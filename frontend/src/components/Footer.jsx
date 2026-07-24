import { Link } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import { useProducts } from "../context/ProductsContext";
import styles from "./Footer.module.css";

const telHref = (p) => `tel:${String(p).replace(/[^\d+]/g, "")}`;

const ICONS = {
  Instagram: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
  Facebook: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />
    </svg>
  ),
  "Twitter / X": (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M18.9 2H22l-7.6 8.7L23.3 22h-6.9l-5.4-6.9L4.8 22H1.7l8.1-9.3L1 2h7.1l4.9 6.3L18.9 2zm-1.2 18h1.9L7.4 4H5.4l12.3 16z" />
    </svg>
  ),
  YouTube: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
      <path d="M23 12s0-3.5-.45-5.2a2.9 2.9 0 0 0-2-2C18.9 4.3 12 4.3 12 4.3s-6.9 0-8.55.5a2.9 2.9 0 0 0-2 2C1 8.5 1 12 1 12s0 3.5.45 5.2a2.9 2.9 0 0 0 2 2C5.1 19.7 12 19.7 12 19.7s6.9 0 8.55-.5a2.9 2.9 0 0 0 2-2C23 15.5 23 12 23 12z" fillOpacity="0" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9.75 15.02 15.5 12 9.75 8.98v6.04z" />
    </svg>
  ),
  Pinterest: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.65 19.31c-.05-.83-.09-2.1.02-3 .1-.42.66-2.83.66-2.83s-.17-.34-.17-.84c0-.79.46-1.38 1.03-1.38.49 0 .72.36.72.8 0 .49-.31 1.22-.47 1.9-.13.57.29 1.03.85 1.03 1.02 0 1.8-1.08 1.8-2.63 0-1.38-.99-2.34-2.4-2.34-1.64 0-2.6 1.23-2.6 2.5 0 .49.19 1.02.43 1.31a.17.17 0 0 1 .04.17c-.05.19-.15.6-.17.68-.03.11-.09.14-.2.08-1.13-.53-1.7-1.72-1.7-3.09 0-2.03 1.71-3.85 4.51-3.85 2.24 0 3.98 1.6 3.98 3.73 0 2.26-1.42 4.08-3.4 4.08-.65 0-1.27-.34-1.48-.74l-.4 1.53c-.14.55-.53 1.24-.79 1.66A10 10 0 1 0 12 2z" />
    </svg>
  ),
  TikTok: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.1c-.7-.7-1.1-1.7-1.1-2.7h-3.1v13.4c0 1.4-1.1 2.6-2.6 2.6a2.6 2.6 0 0 1 0-5.2c.3 0 .5 0 .8.1V10c-.3 0-.5-.1-.8-.1-3.1 0-5.7 2.5-5.7 5.7S6.7 21.3 9.8 21.3s5.7-2.5 5.7-5.7V8.9c1.2.9 2.7 1.4 4.2 1.4V7.2c-1.1 0-2.2-.4-3.1-1.1z" />
    </svg>
  ),
  LinkedIn: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M6.94 8.5H3.56V21h3.38V8.5zM5.25 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM21 13.4c0-3.4-1.8-5-4.2-5-1.6 0-2.6.8-3.1 1.7V8.5H10.3c.05 1 0 12.5 0 12.5h3.4v-7c0-.4 0-.7.1-1 .3-.7.9-1.4 1.9-1.4 1.3 0 1.9 1 1.9 2.5V21H21v-7.6z" />
    </svg>
  ),
  WhatsApp: (
    <svg viewBox="0 0 24 24" width="21" height="21" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm5.7 14.2c-.2.6-1.4 1.2-1.9 1.3-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.2-1.6-1.2-3.1s.8-2.2 1.1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5.2.6.8 1.9.8 2.1.1.2.1.3 0 .5-.1.2-.1.3-.3.5-.1.2-.3.4-.4.5-.1.1-.3.3-.1.6.2.3.9 1.4 1.9 2.3 1.3 1.1 2.4 1.5 2.7 1.7.3.1.5.1.7-.1.2-.2.8-.9 1-1.2.2-.3.4-.2.6-.1.2.1 1.5.7 1.8.8.3.1.5.2.5.3.1.2.1.6-.1 1.2z" />
    </svg>
  ),
};
const FALLBACK_ICON = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.07 0l2-2a5 5 0 0 0-7.07-7.07l-1 1" />
    <path d="M14 11a5 5 0 0 0-7.07 0l-2 2a5 5 0 0 0 7.07 7.07l1-1" />
  </svg>
);

export default function Footer() {
  const { footer, storeInfo } = useSettings();
  const { categories } = useProducts();
  const { phone, email, socialLinks } = footer || {};
  const links = (socialLinks || []).filter((s) => s?.url);

  /**
   * The three collections first, then every category the shop actually has —
   * added in admin → Categories, so this list keeps itself up to date.
   */
  const shopLinks = [
    "New Arrivals",
    "Best Sellers",
    "Clearance Sale",
    ...(categories || [])
      .map((c) => (typeof c === "string" ? c : c?.label || c?.name))
      .filter(Boolean),
  ];

  const storeMapLink =
    String(storeInfo?.mapsUrl || "").trim() ||
    (storeInfo?.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          storeInfo.address
        )}`
      : "");

  return (
    <footer className={styles.footer}>
      <div className={`${styles.top} shell`}>
        <div className={styles.colsWrap}>
          {/* Help — phone + email */}
          <div className={styles.col} id="footer-help">
            <h3 className={styles.colTitle}>Help</h3>
            <ul className={styles.list}>
              {phone && (
                <li>
                  <a href={telHref(phone)} className={styles.link}>{phone}</a>
                </li>
              )}
              {email && (
                <li>
                  <a href={`mailto:${email}`} className={styles.link}>{email}</a>
                </li>
              )}
            </ul>
          </div>

          {/* Shop — the three collections plus every live category. */}
          <div className={styles.col}>
            <h3 className={styles.colTitle}>Shop</h3>
            <ul className={styles.list}>
              {shopLinks.map((c) => (
                <li key={c}>
                  <Link
                    className={styles.link}
                    to={`/shop?category=${encodeURIComponent(c)}`}
                  >
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div className={styles.col} id="footer-about">
            <h3 className={styles.colTitle}>About</h3>
            <ul className={styles.list}>
              <li>
                <Link className={styles.link} to="/about">
                  Our story
                </Link>
              </li>
              <li>
                <Link className={styles.link} to="/shop">
                  All products
                </Link>
              </li>
              {storeInfo?.address && (
                <li>
                  <a
                    className={styles.link}
                    href={storeMapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit our store
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Social — any platforms added in admin */}
          {links.length > 0 && (
            <div className={styles.col}>
              <h3 className={styles.colTitle}>Follow</h3>
              <div className={styles.social}>
                {links.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                    aria-label={s.platform || "Social link"}
                  >
                    {ICONS[s.platform] || FALLBACK_ICON}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`${styles.wordmarkWrap} shell`}>
        <span className={styles.wordmark}>Appealing Apparels</span>
        <p className={styles.legal}>© 2026 Appealing Apparels. All rights reserved.</p>
      </div>
    </footer>
  );
}
