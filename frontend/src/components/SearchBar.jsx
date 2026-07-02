import styles from "./SearchBar.module.css";

export default function SearchBar({ value, onChange, placeholder = "Search garments" }) {
  return (
    <div className={styles.wrap}>
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        width="16"
        height="16"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M16.5 16.5L21 21" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>

      <input
        type="search"
        className={styles.input}
        value={value}
        placeholder={placeholder}
        aria-label="Search products"
        onChange={(e) => onChange(e.target.value)}
      />

      {value && (
        <button
          type="button"
          className={styles.clear}
          aria-label="Clear search"
          onClick={() => onChange("")}
        >
          Clear
        </button>
      )}
    </div>
  );
}
