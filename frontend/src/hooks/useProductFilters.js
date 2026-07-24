import { useMemo, useState } from "react";

/**
 * Centralises Shop browsing logic (search, category, sort, on-sale filter).
 * Pure derivation from the products array — reused by Shop + admin list.
 */
export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "discount", label: "Biggest discount" },
  { value: "name", label: "Name: A–Z" },
];

// "New Arrivals" / "Best Sellers" / "Clearance Sale" browse like real
// categories on the storefront, but they're flags on the product, not
// actual categories.
export const COLLECTION_CATEGORIES = ["New Arrivals", "Best Sellers", "Clearance Sale"];

const catsOf = (p, includeCollections, collectionCategories) => {
  const base =
    Array.isArray(p.categories) && p.categories.length
      ? p.categories
      : p.category
      ? [p.category]
      : [];
  if (!includeCollections) return base;
  const extra = [];
  if (p.newArrival && collectionCategories.includes("New Arrivals"))
    extra.push("New Arrivals");
  if (p.featured && collectionCategories.includes("Best Sellers"))
    extra.push("Best Sellers");
  if (p.clearance && collectionCategories.includes("Clearance Sale"))
    extra.push("Clearance Sale");
  return [...base, ...extra];
};

const pctOff = (p) =>
  typeof p.compareAtPrice === "number" && p.compareAtPrice > p.price
    ? 1 - p.price / p.compareAtPrice
    : 0;

export default function useProductFilters(
  products,
  initialCategory = "All",
  { includeCollections = false, collectionCategories = COLLECTION_CATEGORIES } = {}
) {
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(
    initialCategory && initialCategory !== "All" ? [initialCategory] : []
  );
  const [sort, setSort] = useState("featured");
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);

  // The actual min/max price in the catalogue — used as placeholder hints
  // in the price filter inputs.
  const priceBounds = useMemo(() => {
    if (!products.length) return { min: 0, max: 0 };
    let min = Infinity;
    let max = 0;
    products.forEach((p) => {
      if (typeof p.price === "number") {
        if (p.price < min) min = p.price;
        if (p.price > max) max = p.price;
      }
    });
    return { min: min === Infinity ? 0 : Math.floor(min), max: Math.ceil(max) };
  }, [products]);

  // Unique categories, alphabetised, with "All" first and (when enabled)
  // New Arrivals / Best Sellers / Clearance Sale pinned right after it.
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) =>
      catsOf(p, includeCollections, collectionCategories).forEach((c) => set.add(c))
    );
    const pinned = COLLECTION_CATEGORIES.filter((c) => set.has(c));
    const rest = Array.from(set)
      .filter((c) => !COLLECTION_CATEGORIES.includes(c))
      .sort();
    return ["All", ...pinned, ...rest];
  }, [products, includeCollections, collectionCategories]);

  // Multi-select: toggling a category adds/removes it from the selection so
  // several categories can be browsed together.
  const toggleCategory = (cat) => {
    if (cat === "All") {
      setSelectedCategories([]);
      return;
    }
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };
  const removeCategory = (cat) =>
    setSelectedCategories((prev) => prev.filter((c) => c !== cat));

  // Legacy single-select API, kept for callers (e.g. the admin product list)
  // that only ever want one category active at a time.
  const category = selectedCategories[0] ?? "All";
  const setCategory = (cat) =>
    setSelectedCategories(cat && cat !== "All" ? [cat] : []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = products.filter((product) => {
      if (
        selectedCategories.length &&
        !catsOf(product, includeCollections, collectionCategories).some((c) =>
          selectedCategories.includes(c)
        )
      )
        return false;
      if (onSaleOnly && pctOff(product) <= 0) return false;
      if (minPrice != null && product.price < minPrice) return false;
      if (maxPrice != null && product.price > maxPrice) return false;
      if (!q) return true;
      const haystack = [product.name, product.category, product.description, product.code]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    // sorting (copy first so we never mutate the source array)
    list = [...list];
    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "discount":
        list.sort((a, b) => pctOff(b) - pctOff(a));
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // "featured": featured first, then new arrivals, otherwise catalogue order
        list.sort(
          (a, b) =>
            Number(b.featured) - Number(a.featured) ||
            Number(b.newArrival) - Number(a.newArrival)
        );
    }
    return list;
  }, [products, query, selectedCategories, sort, onSaleOnly, minPrice, maxPrice, includeCollections, collectionCategories]);

  const clearPrice = () => {
    setMinPrice(null);
    setMaxPrice(null);
  };

  const reset = () => {
    setQuery("");
    setSelectedCategories([]);
    setSort("featured");
    setOnSaleOnly(false);
    setMinPrice(null);
    setMaxPrice(null);
  };

  return {
    query,
    setQuery,
    category,
    setCategory,
    selectedCategories,
    setSelectedCategories,
    toggleCategory,
    removeCategory,
    sort,
    setSort,
    onSaleOnly,
    setOnSaleOnly,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    clearPrice,
    priceBounds,
    categories,
    filtered,
    count: filtered.length,
    total: products.length,
    isFiltering:
      query.trim() !== "" ||
      selectedCategories.length > 0 ||
      onSaleOnly ||
      minPrice != null ||
      maxPrice != null ||
      sort !== "featured",
    reset,
  };
}
