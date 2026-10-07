import { useRef, useState } from "react";

/**
 * Pointer-based swipe/drag for slideshows (touch + mouse).
 * - Live drag offset (px) to follow the finger.
 * - Fires onNext / onPrev past the threshold.
 * - `onClickCapture` cancels a click if the pointer actually dragged, so
 *   clickable slides don't navigate when you meant to swipe.
 *
 * Add `touch-action: pan-y` to the swipe container so vertical page scroll
 * still works.
 *
 * Pointermove fires far more often than the screen repaints, especially on
 * phones. Calling setState on every event forces a React re-render each
 * time, which is a common cause of stutter mid-swipe. We coalesce those
 * into a single state update per animation frame (requestAnimationFrame)
 * so the drag still tracks the finger smoothly, without out-pacing what the
 * browser can actually paint.
 */
export default function useSwipe({ onNext, onPrev, threshold = 50 } = {}) {
  const [dragPx, setDragPx] = useState(0);
  const startX = useRef(null);
  const moved = useRef(false);
  const captured = useRef(false);
  const pendingDx = useRef(0);
  const rafId = useRef(null);

  const onPointerDown = (e) => {
    // Let real controls (arrows, dots) receive their click.
    if (e.target.closest?.("button, [data-noswipe]")) {
      startX.current = null;
      moved.current = false;
      return;
    }
    startX.current = e.clientX;
    moved.current = false;
    captured.current = false;
    pendingDx.current = 0;
    // NOTE: we deliberately do NOT capture the pointer here. Capturing on
    // pointerdown retargets the release to this container, which swallows the
    // click on child links. We capture lazily, once a real drag begins.
  };

  const onPointerMove = (e) => {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 8) {
      moved.current = true;
      if (!captured.current) {
        try {
          e.currentTarget.setPointerCapture?.(e.pointerId);
          captured.current = true;
        } catch {
          /* ignore */
        }
      }
    }
    pendingDx.current = dx;
    if (rafId.current == null) {
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        setDragPx(pendingDx.current);
      });
    }
  };

  const finish = () => {
    if (startX.current == null) return;
    if (rafId.current != null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    const dx = pendingDx.current;
    setDragPx(0);
    startX.current = null;
    captured.current = false;
    if (dx <= -threshold) onNext?.();
    else if (dx >= threshold) onPrev?.();
  };

  const onClickCapture = (e) => {
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
      moved.current = false;
    }
  };

  return {
    dragPx,
    dragging: startX.current != null,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: finish,
      onClickCapture,
    },
  };
}
