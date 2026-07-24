import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useProducts } from "../../context/ProductsContext";
import { useSettings, HOME_SECTIONS } from "../../context/SettingsContext";
import { orderedProducts } from "../../utils/sectionOrder";
import ui from "../admin.module.css";
import styles from "./AdminSections.module.css";

// datetime-local inputs need "YYYY-MM-DDTHH:mm" in the browser's local time.
const toDatetimeLocal = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const DragIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
    <circle cx="8" cy="6" r="1.5" /><circle cx="16" cy="6" r="1.5" />
    <circle cx="8" cy="12" r="1.5" /><circle cx="16" cy="12" r="1.5" />
    <circle cx="8" cy="18" r="1.5" /><circle cx="16" cy="18" r="1.5" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/**
 * Pick a product to drop into a homepage section. Only shows products that
 * aren't already in it.
 */
function AddProductPicker({ title, candidates, onPick, onClose, busyId }) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const shown = !q
    ? candidates
    : candidates.filter((p) =>
        [p.name, p.code, p.category, ...(p.categories || [])]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );

  return (
    <div className={styles.pickerOverlay} onClick={onClose}>
      <div
        className={styles.pickerCard}
        role="dialog"
        aria-modal="true"
        aria-label={`Add a product to ${title}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.pickerHead}>
          <div>
            <h3 className={styles.pickerTitle}>Add to {title}</h3>
            <p className={styles.pickerSub}>
              {candidates.length} product{candidates.length === 1 ? "" : "s"} not in
              this section yet.
            </p>
          </div>
          <button
            type="button"
            className={styles.pickerClose}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <input
          className={styles.pickerSearch}
          placeholder="Search by name, code or category…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        {shown.length === 0 ? (
          <p className={styles.emptyNote}>
            {candidates.length
              ? "Nothing matches that search."
              : "Every product is already in this section."}
          </p>
        ) : (
          <ul className={styles.pickerList}>
            {shown.map((p) => {
              const image = p.images?.[0] ?? p.image;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className={styles.pickerItem}
                    disabled={!!busyId}
                    onClick={() => onPick(p)}
                  >
                    <span className={styles.pickerThumb}>
                      {image && <img src={image} alt="" />}
                    </span>
                    <span className={styles.pickerText}>
                      <span className={styles.pickerName}>{p.name}</span>
                      <span className={styles.pickerMeta}>
                        {[p.code, p.category].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className={styles.pickerAdd}>
                      {busyId === p.id ? "Adding…" : "Add"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/** One draggable-to-reorder section (New Arrivals / Best Sellers / Clearance Sale). */
function SectionCard({
  id,
  focused,
  title,
  description,
  products,
  allProducts,
  orderIds,
  onReorder,
  onAdd,
  onRemove,
  extra,
}) {
  const ordered = useMemo(() => orderedProducts(products, orderIds), [products, orderIds]);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busyId, setBusyId] = useState("");

  const inSection = useMemo(() => new Set(products.map((p) => p.id)), [products]);
  const candidates = useMemo(
    () => (allProducts || []).filter((p) => !inSection.has(p.id)),
    [allProducts, inSection]
  );

  const add = async (p) => {
    setBusyId(p.id);
    try {
      await onAdd(p);
      setPickerOpen(false);
    } catch (e) {
      alert(e?.response?.data?.message || "Couldn't add that product.");
    } finally {
      setBusyId("");
    }
  };

  const remove = async (p) => {
    if (
      !window.confirm(
        `Remove "${p.name}" from ${title}?\n\nIt stays in your catalogue — this only takes it off this homepage section.`
      )
    )
      return;
    setBusyId(p.id);
    try {
      await onRemove(p);
    } catch (e) {
      alert(e?.response?.data?.message || "Couldn't remove that product.");
    } finally {
      setBusyId("");
    }
  };

  const onDragStart = (i) => (e) => {
    setDragIndex(i);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (i) => (e) => {
    e.preventDefault();
    if (i !== dragOverIndex) setDragOverIndex(i);
  };
  const onDrop = (i) => (e) => {
    e.preventDefault();
    if (dragIndex == null || dragIndex === i) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const next = [...ordered];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(i, 0, moved);
    onReorder(next.map((p) => p.id));
    setDragIndex(null);
    setDragOverIndex(null);
  };
  const onDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const cardRef = useRef(null);
  useEffect(() => {
    if (!focused) return;
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [focused]);

  return (
    <div
      className={`${styles.card} ${focused ? styles.cardFocused : ""}`}
      id={id}
      ref={cardRef}
    >
      <div className={styles.cardHead}>
        <div className={styles.cardHeadText}>
          <h2 className={styles.cardTitle}>{title}</h2>
          <p className={styles.cardSub}>{description}</p>
        </div>
        <button
          type="button"
          className={styles.addBtn}
          onClick={() => setPickerOpen(true)}
        >
          <PlusIcon />
          Add product
        </button>
      </div>

      {extra}

      {ordered.length === 0 ? (
        <p className={styles.emptyNote}>
          No products in this section yet — use <strong>Add product</strong> above.
        </p>
      ) : (
        <div className={styles.grid}>
          {ordered.map((p, i) => {
            const image = p.images?.[0] ?? p.image;
            return (
              <div
                key={p.id}
                className={`${styles.productCard} ${dragIndex === i ? styles.dragging : ""} ${
                  dragOverIndex === i && dragIndex !== null && dragIndex !== i
                    ? styles.dragOver
                    : ""
                }`}
                draggable
                onDragStart={onDragStart(i)}
                onDragOver={onDragOver(i)}
                onDrop={onDrop(i)}
                onDragEnd={onDragEnd}
              >
                <span className={styles.posBadge}>{i + 1}</span>
                <span className={styles.dragHandle}>
                  <DragIcon />
                </span>
                <button
                  type="button"
                  className={styles.removeBtn}
                  draggable="false"
                  disabled={busyId === p.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(p);
                  }}
                  onDragStart={(e) => e.preventDefault()}
                  aria-label={`Remove ${p.name} from ${title}`}
                  title={`Remove from ${title}`}
                >
                  ✕
                </button>
                <span className={styles.thumb}>
                  {image && <img src={image} alt="" draggable="false" />}
                </span>
                <span className={styles.name}>{p.name}</span>
              </div>
            );
          })}
        </div>
      )}

      {pickerOpen && (
        <AddProductPicker
          title={title}
          candidates={candidates}
          busyId={busyId}
          onPick={add}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}


/**
 * The "Explore" rail. Unlike the other three, its membership isn't a flag on
 * the product — it's a saved list of ids here, which is what lets the shop
 * owner curate it freely. An empty list means "show everything".
 */
function ExploreCard({ settings, onChange, allProducts }) {
  const s = settings || {};
  const ids = s.productIds || [];
  const curated = ids.length > 0;

  const [pickerOpen, setPickerOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const byId = useMemo(
    () => new Map(allProducts.map((p) => [String(p.id), p])),
    [allProducts]
  );

  // What's actually shown: the curated list, or the whole catalogue.
  const shown = curated
    ? ids.map((id) => byId.get(String(id))).filter(Boolean)
    : allProducts;

  const inSection = new Set(shown.map((p) => String(p.id)));
  const candidates = allProducts.filter((p) => !inSection.has(String(p.id)));

  /** Adding the first product switches the rail from "all" to curated. */
  const add = (p) => {
    const base = curated ? ids : allProducts.map((x) => String(x.id));
    onChange({ productIds: [...base, String(p.id)] });
    setPickerOpen(false);
  };

  const remove = (p) => {
    const base = curated ? ids : allProducts.map((x) => String(x.id));
    onChange({ productIds: base.filter((id) => id !== String(p.id)) });
  };

  const reorder = (from, to) => {
    const base = curated ? [...ids] : allProducts.map((x) => String(x.id));
    const [moved] = base.splice(from, 1);
    base.splice(to, 0, moved);
    onChange({ productIds: base });
  };

  return (
    <div className={styles.card} id="explore">
      <div className={styles.cardHead}>
        <div className={styles.cardHeadText}>
          <h2 className={styles.cardTitle}>{s.title || "Explore"}</h2>
          <p className={styles.cardSub}>
            Your own homepage rail — rename it, and choose exactly what appears.
            {curated
              ? " Showing the products you've picked."
              : " Showing every product, until you remove one."}
          </p>
        </div>
        <button
          type="button"
          className={styles.addBtn}
          onClick={() => setPickerOpen(true)}
        >
          <PlusIcon />
          Add product
        </button>
      </div>

      <div className={ui.toggleRow}>
        <div className={ui.toggleText}>
          <strong>Show this section</strong>
          <span className={ui.toggleSub}>
            {s.enabled === false
              ? "Hidden from the homepage."
              : "Live on the homepage, between Follow us and Visit our store."}
          </span>
        </div>
        <button
          type="button"
          className={`${ui.toggle} ${s.enabled === false ? "" : ui.toggleOn}`}
          onClick={() => onChange({ enabled: s.enabled === false })}
          aria-pressed={s.enabled !== false}
          aria-label="Toggle the Explore section"
        >
          <span className={ui.toggleKnob} />
        </button>
      </div>

      <div className={styles.exploreFields}>
        <label className={ui.catField}>
          <span className={ui.catLabel}>Section title</span>
          <input
            className={ui.catInput}
            value={s.title ?? "Explore"}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Explore"
          />
        </label>
        <label className={ui.catField}>
          <span className={ui.catLabel}>Subtitle (optional)</span>
          <input
            className={ui.catInput}
            value={s.subtitle || ""}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            placeholder="A line under the heading"
          />
        </label>
        <label className={ui.catField}>
          <span className={ui.catLabel}>Button label</span>
          <input
            className={ui.catInput}
            value={s.viewAllLabel || ""}
            onChange={(e) => onChange({ viewAllLabel: e.target.value })}
            placeholder="View all"
          />
        </label>
      </div>

      {curated && (
        <button
          type="button"
          className={styles.linkBtn}
          onClick={() => onChange({ productIds: [] })}
        >
          Reset to every product
        </button>
      )}

      {shown.length === 0 ? (
        <p className={styles.emptyNote}>
          Nothing in this section — use <strong>Add product</strong> above.
        </p>
      ) : (
        <div className={styles.grid}>
          {shown.map((p, i) => {
            const image = p.images?.[0] ?? p.image;
            return (
              <div
                key={p.id}
                className={`${styles.productCard} ${
                  dragOverIndex === i ? styles.dragOver : ""
                }`}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (i !== dragOverIndex) setDragOverIndex(i);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex != null && dragIndex !== i) reorder(dragIndex, i);
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
              >
                <span className={styles.posBadge}>{i + 1}</span>
                <span className={styles.dragHandle}>
                  <DragIcon />
                </span>
                <button
                  type="button"
                  className={styles.removeBtn}
                  draggable="false"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(p);
                  }}
                  onDragStart={(e) => e.preventDefault()}
                  aria-label={`Remove ${p.name} from this section`}
                  title="Remove from this section"
                >
                  ✕
                </button>
                <div className={styles.thumb}>
                  {image && <img src={image} alt="" draggable="false" />}
                </div>
                <span className={styles.name}>{p.name}</span>
              </div>
            );
          })}
        </div>
      )}

      {pickerOpen && (
        <AddProductPicker
          title={s.title || "Explore"}
          candidates={candidates}
          busyId=""
          onPick={add}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}


/** Drag the homepage sections themselves into any order. */
function SectionOrderCard({ order, onChange }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const labelFor = (key) =>
    HOME_SECTIONS.find((s) => s.key === key)?.label || key;

  const rows = order?.length ? order : HOME_SECTIONS.map((s) => s.key);

  const move = (from, to) => {
    if (to < 0 || to >= rows.length || from === to) return;
    const next = [...rows];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div className={styles.cardHeadText}>
          <h2 className={styles.cardTitle}>Homepage order</h2>
          <p className={styles.cardSub}>
            Drag a row to change the order these sections appear in on the
            homepage. The cover slideshow always stays at the top.
          </p>
        </div>
      </div>

      <ol className={styles.orderList}>
        {rows.map((key, i) => (
          <li
            key={key}
            className={`${styles.orderRow} ${
              overIndex === i ? styles.orderRowOver : ""
            }`}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => {
              e.preventDefault();
              if (i !== overIndex) setOverIndex(i);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex != null) move(dragIndex, i);
              setDragIndex(null);
              setOverIndex(null);
            }}
            onDragEnd={() => {
              setDragIndex(null);
              setOverIndex(null);
            }}
          >
            <span className={styles.posBadge}>{i + 1}</span>
            <span className={styles.orderLabel}>{labelFor(key)}</span>

            {/* Keyboard and touch fallback for the drag. */}
            <span className={styles.orderNudge}>
              <button
                type="button"
                onClick={() => move(i, i - 1)}
                disabled={i === 0}
                aria-label={`Move ${labelFor(key)} up`}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, i + 1)}
                disabled={i === rows.length - 1}
                aria-label={`Move ${labelFor(key)} down`}
              >
                ↓
              </button>
            </span>

            <span className={styles.dragHandle}>
              <DragIcon />
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function AdminSections() {
  const { products, newArrivals, bestSellers, clearanceSale, updateProduct } =
    useProducts();

  // Arriving from the dashboard's "+ Best Sellers" button, for example.
  const [searchParams] = useSearchParams();
  const focus = searchParams.get("section") || "";

  // Each homepage section is driven by a flag on the product itself, so adding
  // and removing here is just toggling that flag.
  const setFlag = (flag) => (product, on) =>
    updateProduct(product.id, { [flag]: on });
  const {
    sectionOrder,
    updateSectionOrder,
    exploreSection,
    updateExploreSection,
    homeSectionOrder,
    updateHomeSectionOrder,
    clearanceSaleEnabled,
    setClearanceSaleEnabled,
    clearanceSaleEndsAt,
    setClearanceSaleEndsAt,
  } = useSettings();

  return (
    <div>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>Sections</h1>
          <p className={ui.pageSub}>
            Add or remove the products shown in New Arrivals, Best Sellers and
            Clearance Sale on the homepage, and drag the cards to set the order
            they appear in. Removing a product here only takes it off the
            section — it stays in your catalogue.
          </p>
        </div>
      </div>

      <SectionCard
        title="New Arrivals"
        description="Add or remove products, and drag a card to reorder them."
        products={newArrivals}
        orderIds={sectionOrder.newArrivals}
        id="new-arrivals"
        focused={focus === "newArrivals"}
        allProducts={products}
        onReorder={(ids) => updateSectionOrder("newArrivals", ids)}
        onAdd={(p) => setFlag("newArrival")(p, true)}
        onRemove={(p) => setFlag("newArrival")(p, false)}
      />

      <SectionCard
        title="Best Sellers"
        description="Add or remove products, and drag a card to reorder them."
        products={bestSellers}
        orderIds={sectionOrder.bestSellers}
        id="best-sellers"
        focused={focus === "bestSellers"}
        allProducts={products}
        onReorder={(ids) => updateSectionOrder("bestSellers", ids)}
        onAdd={(p) => setFlag("featured")(p, true)}
        onRemove={(p) => setFlag("featured")(p, false)}
      />

      <SectionOrderCard
        order={homeSectionOrder}
        onChange={updateHomeSectionOrder}
      />

      <ExploreCard
        settings={exploreSection}
        onChange={updateExploreSection}
        allProducts={products}
      />

      <SectionCard
        title="Clearance Sale"
        description="Add or remove products, and drag a card to reorder them."
        products={clearanceSale}
        orderIds={sectionOrder.clearance}
        id="clearance-sale"
        focused={focus === "clearance"}
        allProducts={products}
        onReorder={(ids) => updateSectionOrder("clearance", ids)}
        onAdd={(p) => setFlag("clearance")(p, true)}
        onRemove={(p) => setFlag("clearance")(p, false)}
        extra={
          <div className={styles.clearanceControls}>
            <div className={ui.toggleRow}>
              <div className={ui.toggleText}>
                <strong>Clearance Sale section</strong>
                <span className={ui.toggleSub}>
                  {clearanceSaleEnabled
                    ? "Live on the homepage."
                    : "Hidden from the homepage, even if products are tagged."}
                </span>
              </div>
              <button
                type="button"
                className={`${ui.toggle} ${clearanceSaleEnabled ? ui.toggleOn : ""}`}
                onClick={() => setClearanceSaleEnabled(!clearanceSaleEnabled)}
                aria-pressed={clearanceSaleEnabled}
                aria-label="Toggle Clearance Sale section"
              >
                <span className={ui.toggleKnob} />
              </button>
            </div>

            <div className={ui.toggleRow} style={{ borderBottom: "none" }}>
              <div className={ui.toggleText}>
                <strong>Countdown timer</strong>
                <span className={ui.toggleSub}>
                  {clearanceSaleEndsAt
                    ? "Shown next to the title until this date/time."
                    : "Not set — no countdown shows."}
                </span>
              </div>
              <div className={styles.clearanceDateWrap}>
                <input
                  type="datetime-local"
                  className={styles.clearanceDateInput}
                  value={toDatetimeLocal(clearanceSaleEndsAt)}
                  onChange={(e) =>
                    setClearanceSaleEndsAt(
                      e.target.value ? new Date(e.target.value).toISOString() : null
                    )
                  }
                />
                {clearanceSaleEndsAt && (
                  <button
                    type="button"
                    className={`${ui.linkBtn} ${ui.linkDanger}`}
                    onClick={() => setClearanceSaleEndsAt(null)}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        }
      />
    </div>
  );
}
