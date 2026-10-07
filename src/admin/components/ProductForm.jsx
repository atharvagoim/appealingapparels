import { useEffect, useState } from "react";
import { useProducts } from "../../context/ProductsContext";
import { uploadProductImages } from "../../api/uploadApi";
import CategoryMultiSelect from "./CategoryMultiSelect";
import styles from "./ProductForm.module.css";

/** Red trash-bin icon used everywhere a photo can be removed. */
function BinIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" />
      <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const blankSize = () => ({ size: "", stock: 0 });
const blankColor = () => ({
  name: "",
  swatch: "#111111",
  price: "",
  images: "",
  stock: 0,
  primary: false,
  sizes: [blankSize()],
});

/**
 * Thumbnail strip for a newline-separated list of image URLs. Used by each
 * colourway so photos can be checked and reordered without leaving the form.
 */
function ImageStrip({ value, onChange, emptyHint }) {
  const urls = String(value || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const write = (arr) => onChange(arr.join("\n"));
  const move = (from, to) => {
    if (to < 0 || to >= urls.length) return;
    const arr = [...urls];
    const [m] = arr.splice(from, 1);
    arr.splice(to, 0, m);
    write(arr);
  };

  if (urls.length === 0) {
    return <p className={styles.stripEmpty}>{emptyHint}</p>;
  }

  return (
    <div className={styles.strip}>
      {urls.map((src, i) => (
        <div className={styles.stripCard} key={`${src}-${i}`}>
          {i === 0 && <span className={styles.stripMain}>Main</span>}
          <img
            className={styles.stripImg}
            src={src}
            alt={`Photo ${i + 1}`}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.classList.add(styles.stripBroken);
            }}
          />
          <div className={styles.stripBar}>
            <button
              type="button"
              className={styles.stripBtn}
              disabled={i === 0}
              onClick={() => move(i, i - 1)}
              aria-label="Move earlier"
            >
              ‹
            </button>
            <button
              type="button"
              className={styles.stripBtn}
              disabled={i === urls.length - 1}
              onClick={() => move(i, i + 1)}
              aria-label="Move later"
            >
              ›
            </button>
            <button
              type="button"
              className={`${styles.stripBtn} ${styles.stripDel}`}
              onClick={() => write(urls.filter((_, x) => x !== i))}
              aria-label="Remove photo"
              title="Remove photo"
            >
              <BinIcon />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

const TABS = [
  { key: "basic", label: "Basic Info" },
  { key: "inventory", label: "Variants & Stock" },
  { key: "images", label: "Images" },
  { key: "details", label: "Details" },
  { key: "shipping", label: "Shipping" },
];

/** Homepage sections and the per-section colour list each one drives. */
const SECTION_PICKS = [
  { flag: "newArrival", field: "newArrivalColors", label: "New arrivals" },
  { flag: "featured", field: "featuredColors", label: "Best sellers" },
  { flag: "clearance", field: "clearanceColors", label: "Clearance sale" },
];

function toForm(product) {
  if (!product) {
    return {
      name: "",
      code: "",
      slug: "",
      categories: [],
      price: "",
      compareAtPrice: "",
      description: "",
      newArrival: false,
      featured: false,
      clearance: false,
      newArrivalColors: [],
      featuredColors: [],
      clearanceColors: [],
      homeNewArrival: false,
      homeBestSeller: false,
      homeClearance: false,
      highlights: "",
      fabricCare: "",
      images: "",
      hasSizes: true,
      stock: "0",
      colors: [],
      weightKg: "0.3",
      lengthCm: "25",
      breadthCm: "20",
      heightCm: "4",
      sizes: [
        { size: "S", stock: 0 },
        { size: "M", stock: 0 },
        { size: "L", stock: 0 },
      ],
    };
  }
  return {
    name: product.name || "",
    code: product.code || "",
    slug: product.slug || "",
    categories: product.categories?.length
      ? product.categories
      : product.category
      ? [product.category]
      : [],
    price: product.price ?? "",
    compareAtPrice: product.compareAtPrice ?? "",
    description: product.description || "",
    newArrival: !!product.newArrival,
    featured: !!product.featured,
    clearance: !!product.clearance,
    newArrivalColors: product.newArrivalColors || [],
    featuredColors: product.featuredColors || [],
    clearanceColors: product.clearanceColors || [],
    homeNewArrival: !!product.homeNewArrival,
    homeBestSeller: !!product.homeBestSeller,
    homeClearance: !!product.homeClearance,
    highlights: (product.highlights || []).join("\n"),
    fabricCare: (product.fabricCare || []).join("\n"),
    images: (product.images || []).join("\n"),
    hasSizes: product.hasSizes !== false,
    stock: product.stock ?? 0,
    colors: (product.colors || []).map((c) => ({
      name: c.name || "",
      swatch: c.swatch || "#111111",
      price: c.price ?? "",
      images: (c.images || []).join("\n"),
      stock: c.stock ?? 0,
      primary: !!c.primary,
      sizes: c.sizes?.length ? c.sizes : [blankSize()],
    })),
    weightKg: product.shipping?.weightKg ?? "0.3",
    lengthCm: product.shipping?.lengthCm ?? "25",
    breadthCm: product.shipping?.breadthCm ?? "20",
    heightCm: product.shipping?.heightCm ?? "4",
    sizes: product.sizes?.length ? product.sizes : [blankSize()],
  };
}

export default function ProductForm({ initial, onSave, onClose, initialTab }) {
  const { categories } = useProducts();
  const [form, setForm] = useState(() => toForm(initial));
  const [error, setError] = useState("");
  const [tab, setTab] = useState(
    TABS.some((t) => t.key === initialTab) ? initialTab : "basic"
  );
  const isEdit = !!initial;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // Colourways carry their own photos, so the product-level "Images" tab is
  // only offered for single-colour products (their sole image source). When a
  // product has colours, each colour's images are used instead.
  const hasColors = form.colors.length > 0;
  const visibleTabs = TABS.filter((t) => t.key !== "images" || !hasColors);
  useEffect(() => {
    if (hasColors && tab === "images") setTab("inventory");
  }, [hasColors, tab]);

  // Colour names available for section picking, and a per-section toggle.
  const colorNames = form.colors.map((c) => c.name.trim()).filter(Boolean);
  const toggleSectionColor = (field, name) =>
    setForm((f) => {
      const cur = f[field] || [];
      return {
        ...f,
        [field]: cur.includes(name)
          ? cur.filter((n) => n !== name)
          : [...cur, name],
      };
    });

  /* ---- colourways ---- */
  const setColor = (i, key, value) =>
    setForm((f) => ({
      ...f,
      colors: f.colors.map((c, idx) => (idx === i ? { ...c, [key]: value } : c)),
    }));
  const setColorSize = (ci, si, key, value) =>
    setForm((f) => ({
      ...f,
      colors: f.colors.map((c, idx) =>
        idx === ci
          ? {
              ...c,
              sizes: c.sizes.map((s2, sIdx) =>
                sIdx === si ? { ...s2, [key]: value } : s2
              ),
            }
          : c
      ),
    }));
  const addColorSize = (ci) =>
    setForm((f) => ({
      ...f,
      colors: f.colors.map((c, idx) =>
        idx === ci ? { ...c, sizes: [...c.sizes, blankSize()] } : c
      ),
    }));
  const removeColorSize = (ci, si) =>
    setForm((f) => ({
      ...f,
      colors: f.colors.map((c, idx) =>
        idx === ci ? { ...c, sizes: c.sizes.filter((_, x) => x !== si) } : c
      ),
    }));
  const makePrimary = (i) =>
    setForm((f) => ({
      ...f,
      colors: f.colors.map((c, idx) => ({ ...c, primary: idx === i })),
    }));
  const addColor = () =>
    setForm((f) => ({
      ...f,
      // The first colour added is automatically the primary one.
      colors: [...f.colors, { ...blankColor(), primary: f.colors.length === 0 }],
    }));
  const removeColor = (i) =>
    setForm((f) => ({ ...f, colors: f.colors.filter((_, idx) => idx !== i) }));

  const imagePreviews = form.images
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const removeImage = (index) => {
    set("images", imagePreviews.filter((_, i) => i !== index).join("\n"));
  };

  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  // ---- photo uploads (main product images) ----
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleUpload = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setUploadError("");
    try {
      const urls = await uploadProductImages(fileList);
      set("images", [...imagePreviews, ...urls].join("\n"));
    } catch (err) {
      setUploadError(err?.response?.data?.message || "Upload failed — try again.");
    } finally {
      setUploading(false);
    }
  };

  // ---- photo uploads (per-colourway images) ----
  const [colorUploading, setColorUploading] = useState({});
  const [colorUploadError, setColorUploadError] = useState({});

  const handleColorUpload = async (ci, fileList) => {
    if (!fileList || fileList.length === 0) return;
    setColorUploading((u) => ({ ...u, [ci]: true }));
    setColorUploadError((e) => ({ ...e, [ci]: "" }));
    try {
      const urls = await uploadProductImages(fileList);
      const current = String(form.colors[ci]?.images || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      setColor(ci, "images", [...current, ...urls].join("\n"));
    } catch (err) {
      setColorUploadError((e) => ({
        ...e,
        [ci]: err?.response?.data?.message || "Upload failed — try again.",
      }));
    } finally {
      setColorUploading((u) => ({ ...u, [ci]: false }));
    }
  };

  const moveImage = (from, to) => {
    if (from == null || to == null || from === to) return;
    if (to < 0 || to >= imagePreviews.length) return;
    const arr = [...imagePreviews];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    set("images", arr.join("\n"));
  };

  /** Small count shown on a tab, or null when a tab has nothing to count. */
  const tabBadge = (key) => {
    if (key === "images") return imagePreviews.length;
    if (key === "inventory") {
      if (form.colors.length > 0) return form.colors.length;
      if (!form.hasSizes) return null;
      return form.sizes.filter((x) => x.size.trim() !== "").length;
    }
    return null;
  };

  const setSize = (i, key, value) =>
    setForm((f) => ({
      ...f,
      sizes: f.sizes.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)),
    }));

  const addSizeRow = () =>
    setForm((f) => ({ ...f, sizes: [...f.sizes, blankSize()] }));

  const removeSizeRow = (i) =>
    setForm((f) => ({ ...f, sizes: f.sizes.filter((_, idx) => idx !== i) }));

  const handleNameBlur = () => {
    if (!form.slug && form.name) set("slug", slugify(form.name));
  };

  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.name.trim()) {
      setTab("basic");
      return setError("Name is required.");
    }
    if (form.price === "" || Number(form.price) < 0) {
      setTab("basic");
      return setError("Enter a valid price.");
    }

    const sizes = form.sizes
      .filter((s) => s.size.trim() !== "")
      .map((s) => ({
        size: s.size.trim().toUpperCase(),
        stock: Math.max(0, Number(s.stock) || 0),
      }));

    const images = form.images
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const price = Number(form.price);
    const rawCompare = form.compareAtPrice === "" ? null : Number(form.compareAtPrice);
    const compareAtPrice = rawCompare && rawCompare > price ? rawCompare : null;

    const cats = form.categories.map((c) => c.trim()).filter(Boolean);
    const primary = cats[0] || "Uncategorised";

    // Keep only chosen colours that still exist as a colourway, and only when
    // the section is actually on. Empty means "show the primary colour".
    const validColorNames = new Set(
      form.colors.map((c) => c.name.trim()).filter(Boolean)
    );
    const sectionColors = (on, names) =>
      on ? (names || []).filter((n) => validColorNames.has(n)) : [];

    setError("");
    setSaving(true);
    try {
      await onSave({
        name: form.name.trim(),
        code: form.code.trim(),
        slug: form.slug.trim() || slugify(form.name),
        category: primary,
        categories: cats.length ? cats : [primary],
        price,
        compareAtPrice,
        description: form.description.trim(),
        newArrival: form.newArrival,
        featured: form.featured,
        clearance: form.clearance,
        newArrivalColors: sectionColors(form.newArrival, form.newArrivalColors),
        featuredColors: sectionColors(form.featured, form.featuredColors),
        clearanceColors: sectionColors(form.clearance, form.clearanceColors),
        homeNewArrival: form.newArrival && form.homeNewArrival,
        homeBestSeller: form.featured && form.homeBestSeller,
        homeClearance: form.clearance && form.homeClearance,
        highlights: form.highlights.split("\n").map((s) => s.trim()).filter(Boolean),
        fabricCare: form.fabricCare.split("\n").map((s) => s.trim()).filter(Boolean),
        images,
        hasSizes: form.hasSizes,
        // Sizes only mean anything when the product is sized, and only live at
        // the top level when there are no colourways to hold them.
        sizes: form.hasSizes && form.colors.length === 0 ? sizes : [],
        stock: form.hasSizes ? 0 : Math.max(0, Number(form.stock) || 0),
        colors: (() => {
          const rows = form.colors.filter((c) => c.name.trim() !== "");
          const hasPrimary = rows.some((c) => c.primary);
          return rows.map((c, idx) => ({
            ...c,
            primary: hasPrimary ? c.primary === true : idx === 0,
          }));
        })()
          .map((c) => ({
            name: c.name.trim(),
            swatch: c.swatch || "#111111",
            // Optional override — only stored when a positive number is typed.
            price:
              c.price === "" || c.price == null || Number(c.price) <= 0
                ? null
                : Number(c.price),
            images: c.images
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean),
            primary: c.primary === true,
            stock: form.hasSizes ? 0 : Math.max(0, Number(c.stock) || 0),
            sizes: form.hasSizes
              ? c.sizes
                  .filter((x) => x.size.trim() !== "")
                  .map((x) => ({
                    size: x.size.trim().toUpperCase(),
                    stock: Math.max(0, Number(x.stock) || 0),
                  }))
              : [],
          })),
        shipping: {
          weightKg: Number(form.weightKg) || 0,
          lengthCm: Number(form.lengthCm) || 0,
          breadthCm: Number(form.breadthCm) || 0,
          heightCm: Number(form.heightCm) || 0,
        },
      });
    } catch (err) {
      setTab("basic");
      setError(err?.response?.data?.message || err?.message || "Couldn't save the product.");
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <header className={styles.head}>
          <h2 className={styles.title}>{isEdit ? "Edit product" : "Add product"}</h2>
          <div className={styles.headRight}>
            {isEdit && initial?.slug && (
              <a
                className={styles.viewLink}
                href={`/product/${initial.slug}`}
                target="_blank"
                rel="noreferrer"
                title="Open this product on the storefront"
              >
                View on site ↗
              </a>
            )}
            <button className={styles.close} aria-label="Close" onClick={onClose}>
              ✕
            </button>
          </div>
        </header>

        <div className={styles.tabs} role="tablist">
          {visibleTabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {(() => {
                const n = tabBadge(t.key);
                return n === null ? null : (
                  <span
                    className={`${styles.tabCount} ${n === 0 ? styles.tabCountEmpty : ""}`}
                  >
                    {n}
                  </span>
                );
              })()}
            </button>
          ))}
        </div>

        <div className={styles.body}>
          {error && <p className={styles.error}>{error}</p>}

          {tab === "basic" && (
            <>
              <label className={styles.field}>
                <span className={styles.label}>Name</span>
                <input
                  className={styles.input}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  onBlur={handleNameBlur}
                  placeholder="Oversized Black Tee"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Product code</span>
                <input
                  className={styles.input}
                  value={form.code}
                  onChange={(e) => set("code", e.target.value.toUpperCase())}
                  placeholder="Leave blank to auto-generate, or type your own"
                />
              </label>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span className={styles.label}>Slug</span>
                  <input
                    className={styles.input}
                    value={form.slug}
                    onChange={(e) => set("slug", e.target.value)}
                    placeholder="oversized-black-tee"
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Categories</span>
                  <CategoryMultiSelect
                    value={form.categories}
                    categories={categories}
                    onChange={(v) => set("categories", v)}
                  />
                </label>
              </div>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span className={styles.label}>Price (₹)</span>
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => set("price", e.target.value)}
                    placeholder="999"
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Original price / MRP (₹) — optional</span>
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    value={form.compareAtPrice}
                    onChange={(e) => set("compareAtPrice", e.target.value)}
                    placeholder="e.g. 1999"
                  />
                </label>
              </div>

              <label className={styles.field}>
                <span className={styles.label}>Description</span>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="A stylish and functional bag designed for everyday use. Spacious, durable, and perfect for carrying your daily essentials with ease."
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Product highlights (one per line)</span>
                <textarea
                  className={styles.textarea}
                  rows={4}
                  value={form.highlights}
                  onChange={(e) => set("highlights", e.target.value)}
                  placeholder={"Spacious main compartment\nPremium quality material\nLightweight & durable\nSecure zipper closure\nComfortable to carry\nIdeal for daily use"}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Fabric &amp; care (one per line)</span>
                <textarea
                  className={styles.textarea}
                  rows={4}
                  value={form.fabricCare}
                  onChange={(e) => set("fabricCare", e.target.value)}
                  placeholder={"Premium durable material\nWipe clean with a damp cloth\nDo not machine wash\nStore in a cool, dry place"}
                />
              </label>
            </>
          )}

          {tab === "images" && (
            <>
              {form.colors.length > 0 && (
                <p className={styles.imagesNote}>
                  This product has colourways, so each colour's own photos are
                  used on the shop and product page. These images are only a
                  fallback for any colour left without photos.
                </p>
              )}
              <div className={styles.uploadRow}>
                <label className={`${styles.uploadBtn} ${uploading ? styles.uploadBtnBusy : ""}`}>
                  {uploading ? "Uploading…" : "+ Upload images"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    disabled={uploading}
                    onChange={(e) => {
                      handleUpload(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
                <span className={styles.uploadHint}>JPG, PNG or WEBP — up to 8MB each.</span>
              </div>
              {uploadError && <p className={styles.uploadError}>{uploadError}</p>}

              {imagePreviews.length > 0 && (
                <>
                  <p className={styles.previewHint}>
                    Drag to reorder — the first image is the main one shown on the product.
                  </p>
                  <div className={styles.previewGrid}>
                    {imagePreviews.map((src, i) => (
                      <div
                        className={`${styles.previewCard} ${dragIndex === i ? styles.dragging : ""} ${
                          overIndex === i && dragIndex !== null && dragIndex !== i ? styles.dropTarget : ""
                        }`}
                        key={`${src}-${i}`}
                        draggable
                        onDragStart={(e) => {
                          setDragIndex(i);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          if (overIndex !== i) setOverIndex(i);
                        }}
                        onDragEnter={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          moveImage(dragIndex, i);
                          setDragIndex(null);
                          setOverIndex(null);
                        }}
                        onDragEnd={() => {
                          setDragIndex(null);
                          setOverIndex(null);
                        }}
                      >
                        <span className={styles.grip} aria-hidden="true">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <circle cx="9" cy="6" r="1.6" />
                            <circle cx="15" cy="6" r="1.6" />
                            <circle cx="9" cy="12" r="1.6" />
                            <circle cx="15" cy="12" r="1.6" />
                            <circle cx="9" cy="18" r="1.6" />
                            <circle cx="15" cy="18" r="1.6" />
                          </svg>
                        </span>
                        {i === 0 && <span className={styles.mainTag}>Main</span>}
                        <img
                          className={styles.previewImg}
                          src={src}
                          alt={`Product image ${i + 1}`}
                          draggable="false"
                          onError={(e) => {
                            e.currentTarget.style.opacity = "0.25";
                          }}
                        />
                        <div className={styles.previewBar}>
                          <span className={styles.previewNum}>#{i + 1}</span>
                          <span className={styles.moveBtns}>
                            <button
                              type="button"
                              className={styles.moveBtn}
                              disabled={i === 0}
                              onClick={() => moveImage(i, i - 1)}
                              aria-label="Move earlier"
                              title="Move earlier"
                            >
                              ‹
                            </button>
                            <button
                              type="button"
                              className={styles.moveBtn}
                              disabled={i === imagePreviews.length - 1}
                              onClick={() => moveImage(i, i + 1)}
                              aria-label="Move later"
                              title="Move later"
                            >
                              ›
                            </button>
                          </span>
                          <button
                            type="button"
                            className={styles.binBtn}
                            onClick={() => removeImage(i)}
                            aria-label={`Remove image ${i + 1}`}
                            title="Remove image"
                          >
                            <BinIcon />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}


          {tab === "shipping" && (
            <div className={styles.inventory}>
              {/* Parcel size — the courier needs these to book a shipment. */}
            <div className={styles.shipBlock} style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
              <span className={styles.label}>Parcel weight &amp; size</span>
              <p className={styles.shipHint}>
                Used when booking the courier. Weight in kilograms, box
                measurements in centimetres.
              </p>
              <div className={styles.shipGrid}>
                {[
                  { key: "weightKg", label: "Weight (kg)", step: "0.05" },
                  { key: "lengthCm", label: "Length (cm)", step: "0.5" },
                  { key: "breadthCm", label: "Breadth (cm)", step: "0.5" },
                  { key: "heightCm", label: "Height (cm)", step: "0.5" },
                ].map((f) => (
                  <label className={styles.shipField} key={f.key}>
                    <span className={styles.shipLabel}>{f.label}</span>
                    <input
                      className={styles.stockInput}
                      type="number"
                      min="0"
                      step={f.step}
                      value={form[f.key]}
                      onChange={(e) => set(f.key, e.target.value)}
                    />
                  </label>
                ))}
              </div>
            </div>
            </div>
          )}
          {tab === "details" && (
            <>
              <div className={styles.toggles}>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={form.newArrival}
                    onChange={(e) => set("newArrival", e.target.checked)}
                  />
                  New arrival
                </label>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => set("featured", e.target.checked)}
                  />
                  Best seller
                </label>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={form.clearance}
                    onChange={(e) => set("clearance", e.target.checked)}
                  />
                  Clearance sale
                </label>
              </div>

              {(form.newArrival || form.featured || form.clearance) && (
                <p className={styles.hint}>
                  Tagged products appear on the homepage — go to{" "}
                  <strong>Sections</strong> in the sidebar to choose the order
                  they show in.
                </p>
              )}

              {colorNames.length > 0 &&
                (form.newArrival || form.featured || form.clearance) && (
                  <div className={styles.sectionColorsWrap}>
                    <p className={styles.sectionColorsHead}>
                      Which colours appear in each section
                    </p>
                    {SECTION_PICKS.filter((s) => form[s.flag]).map((s) => {
                      const chosen = form[s.field] || [];
                      const all = chosen.length === colorNames.length;
                      return (
                        <div className={styles.sectionColorsRow} key={s.flag}>
                          <span className={styles.sectionColorsLabel}>
                            {s.label}
                          </span>
                          <div className={styles.sectionChips}>
                            <button
                              type="button"
                              className={`${styles.colorChip} ${
                                all ? styles.colorChipOn : ""
                              }`}
                              onClick={() =>
                                set(s.field, all ? [] : [...colorNames])
                              }
                            >
                              All colours
                            </button>
                            {colorNames.map((name) => (
                              <button
                                key={name}
                                type="button"
                                className={`${styles.colorChip} ${
                                  chosen.includes(name) ? styles.colorChipOn : ""
                                }`}
                                onClick={() => toggleSectionColor(s.field, name)}
                              >
                                {name}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    <p className={styles.hint}>
                      Pick the colourways to show as their own cards in that
                      section. Leave all off to show just the primary colour.
                    </p>
                  </div>
                )}
            </>
          )}

          {tab === "inventory" && (
            <div className={styles.inventory}>
              {/* Two switches decide the whole shape of this tab. */}
              <div className={styles.variantToggles}>
                <label className={styles.switchRow}>
                  <input
                    type="checkbox"
                    checked={!form.hasSizes}
                    onChange={(e) => set("hasSizes", !e.target.checked)}
                  />
                  <span>
                    <strong>Free size — one size only</strong>
                    <em>
                      Tick for bags and anything that doesn't come in sizes. The
                      size picker is hidden and a single stock number is used
                      instead.
                    </em>
                  </span>
                </label>

                <label className={styles.switchRow}>
                  <input
                    type="checkbox"
                    checked={form.colors.length > 0}
                    onChange={(e) =>
                      set("colors", e.target.checked ? [blankColor()] : [])
                    }
                  />
                  <span>
                    <strong>This product comes in several colours</strong>
                    <em>
                      Each colour gets its own photos and its own stock. Mark one
                      as <strong>primary</strong> — that's the one shown on the
                      shop grid and when the product page first opens.
                    </em>
                  </span>
                </label>
              </div>

              {/* ---------- one colourway, no sizes ---------- */}
              {form.colors.length === 0 && !form.hasSizes && (
                <label className={styles.shipField}>
                  <span className={styles.label}>Stock</span>
                  <input
                    className={styles.stockInput}
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => set("stock", e.target.value)}
                  />
                </label>
              )}

              {/* ---------- colourways ---------- */}
              {form.colors.length > 0 && (
                <div className={styles.colorList}>
                  {form.colors.map((c, ci) => (
                    <div className={styles.colorCard} key={ci}>
                      <div className={styles.colorHead}>
                        <span
                          className={styles.colorThumb}
                          style={{ background: c.swatch || "#111" }}
                          aria-hidden="true"
                        >
                          {c.images.trim().split("\n")[0]?.trim() && (
                            <img
                              src={c.images.trim().split("\n")[0].trim()}
                              alt=""
                              onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                          )}
                        </span>
                        <input
                          className={styles.sizeInput}
                          value={c.name}
                          onChange={(e) => setColor(ci, "name", e.target.value)}
                          placeholder="Colour name, e.g. Navy Blue"
                        />
                        <input
                          type="color"
                          className={styles.colorSwatch}
                          value={c.swatch}
                          onChange={(e) => setColor(ci, "swatch", e.target.value)}
                          title="Swatch colour — used when this colour has no photo"
                        />
                        {!form.hasSizes && (
                          <input
                            className={styles.stockInput}
                            type="number"
                            min="0"
                            value={c.stock}
                            onChange={(e) => setColor(ci, "stock", e.target.value)}
                            placeholder="Stock"
                            title="Stock for this colour"
                          />
                        )}
                        <label
                          className={`${styles.primaryPick} ${
                            c.primary ? styles.primaryPickOn : ""
                          }`}
                          title="Show this colour on the shop grid and as the opening photo"
                        >
                          <input
                            type="radio"
                            name="primaryColor"
                            checked={!!c.primary}
                            onChange={() => makePrimary(ci)}
                          />
                          Primary
                        </label>

                        <button
                          type="button"
                          className={styles.removeRow}
                          onClick={() => removeColor(ci)}
                          aria-label={`Remove ${c.name || "colour"}`}
                        >
                          ✕
                        </button>
                      </div>

                      <label className={styles.shipField}>
                        <span className={styles.shipLabel}>
                          Price for this colour (optional)
                        </span>
                        <input
                          className={styles.stockInput}
                          type="number"
                          min="0"
                          value={c.price}
                          onChange={(e) => setColor(ci, "price", e.target.value)}
                          placeholder={`Leave blank for ₹${Number(form.price) || 0}`}
                          title="Leave blank to use the product's price"
                        />
                      </label>

                      <div className={styles.shipField}>
                        <span className={styles.shipLabel}>Photos for this colour</span>
                        <div className={styles.uploadRow}>
                          <label
                            className={`${styles.uploadBtn} ${
                              colorUploading[ci] ? styles.uploadBtnBusy : ""
                            }`}
                          >
                            {colorUploading[ci] ? "Uploading…" : "+ Upload images"}
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              hidden
                              disabled={!!colorUploading[ci]}
                              onChange={(e) => {
                                handleColorUpload(ci, e.target.files);
                                e.target.value = "";
                              }}
                            />
                          </label>
                          <span className={styles.uploadHint}>JPG, PNG or WEBP — up to 8MB each.</span>
                        </div>
                        {colorUploadError[ci] && (
                          <p className={styles.uploadError}>{colorUploadError[ci]}</p>
                        )}
                      </div>

                      <ImageStrip
                        value={c.images}
                        onChange={(v) => setColor(ci, "images", v)}
                        emptyHint="No photos yet — upload one above and it'll appear here. The first photo is the one shoppers see first."
                      />

                      {form.hasSizes && (
                        <>
                          <div className={styles.invHead}>
                            <span className={styles.shipLabel}>
                              Sizes for this colour (size · stock)
                            </span>
                            <button
                              type="button"
                              className={styles.addRow}
                              onClick={() => addColorSize(ci)}
                            >
                              + Add size
                            </button>
                          </div>
                          {c.sizes.map((sz, si) => (
                            <div className={styles.sizeRow} key={si}>
                              <input
                                className={styles.sizeInput}
                                value={sz.size}
                                onChange={(e) => setColorSize(ci, si, "size", e.target.value)}
                                placeholder="M"
                                aria-label="Size"
                              />
                              <input
                                className={styles.stockInput}
                                type="number"
                                min="0"
                                value={sz.stock}
                                onChange={(e) => setColorSize(ci, si, "stock", e.target.value)}
                                aria-label="Stock"
                                title="Stock"
                              />
                              <button
                                type="button"
                                className={styles.removeRow}
                                onClick={() => removeColorSize(ci, si)}
                                aria-label="Remove size"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  ))}

                  <button type="button" className={styles.addRow} onClick={addColor}>
                    + Add colour
                  </button>
                </div>
              )}

              {/* ---------- one colourway, with sizes ---------- */}
              {form.colors.length === 0 && form.hasSizes && (
              <>
              <div className={styles.invHead}>
                <span className={styles.label}>Inventory (size · stock)</span>
                <button type="button" className={styles.addRow} onClick={addSizeRow}>
                  + Add size
                </button>
              </div>
              {form.sizes.map((s, i) => (
                <div className={styles.sizeRow} key={i}>
                  <input
                    className={styles.sizeInput}
                    value={s.size}
                    onChange={(e) => setSize(i, "size", e.target.value)}
                    placeholder="M"
                    aria-label="Size"
                  />
                  <input
                    className={styles.stockInput}
                    type="number"
                    min="0"
                    value={s.stock}
                    onChange={(e) => setSize(i, "stock", e.target.value)}
                    aria-label="Stock"
                    title="Stock"
                  />
                  <button
                    type="button"
                    className={styles.removeRow}
                    onClick={() => removeSizeRow(i)}
                    aria-label="Remove size"
                  >
                    ✕
                  </button>
                </div>
              ))}

              </>
              )}

            </div>
          )}
        </div>

        <footer className={styles.foot}>
          <button className={styles.cancel} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.save} onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add product"}
          </button>
        </footer>
      </div>
    </div>
  );
}
