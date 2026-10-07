import { useEffect } from "react";
import styles from "./LogoutConfirmModal.module.css";

/**
 * A small "are you sure?" dialog shown before actually logging someone
 * out — used on both the customer Account page and the admin panel, so it's
 * a shared, generic component rather than living in either one.
 */
export default function LogoutConfirmModal({ onConfirm, onCancel, busy = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="logout-confirm-title" className={styles.title}>
          Log out?
        </h2>
        <p className={styles.body}>You'll need to sign in again to get back in.</p>
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={styles.confirm} onClick={onConfirm} disabled={busy}>
            {busy ? "Logging out…" : "Log out"}
          </button>
        </div>
      </div>
    </div>
  );
}
