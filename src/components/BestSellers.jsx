import { useMemo } from "react";
import { Link } from "react-router-dom";
import styles from "./BestSellers.module.css";
import CardRow from "./CardRow.jsx";
import { useProducts } from "../context/ProductsContext";
import { useSettings } from "../context/SettingsContext";
import { orderedProducts, sectionEntries } from "../utils/sectionOrder";

export default function BestSellers() {
  const { bestSellers } = useProducts();
  const { sectionOrder, sectionTitles } = useSettings();

  const ordered = useMemo(
    () => orderedProducts(bestSellers, sectionOrder.bestSellers),
    [bestSellers, sectionOrder.bestSellers]
  );

  // One card per chosen colourway (its own photos); products with no
  // colours or no per-section pick fall back to a single primary card.
  const entries = useMemo(() => sectionEntries(ordered, "featuredColors"), [ordered]);

  if (!ordered.length) return null;

  return (
    <section className={styles.section} id="best-sellers" aria-labelledby="bs-title">
      <div className={`${styles.head} shell`}>
        <h2 id="bs-title" className={styles.title}>
          {sectionTitles.bestSellers}
        </h2>
        <Link to="/shop?category=Best%20Sellers" className={styles.viewAll}>
          View all
        </Link>
      </div>

      <br></br>

      <div className="shell">
        <CardRow items={entries} showSwatches />
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
