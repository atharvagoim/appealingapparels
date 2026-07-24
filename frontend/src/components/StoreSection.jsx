import { useSettings } from "../context/SettingsContext";
import styles from "./StoreSection.module.css";

function PinIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2C7.86 2 4.5 5.36 4.5 9.5c0 5.75 7.5 12.5 7.5 12.5s7.5-6.75 7.5-12.5C19.5 5.36 16.14 2 12 2z"
        fill="currentColor"
      />
      <circle cx="12" cy="9.5" r="3.1" fill="var(--paper)" />
    </svg>
  );
}

function ClockIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

/**
 * Pulls real coordinates out of a Google Maps URL so the embed drops a pin on
 * the shop itself rather than centring on the whole pincode area.
 */
function coordsFrom(url) {
  const s = String(url || "");
  // The place's own marker — most accurate.
  let m = s.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (m) return `${m[1]},${m[2]}`;
  // Explicit query / centre coordinates.
  m = s.match(/[?&](?:q|query|ll|center|daddr)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (m) return `${m[1]},${m[2]}`;
  // Viewport coordinates from a /maps/@lat,lng,17z style link.
  m = s.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (m) return `${m[1]},${m[2]}`;
  return "";
}

export default function StoreSection() {
  const { storeInfo } = useSettings();
  const { address, addressNote, hoursLabel, hoursValue, mapsUrl, mapQuery } =
    storeInfo || {};

  if (!address) return null;

  // Exact spot first, then coordinates lifted from the directions link, then
  // the written address as a last resort.
  const exactLocation =
    String(mapQuery || "").trim() || coordsFrom(mapsUrl) || address;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    exactLocation
  )}&z=17&hl=en&output=embed`;

  return (
    <section className={styles.section} aria-labelledby="store-title">
      <div className="shell">
        <div className={styles.card}>
          <div className={styles.content}>
            <h2 id="store-title" className={styles.title}>
              Visit our store
            </h2>
            <p className={styles.lede}>
              Experience our collections in person. We'd love to see you!
            </p>

            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <span className={styles.infoIcon}>
                  <PinIcon className={styles.infoIconSvg} />
                </span>
                <div>
                  <p className={styles.infoTitle}>{address}</p>
                  {addressNote && <p className={styles.infoSub}>{addressNote}</p>}
                </div>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoIcon}>
                  <ClockIcon className={styles.infoIconSvg} />
                </span>
                <div>
                  <p className={styles.infoTitle}>{hoursLabel}</p>
                  <p className={styles.infoSub}>{hoursValue}</p>
                </div>
              </div>
            </div>

            {mapsUrl && (
              <a
                className={styles.directionsBtn}
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Get directions
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </a>
            )}
          </div>

          <div className={styles.mapPanel}>
            <iframe
              className={styles.mapFrame}
              title="Store location map"
              src={mapSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
