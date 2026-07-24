import { useSettings } from "../context/SettingsContext";
import styles from "./SocialFollow.module.css";

/* Platform marks, drawn to sit at the same weight as the rest of the site. */
const MARKS = {
  Facebook: (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />
    </svg>
  ),
  Instagram: (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  ),
  "Twitter / X": (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
      <path d="M17.5 3h3.2l-7 8 8.3 10h-6.5l-5-6.1L4.7 21H1.5l7.5-8.6L1 3h6.6l4.6 5.6L17.5 3zm-1.1 16h1.8L7.7 4.8H5.8L16.4 19z" />
    </svg>
  ),
  YouTube: (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
      <path d="M22.5 7.2a2.7 2.7 0 0 0-1.9-1.9C18.9 4.8 12 4.8 12 4.8s-6.9 0-8.6.5A2.7 2.7 0 0 0 1.5 7.2 28 28 0 0 0 1 12a28 28 0 0 0 .5 4.8 2.7 2.7 0 0 0 1.9 1.9c1.7.5 8.6.5 8.6.5s6.9 0 8.6-.5a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 23 12a28 28 0 0 0-.5-4.8zM9.9 15.3V8.7l5.7 3.3-5.7 3.3z" />
    </svg>
  ),
  WhatsApp: (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.7 1-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.6-1.2a.4.4 0 0 0 0-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.5 11.1 11.1 0 0 0 4.3 3.8c1.6.6 2.2.7 3 .6a2.5 2.5 0 0 0 1.7-1.2 2 2 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3z" />
    </svg>
  ),
};

/* Line icons for the three proof points. */
const STAT_ICONS = {
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.4a3.2 3.2 0 0 1 0 5.2M17.5 14.6a5.5 5.5 0 0 1 3 4.9" />
    </>
  ),
  bell: (
    <>
      <path d="M18 15V10a6 6 0 1 0-12 0v5l-1.6 2.4h15.2z" />
      <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  tag: (
    <>
      <path d="M20.6 13.4 11 3.8A2 2 0 0 0 9.6 3.2H4v5.6a2 2 0 0 0 .6 1.4l9.6 9.6a2 2 0 0 0 2.8 0l3.6-3.6a2 2 0 0 0 0-2.8z" />
      <circle cx="7.7" cy="7.7" r="1.2" />
    </>
  ),
  star: (
    <path d="M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.6 6.8 19.4l1-5.9-4.3-4.1 5.9-.8z" />
  ),
  truck: (
    <>
      <path d="M3 7h10v9H3zM13 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18.5" r="1.7" />
      <circle cx="17" cy="18.5" r="1.7" />
    </>
  ),
};

function StatIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {STAT_ICONS[name] || STAT_ICONS.users}
    </svg>
  );
}

/**
 * "Follow us on …" band between the Clearance Sale and Visit our store
 * sections. Everything shown here is editable in admin → Social.
 */
export default function SocialFollow() {
  const { socialFollow } = useSettings();
  const s = socialFollow || {};

  // Nothing to send people to, or switched off — render nothing at all.
  if (!s.enabled || !String(s.url || "").trim()) return null;

  const platform = s.platform || "Facebook";
  const mark = MARKS[platform] || MARKS.Facebook;
  const accent = s.accent || "#1a53e3";
  const stats = (s.stats || []).filter((x) => x && (x.value || x.label));

  return (
    <section
      className={styles.section}
      style={{ "--social-accent": accent }}
      aria-labelledby="social-follow-title"
    >
      <div className={styles.band}>
        {/* ------------------------------------------------ left: the pitch */}
        <div className={styles.content}>
          <span className={styles.mark}>{mark}</span>

          <h2 id="social-follow-title" className={styles.title}>
            {s.heading || `Follow us on ${platform}`}
          </h2>

          {s.subtext && <p className={styles.lede}>{s.subtext}</p>}
        </div>

        {/* --------------------------------- right: proof points + the CTA */}
        <div className={styles.aside}>
          {stats.length > 0 && (
            <ul className={styles.stats}>
              {stats.map((stat, i) => (
                <li className={styles.stat} key={`${stat.label}-${i}`}>
                  <span className={styles.statIcon}>
                    <StatIcon name={stat.icon} />
                  </span>
                  <span className={styles.statValue}>{stat.value}</span>
                  <span className={styles.statLabel}>{stat.label}</span>
                </li>
              ))}
            </ul>
          )}

          <a
            className={styles.cta}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {s.buttonLabel || `Visit our ${platform} page`}
          </a>
        </div>
      </div>
    </section>
  );
}
