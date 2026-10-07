import { Link } from "react-router-dom";
import styles from "./SectionBanner.module.css";

/** The "banner" header mode for a homepage rail — a full-width clickable
 *  image standing in for the plain text title, e.g. a promotional graphic
 *  like a "Big Bag Event — up to 50% off" banner instead of "New Arrivals".
 *  `fullBleed` skips the page's usual max-width/gutter so the image runs
 *  edge to edge instead of sitting inside the standard content column. */
export default function SectionBanner({ image, href, alt, fullBleed = false }) {
  const img = <img className={styles.image} src={image} alt={alt || ""} />;
  return (
    <div className={`${styles.wrap} ${fullBleed ? styles.fullBleed : "shell"}`}>
      {href ? (
        <Link to={href} className={styles.link} aria-label={alt || "View all"}>
          {img}
        </Link>
      ) : (
        img
      )}
    </div>
  );
}
