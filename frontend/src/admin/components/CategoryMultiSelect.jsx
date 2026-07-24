import { useState } from "react";
import styles from "./CategoryMultiSelect.module.css";

const NEW = "__new__";

/**
 * Pick one or more categories for a product. Selected categories show as
 * removable chips; the dropdown adds an existing category, and "Add a new
 * category" reveals a text field. A new category becomes real once the
 * product is saved with it (the list is derived from products).
 */
export default function CategoryMultiSelect({ value = [], onChange, categories = [] }) {
  const known = Array.from(new Set(categories.filter((c) => c && c !== "All"))).sort(
    (a, b) => a.localeCompare(b)
  );
  const available = known.filter((c) => !value.includes(c));

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const add = (cat) => {
    const c = (cat || "").trim();
    if (!c) return;
    if (!value.some((v) => v.toLowerCase() === c.toLowerCase())) onChange([...value, c]);
  };
  const remove = (cat) => onChange(value.filter((v) => v !== cat));

  const onSelect = (e) => {
    const v = e.target.value;
    e.target.value = "";
    if (v === NEW) {
      setAdding(true);
      return;
    }
    if (v) add(v);
  };

  const commitNew = () => {
    add(draft);
    setDraft("");
    setAdding(false);
  };

  return (
    <div className={styles.wrap}>
      {value.length > 0 && (
        <div className={styles.chips}>
          {value.map((c) => (
            <span className={styles.chip} key={c}>
              {c}
              <button
                type="button"
                className={styles.remove}
                onClick={() => remove(c)}
                aria-label={`Remove ${c}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {adding ? (
        <div className={styles.newRow}>
          <input
            className={styles.input}
            autoFocus
            value={draft}
            placeholder="New category name"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitNew();
              }
            }}
          />
          <button type="button" className={styles.addBtn} onClick={commitNew}>
            Add
          </button>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => {
              setAdding(false);
              setDraft("");
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className={styles.selectWrap}>
          <select className={styles.select} value="" onChange={onSelect}>
            <option value="" disabled>
              {value.length ? "Add another category…" : "Select a category…"}
            </option>
            {available.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={NEW}>＋ Add a new category…</option>
          </select>
          <svg
            className={styles.chev}
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      )}
    </div>
  );
}
