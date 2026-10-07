import { Link } from "react-router-dom";
import useDocumentMeta from "../hooks/useDocumentMeta";
import styles from "./LegalPage.module.css";

/**
 * Shared shell for Privacy Policy / Terms of Service / Refund Policy — one
 * consistent document layout so each page is just its own content.
 */
export default function LegalPage({ title, updated, description, children }) {
  useDocumentMeta(title, description);

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <Link to="/" className={styles.back}>
          ← Back to home
        </Link>
        <p className={styles.eyebrow}>Legal</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.updated}>Last updated {updated}</p>
        <div className={styles.body}>{children}</div>
      </div>
    </main>
  );
}
