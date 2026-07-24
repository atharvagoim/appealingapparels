import { useMemo } from "react";
import { Link } from "react-router-dom";
import styles from "./ClearanceSale.module.css";
import CardRow from "./CardRow.jsx";
import CountdownTimer from "./CountdownTimer.jsx";
import { useProducts } from "../context/ProductsContext";
import { useSettings } from "../context/SettingsContext";
import { orderedProducts } from "../utils/sectionOrder";

export default function ClearanceSale() {
  const { clearanceSaleEnabled, clearanceSaleEndsAt, sectionOrder } = useSettings();
  const { clearanceSale } = useProducts();

  const ordered = useMemo(
    () => orderedProducts(clearanceSale, sectionOrder.clearance),
    [clearanceSale, sectionOrder.clearance]
  );

  // Hidden entirely while the site owner has the section switched off, or
  // when there's nothing marked for clearance yet.
  if (!clearanceSaleEnabled || !ordered.length) return null;

  return (
    <section className={styles.section} id="clearance-sale" aria-labelledby="cs-title">
      <div className={`${styles.head} shell`}>
        <div>
          <span className={styles.eyebrow}>Limited time only</span>
          <CountdownTimer endsAt={clearanceSaleEndsAt} />
          <h2 id="cs-title" className={styles.title}>
            Clearance sale
          </h2>
        </div>
        <Link to="/shop?category=Clearance%20Sale" className={styles.viewAll}>
          View all
        </Link>
      </div>

      <br></br>

      <div className="shell">
        <CardRow products={ordered} />
      </div>

      <br></br>

      <div className={`${styles.viewAllWrap} shell`}>
        <Link to="/shop?category=Clearance%20Sale" className={styles.viewAllBtn}>
          View all
        </Link>
      </div>
    </section>
  );
}
