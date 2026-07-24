import { useRef } from "react";
import ui from "../admin.module.css";
import styles from "./ImageCrop.module.css";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

/**
 * WYSIWYG crop framer for one device view. Drag the image to pan, scroll or
 * pinch to zoom, use arrow keys to nudge a fraction of a percent at a time,
 * or type exact numbers for pixel-precise placement. Emits { zoom, x, y }
 * (x/y are object-position percentages). Renders with the exact CSS the
 * storefront uses, so it's true-to-preview.
 */
export default function ImageCrop({ src, label, aspect = "4 / 3", round = false, value, onChange }) {
  const zoom = value?.zoom ?? 1;
  const x = value?.x ?? 50;
  const y = value?.y ?? 50;
  const boxRef = useRef(null);
  const drag = useRef(null);

  const set = (patch) => onChange({ zoom, x, y, ...patch });

  const onPointerDown = (e) => {
    const box = boxRef.current;
    drag.current = {
      sx: e.clientX,
      sy: e.clientY,
      x,
      y,
      w: box?.offsetWidth || 1,
      h: box?.offsetHeight || 1,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = ((e.clientX - d.sx) / d.w) * 100;
    const dy = ((e.clientY - d.sy) / d.h) * 100;
    set({ x: clamp(d.x - dx, 0, 100), y: clamp(d.y - dy, 0, 100) });
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  // Scroll/trackpad + pinch to zoom without leaving the mouse on the slider.
  const onWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.02 : 0.02;
    set({ zoom: clamp(Math.round((zoom + delta) * 100) / 100, 1, 4) });
  };

  // Arrow keys nudge position a fraction of a percent — Shift for bigger
  // steps, +/- for zoom. This is what makes fine placement actually possible
  // without fighting mouse precision.
  const onKeyDown = (e) => {
    const step = e.shiftKey ? 2 : 0.2;
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        set({ x: clamp(x - step, 0, 100) });
        break;
      case "ArrowRight":
        e.preventDefault();
        set({ x: clamp(x + step, 0, 100) });
        break;
      case "ArrowUp":
        e.preventDefault();
        set({ y: clamp(y - step, 0, 100) });
        break;
      case "ArrowDown":
        e.preventDefault();
        set({ y: clamp(y + step, 0, 100) });
        break;
      case "+":
      case "=":
        e.preventDefault();
        set({ zoom: clamp(Math.round((zoom + 0.02) * 100) / 100, 1, 4) });
        break;
      case "-":
        e.preventDefault();
        set({ zoom: clamp(Math.round((zoom - 0.02) * 100) / 100, 1, 4) });
        break;
      default:
        break;
    }
  };

  return (
    <div className={ui.cropEditor}>
      <span className={ui.cropLabel2}>{label}</span>
      <div
        ref={boxRef}
        className={ui.cropBox}
        style={{
          aspectRatio: aspect,
          borderRadius: round ? "50%" : undefined,
          maxWidth: round ? "220px" : undefined,
        }}
        tabIndex={0}
        role="group"
        aria-label={`${label} crop — drag to pan, arrow keys to nudge, scroll to zoom`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onKeyDown={onKeyDown}
      >
        {src ? (
          <img
            src={src}
            alt=""
            draggable="false"
            style={{ objectPosition: `${x}% ${y}%`, transform: `scale(${zoom})` }}
          />
        ) : (
          <span className={ui.cropEmpty}>No image</span>
        )}
        {/* centre crosshair — helps line up the focal point precisely */}
        <span className={styles.crosshairH} aria-hidden="true" />
        <span className={styles.crosshairV} aria-hidden="true" />
      </div>

      <div className={ui.cropZoom}>
        <span>Zoom</span>
        <input
          type="range"
          min="1"
          max="4"
          step="0.01"
          value={zoom}
          onChange={(e) => set({ zoom: Number(e.target.value) })}
        />
        <button type="button" className={ui.linkBtn} onClick={() => set({ zoom: 1, x: 50, y: 50 })}>
          Reset
        </button>
      </div>

      {/* exact numbers — type a value for pixel-precise placement */}
      <div className={styles.fineRow}>
        <label className={styles.fineField}>
          <span>Zoom %</span>
          <input
            type="number"
            min="100"
            max="400"
            step="1"
            value={Math.round(zoom * 100)}
            onChange={(e) => set({ zoom: clamp(Number(e.target.value) / 100 || 1, 1, 4) })}
          />
        </label>
        <label className={styles.fineField}>
          <span>X %</span>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={Math.round(x * 10) / 10}
            onChange={(e) => set({ x: clamp(Number(e.target.value) || 0, 0, 100) })}
          />
        </label>
        <label className={styles.fineField}>
          <span>Y %</span>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={Math.round(y * 10) / 10}
            onChange={(e) => set({ y: clamp(Number(e.target.value) || 0, 0, 100) })}
          />
        </label>
      </div>
    </div>
  );
}
