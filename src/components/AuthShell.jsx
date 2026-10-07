import { useSettings } from "../context/SettingsContext";
import { TRUST_ITEMS } from "./TrustBadges.jsx";
import styles from "./AuthShell.module.css";

/**
 * Shared shell for Login, Signup, Forgot Password, and Reset Password.
 *
 * `panelKey` ("login" | "signup") opts a page into the laptop-only split
 * layout (branded photo on the left, form on the right), each with its own
 * independent image/copy/accent colour — Forgot/Reset Password pass nothing
 * and get the centered, image-free layout instead. Regardless of panelKey,
 * the image never shows on a phone; below the laptop breakpoint every one
 * of these pages is just the form, full width.
 */
export default function AuthShell({ panelKey, eyebrow, title, subtitle, children }) {
  const { authPanels } = useSettings();
  const panel = panelKey ? authPanels?.[panelKey] : null;
  const accent = panel?.accent || "#0a0a0a";

  return (
    <main
      className={`${styles.page} ${panel ? styles.withImage : styles.centered}`}
      style={{ "--auth-accent": accent }}
    >
      {panel && (
        <div className={styles.imagePanel}>
          {panel.image && (
            <img
              className={styles.image}
              src={panel.image}
              alt=""
              style={{
                "--auth-x-m": `${panel.crop?.mobile?.x ?? 50}%`,
                "--auth-y-m": `${panel.crop?.mobile?.y ?? 50}%`,
                "--auth-zoom-m": panel.crop?.mobile?.zoom ?? 1,
                "--auth-x-d": `${panel.crop?.desktop?.x ?? 50}%`,
                "--auth-y-d": `${panel.crop?.desktop?.y ?? 50}%`,
                "--auth-zoom-d": panel.crop?.desktop?.zoom ?? 1,
              }}
            />
          )}
          <div className={styles.imageScrim} aria-hidden="true" />
          <div className={styles.imageCopy}>
            <h2 className={styles.headline}>{panel.headline || "Carry Better."}</h2>
            <p className={styles.tagline}>{panel.tagline || "Designed for everyday movement."}</p>
          </div>
        </div>
      )}

      <div className={styles.formPanel}>
        <div className={styles.card}>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.sub}>{subtitle}</p>}

          {children}

          <ul className={styles.trustRow}>
            {TRUST_ITEMS.map((t) => (
              <li className={styles.trustItem} key={t.title}>
                <span className={styles.trustIcon}>{t.icon}</span>
                <span>
                  <span className={styles.trustTitle}>{t.title}</span>
                  <span className={styles.trustSub}>{t.sub}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
