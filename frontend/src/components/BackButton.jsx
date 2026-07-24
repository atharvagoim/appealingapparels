import { useNavigate } from "react-router-dom";
import styles from "./BackButton.module.css";

/**
 * "Back" control that returns to the previous page.
 *
 * Pass `label` to get the dark square plus a heading beside it, the same
 * treatment the Shopping bag page uses.
 */
export default function BackButton({ translucent = false, bare = false, label = "" }) {
  const navigate = useNavigate();

  if (bare) {
    return (
      <button
        type="button"
        className={styles.bare}
        onClick={() => navigate(-1)}
        aria-label="Go back"
      >
        <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="11 6 5 12 11 18" />
        </svg>
      </button>
    );
  }

  const square = (
    <button
      type="button"
      className={`${styles.back} ${translucent ? styles.translucent : ""}`}
      onClick={() => navigate(-1)}
      aria-label="Go back"
    >
      <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="11 6 5 12 11 18" />
      </svg>
    </button>
  );

  if (!label) return square;

  return (
    <span className={styles.labelled}>
      {square}
      <span className={styles.label}>{label}</span>
    </span>
  );
}
