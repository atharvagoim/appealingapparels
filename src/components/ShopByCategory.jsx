import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import styles from "./ShopByCategory.module.css";

function Circle({ cat }) {
  const m = cat.mobile || {};
  const internal = cat.link && cat.link.startsWith("/");
  const inner = (
    <>
      <span className={styles.circle}>
        {cat.image && (
          <img
            src={cat.image}
            alt=""
            draggable="false"
            loading="lazy"
            decoding="async"
            style={{
              objectPosition: `${m.x ?? 50}% ${m.y ?? 50}%`,
              transform: `scale(${m.zoom ?? 1})`,
            }}
          />
        )}
      </span>
      <span className={styles.label}>{cat.label}</span>
    </>
  );
  return internal ? (
    <Link to={cat.link} className={styles.cell} draggable="false">
      {inner}
    </Link>
  ) : (
    <a href={cat.link || "#"} className={styles.cell} draggable="false">
      {inner}
    </a>
  );
}

export default function ShopByCategory() {
  const { categories } = useSettings();
  const trackRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  // With only a few categories the row fits, so there's nothing to page
  // through and the arrows shouldn't be there at all.
  const [scrollable, setScrollable] = useState(false);
  const rafId = useRef(null);

  const update = () => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
    setScrollable(el.scrollWidth > el.clientWidth + 2);
  };

  // Scroll fires far more often than the screen repaints, especially while
  // swiping on a phone — coalesce to once per frame.
  const onScroll = () => {
    if (rafId.current != null) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      update();
    });
  };

  useEffect(() => {
    update();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
  }, [categories.length]);

  const page = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.6, behavior: "smooth" });
  };

  if (!categories.length) return null;

  return (
    <section className={styles.section} aria-label="Browse categories">
      <div className={`${styles.head} shell`}>
        <h2 className={styles.title}>What are you shopping for today?</h2>
      </div>

      <div className={`${styles.wrap} shell`}>
        {scrollable && (
        <button
          className={`${styles.arrow} ${styles.left}`}
          onClick={() => page(-1)}
          disabled={atStart}
          aria-label="Show previous categories"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        )}

        <div className={styles.track} ref={trackRef}>
          {categories.map((cat, i) => (
            <Circle cat={cat} key={`${cat.label}-${i}`} />
          ))}
        </div>

        {scrollable && (
        <button
          className={`${styles.arrow} ${styles.right}`}
          onClick={() => page(1)}
          disabled={atEnd}
          aria-label="Show more categories"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
        )}
      </div>
    </section>
  );
}
