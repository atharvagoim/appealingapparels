import { Link } from "react-router-dom";
import { useProducts, totalStock } from "../../context/ProductsContext";
import ui from "../admin.module.css";

const LOW_STOCK_THRESHOLD = 5;

export default function Dashboard() {
  const { products, categories } = useProducts();

  const units = products.reduce((sum, p) => sum + totalStock(p), 0);
  const lowStock = products.filter(
    (p) => totalStock(p) > 0 && totalStock(p) <= LOW_STOCK_THRESHOLD
  );
  const outOfStock = products.filter((p) => totalStock(p) === 0);

  const stats = [
    { label: "Products", value: products.length },
    { label: "Stock units", value: units },
    { label: "Categories", value: categories.length },
    { label: "Low / out", value: lowStock.length + outOfStock.length },
  ];

  return (
    <div>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>Dashboard</h1>
          <p className={ui.pageSub}>Catalogue overview</p>
        </div>
        <div className={ui.headActions}>
          <Link to="/admin/products" className={ui.btn}>
            Manage products
          </Link>
        </div>
      </div>

      <div className={ui.stats}>
        {stats.map((s) => (
          <div className={ui.stat} key={s.label}>
            <p className={ui.statLabel}>{s.label}</p>
            <p className={ui.statValue}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className={ui.panel}>
        <div className={ui.panelHead}>
          Needs attention ({lowStock.length + outOfStock.length})
        </div>
        {lowStock.length + outOfStock.length === 0 ? (
          <div style={{ padding: "20px 18px", color: "var(--ink-soft)", fontSize: 13 }}>
            Everything is well stocked.
          </div>
        ) : (
          <div className={ui.list}>
            {[...outOfStock, ...lowStock].map((p) => (
              <div className={ui.row} key={p.id}>
                <img className={ui.thumb} src={p.images?.[0]} alt={p.name} />
                <div className={ui.rowMain}>
                  <div>
                    <p className={ui.rowName}>{p.name}</p>
                    <p className={ui.rowMeta}>{p.category}</p>
                  </div>
                  <div className={ui.rowStats}>
                    <span className={ui.low}>
                      {totalStock(p) === 0
                        ? "Out of stock"
                        : `${totalStock(p)} left`}
                    </span>
                  </div>
                </div>
                <div className={ui.rowActions}>
                  <Link to="/admin/products" className={ui.linkBtn}>
                    Restock
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
