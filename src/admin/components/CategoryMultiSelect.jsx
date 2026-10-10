import { useState } from "react";
import styles from "./CategoryMultiSelect.module.css";

/**
 * Pick one or more categories for a product. Every existing category is shown
 * as a tappable chip (highlighted when chosen), and a text box underneath
 * creates a brand-new one. A new category becomes real once the product is
 * saved with it. Whatever is typed in the box is also added automatically when
 * the box loses focus, so pressing "Save" without pressing "Add" first can't
 * silently drop it.
 */
export default function CategoryMultiSelect({ value = [], onChange, categories = [] }) {
  const [draft, setDraft] = useState("");

  const has = (list, c) => list.some((v) => v.toLowerCase() === c.toLowerCase());

  // Existing categories, plus anything already on this product that isn't in
  // the shared list yet (so it still shows up, selected).
  const known = Array.from(
    new Set([...categories, ...value].filter((c) => c && c !== "All"))
  ).sort((a, b) => a.localeCompare(b));

  const toggle = (c) =>
    onChange(has(value, c) ? value.filter((v) => v.toLowerCase() !== c.toLowerCase()) : [...value, c]);

  const commitDraft = () => {
    const c = draft.trim();
    setDraft("");
    if (!c) return;
    // Reuse the existing spelling if it matches one case-insensitively.
    const existing = known.find((k) => k.toLowerCase() === c.toLowerCase());
    const name = existing || c;
    if (!has(value, name)) onChange([...value, name]);
  };

  return (
    <div className={styles.wrap}>
      {known.length > 0 ? (
        <div className={styles.chips} role="group" aria-label="Existing categories">
          {known.map((c) => {
            const on = has(value, c);
            return (
              <button
                type="button"
                key={c}
                className={`${styles.pick} ${on ? styles.pickOn : ""}`}
                aria-pressed={on}
                onClick={() => toggle(c)}
              >
                {on && <span aria-hidden="true">✓ </span>}
                {c}
              </button>
            );
          })}
        </div>
      ) : (
        <p className={styles.empty}>No categories yet — create the first one below.</p>
      )}

      <div className={styles.newRow}>
        <input
          className={styles.input}
          value={draft}
          placeholder="Create a new category…"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitDraft();
            }
          }}
        />
        <button
          type="button"
          className={styles.addBtn}
          // mousedown fires before the input's blur, so don't let it steal focus twice
          onMouseDown={(e) => e.preventDefault()}
          onClick={commitDraft}
          disabled={!draft.trim()}
        >
          + Add
        </button>
      </div>
    </div>
  );
}
