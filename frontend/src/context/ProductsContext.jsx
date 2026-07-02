import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { products as seedProducts } from "../data/products";
import { useApi } from "../api/client";
import {
  fetchProducts,
  createProductApi,
  updateProductApi,
  deleteProductApi,
} from "../api/productsApi";

const ProductsContext = createContext();
const STORAGE_KEY = "products";

function initialLocal() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : seedProducts;
  } catch {
    return seedProducts;
  }
}

/**
 * Single source of truth for the catalogue.
 *
 * Dual-mode by design:
 *  - VITE_API_URL set  → reads/writes through the Phase 4 Express API.
 *  - VITE_API_URL unset → uses the localStorage store (Phases 1–3 behaviour),
 *    so the frontend runs fully standalone without the backend.
 */
export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(() => (useApi ? [] : initialLocal()));
  const [loading, setLoading] = useState(useApi);
  const [error, setError] = useState(null);

  // API mode: load once on mount.
  useEffect(() => {
    if (!useApi) return;
    let active = true;
    setLoading(true);
    fetchProducts()
      .then((data) => active && (setProducts(data), setError(null)))
      .catch((err) => active && setError(err?.message || "Failed to load products"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // Local mode: persist on every change.
  useEffect(() => {
    if (useApi) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }, [products]);

  const addProduct = async (product) => {
    if (useApi) {
      const created = await createProductApi(product);
      setProducts((prev) => [created, ...prev]);
      return created.id;
    }
    const id = product.id || `aa-${Date.now()}`;
    setProducts((prev) => [{ ...product, id }, ...prev]);
    return id;
  };

  const updateProduct = async (id, updates) => {
    if (useApi) {
      const updated = await updateProductApi(id, updates);
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return;
    }
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProduct = async (id) => {
    if (useApi) {
      await deleteProductApi(id);
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const resetProducts = async () => {
    if (useApi) {
      const data = await fetchProducts();
      setProducts(data);
      return;
    }
    setProducts(seedProducts);
  };

  const getById = (id) => products.find((p) => p.id === id);
  const getBySlug = (slug) => products.find((p) => p.slug === slug);

  const newArrivals = useMemo(
    () => products.filter((p) => p.newArrival),
    [products]
  );
  const bestSellers = useMemo(
    () => products.filter((p) => p.featured),
    [products]
  );
  const categories = useMemo(
    () =>
      Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort(),
    [products]
  );

  return (
    <ProductsContext.Provider
      value={{
        products,
        loading,
        error,
        addProduct,
        updateProduct,
        deleteProduct,
        getById,
        getBySlug,
        resetProducts,
        newArrivals,
        bestSellers,
        categories,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export const useProducts = () => useContext(ProductsContext);

/** Stock helper shared by admin + storefront. */
export const totalStock = (product) =>
  (product.sizes || []).reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
