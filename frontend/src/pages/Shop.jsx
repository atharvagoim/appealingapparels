import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import useProductFilters, { SORT_OPTIONS, COLLECTION_CATEGORIES } from "../hooks/useProductFilters";
import SearchBar from "../components/SearchBar";
import FilterSort from "../components/FilterSort";
import CategoryFilter from "../components/CategoryFilter";
import ProductCard from "../components/ProductCard";
import styles from "./Shop.module.css";
import { useProducts } from "../context/ProductsContext";

/** Clearance Sale reads as a red "Sale"; the other two read as normal. */
const COLLECTION_TITLES = {
  "New Arrivals": "New Arrivals",
  "Best Sellers": "Best Sellers",
  "Clearance Sale": "Sale",
};
import { useSettings } from "../context/SettingsContext";

export default function Shop() {
  const { products } = useProducts();
  const { clearanceSaleEnabled } = useSettings();
  const [params] = useSearchParams();
  const urlCategory = params.get("category") || "All";


  // Clearance Sale only behaves like a category while the site owner has
  // the section switched on.
  const collectionCategories = useMemo(
    () =>
      clearanceSaleEnabled
        ? COLLECTION_CATEGORIES
        : COLLECTION_CATEGORIES.filter((c) => c !== "Clearance Sale"),
    [clearanceSaleEnabled]
  );

  const {
    query,
    setQuery,
    category,
    setCategory,
    setSelectedCategories,
    selectedCategories,
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
    count,
    total,
    isFiltering,
    reset,
  } = useProductFilters(products, urlCategory, {
    includeCollections: true,
    collectionCategories,
  });

  /**
   * Banner heading, shown only when exactly one of the three collections is
   * selected. Reading the live selection rather than the URL means it follows
   * the filter panel too — switch to a normal category and it disappears.
   */
  const collectionTitle =
    selectedCategories.length === 1
      ? COLLECTION_TITLES[selectedCategories[0]] || ""
      : "";

  /**
   * One card per colourway, so a kurti sold in three colours appears three
   * times on the grid rather than once. Products without colourways stay as a
   * single card. The primary colour is listed first.
   */
  const cards = useMemo(
    () =>
      filtered.flatMap((product) => {
        const colors = product.colors || [];
        if (colors.length === 0) {
          return [{ key: product.id, product, colorName: null }];
        }
        const ordered = [
          ...colors.filter((c) => c.primary),
          ...colors.filter((c) => !c.primary),
        ];
        return ordered.map((c) => ({
          key: `${product.id}:${c.name}`,
          product,
          colorName: c.name,
        }));
      }),
    [filtered]
  );

  // Keep the filter in sync when a ?category= link is followed (header nav,
  // a category tile, or the New Arrivals/Best Sellers "View All" buttons) —
  // it replaces whatever was selected with just that one category.
  useEffect(() => {
    setSelectedCategories(
      urlCategory && urlCategory !== "All" ? [urlCategory] : []
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCategory]);

  return (
    <main className={styles.page}>
      {collectionTitle && (
        <div className="shell">
          <h1
            className={`${styles.collectionTitle} ${
              collectionTitle === "Sale" ? styles.collectionSale : ""
            }`}
          >
            {collectionTitle}
          </h1>
        </div>
      )}

      <div className={`${styles.toolbar} shell`}>
        <SearchBar value={query} onChange={setQuery} />

        <FilterSort
          products={products}
          filters={{
            selectedCategories,
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
            count,
            reset,
          }}
        />

        <div className={styles.desktopTools}>
        <CategoryFilter
          categories={categories}
          active={category}
          onSelect={setCategory}
        />

        <div className={styles.controls}>
          <label className={styles.sortField}>
            <span className={styles.sortLabel}>Sort by</span>
            <select
              className={styles.sortSelect}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className={`${styles.saleToggle} ${onSaleOnly ? styles.saleOn : ""}`}
            onClick={() => setOnSaleOnly((v) => !v)}
            aria-pressed={onSaleOnly}
          >
            On sale only
          </button>
        </div>

        <div className={styles.countRow}>
          <p className={styles.count}>
            {cards.length} {cards.length === 1 ? "piece" : "pieces"}
            {isFiltering && total !== count ? ` of ${total}` : ""}
          </p>
          {isFiltering && (
            <button type="button" className={styles.clearAll} onClick={reset}>
              Clear filters
            </button>
          )}
        </div>
        </div>
      </div>

      {count > 0 ? (
        <div className={`${styles.grid} shell`}>
          {cards.map((card) => (
            <ProductCard
              key={card.key}
              product={card.product}
              colorName={card.colorName}
              badge={card.product.newArrival ? "New" : undefined}
            />
          ))}
        </div>
      ) : (
        <div className={`${styles.empty} shell`}>
          <p className={styles.emptyTitle}>Nothing matches that yet.</p>
          <p className={styles.emptyBody}>
            Try a different search or category — new pieces are added
            regularly.
          </p>
          <button type="button" className={styles.emptyBtn} onClick={reset}>
            Reset
          </button>
        </div>
      )}
    </main>
  );
}
