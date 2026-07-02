import styles from "./NewArrivals.module.css";
import ProductCard from "./ProductCard.jsx";
import { useProducts } from "../context/ProductsContext";
import useReveal from "../useReveal.js";

export default function NewArrivals() {
  const { newArrivals } = useProducts();
  const [ref, shown] = useReveal();

  return (
    <section
      className={`${styles.section} ${shown ? styles.shown : ""}`}
      id="new-arrivals"
      ref={ref}
      aria-labelledby="na-title"
    >
      <div className={`${styles.head} shell`}>
        <div>
          <p className="eyebrow">Just landed</p>
          <h2 id="na-title" className={styles.title}>
            New arrivals
          </h2>
        </div>
        <a href="#" className={styles.viewAll}>
          View all
        </a>
      </div>

      <div className={styles.scroller}>
        <div className={styles.rail}>
          {newArrivals.map((p) => (
            <div className={styles.cell} key={p.id}>
              <ProductCard product={p} badge="New" />
            </div>
          ))}
          <div className={styles.endcap}>
            <a href="#" className={styles.endcapLink}>
              See the
              <br />
              full edit
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
