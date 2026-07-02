import { useMemo, useState } from "react";

/**
 * Centralises Shop browsing logic so it can be reused by future surfaces
 * (wishlist, admin product list). Pure derivation from the products array —
 * no side effects, easy to test.
 *
 * @param {Array} products - full product catalogue
 * @returns filtering state + derived list and counts
 */
export default function useProductFilters(products, initialCategory = "All") {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);

  // Unique categories, alphabetised, with an "All" entry first.
  const categories = useMemo(() => {
    const set = new Set(
      products.map((p) => p.category).filter(Boolean)
    );
    return ["All", ...Array.from(set).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        category === "All" || product.category === category;
      if (!matchesCategory) return false;

      if (!q) return true;

      const haystack = [
        product.name,
        product.category,
        product.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [products, query, category]);

  const reset = () => {
    setQuery("");
    setCategory("All");
  };

  return {
    query,
    setQuery,
    category,
    setCategory,
    categories,
    filtered,
    count: filtered.length,
    total: products.length,
    isFiltering: query.trim() !== "" || category !== "All",
    reset,
  };
}
