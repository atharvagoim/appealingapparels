import { useMemo } from "react";
import { Link } from "react-router-dom";
import styles from "./ExploreSection.module.css";
import CardRow from "./CardRow.jsx";
import { useProducts } from "../context/ProductsContext";
import { useSettings } from "../context/SettingsContext";

/**
 * A homepage rail the shop owner controls outright — its heading, its copy,
 * and exactly which products appear, all from admin → Sections.
 *
 * An empty product list means "show everything", so the section is useful the
 * moment it's switched on and only needs curating if the owner wants to.
 */
export default function ExploreSection() {
  const { products } = useProducts();
  const { exploreSection } = useSettings();
  const s = exploreSection || {};

  const chosen = useMemo(() => {
    const ids = s.productIds || [];
    if (ids.length === 0) return products;

    // Keep the admin's order, and drop anything since deleted.
    const byId = new Map(products.map((p) => [String(p.id), p]));
    return ids.map((id) => byId.get(String(id))).filter(Boolean);
  }, [products, s.productIds]);

  if (s.enabled === false || chosen.length === 0) return null;

  const title = s.title || "Explore";
  const to = "/shop";

  return (
    <section className={styles.section} id="explore" aria-labelledby="explore-title">
      <div className={`${styles.head} shell`}>
        <div className={styles.headText}>
          <h2 id="explore-title" className={styles.title}>
            {title}
          </h2>
          {s.subtitle && <p className={styles.subtitle}>{s.subtitle}</p>}
        </div>
        <Link to={to} className={styles.viewAll}>
          {s.viewAllLabel || "View all"}
        </Link>
      </div>

      <br></br>

      <div className="shell">
        <CardRow products={chosen} />
      </div>

      <br></br>

      <div className={`${styles.viewAllWrap} shell`}>
        <Link to={to} className={styles.viewAllBtn}>
          {s.viewAllLabel || "View all"}
        </Link>
      </div>
    </section>
  );
}
