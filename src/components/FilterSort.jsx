import { useEffect, useMemo, useState } from "react";
import { SORT_OPTIONS } from "../hooks/useProductFilters";
import styles from "./FilterSort.module.css";

const catsOf = (p) => {
  const base =
    Array.isArray(p.categories) && p.categories.length
      ? p.categories
      : p.category
      ? [p.category]
      : [];
  const extra = [];
  if (p.newArrival) extra.push("New Arrivals");
  if (p.featured) extra.push("Best Sellers");
  if (p.clearance) extra.push("Clearance Sale");
  return [...base, ...extra];
};
const pctOff = (p) =>
  typeof p.compareAtPrice === "number" && p.compareAtPrice > p.price
    ? 1 - p.price / p.compareAtPrice
    : 0;

const SECTIONS = ["Category", "Price", "Sort By", "Availability"];

export default function FilterSort({ products, filters }) {
  const {
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
  } = filters;

  const [open, setOpen] = useState(false);
  const [section, setSection] = useState("Category");

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const catCounts = useMemo(() => {
    const m = {};
    products.forEach((p) => catsOf(p).forEach((c) => (m[c] = (m[c] || 0) + 1)));
    return m;
  }, [products]);
  const saleCount = useMemo(
    () => products.filter((p) => pctOff(p) > 0).length,
    [products]
  );

  const activeCount =
    selectedCategories.length +
    (onSaleOnly ? 1 : 0) +
    (minPrice != null || maxPrice != null ? 1 : 0) +
    (sort !== "featured" ? 1 : 0);

  const priceLabel = () => {
    if (minPrice != null && maxPrice != null) return `₹${minPrice}–₹${maxPrice}`;
    if (minPrice != null) return `Over ₹${minPrice}`;
    if (maxPrice != null) return `Under ₹${maxPrice}`;
    return null;
  };
  const priceTag = priceLabel();

  // The slider works on concrete numbers; null means "not filtered", which
  // sits at the corresponding end of the range.
  const lowValue = minPrice ?? priceBounds.min;
  const highValue = maxPrice ?? priceBounds.max;
  const span = Math.max(1, priceBounds.max - priceBounds.min);
  const lowPct = ((lowValue - priceBounds.min) / span) * 100;
  const highPct = ((highValue - priceBounds.min) / span) * 100;

  return (
    <>
      <div className={styles.bar}>
        <button className={styles.barBtn} onClick={() => setOpen(true)}>
          Filter &amp; Sort{activeCount > 0 ? ` (${activeCount})` : ""}
          <span className={styles.chev} aria-hidden="true">›</span>
        </button>

        {selectedCategories.map((c) => (
          <span key={c} className={styles.catTag}>
            {c}
            <button
              type="button"
              className={styles.catTagX}
              onClick={() => removeCategory(c)}
              aria-label={`Remove ${c} filter`}
            >
              ×
            </button>
          </span>
        ))}

        {priceTag && (
          <span className={styles.catTag}>
            {priceTag}
            <button
              type="button"
              className={styles.catTagX}
              onClick={clearPrice}
              aria-label="Remove price filter"
            >
              ×
            </button>
          </span>
        )}

        <span className={styles.barCount}>
          {count} {count === 1 ? "Product" : "Products"}
        </span>
      </div>

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-label="Filter and sort"
            onClick={(e) => e.stopPropagation()}
          >
          <div className={styles.head}>
            <span className={styles.headTitle}>Filter &amp; Sort</span>
            <button className={styles.close} onClick={() => setOpen(false)} aria-label="Close">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
          </div>

          <div className={styles.body}>
            <div className={styles.tabs}>
              {SECTIONS.map((s) => {
                const badgeCount =
                  s === "Category"
                    ? selectedCategories.length
                    : s === "Availability"
                    ? onSaleOnly
                      ? 1
                      : 0
                    : s === "Price"
                    ? minPrice != null || maxPrice != null
                      ? 1
                      : 0
                    : 0;
                return (
                  <button
                    key={s}
                    className={`${styles.tab} ${section === s ? styles.tabOn : ""}`}
                    onClick={() => setSection(s)}
                  >
                    {s}
                    {badgeCount > 0 && (
                      <span className={styles.tabBadge}>{badgeCount}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className={styles.options}>
              {section === "Category" && (
                <>
                  <label className={styles.opt}>
                    <input
                      type="checkbox"
                      checked={selectedCategories.length === 0}
                      onChange={() => toggleCategory("All")}
                    />
                    <span className={styles.optLabel}>All</span>
                    <span className={styles.optCount}>({products.length})</span>
                  </label>
                  {categories
                    .filter((c) => c !== "All")
                    .map((c) => (
                      <label className={styles.opt} key={c}>
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(c)}
                          onChange={() => toggleCategory(c)}
                        />
                        <span className={styles.optLabel}>{c}</span>
                        <span className={styles.optCount}>({catCounts[c] || 0})</span>
                      </label>
                    ))}
                </>
              )}

              {section === "Price" && (
                <div className={styles.priceBlock}>
                  <p className={styles.priceHint}>
                    The highest price is ₹
                    {Number(priceBounds.max).toLocaleString("en-IN")}
                  </p>

                  {/* Two range inputs stacked on one track; the fill between
                      the handles is drawn from the current values. */}
                  <div className={styles.slider}>
                    <span className={styles.sliderTrack} aria-hidden="true" />
                    <span
                      className={styles.sliderFill}
                      aria-hidden="true"
                      style={{ left: `${lowPct}%`, right: `${100 - highPct}%` }}
                    />
                    <input
                      type="range"
                      className={styles.sliderInput}
                      min={priceBounds.min}
                      max={priceBounds.max}
                      value={lowValue}
                      aria-label="Minimum price"
                      onChange={(e) => {
                        const v = Math.min(Number(e.target.value), highValue);
                        setMinPrice(v <= priceBounds.min ? null : v);
                      }}
                    />
                    <input
                      type="range"
                      className={styles.sliderInput}
                      min={priceBounds.min}
                      max={priceBounds.max}
                      value={highValue}
                      aria-label="Maximum price"
                      onChange={(e) => {
                        const v = Math.max(Number(e.target.value), lowValue);
                        setMaxPrice(v >= priceBounds.max ? null : v);
                      }}
                    />
                  </div>

                  <div className={styles.priceRow}>
                    <label className={styles.priceField}>
                      <span className={styles.priceCurrency}>₹</span>
                      <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        aria-label="Minimum price"
                        value={minPrice ?? ""}
                        placeholder={String(priceBounds.min)}
                        onChange={(e) =>
                          setMinPrice(
                            e.target.value === "" ? null : Math.max(0, Number(e.target.value))
                          )
                        }
                      />
                    </label>
                    <label className={styles.priceField}>
                      <span className={styles.priceCurrency}>₹</span>
                      <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        aria-label="Maximum price"
                        value={maxPrice ?? ""}
                        placeholder={String(priceBounds.max)}
                        onChange={(e) =>
                          setMaxPrice(
                            e.target.value === "" ? null : Math.max(0, Number(e.target.value))
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              )}

              {section === "Sort By" &&
                SORT_OPTIONS.map((o) => (
                  <label className={styles.opt} key={o.value}>
                    <input
                      type="radio"
                      name="filtersort-sort"
                      checked={sort === o.value}
                      onChange={() => setSort(o.value)}
                    />
                    <span className={styles.optLabel}>{o.label}</span>
                  </label>
                ))}

              {section === "Availability" && (
                <label className={styles.opt}>
                  <input
                    type="checkbox"
                    checked={onSaleOnly}
                    onChange={() => setOnSaleOnly((v) => !v)}
                  />
                  <span className={styles.optLabel}>On sale only</span>
                  <span className={styles.optCount}>({saleCount})</span>
                </label>
              )}
            </div>
          </div>

          <div className={styles.foot}>
            <button className={styles.clear} onClick={reset}>
              Clear all
            </button>
            <button className={styles.apply} onClick={() => setOpen(false)}>
              Show {count} {count === 1 ? "result" : "results"}
            </button>
          </div>
          </div>
        </div>
      )}
    </>
  );
}
