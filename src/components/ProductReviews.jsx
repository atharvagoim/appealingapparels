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
  const visible = open ? reviews : reviews.slice(0, 2);
  const hiddenCount = reviews.length - 2;

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

      {reviews.length > 0 && (
        <ul className={styles.list}>
          {visible.map((r) => (
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

      {hiddenCount > 0 && (
        <button
          type="button"
          className={styles.viewMore}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Show less" : `View more (${hiddenCount})`}
        </button>
      )}
    </div>
  );
}
