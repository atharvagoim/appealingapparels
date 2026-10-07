import { useSettings } from "../context/SettingsContext";
import styles from "./SocialFollow.module.css";

/* Line icons for the follow-panel proof points. */
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
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {STAT_ICONS[name] || STAT_ICONS.users}
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M12 2C7.86 2 4.5 5.36 4.5 9.5c0 5.75 7.5 12.5 7.5 12.5s7.5-6.75 7.5-12.5C19.5 5.36 16.14 2 12 2z"
        fill="currentColor"
      />
      <circle cx="12" cy="9.5" r="3.1" fill="var(--paper)" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

/** The classic Facebook glyph — used both as the small eyebrow mark above
 *  the heading and inside the follow button. */
/** The real Facebook logo (a supplied image, not a hand-drawn glyph) — used
 *  as the eyebrow mark, inside the follow button, and as the mobile badge.
 *  It's a complete circular mark on its own, so wherever it's used, the
 *  wrapping badge's own background is turned off (see the *Fb modifier
 *  classes) rather than showing a circle behind a circle. */
function FacebookIcon({ size = 22 }) {
  return (
    <img
      src="/facebook-icon.png"
      alt="Facebook"
      width={size}
      height={size}
      style={{ display: "block", width: size, height: size, borderRadius: "50%" }}
    />
  );
}

/** A simple storefront glyph for the "Visit our store" eyebrow mark. */
function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8.5 5.5 4h13L20 8.5" />
      <path d="M4 8.5v10.5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V8.5" />
      <path d="M4 8.5a2.3 2.3 0 0 0 4.4 1 2.3 2.3 0 0 0 4.4 0 2.3 2.3 0 0 0 4.4 0 2.3 2.3 0 0 0 4.4-1" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

/** Trailing arrow used on both buttons. */
function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

/** Small chevron used in the mobile-only stacked list rows. */
function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/**
 * Combined "Follow us on Facebook" + "Visit our store" band — one homepage
 * section with two side-by-side panels, each independently editable in admin
 * → Social, and each independently hidden when it has nothing to show.
 */
