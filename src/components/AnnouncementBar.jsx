import { useSettings } from "../context/SettingsContext";
import styles from "./AnnouncementBar.module.css";

export default function AnnouncementBar() {
  const { announcement } = useSettings();
  const { enabled, animated, bgColor, bgGradient, textColor, taglines } = announcement || {};
  const items = (taglines || []).filter((t) => t && t.trim());

  if (!enabled || !items.length) return null;

  const barStyle = { background: bgGradient || bgColor || "#111111" };
  const textStyle = { color: textColor || "#ffffff" };

  if (!animated) {
    return (
      <div className={styles.bar} style={barStyle} role="region" aria-label="Store announcement">
        <div className={styles.staticRow}>
          {items.map((t, i) => (
            <span className={styles.item} style={textStyle} key={i}>
              {t}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // Animated: the sequence is duplicated so the right-to-left loop is seamless.
  const track = [...items, ...items];
  return (
    <div className={styles.bar} style={barStyle} role="region" aria-label="Store announcement">
      <div className={styles.marqueeViewport}>
        <div className={styles.marqueeTrack}>
          {track.map((t, i) => (
            <span className={styles.marqueeItem} style={textStyle} key={i}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
