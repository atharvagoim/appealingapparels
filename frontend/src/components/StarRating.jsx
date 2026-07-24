import { useState } from "react";
import styles from "./StarRating.module.css";

function Star({ fill, size }) {
  // fill: 0 → empty, 1 → full, anything between draws a partial star.
  const id = `star-${Math.random().toString(36).slice(2)}`;
  const pct = `${Math.max(0, Math.min(1, fill)) * 100}%`;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" x2="100%" y1="0" y2="0">
          <stop offset={pct} stopColor="currentColor" />
          <stop offset={pct} stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.45 6.19 20.5l1.11-6.47-4.7-4.58 6.5-.95z"
        fill={`url(#${id})`}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Read-only star row. Supports halves via the decimal average. */
export function Stars({ value = 0, size = 16, className = "" }) {
  return (
    <span className={`${styles.stars} ${className}`} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} fill={value - i} size={size} />
      ))}
    </span>
  );
}

/** Clickable 1–5 star picker. */
export default function StarRating({ value = 0, onChange, size = 30, disabled }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <span
      className={styles.picker}
      role="radiogroup"
      aria-label="Rating out of 5 stars"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={`${styles.pickBtn} ${n <= shown ? styles.pickOn : ""}`}
          disabled={disabled}
          onMouseEnter={() => setHover(n)}
          onFocus={() => setHover(n)}
          onClick={() => onChange?.(n)}
        >
          <Star fill={n <= shown ? 1 : 0} size={size} />
        </button>
      ))}
    </span>
  );
}
