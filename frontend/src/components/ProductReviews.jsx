import { useEffect, useState } from "react";
import { Stars } from "./StarRating";
import { fetchProductReviews } from "../api/reviewsApi";
import styles from "./ProductReviews.module.css";

const fmt = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/**
 * Ratings and reviews for one product, shown under the product code.
 * Renders nothing at all when the product has no reviews yet.
 */
export default function ProductReviews({ productId }) {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!productId) return;
    let active = true;
    setData(null);
    setOpen(false);
    fetchProductReviews(productId)
      .then((d) => active && setData(d))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [productId]);

  // No reviews → show nothing.
  if (!data || !data.count) return null;

  const { average, count, reviews } = data;
  const written = reviews.filter((r) => r.body);

  return (
    <div className={styles.wrap}>
      <div className={styles.summary}>
        <span className={styles.average}>{average.toFixed(1)}</span>
        <div>
          <Stars value={average} size={18} />
          <p className={styles.count}>
            {count} rating{count > 1 ? "s" : ""}
            {written.length
              ? ` · ${written.length} review${written.length > 1 ? "s" : ""}`
              : ""}
          </p>
        </div>
      </div>

      <button
        type="button"
        className="acc-head"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>Ratings &amp; reviews ({count})</span>
        <svg
          className={open ? "acc-chevron open" : "acc-chevron"}
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul className={styles.list}>
          {reviews.map((r) => (
            <li className={styles.review} key={r.id}>
              <div className={styles.reviewHead}>
                <Stars value={r.rating} size={14} />
                <span className={styles.reviewName}>{r.name || "Customer"}</span>
                <span className={styles.reviewDate}>{fmt(r.createdAt)}</span>
              </div>
              {r.body && <p className={styles.reviewBody}>{r.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
