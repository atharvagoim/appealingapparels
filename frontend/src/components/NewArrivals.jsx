import { useMemo } from "react";
import { Link } from "react-router-dom";
import styles from "./NewArrivals.module.css";
import CardRow from "./CardRow.jsx";
import { useProducts } from "../context/ProductsContext";
import { useSettings } from "../context/SettingsContext";
import { orderedProducts } from "../utils/sectionOrder";

export default function NewArrivals() {
  const { newArrivals } = useProducts();
  const { sectionOrder } = useSettings();

  // Order set by dragging cards in admin/sections; new/unlisted products
  // are appended automatically so nothing gets silently hidden.
  const ordered = useMemo(
    () => orderedProducts(newArrivals, sectionOrder.newArrivals),
    [newArrivals, sectionOrder.newArrivals]
  );

  if (!ordered.length) return null;

  return (
    <section className={styles.section} id="new-arrivals" aria-labelledby="na-title">
      <div className={`${styles.head} shell`}>
        <h2 id="na-title" className={styles.title}>
          New arrivals
        </h2>
        <Link to="/shop?category=New%20Arrivals" className={styles.viewAll}>
          View all
        </Link>
      </div>

      <br></br>

      <div className="shell">
        <CardRow products={ordered} badge="New" />
      </div>

      <br></br>

      <div className={`${styles.viewAllWrap} shell`}>
        <Link to="/shop?category=New%20Arrivals" className={styles.viewAllBtn}>
          View all
        </Link>
      </div>
    </section>
  );
}
