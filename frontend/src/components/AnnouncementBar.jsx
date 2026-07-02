import styles from "./AnnouncementBar.module.css";

export default function AnnouncementBar() {
  return (
    <div className={styles.bar} role="region" aria-label="Store announcements">
      <p className={styles.item}>Complimentary shipping on orders over ₹5,000</p>
      <span className={styles.dot} aria-hidden="true" />
      <p className={styles.item}>30-day returns, always</p>
    </div>
  );
}
