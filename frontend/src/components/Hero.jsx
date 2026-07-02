import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import styles from "./Hero.module.css";

const AUTOPLAY_MS = 5000;

export default function Hero() {
  const { coverImages } = useSettings();
  const slides = coverImages.length ? coverImages : [""];
  const [index, setIndex] = useState(0);

  // Auto-advance the slideshow.
  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % slides.length),
      AUTOPLAY_MS
    );
    return () => clearInterval(id);
  }, [slides.length]);

  // Keep index valid if the cover list shrinks.
  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  return (
    <section className={styles.hero} id="top" aria-label="Featured">
      <div className={styles.viewport}>
        <div
          className={styles.track}
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((src, i) => (
            <div className={styles.slide} key={i}>
              <img src={src} alt="" loading={i === 0 ? "eager" : "lazy"} />
            </div>
          ))}
        </div>

        <div className={styles.overlay}>
          <Link to="/shop" className={styles.cta}>
            Shop
          </Link>
        </div>

        {slides.length > 1 && (
          <div className={styles.dots}>
            {slides.map((_, i) => (
              <button
                key={i}
                className={i === index ? `${styles.dot} ${styles.dotOn}` : styles.dot}
                onClick={() => setIndex(i)}
                aria-label={`Show cover ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
