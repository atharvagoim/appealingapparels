import styles from "./CategoryFilter.module.css";

export default function CategoryFilter({ categories, active, onSelect }) {
  return (
    <div
      className={styles.scroller}
      role="tablist"
      aria-label="Filter by category"
    >
      <div className={styles.rail}>
        {categories.map((category) => {
          const isActive = category === active;
          return (
            <button
              key={category}
              role="tab"
              aria-selected={isActive}
              className={`${styles.chip} ${isActive ? styles.active : ""}`}
              onClick={() => onSelect(category)}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}
