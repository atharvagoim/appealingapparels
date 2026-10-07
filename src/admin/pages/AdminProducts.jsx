import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useProducts, totalStock, imagesOf, variantOutages } from "../../context/ProductsContext";
import useProductFilters from "../../hooks/useProductFilters";
import { backfillProductCodesApi } from "../../api/productsApi";
import ProductForm from "../components/ProductForm";
import ui from "../admin.module.css";
import styles from "./AdminProducts.module.css";

const LOW_STOCK_THRESHOLD = 5;
const STOCK_TABS = ["All", "In stock", "Low", "Out of stock"];

/** Product thumbnail that degrades to a clean initial-in-a-box when the image
 *  is missing or fails to load, instead of showing a broken-image icon. */
function Thumb({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`${styles.thumb} ${styles.thumbEmpty}`} aria-hidden="true">
        {(alt?.trim()?.[0] || "?").toUpperCase()}
      </div>
    );
  }
  return (
    <img
      className={styles.thumb}
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
    />
  );
}

export default function AdminProducts() {
  const { products, addProduct, updateProduct, deleteProduct, resetProducts } =
    useProducts();
  const [backfilling, setBackfilling] = useState(false);
  const missingCodeCount = products.filter((p) => !p.code).length;

  const handleBackfillCodes = async () => {
    setBackfilling(true);
    try {
      const { updated } = await backfillProductCodesApi();
      await resetProducts();
      alert(`Assigned a product code to ${updated} product${updated === 1 ? "" : "s"}.`);
    } catch (err) {
      alert(err?.response?.data?.message || "Couldn't generate codes. Please try again.");
    } finally {
      setBackfilling(false);
    }
  };

  // search + category (reuses the storefront filtering hook). Admin also
  // gets New Arrivals / Best Sellers / Clearance Sale as filterable
  // pseudo-categories, regardless of whether Clearance Sale is currently
  // live on the storefront — admin still needs to find and tag products.
  const { query, setQuery, category, setCategory, categories, filtered } =
    useProductFilters(products, "All", {
      includeCollections: true,
      // Admin needs a way to find products that were never given a real
      // category, so the fallback shows up here even though it's hidden
      // from the storefront.
      includeUncategorised: true,
    });

  const [stockTab, setStockTab] = useState("All");
  const [editing, setEditing] = useState(null);

  // Deep link: /admin/products?edit=<id> opens that product's editor
  // (used by the dashboard "Out of stock" / "Restock" shortcuts).
  const [params, setParams] = useSearchParams();
  const editId = params.get("edit");
  const addFlag = params.get("add");
  useEffect(() => {
    if (addFlag) {
      setEditing("new");
      params.delete("add");
      setParams(params, { replace: true });
      return;
    }
    if (!editId) return;
    const target = products.find((p) => String(p.id) === String(editId));
    if (target) setEditing(target);
  }, [editId, addFlag, products]);

  const closeEditor = () => {
    setEditing(null);
    if (editId || params.get("tab")) {
      params.delete("edit");
      params.delete("tab");
      setParams(params, { replace: true });
    }
  };

  const visible = useMemo(() => {
    return filtered.filter((p) => {
      const s = totalStock(p);
      if (stockTab === "In stock") return s > LOW_STOCK_THRESHOLD;
      if (stockTab === "Low") return s > 0 && s <= LOW_STOCK_THRESHOLD;
      // Catches a product that's fully out, and one that still has stock
      // overall but has a specific colour or size sitting at zero — both
      // are genuinely "out of stock" from a shopper's point of view.
      if (stockTab === "Out of stock") return s === 0 || variantOutages(p).length > 0;
      return true;
    });
  }, [filtered, stockTab]);

  const handleSave = async (data) => {
    if (editing && editing !== "new") await updateProduct(editing.id, data);
    else await addProduct(data);
    closeEditor();
  };

  const handleDelete = (product) => {
    if (window.confirm(`Delete “${product.name}”? This cannot be undone.`)) {
      deleteProduct(product.id);
    }
  };

  return (
    <div>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>Products</h1>
          <p className={ui.pageSub}>{products.length} in the catalogue</p>
        </div>
        <div className={ui.headActions}>
          {missingCodeCount > 0 && (
            <button
              className={`${ui.btn} ${ui.btnGhost}`}
              onClick={handleBackfillCodes}
              disabled={backfilling}
            >
              {backfilling ? "Generating…" : `Generate codes (${missingCodeCount})`}
            </button>
          )}
          <button className={ui.btn} onClick={() => setEditing("new")}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add product
          </button>
        </div>
      </div>

      {/* search + filters — find any product fast */}
      <div className={styles.toolCard}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            className={styles.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, category or product number"
            aria-label="Search products"
          />
          <svg className={styles.searchAdorn} viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 7h11" />
            <circle cx="18" cy="7" r="2.4" />
            <path d="M21 17H10" />
            <circle cx="6" cy="17" r="2.4" />
          </svg>
        </div>

        <label className={styles.categorySelectWrap}>
          <span className={styles.categorySelectLabel}>Category</span>
          <select
            className={styles.categorySelect}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.chips} role="tablist" aria-label="Filter by stock">
          {STOCK_TABS.map((tab) => (
            <button
              key={tab}
              className={`${styles.chip} ${stockTab === tab ? styles.chipOn : ""}`}
              onClick={() => setStockTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {stockTab === "Out of stock" && (
          <p className={styles.stockHint}>
            Includes products fully sold out, and products where just one
            colour or size has run out — even while others are still
            available.
          </p>
        )}

        <p className={styles.resultCount}>
          {visible.length} {visible.length === 1 ? "result" : "results"}
        </p>
      </div>

      {visible.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No matching products.</p>
          <p className={styles.emptyBody}>Try a different search, category or stock filter.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {visible.map((p) => {
            const stock = totalStock(p);
            const outages = variantOutages(p);
            const badgeClass =
              stock === 0
                ? styles.badgeOut
                : stock <= LOW_STOCK_THRESHOLD
                ? styles.badgeLow
                : styles.badgeIn;
            const stockLabel = stock === 0 ? "Out of stock" : `${stock} in stock`;
            return (
              <div className={styles.card} key={p.id}>
                <Thumb src={imagesOf(p)[0] || p.images?.[0]} alt={p.name} />
                <div className={styles.cardMain}>
                  <p className={styles.name}>{p.name}</p>
                  <p className={styles.meta}>
                    {p.category}
                    {p.code && <span className={styles.code}> · {p.code}</span>}
                  </p>
                  {outages.length > 0 && (
                    <p className={styles.variantOut}>
                      Out of stock: {outages.join(", ")}
                    </p>
                  )}
                </div>
                <div className={styles.right}>
                  <span className={styles.price}>
                    ₹{Number(p.price).toLocaleString("en-IN")}
                  </span>
                  <span className={`${styles.badge} ${badgeClass}`}>{stockLabel}</span>
                  <div className={styles.actions}>
                    <a
                      className={styles.iconBtn}
                      href={`/product/${p.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`View ${p.name}`}
                      title="View on site"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </a>
                    <button
                      className={styles.iconBtn}
                      onClick={() => setEditing(p)}
                      aria-label={`Edit ${p.name}`}
                      title="Edit"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17z" />
                        <path d="M13.5 6.5l3 3" />
                      </svg>
                    </button>
                    <button
                      className={`${styles.iconBtn} ${styles.iconDanger}`}
                      onClick={() => handleDelete(p)}
                      aria-label={`Delete ${p.name}`}
                      title="Delete"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M4 7h16" />
                        <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
                        <path d="M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <ProductForm
          initial={editing === "new" ? null : editing}
          initialTab={params.get("tab") || undefined}
          onSave={handleSave}
          onClose={closeEditor}
        />
      )}
    </div>
  );
}
