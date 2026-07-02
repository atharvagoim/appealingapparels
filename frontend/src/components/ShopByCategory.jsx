import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import styles from "./ShopByCategory.module.css";

const AUTOPLAY_MS = 4500;

function Slide({ cat }) {
  const inner = (
    <div className={styles.frame}>
      {cat.image && <img src={cat.image} alt="" />}
      <span className={styles.scrim} aria-hidden="true" />
      <div className={styles.overlay}>
        <span className={styles.label}>{cat.label}</span>
      </div>
    </div>
  );
  const internal = cat.link && cat.link.startsWith("/");
  return internal ? (
    <Link to={cat.link} className={styles.slide}>
      {inner}
    </Link>
  ) : (
    <a href={cat.link || "#"} className={styles.slide}>
      {inner}
    </a>
  );
}

export default function ShopByCategory() {
  const { categories } = useSettings();
  const [index, setIndex] = useState(0);

  // Auto-advance the slideshow.
  useEffect(() => {
    if (categories.length <= 1) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % categories.length),
      AUTOPLAY_MS
    );
    return () => clearInterval(id);
  }, [categories.length]);

  // Keep index valid if the list shrinks.
  useEffect(() => {
    if (index >= categories.length) setIndex(0);
  }, [categories.length, index]);

  if (!categories.length) return null;

  return (
    <section className={styles.section} aria-label="Browse categories">
      <div className={styles.viewport}>
        <div
          className={styles.track}
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {categories.map((cat, i) => (
            <Slide cat={cat} key={`${cat.label}-${i}`} />
          ))}
        </div>

        {categories.length > 1 && (
          <div className={styles.dots}>
            {categories.map((_, i) => (
              <button
                key={i}
                className={i === index ? `${styles.dot} ${styles.dotOn}` : styles.dot}
                onClick={() => setIndex(i)}
                aria-label={`Show category ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
