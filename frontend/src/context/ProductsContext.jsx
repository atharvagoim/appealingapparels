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

/** How many products each collection shows on the home page. */
export const HOME_LIMIT = 4;

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
  const clearanceSale = useMemo(
    () => products.filter((p) => p.clearance),
    [products]
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          products.flatMap((p) =>
            Array.isArray(p.categories) && p.categories.length
              ? p.categories
              : p.category
              ? [p.category]
              : []
          )
        )
      ).sort(),
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
        clearanceSale,
        categories,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export const useProducts = () => useContext(ProductsContext);

/** Stock helper shared by admin + storefront. */
const sumRows = (rows) =>
  (rows || []).reduce((n, s) => n + (Number(s.stock) || 0), 0);

/** Does this product come in more than one colourway? */
export const hasColors = (product) => (product?.colors || []).length > 0;

/** Is this product sold in sizes at all? Bags and one-size pieces aren't. */
export const isSized = (product) => product?.hasSizes !== false;

/**
 * The colourway that represents the product on the grid and opens the product
 * page. Falls back to the first when nothing has been marked.
 */
export const primaryColor = (product) => {
  if (!hasColors(product)) return null;
  return product.colors.find((c) => c.primary) || product.colors[0];
};

/**
 * The variant currently being looked at — a colour if there are any, otherwise
 * the product itself. Both shapes expose `images`, `sizes` and `stock`, so the
 * rest of the UI can treat them the same way.
 */
export const variantOf = (product, colorName) => {
  if (!hasColors(product)) return product;
  return (
    product.colors.find((c) => c.name === colorName) || primaryColor(product)
  );
};

/** Sizes on offer for the chosen colour (or the product, when uncoloured). */
export const sizesOf = (product, colorName) =>
  isSized(product) ? variantOf(product, colorName)?.sizes || [] : [];

/** Photos for the chosen colour, falling back to the product's own. */
export const imagesOf = (product, colorName) => {
  const v = variantOf(product, colorName);
  const imgs = v?.images?.length ? v.images : product?.images;
  return imgs || [];
};

/** Stock for one variant, across its sizes when it has them. */
export const variantStock = (product, colorName) => {
  const v = variantOf(product, colorName);
  if (!v) return 0;
  return isSized(product) ? sumRows(v.sizes) : Number(v.stock) || 0;
};

/** Everything on the shelf, whichever shape the product takes. */
export const totalStock = (product) => {
  if (!product) return 0;
  if (hasColors(product)) {
    return product.colors.reduce(
      (n, c) =>
        n + (isSized(product) ? sumRows(c.sizes) : Number(c.stock) || 0),
      0
    );
  }
  return isSized(product) ? sumRows(product.sizes) : Number(product.stock) || 0;
};
