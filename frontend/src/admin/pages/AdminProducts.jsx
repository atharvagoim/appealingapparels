import { useMemo, useState } from "react";
import { useProducts, totalStock } from "../../context/ProductsContext";
import useProductFilters from "../../hooks/useProductFilters";
import SearchBar from "../../components/SearchBar";
import CategoryFilter from "../../components/CategoryFilter";
import ProductForm from "../components/ProductForm";
import ui from "../admin.module.css";

const LOW_STOCK_THRESHOLD = 5;
const STOCK_TABS = ["All", "In stock", "Low", "Out"];

export default function AdminProducts() {
  const { products, addProduct, updateProduct, deleteProduct, resetProducts } =
    useProducts();

  // search + category (reuses the storefront filtering hook)
  const { query, setQuery, category, setCategory, categories, filtered } =
    useProductFilters(products);

  const [stockTab, setStockTab] = useState("All");
  const [editing, setEditing] = useState(null);

  const visible = useMemo(() => {
    return filtered.filter((p) => {
      const s = totalStock(p);
      if (stockTab === "In stock") return s > LOW_STOCK_THRESHOLD;
      if (stockTab === "Low") return s > 0 && s <= LOW_STOCK_THRESHOLD;
      if (stockTab === "Out") return s === 0;
      return true;
    });
  }, [filtered, stockTab]);

  const handleSave = (data) => {
    if (editing && editing !== "new") updateProduct(editing.id, data);
    else addProduct(data);
    setEditing(null);
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
          <button
            className={`${ui.btn} ${ui.btnGhost}`}
            onClick={() => {
              if (
                window.confirm(
                  "Reset the catalogue to the built-in defaults? Your changes will be lost."
                )
              )
                resetProducts();
            }}
          >
            Reset
          </button>
          <button className={ui.btn} onClick={() => setEditing("new")}>
            + Add product
          </button>
        </div>
      </div>

      {/* search + filters — find any product fast */}
      <div className={ui.toolbar}>
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by name or category"
        />
        <CategoryFilter
          categories={categories}
          active={category}
          onSelect={setCategory}
        />
        <div className={ui.stockTabs}>
          {STOCK_TABS.map((tab) => (
            <button
              key={tab}
              className={`${ui.stockTab} ${stockTab === tab ? ui.stockTabOn : ""}`}
              onClick={() => setStockTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <p className={ui.resultCount}>
          {visible.length} {visible.length === 1 ? "result" : "results"}
        </p>
      </div>

      {visible.length === 0 ? (
        <div className={ui.empty}>
          <p className={ui.emptyTitle}>No matching products.</p>
          <p className={ui.emptyBody}>Try a different search, category or stock filter.</p>
        </div>
      ) : (
        <div className={ui.panel}>
          <div className={ui.list}>
            {visible.map((p) => {
              const stock = totalStock(p);
              return (
                <div className={ui.row} key={p.id}>
                  <img className={ui.thumb} src={p.images?.[0]} alt={p.name} />
                  <div className={ui.rowMain}>
                    <div>
                      <p className={ui.rowName}>{p.name}</p>
                      <p className={ui.rowMeta}>{p.category}</p>
                    </div>
                    <div className={ui.rowStats}>
                      <span>₹{Number(p.price).toLocaleString("en-IN")}</span>
                      <span className={stock <= LOW_STOCK_THRESHOLD ? ui.low : ""}>
                        {stock === 0 ? "Out of stock" : `${stock} in stock`}
                      </span>
                    </div>
                  </div>
                  <div className={ui.rowActions}>
                    <button className={ui.linkBtn} onClick={() => setEditing(p)}>
                      Edit
                    </button>
                    <button
                      className={`${ui.linkBtn} ${ui.linkDanger}`}
                      onClick={() => handleDelete(p)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {editing && (
        <ProductForm
          initial={editing === "new" ? null : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
