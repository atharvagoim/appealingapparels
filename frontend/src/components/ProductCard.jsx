import { Link } from "react-router-dom";
import styles from "./ProductCard.module.css";
import WishlistButton from "./WishlistButton.jsx";

const formatPrice = (value) =>
  typeof value === "number" ? `₹${value.toLocaleString("en-IN")}` : value;

/**
 * Single reusable product card (Shop grid, homepage rails, wishlist).
 * The card is an <article>; navigation lives in two <Link>s (image + meta)
 * so the wishlist <button> can sit alongside them without nesting
 * interactive elements inside an anchor.
 */
export default function ProductCard({ product, badge, rank }) {
  const image = product.images?.[0] ?? product.image;
  const to = `/product/${product.slug}`;

  return (
    <article className={styles.card}>
      <div className={styles.frame}>
        <Link to={to} className={styles.media} aria-label={product.name}>
          <img src={image} alt={product.name} loading="lazy" />
        </Link>

        {badge && <span className={styles.badge}>{badge}</span>}
        {rank && <span className={styles.rank}>{rank}</span>}

        <WishlistButton product={product} />
      </div>

      <Link to={to} className={styles.meta}>
        <div className={styles.metaText}>
          <h3 className={styles.name}>{product.name}</h3>
          <p className={styles.category}>{product.category}</p>
        </div>
        <p className={styles.price}>{formatPrice(product.price)}</p>
      </Link>
    </article>
  );
}
