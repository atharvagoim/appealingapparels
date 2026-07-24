import { useMemo } from "react";
import { Link } from "react-router-dom";
import styles from "./BestSellers.module.css";
import CardRow from "./CardRow.jsx";
import { useProducts } from "../context/ProductsContext";
import { useSettings } from "../context/SettingsContext";
import { orderedProducts } from "../utils/sectionOrder";

export default function BestSellers() {
  const { bestSellers } = useProducts();
  const { sectionOrder } = useSettings();

  const ordered = useMemo(
    () => orderedProducts(bestSellers, sectionOrder.bestSellers),
    [bestSellers, sectionOrder.bestSellers]
  );

  if (!ordered.length) return null;

  return (
    <section className={styles.section} id="best-sellers" aria-labelledby="bs-title">
      <div className={`${styles.head} shell`}>
        <h2 id="bs-title" className={styles.title}>
          Best sellers
        </h2>
        <Link to="/shop?category=Best%20Sellers" className={styles.viewAll}>
          View all
        </Link>
      </div>

      <br></br>

      <div className="shell">
        <CardRow products={ordered} />
      </div>

      <br></br>

      <div className={`${styles.viewAllWrap} shell`}>
        <Link to="/shop?category=Best%20Sellers" className={styles.viewAllBtn}>
          View all
        </Link>
      </div>
    </section>
  );
}
