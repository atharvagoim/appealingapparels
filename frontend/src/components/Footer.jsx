import styles from "./Footer.module.css";

const COLUMNS = [
  {
    title: "Shop",
    links: ["New arrivals", "Best sellers", "Clothing", "Accessories", "Gift cards"],
  },
  {
    title: "Help",
    links: ["Shipping", "Returns & exchanges", "Size guide", "Track order", "Contact"],
  },
  {
    title: "House",
    links: ["Our story", "Materials", "Sustainability", "Stores", "Careers"],
  },
];

const SOCIAL = ["Instagram", "Pinterest", "TikTok", "YouTube"];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`${styles.top} shell`}>
        <div className={styles.colsWrap}>
          {COLUMNS.map((col) => (
            <div className={styles.col} key={col.title}>
              <h3 className={styles.colTitle}>{col.title}</h3>
              <ul className={styles.list}>
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className={styles.link}>
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className={styles.col}>
            <h3 className={styles.colTitle}>Follow</h3>
            <ul className={styles.list}>
              {SOCIAL.map((s) => (
                <li key={s}>
                  <a href="#" className={styles.link}>
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className={`${styles.wordmarkWrap} shell`}>
        <span className={styles.wordmark}>Appealing Apparels</span>
      </div>

      <div className={`${styles.legal} shell`}>
        <p>© 2026 Appealing Apparels. All rights reserved.</p>
        <div className={styles.legalLinks}>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Cookies</a>
        </div>
      </div>
    </footer>
  );
}
