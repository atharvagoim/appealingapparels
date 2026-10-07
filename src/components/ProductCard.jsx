import { Suspense, lazy, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./ProductCard.module.css";
import WishlistButton from "./WishlistButton.jsx";
import { totalStock, imagesOf, variantStock, priceOf } from "../context/ProductsContext";

// QuickView is a large modal (cart logic, size chart, colour switching) that
// only ever mounts once someone actually clicks to open it, so it ships as
// its own chunk instead of bloating every page that shows a product grid.
const QuickView = lazy(() => import("./QuickView.jsx"));

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
export default function ProductCard({ product, badge, rank, colorName, showSwatches }) {
  const colors = product.colors || [];
  // Colourways in a stable order (primary first) for the swatch row.
  const orderedColors = [
    ...colors.filter((c) => c.primary),
    ...colors.filter((c) => !c.primary),
  ];
  const primaryName = orderedColors[0]?.name || null;
  const navigate = useNavigate();

  // In swatch mode the card shows the primary colour; each swatch is a link to
  // its own colour's product page (see below). Otherwise the card is pinned by
  // `colorName` (homepage rails) or falls back to the primary colour.
  const effColor = showSwatches ? colorName || primaryName : colorName;

  const gallery = imagesOf(product, effColor);
  const image = gallery[0] ?? product.image;
  const hoverImage = gallery[1];
  const to = effColor
    ? `/product/${product.slug}?color=${encodeURIComponent(effColor)}`
    : `/product/${product.slug}`;

  const price = priceOf(product, effColor);
  const hasDiscount =
    typeof product.compareAtPrice === "number" &&
    product.compareAtPrice > price;
  const percentOff = hasDiscount
    ? Math.round((1 - price / product.compareAtPrice) * 100)
    : 0;
  const soldOut = effColor
    ? variantStock(product, effColor) === 0
    : totalStock(product) === 0;

  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const showSwatchRow = showSwatches && orderedColors.length > 1;

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

        {showSwatchRow && (
          <div className={styles.swatches}>
            {orderedColors.map((c) => (
              <button
                key={c.name}
                type="button"
                className={`${styles.swatch} ${
                  effColor === c.name ? styles.swatchOn : ""
                }`}
                style={{ background: c.swatch || "#cccccc" }}
                title={c.name}
                aria-label={`View ${product.name} in ${c.name}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(
                    `/product/${product.slug}?color=${encodeURIComponent(c.name)}`
                  );
                }}
              />
            ))}
          </div>
        )}

        <div className={styles.priceRow}>
          {hasDiscount && (
            <span className={styles.original}>
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
          <span className={hasDiscount ? styles.salePrice : styles.price}>
            {formatPrice(price)}
          </span>
        </div>
      </Link>

      {quickViewOpen && (
        <Suspense fallback={null}>
          <QuickView
            product={product}
            initialColor={effColor}
            onClose={() => setQuickViewOpen(false)}
          />
        </Suspense>
      )}
    </article>
  );
}
