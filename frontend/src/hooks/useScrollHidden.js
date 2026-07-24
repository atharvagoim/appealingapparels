import { useEffect, useRef, useState } from "react";

/**
 * Mobile-only "hide on scroll down, reveal on scroll up" behavior, shared by
 * the header and the announcement bar so they move together. Desktop always
 * stays visible. Throttled to one check per animation frame.
 *
 * Pass `disabled` (e.g. while a menu drawer is open) to force it visible.
 */
export default function useScrollHidden(threshold = 80, disabled = false) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const rafId = useRef(null);

  useEffect(() => {
    if (disabled) setHidden(false);
    lastY.current = window.scrollY;

    const onScroll = () => {
      if (disabled) return;
      if (rafId.current != null) return;
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        const y = window.scrollY;
        if (window.innerWidth < 1000) {
          const goingDown = y > lastY.current;
          if (goingDown && y > threshold) setHidden(true);
          else if (!goingDown) setHidden(false);
        } else {
          setHidden(false);
        }
        lastY.current = y;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
  }, [threshold, disabled]);

  return hidden;
}
