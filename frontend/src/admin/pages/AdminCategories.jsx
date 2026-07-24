import { useRef, useState } from "react";
import { useSettings } from "../../context/SettingsContext";
import { useProducts } from "../../context/ProductsContext";
import { COLLECTION_CATEGORIES } from "../../hooks/useProductFilters";
import ImageCrop from "../components/ImageCrop";
import ui from "../admin.module.css";
import styles from "./AdminCategories.module.css";

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-1 13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 7h14z" />
  </svg>
);
const EditIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);
const DragIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
    <circle cx="8" cy="6" r="1.5" /><circle cx="16" cy="6" r="1.5" />
    <circle cx="8" cy="12" r="1.5" /><circle cx="16" cy="12" r="1.5" />
    <circle cx="8" cy="18" r="1.5" /><circle cx="16" cy="18" r="1.5" />
  </svg>
);
const ResetIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 12a9 9 0 1 1 3 6.7" />
    <path d="M3 16v-4h4" />
  </svg>
);
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const TagIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.6 13.4 11 3.8A2 2 0 0 0 9.6 3.2H4v5.6a2 2 0 0 0 .6 1.4l9.6 9.6a2 2 0 0 0 2.8 0l3.6-3.6a2 2 0 0 0 0-2.8z" />
    <circle cx="7.7" cy="7.7" r="1.2" />
  </svg>
);
const LinkIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 15l6-6" />
    <path d="M11 6.5 12.4 5a4 4 0 1 1 5.6 5.6L16.5 12" />
    <path d="M13 17.5 11.6 19a4 4 0 1 1-5.6-5.6L7.5 12" />
  </svg>
);
const GridIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </svg>
);
const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export default function AdminCategories() {
  const {
    categories,
    setCategories,
    addCategory,
    updateCategory,
    updateCategoryCrop,
    removeCategory,
    moveCategory,
    resetCategories,
  } = useSettings();
  const { categories: realCategories } = useProducts();
  const [expandedIndex, setExpandedIndex] = useState(null);

  const add = () => {
    addCategory();
    setExpandedIndex(categories.length);
  };

  const expanded = expandedIndex != null ? categories[expandedIndex] : null;

  // ---- drag-and-drop reordering ----
  // A row only becomes draggable while the grip is held, so clicking anywhere
  // else still opens the editor and a drag never ends up opening it by accident.
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const justDragged = useRef(false);

  const onRowDragStart = (i) => (e) => {
    setDragIndex(i);
    e.dataTransfer.effectAllowed = "move";
    // Firefox refuses to start a drag without payload.
    try {
      e.dataTransfer.setData("text/plain", String(i));
    } catch {
      /* ignore */
    }
  };
  const onRowDragOver = (i) => (e) => {
    if (dragIndex == null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (i !== dragOverIndex) setDragOverIndex(i);
  };
  const onRowDrop = (i) => (e) => {
    e.preventDefault();
    if (dragIndex == null || dragIndex === i) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const next = [...categories];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(i, 0, moved);
    setCategories(next);
    // Keep the editor pointed at the same category if one is open.
    setExpandedIndex((idx) => {
      if (idx == null) return idx;
      if (idx === dragIndex) return i;
      if (dragIndex < idx && i >= idx) return idx - 1;
      if (dragIndex > idx && i <= idx) return idx + 1;
      return idx;
    });
    setDragIndex(null);
    setDragOverIndex(null);
  };
  const onRowDragEnd = () => {
    justDragged.current = true;
    // Swallow the click the browser fires right after a drop.
    setTimeout(() => {
      justDragged.current = false;
    }, 0);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const openRow = (i) => {
    if (justDragged.current || dragIndex !== null) return;
    setExpandedIndex(i);
  };

  return (
    <div>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>Shop by category</h1>
          <p className={ui.pageSub}>
            {categories.length} {categories.length === 1 ? "circle" : "circles"} —
            shown on the homepage under "What are you shopping for today?".
            Tap one to edit its image, name and link.
          </p>
        </div>
        <div className={ui.headActions}>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={() => {
              if (window.confirm("Reset categories to the defaults?")) resetCategories();
            }}
          >
            <ResetIcon /> Reset to defaults
          </button>
          <button type="button" className={styles.addBtn} onClick={add}>
            Add category <PlusIcon />
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className={ui.empty}>
          <p className={ui.emptyTitle}>No categories.</p>
          <p className={ui.emptyBody}>Add one to show it on the homepage.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {categories.map((cat, i) => (
            <div
              key={i}
              className={`${styles.row} ${expandedIndex === i ? styles.rowOn : ""} ${
                dragOverIndex === i && dragIndex !== null && dragIndex !== i
                  ? styles.rowDragOver
                  : ""
              } ${dragIndex === i ? styles.rowDragging : ""}`}
              onClick={() => openRow(i)}
              draggable
              onDragStart={onRowDragStart(i)}
              onDragOver={onRowDragOver(i)}
              onDrop={onRowDrop(i)}
              onDragEnd={onRowDragEnd}
            >
              <span className={styles.thumb}>
                {cat.image ? (
                  <img src={cat.image} alt="" draggable="false" />
                ) : (
                  <span className={styles.thumbEmpty}>No image</span>
                )}
              </span>
              <span className={styles.info}>
                <strong>{cat.label || `Category #${i + 1}`}</strong>
                <span>{cat.link || "No link set"}</span>
              </span>
              <span className={styles.icons}>
                <button
                  type="button"
                  className={styles.iconBtnSm}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedIndex(i);
                  }}
                  aria-label="Edit category"
                  title="Edit"
                >
                  <EditIcon />
                </button>
                {cat.link && (
                  <a
                    href={cat.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.iconBtnSm}
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Preview link"
                  >
                    <LinkIcon />
                  </a>
                )}
                <button
                  type="button"
                  className={`${styles.iconBtnSm} ${styles.iconBtnDanger}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCategory(i);
                    if (expandedIndex === i) setExpandedIndex(null);
                  }}
                  aria-label="Delete category"
                >
                  <TrashIcon />
                </button>
                <span
                  className={styles.dragHandle}
                  role="button"
                  tabIndex={0}
                  aria-label={`Reorder ${cat.label || `category ${i + 1}`}`}
                  title="Drag to reorder"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
                    e.preventDefault();
                    e.stopPropagation();
                    const to = e.key === "ArrowUp" ? i - 1 : i + 1;
                    if (to < 0 || to >= categories.length) return;
                    const next = [...categories];
                    const [moved] = next.splice(i, 1);
                    next.splice(to, 0, moved);
                    setCategories(next);
                  }}
                >
                  <DragIcon />
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------- expanded editor */}
      {expanded && (
        <div className={styles.overlay} onClick={() => setExpandedIndex(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <span className={styles.modalThumb}>
                {expanded.image && <img src={expanded.image} alt="" />}
              </span>
              <div className={styles.modalTitleWrap}>
                <strong>{expanded.label || `Category #${expandedIndex + 1}`}</strong>
                <span>{expanded.link || "No link"}</span>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setExpandedIndex(null)}
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </button>
            </div>

            <label className={styles.modalField}>
              <span>Name</span>
              <div className={styles.modalInputWrap}>
                <input
                  value={expanded.label}
                  onChange={(e) => updateCategory(expandedIndex, { label: e.target.value })}
                  placeholder="e.g. T-Shirts"
                />
                <span className={styles.modalIcon}>
                  <TagIcon />
                </span>
              </div>
            </label>

            <label className={styles.modalField}>
              <span>Image URL</span>
              <div className={`${styles.modalInputWrap} ${styles.iconLeft}`}>
                <span className={styles.modalIcon}>
                  <LinkIcon />
                </span>
                <input
                  value={expanded.image}
                  onChange={(e) => updateCategory(expandedIndex, { image: e.target.value })}
                  placeholder="https://…  or  /path/to/image.jpg"
                />
              </div>
            </label>

            <label className={styles.modalField}>
              <span>Link (where it goes)</span>
              <div className={`${styles.modalInputWrap} ${styles.iconLeft}`}>
                <span className={styles.modalIcon}>
                  <LinkIcon />
                </span>
                <input
                  value={expanded.link}
                  onChange={(e) => updateCategory(expandedIndex, { link: e.target.value })}
                  placeholder="/shop?category=T-Shirts"
                />
              </div>
            </label>

            <label className={styles.modalField}>
              <span>Or pick an existing category — fills the link above automatically</span>
              <div className={`${styles.modalInputWrap} ${styles.iconLeft}`}>
                <span className={styles.modalIcon}>
                  <GridIcon />
                </span>
                <select
                  value=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    const link =
                      val === "__all__" ? "/shop" : `/shop?category=${encodeURIComponent(val)}`;
                    updateCategory(expandedIndex, { link });
                  }}
                >
                  <option value="">Choose a category…</option>
                  <option value="__all__">All products (/shop)</option>
                  {COLLECTION_CATEGORIES.length > 0 && (
                    <optgroup label="Collections">
                      {COLLECTION_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {realCategories.length > 0 && (
                    <optgroup label="Categories">
                      {realCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <span className={styles.modalIcon} style={{ left: "auto", right: 14 }}>
                  <ChevronIcon />
                </span>
              </div>
            </label>

            <ImageCrop
              src={expanded.image}
              label="Circle crop"
              aspect="1 / 1"
              round
              value={expanded.mobile}
              onChange={(c) => updateCategoryCrop(expandedIndex, "mobile", c)}
            />

            <div className={styles.modalFoot}>
              <span className={styles.dragHandle} style={{ cursor: "default" }}>
                <DragIcon />
              </span>
              <button
                type="button"
                className={styles.modalMoveBtn}
                onClick={() => {
                  moveCategory(expandedIndex, -1);
                  setExpandedIndex((idx) => Math.max(idx - 1, 0));
                }}
                disabled={expandedIndex === 0}
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                className={styles.modalMoveBtn}
                onClick={() => {
                  moveCategory(expandedIndex, 1);
                  setExpandedIndex((idx) => Math.min(idx + 1, categories.length - 1));
                }}
                disabled={expandedIndex === categories.length - 1}
                aria-label="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                className={styles.modalRemove}
                onClick={() => {
                  removeCategory(expandedIndex);
                  setExpandedIndex(null);
                }}
              >
                <TrashIcon /> Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
