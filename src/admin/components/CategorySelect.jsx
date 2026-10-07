import { useState } from "react";
import styles from "./CategorySelect.module.css";

const NEW = "__new__";

/**
 * Category picker: a dropdown of existing categories plus an
 * "Add a new category" option that reveals a text field. New categories
 * come into existence as soon as a product is saved with them, since the
 * category list is derived from products.
 */
export default function CategorySelect({
  value,
  onChange,
  categories = [],
  placeholder = "Select a category",
}) {
  const known = Array.from(new Set(categories.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
  // Keep the current value selectable even if it isn't in the derived list yet.
  const options = value && !known.includes(value) ? [value, ...known] : known;

  const [adding, setAdding] = useState(false);

  if (adding) {
    return (
      <div className={styles.newWrap}>
        <input
          className={styles.input}
          autoFocus
          value={value}
          placeholder="New category name"
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className={styles.link}
          onClick={() => setAdding(false)}
        >
          Choose an existing category
        </button>
      </div>
    );
  }

  return (
    <div className={styles.selectWrap}>
      <select
        className={styles.select}
        value={value || ""}
        onChange={(e) => {
          if (e.target.value === NEW) {
            onChange("");
            setAdding(true);
          } else {
            onChange(e.target.value);
          }
        }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((c) => (
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
  );
}
