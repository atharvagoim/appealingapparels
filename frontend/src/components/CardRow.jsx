import { useEffect, useRef, useState } from "react";
import ProductCard from "./ProductCard.jsx";
import styles from "./CardRow.module.css";

/**
 * Horizontal row of product cards. Shows 4 at a time on laptops and reveals
 * the rest with hover arrows; scrolls/swipes normally on phones.
 */
export default function CardRow({ products, badge }) {
  const trackRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const rafId = useRef(null);

  const update = () => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  };

  // Scroll fires far more often than the screen repaints, especially while
  // swiping on a phone. Coalesce it to once per frame instead of reading
  // layout (scrollLeft/clientWidth/scrollWidth) on every tick.
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
  }, [products.length]);

  const page = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  if (!products.length) return null;

  return (
    <div className={styles.wrap}>
      <button
        className={`${styles.arrow} ${styles.left}`}
        onClick={() => page(-1)}
        disabled={atStart}
        aria-label="Show previous products"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div className={styles.track} ref={trackRef}>
        {products.map((p) => (
          <div className={styles.cell} key={p.id}>
            <ProductCard product={p} badge={badge} />
          </div>
        ))}
      </div>

      <button
        className={`${styles.arrow} ${styles.right}`}
        onClick={() => page(1)}
        disabled={atEnd}
        aria-label="Show more products"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
