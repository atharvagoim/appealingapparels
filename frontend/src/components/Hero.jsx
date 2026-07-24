import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import useSwipe from "../hooks/useSwipe";
import styles from "./Hero.module.css";

const AUTOPLAY_MS = 5000;

function Slide({ cover }) {
  const m = cover.mobile || {};
  const l = cover.laptop || {};
  const inner = (
    <>
      <div className={`${styles.frame} ${styles.frameMobile}`}>
        {cover.image && (
          <img src={cover.image} alt="" draggable="false"
            style={{ objectPosition: `${m.x ?? 50}% ${m.y ?? 50}%`, transform: `scale(${m.zoom ?? 1})` }} />
        )}
      </div>
      <div className={`${styles.frame} ${styles.frameLaptop}`}>
        {cover.image && (
          <img src={cover.image} alt="" draggable="false"
            style={{ objectPosition: `${l.x ?? 50}% ${l.y ?? 50}%`, transform: `scale(${l.zoom ?? 1})` }} />
        )}
      </div>
    </>
  );
  // Every poster is clickable; defaults to the shop, admin can change the link.
  const link = cover.link || "/shop";
  return link.startsWith("/") ? (
    <Link to={link} className={styles.slide} draggable="false">
      {inner}
    </Link>
  ) : (
    <a href={link} className={styles.slide} draggable="false">
      {inner}
    </a>
  );
}

export default function Hero() {
  const { coverImages } = useSettings();
  const slides = coverImages.length ? coverImages : [{ image: "", link: "" }];
  const [index, setIndex] = useState(0);

  const next = () => setIndex((i) => (i + 1) % slides.length);
  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const { dragPx, handlers } = useSwipe({ onNext: next, onPrev: prev });

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [slides.length]);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  return (
    <section className={styles.hero} id="top" aria-label="Featured">
      <div className={styles.viewport} {...handlers}>
        <div
          className={styles.track}
          style={{
            transform: `translateX(calc(-${index * 100}% + ${dragPx}px))`,
            transition: dragPx ? "none" : undefined,
          }}
        >
          {slides.map((cover, i) => (
            <Slide cover={cover} key={i} />
          ))}
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
