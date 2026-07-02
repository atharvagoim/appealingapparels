import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import useProductFilters from "../hooks/useProductFilters";
import SearchBar from "../components/SearchBar";
import CategoryFilter from "../components/CategoryFilter";
import ProductCard from "../components/ProductCard";
import styles from "./Shop.module.css";
import { useProducts } from "../context/ProductsContext";

export default function Shop() {
  const { products } = useProducts();
  const [params] = useSearchParams();
  const urlCategory = params.get("category") || "All";
  const {
    query,
    setQuery,
    category,
    setCategory,
    categories,
    filtered,
    count,
    total,
    isFiltering,
    reset,
  } = useProductFilters(products, urlCategory);

  // Keep the filter in sync when the ?category= link changes.
  useEffect(() => {
    setCategory(urlCategory);
  }, [urlCategory]);

  return (
    <main className={styles.page}>
      <header className={`${styles.head} shell`}>
        <p className="eyebrow">The collection</p>
        <h1 className={styles.title}>Shop all</h1>
      </header>

      <div className={`${styles.toolbar} shell`}>
        <SearchBar value={query} onChange={setQuery} />
        <CategoryFilter
          categories={categories}
          active={category}
          onSelect={setCategory}
        />
        <div className={styles.countRow}>
          <p className={styles.count}>
            {count} {count === 1 ? "piece" : "pieces"}
            {isFiltering && total !== count ? ` of ${total}` : ""}
          </p>
          {isFiltering && (
            <button type="button" className={styles.clearAll} onClick={reset}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {count > 0 ? (
        <div className={`${styles.grid} shell`}>
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              badge={product.newArrival ? "New" : undefined}
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
