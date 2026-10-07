import { useMemo } from "react";
import { Link } from "react-router-dom";
import styles from "./ClearanceSale.module.css";
import CardRow from "./CardRow.jsx";
import CountdownTimer from "./CountdownTimer.jsx";
import { useProducts } from "../context/ProductsContext";
import { useSettings } from "../context/SettingsContext";
import { orderedProducts, sectionEntries } from "../utils/sectionOrder";

export default function ClearanceSale() {
  const { clearanceSaleEnabled, clearanceSaleEndsAt, sectionOrder, sectionTitles } = useSettings();
  const { clearanceSale } = useProducts();

  const ordered = useMemo(
    () => orderedProducts(clearanceSale, sectionOrder.clearance),
    [clearanceSale, sectionOrder.clearance]
  );

  // Hidden entirely while the site owner has the section switched off, or
  // when there's nothing marked for clearance yet.
  // One card per chosen colourway (its own photos); products with no
  // colours or no per-section pick fall back to a single primary card.
  const entries = useMemo(() => sectionEntries(ordered, "clearanceColors"), [ordered]);

  if (!clearanceSaleEnabled || !ordered.length) return null;

  return (
    <section className={styles.section} id="clearance-sale" aria-labelledby="cs-title">
      <div className={`${styles.head} shell`}>
        <div>
          <span className={styles.eyebrow}>Limited time only</span>
          <CountdownTimer endsAt={clearanceSaleEndsAt} />
          <h2 id="cs-title" className={styles.title}>
            {sectionTitles.clearance}
          </h2>
        </div>
        <Link to="/shop?category=Clearance%20Sale" className={styles.viewAll}>
          View all
        </Link>
      </div>

      <br></br>

      <div className="shell">
        <CardRow items={entries} showSwatches />
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
