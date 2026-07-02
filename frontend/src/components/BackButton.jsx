import { useNavigate } from "react-router-dom";
import styles from "./BackButton.module.css";

/** Back arrow that returns to the previous page. */
export default function BackButton({ label = "Back" }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className={styles.back}
      onClick={() => navigate(-1)}
      aria-label="Go back"
    >
      <span className={styles.arrow} aria-hidden="true">←</span>
      {label}
    </button>
  );
}