export default function SocialFollow() {
  const { socialFollow, storeInfo } = useSettings();
  const s = socialFollow || {};
  const store = storeInfo || {};

  const showFollow = Boolean(s.enabled && String(s.url || "").trim());
  const showStore = Boolean(store.enabled !== false && String(store.address || "").trim());
  if (!showFollow && !showStore) return null;

  const platform = s.platform || "Facebook";
  const stats = (s.stats || []).filter((x) => x && (x.value || x.label));

  return (
    <section
      className={styles.section}
      aria-label="Follow us and visit our store"
    >
      <div
        className={`${styles.band} ${
          showFollow && showStore ? "" : styles.bandSingle
        }`}
      >
        {showFollow && (
          <div className={styles.panel}>
            <div className={styles.eyebrowMark}>
              <span className={`${styles.eyebrowIcon} ${styles.eyebrowIconFb}`}>
                <FacebookIcon size={32} />
              </span>
              <span className={styles.eyebrowDash} />
            </div>
            <h2 className={styles.title}>{s.heading || `Follow us on ${platform}`}</h2>
            {s.subtext && <p className={styles.lede}>{s.subtext}</p>}

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
              <span className={`${styles.ctaMark} ${styles.ctaMarkFb}`}>
                <FacebookIcon size={30} />
              </span>
              <span className={styles.ctaLabel}>
                {s.buttonLabel || `Visit our ${platform} page`}
              </span>
              <ArrowIcon />
            </a>
          </div>
        )}

        {showStore && (
          <div className={`${styles.panel} ${styles.storePanel}`}>
            <div className={styles.eyebrowMark}>
              <span className={styles.eyebrowIcon}>
                <StoreIcon />
              </span>
              <span className={styles.eyebrowDash} />
            </div>
            <h2 className={styles.title}>Visit our store</h2>
            <p className={styles.lede}>
              Experience our collections in person. We'd love to see you!
            </p>

            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <span className={styles.infoIcon}>
                  <PinIcon />
                </span>
                <div>
                  <p className={styles.infoTitle}>{store.address}</p>
                  {store.addressNote && (
                    <p className={`${styles.infoSub} ${styles.addressNote}`}>{store.addressNote}</p>
                  )}
                </div>
              </div>

              {(store.hoursLabel || store.hoursValue) && (
                <div className={styles.infoRow}>
                  <span className={styles.infoIcon}>
                    <ClockIcon />
                  </span>
                  <div>
                    <p className={styles.infoTitle}>{store.hoursLabel}</p>
                    <p className={styles.infoSub}>{store.hoursValue}</p>
                  </div>
                </div>
              )}
            </div>

            {store.mapsUrl && (
              <a
                className={styles.directionsBtn}
                href={store.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={styles.ctaMark}>
                  <PinIcon />
                </span>
                <span className={styles.ctaLabel}>Get directions</span>
                <ArrowIcon />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Mobile-only combined card — a completely different layout from the
          desktop panels above (list rows with chevrons, not stat-card
          panels), so it's built as its own markup rather than a CSS
          rework of .band. Hidden ≥900px; .band above is hidden <900px. */}
      <div className={styles.mobileCard}>
        {(s.sectionTitle || s.sectionSubtitle) && (
          <div className={styles.mobileHead}>
            {s.sectionTitle && <h2 className={styles.mobileTitle}>{s.sectionTitle}</h2>}
            <span className={styles.mobileRule} />
            {s.sectionSubtitle && <p className={styles.mobileSubtitle}>{s.sectionSubtitle}</p>}
          </div>
        )}

        {showFollow && (
          <>
            <a
              className={styles.mobileRow}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={styles.mobileFbBadge}>
                <FacebookIcon size={20} />
              </span>
              <span className={styles.mobileRowLabel}>
                {(s.buttonLabel || `Follow us on ${platform}`).toUpperCase()}
              </span>
              <ChevronIcon />
            </a>
            {showStore && <span className={styles.mobileSep} />}
          </>
        )}

        {showStore && (
          <>
            {store.mapsUrl ? (
              <a
                className={styles.mobileRow}
                href={store.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={styles.mobileIconBadge}>
                  <PinIcon />
                </span>
                <span className={styles.mobileRowLabel}>VISIT OUR STORE</span>
                <ChevronIcon />
              </a>
            ) : (
              <div className={styles.mobileRow}>
                <span className={styles.mobileIconBadge}>
                  <PinIcon />
                </span>
                <span className={styles.mobileRowLabel}>VISIT OUR STORE</span>
              </div>
            )}

            <div className={styles.mobileStoreInfo}>
              <span className={styles.mobileIconBadge}>
                <StoreIcon />
              </span>
              <span className={styles.mobileStoreText}>
                <span className={styles.mobileStoreName}>Appealing Apparels</span>
                <span className={styles.mobileStoreAddress}>{store.address}</span>
              </span>
            </div>

            {(store.hoursLabel || store.hoursValue) && (
              <>
                <span className={styles.mobileSep} />
                <div className={styles.mobileStoreInfo}>
                  <span className={styles.mobileIconBadge}>
                    <ClockIcon />
                  </span>
                  <span className={styles.mobileStoreText}>
                    <span className={styles.mobileStoreName}>TIMINGS</span>
                    {store.hoursLabel && (
                      <span className={styles.mobileStoreAddress}>{store.hoursLabel}</span>
                    )}
                    {store.hoursValue && (
                      <span className={styles.mobileStoreAddress}>{store.hoursValue}</span>
                    )}
                  </span>
                </div>
              </>
            )}

            {store.mapsUrl && (
              <a
                className={styles.mobileDirectionsBtn}
                href={store.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <PinIcon />
                GET DIRECTIONS
              </a>
            )}
          </>
        )}
      </div>
    </section>
  );
}
