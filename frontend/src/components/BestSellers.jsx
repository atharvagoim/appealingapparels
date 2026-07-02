import styles from "./BestSellers.module.css";
import ProductCard from "./ProductCard.jsx";
import { useProducts } from "../context/ProductsContext";
import useReveal from "../useReveal.js";

export default function BestSellers() {
  const { bestSellers } = useProducts();
  const [ref, shown] = useReveal();

  return (
    <section
      className={`${styles.section} ${shown ? styles.shown : ""}`}
      id="best-sellers"
      ref={ref}
      aria-labelledby="bs-title"
    >
      <div className={`${styles.head} shell`}>
        <h2 id="bs-title" className={styles.title}>
          Best sellers
        </h2>
        <p className={styles.note}>Ranked by what you keep coming back for.</p>
      </div>

      <div className={`${styles.grid} shell`}>
        {bestSellers.map((p, i) => (
          <ProductCard
            key={p.id}
            product={p}
            rank={String(i + 1).padStart(2, "0")}
          />
        ))}
      </div>
    </section>
  );
}
