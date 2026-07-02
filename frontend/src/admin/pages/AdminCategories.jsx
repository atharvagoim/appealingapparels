import { useSettings } from "../../context/SettingsContext";
import ui from "../admin.module.css";

export default function AdminCategories() {
  const {
    categories,
    addCategory,
    updateCategory,
    removeCategory,
    moveCategory,
    resetCategories,
  } = useSettings();

  return (
    <div>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>Shop by category</h1>
          <p className={ui.pageSub}>
            {categories.length} {categories.length === 1 ? "tile" : "tiles"} —
            big banners on the homepage. Edit each one's image, name and link.
          </p>
        </div>
        <div className={ui.headActions}>
          <button
            className={`${ui.btn} ${ui.btnGhost}`}
            onClick={() => {
              if (window.confirm("Reset categories to the defaults?"))
                resetCategories();
            }}
          >
            Reset
          </button>
          <button className={ui.btn} onClick={addCategory}>
            + Add category
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className={ui.empty}>
          <p className={ui.emptyTitle}>No categories.</p>
          <p className={ui.emptyBody}>Add one to show it on the homepage.</p>
        </div>
      ) : (
        <div className={ui.catList}>
          {categories.map((cat, i) => (
            <div className={ui.catCard} key={i}>
              <div className={ui.catPreview}>
                {cat.image ? (
                  <img src={cat.image} alt="" />
                ) : (
                  <span className={ui.catPlaceholder}>No image</span>
                )}
              </div>

              <div className={ui.catFields}>
                <label className={ui.catField}>
                  <span className={ui.catLabel}>Name</span>
                  <input
                    className={ui.catInput}
                    value={cat.label}
                    onChange={(e) => updateCategory(i, { label: e.target.value })}
                    placeholder="e.g. T-Shirts"
                  />
                </label>
                <label className={ui.catField}>
                  <span className={ui.catLabel}>Image URL</span>
                  <input
                    className={ui.catInput}
                    value={cat.image}
                    onChange={(e) => updateCategory(i, { image: e.target.value })}
                    placeholder="https://…  or  /path/to/image.jpg"
                  />
                </label>
                <label className={ui.catField}>
                  <span className={ui.catLabel}>Link (where it goes)</span>
                  <input
                    className={ui.catInput}
                    value={cat.link}
                    onChange={(e) => updateCategory(i, { link: e.target.value })}
                    placeholder="/shop?category=T-Shirts"
                  />
                </label>

                <div className={ui.catActions}>
                  <button
                    className={ui.iconBtn}
                    onClick={() => moveCategory(i, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    className={ui.iconBtn}
                    onClick={() => moveCategory(i, 1)}
                    disabled={i === categories.length - 1}
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    className={`${ui.linkBtn} ${ui.linkDanger}`}
                    onClick={() => removeCategory(i)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
