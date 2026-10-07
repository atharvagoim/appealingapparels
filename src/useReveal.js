import { useEffect, useRef, useState } from "react";

// Reveals an element once it scrolls into view. Respects reduced-motion
// implicitly because the CSS transition is neutralised by the global media query.
export default function useReveal(options = {}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || shown) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px", ...options }
    );

    obs.observe(node);
    return () => obs.disconnect();
  }, [shown, options]);

  return [ref, shown];
}
