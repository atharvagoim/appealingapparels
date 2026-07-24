import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./ProductCard.module.css";
import WishlistButton from "./WishlistButton.jsx";
import QuickView from "./QuickView.jsx";
import { totalStock, imagesOf, variantStock } from "../context/ProductsContext";

const formatPrice = (value) =>
  typeof value === "number" ? `₹${value.toLocaleString("en-IN")}` : value;

/**
 * Single reusable product card (Shop grid, homepage rails, wishlist).
 * On hover it swaps to the second image. The "+" button opens a quick-view
 * popup (bottom sheet on phone, centred dialog on laptop) with photos, size
 * picker, "View details" and Add to cart.
 */
/**
 * Single reusable product card.
 *
 * `colorName` pins the card to one colourway — the shop grid uses it to show
 * every colour of a product as its own card. Left out, the card falls back to
 * whichever colour is marked primary.
 */
export default function ProductCard({ product, badge, rank, colorName }) {
  const gallery = imagesOf(product, colorName);
  const image = gallery[0] ?? product.image;
  const hoverImage = gallery[1];
  const to = colorName
    ? `/product/${product.slug}?color=${encodeURIComponent(colorName)}`
    : `/product/${product.slug}`;

  const hasDiscount =
    typeof product.compareAtPrice === "number" &&
    product.compareAtPrice > product.price;
  const percentOff = hasDiscount
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0;
  const soldOut = colorName
    ? variantStock(product, colorName) === 0
    : totalStock(product) === 0;

  const [quickViewOpen, setQuickViewOpen] = useState(false);

  return (
    <article className={styles.card}>
      <div className={styles.frame}>
        <Link to={to} className={styles.media} aria-label={product.name}>
          <img
            className={styles.imgMain}
            src={image}
            alt={product.name}
            loading="lazy"
            decoding="async"
          />
          {hoverImage && (
            <img
              className={styles.imgHover}
              src={hoverImage}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
            />
          )}
        </Link>

        {hasDiscount && !soldOut && (
          <span className={styles.saveTag}>{percentOff}% off</span>
        )}
        {badge && !hasDiscount && <span className={styles.badge}>{badge}</span>}
        {rank && <span className={styles.rank}>{rank}</span>}
        {soldOut && <span className={styles.soldTag}>Sold out</span>}

        <WishlistButton product={product} />
      </div>

      <Link to={to} className={styles.meta}>
        <div className={styles.nameRow}>
          <h3 className={styles.name}>
            {product.name}
            {colorName && <span className={styles.colourName}> — {colorName}</span>}
          </h3>
          {!soldOut && (
          <button
            type="button"
            className={styles.quickViewBtn}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setQuickViewOpen(true);
            }}
            aria-label={`Quick view ${product.name}`}
          >
            <span className={styles.quickViewText}>Add</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          )}
        </div>
        <div className={styles.priceRow}>
          {hasDiscount && (
            <span className={styles.original}>
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
          <span className={hasDiscount ? styles.salePrice : styles.price}>
            {formatPrice(product.price)}
          </span>
        </div>
      </Link>

      {quickViewOpen && (
        <QuickView
          product={product}
          initialColor={colorName}
          onClose={() => setQuickViewOpen(false)}
        />
      )}
    </article>
  );
}
