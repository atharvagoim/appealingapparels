import styles from "./FeatureStrip.module.css";

const FEATURES = [
  {
    title: "Free shipping",
    sub: "On orders above ₹1,499",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 6.5h10.5v9.5H3z" />
        <path d="M13.5 9.5H18l3 3v3.5h-7.5z" />
        <circle cx="7" cy="18" r="1.7" />
        <circle cx="17.5" cy="18" r="1.7" />
      </svg>
    ),
  },
  {
    title: "Secure payments",
    sub: "100% secure payments",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l7 3v5c0 4.6-3 7.7-7 9-4-1.3-7-4.4-7-9V6z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Customer support",
    sub: "We're here to help",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
        <path d="M6 13H4.5A1.5 1.5 0 0 0 3 14.5v2A1.5 1.5 0 0 0 4.5 18H6z" />
        <path d="M18 13h1.5A1.5 1.5 0 0 1 21 14.5v2A1.5 1.5 0 0 1 19.5 18H18z" />
        <path d="M20 18a4 4 0 0 1-4 3.5h-2" />
      </svg>
    ),
  },
];

export default function FeatureStrip() {
  return (
    <section className={styles.section} aria-label="Why shop with us">
      <div className={`${styles.strip} shell`}>
        {FEATURES.map((f) => (
          <div className={styles.item} key={f.title}>
            <span className={styles.icon}>{f.icon}</span>
            <span className={styles.text}>
              <span className={styles.title}>{f.title}</span>
              <span className={styles.sub}>{f.sub}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
