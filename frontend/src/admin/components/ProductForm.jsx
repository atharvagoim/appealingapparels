import { useState } from "react";
import styles from "./ProductForm.module.css";

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const blankSize = () => ({ size: "", stock: 0 });

function toForm(product) {
  if (!product) {
    return {
      name: "",
      slug: "",
      category: "",
      price: "",
      description: "",
      newArrival: false,
      featured: false,
      images: "",
      sizes: [
        { size: "S", stock: 0 },
        { size: "M", stock: 0 },
        { size: "L", stock: 0 },
      ],
    };
  }
  return {
    name: product.name || "",
    slug: product.slug || "",
    category: product.category || "",
    price: product.price ?? "",
    description: product.description || "",
    newArrival: !!product.newArrival,
    featured: !!product.featured,
    images: (product.images || []).join("\n"),
    sizes: product.sizes?.length ? product.sizes : [blankSize()],
  };
}

export default function ProductForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(() => toForm(initial));
  const [error, setError] = useState("");
  const isEdit = !!initial;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const setSize = (i, key, value) =>
    setForm((f) => ({
      ...f,
      sizes: f.sizes.map((s, idx) =>
        idx === i ? { ...s, [key]: value } : s
      ),
    }));

  const addSizeRow = () =>
    setForm((f) => ({ ...f, sizes: [...f.sizes, blankSize()] }));

  const removeSizeRow = (i) =>
    setForm((f) => ({ ...f, sizes: f.sizes.filter((_, idx) => idx !== i) }));

  const handleNameBlur = () => {
    if (!form.slug && form.name) set("slug", slugify(form.name));
  };

  const submit = () => {
    if (!form.name.trim()) return setError("Name is required.");
    if (form.price === "" || Number(form.price) < 0)
      return setError("Enter a valid price.");

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

    onSave({
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      category: form.category.trim() || "Uncategorised",
      price: Number(form.price),
      description: form.description.trim(),
      newArrival: form.newArrival,
      featured: form.featured,
      images,
      sizes,
    });
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <header className={styles.head}>
          <h2 className={styles.title}>{isEdit ? "Edit product" : "Add product"}</h2>
          <button className={styles.close} aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className={styles.body}>
          {error && <p className={styles.error}>{error}</p>}

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
              <span className={styles.label}>Category</span>
              <input
                className={styles.input}
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="T-Shirts"
              />
            </label>
          </div>

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
            <span className={styles.label}>Description</span>
            <textarea
              className={styles.textarea}
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Premium heavyweight cotton…"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Image URLs (one per line)</span>
            <textarea
              className={styles.textarea}
              rows={3}
              value={form.images}
              onChange={(e) => set("images", e.target.value)}
              placeholder={"/products/black-tee/front.avif\nhttps://…"}
            />
          </label>

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
          </div>

          {/* Inventory */}
          <div className={styles.inventory}>
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
          </div>
        </div>

        <footer className={styles.foot}>
          <button className={styles.cancel} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.save} onClick={submit}>
            {isEdit ? "Save changes" : "Add product"}
          </button>
        </footer>
      </div>
    </div>
  );
}
