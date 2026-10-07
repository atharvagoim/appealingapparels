import { useEffect, useState } from "react";
import {
  fetchAllCoupons,
  createCouponApi,
  updateCouponApi,
  deleteCouponApi,
  toggleCouponApi,
} from "../../api/couponsApi";
import ui from "../admin.module.css";
import styles from "./AdminCoupons.module.css";

const TYPE_LABEL = {
  percentage: "% off",
  flat: "₹ off",
  freeShipping: "Free shipping",
};

const BLANK = {
  code: "",
  description: "",
  type: "percentage",
  value: "",
  minOrderValue: "",
  maxDiscount: "",
  startAt: "",
  expiresAt: "",
  usageLimit: "",
  perUserLimit: "1",
  active: true,
  showOnProductPage: true,
};

const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

function summarize(c) {
  if (c.type === "percentage") {
    const cap = c.maxDiscount ? ` (up to ₹${c.maxDiscount.toLocaleString("en-IN")})` : "";
    return `${c.value}% off${cap}`;
  }
  if (c.type === "flat") return `₹${Number(c.value).toLocaleString("en-IN")} off`;
  return "Free shipping";
}

function windowLabel(c) {
  if (!c.startAt && !c.expiresAt) return "No end date";
  const start = c.startAt
    ? new Date(c.startAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : "now";
  const end = c.expiresAt
    ? new Date(c.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "no expiry";
  return `${start} → ${end}`;
}

function isLive(c) {
  const now = new Date();
  if (c.startAt && now < new Date(c.startAt)) return false;
  if (c.expiresAt && now > new Date(c.expiresAt)) return false;
  return true;
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const [editing, setEditing] = useState(null); // null | "new" | coupon
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = () => {
    setLoading(true);
    fetchAllCoupons()
      .then(setCoupons)
      .catch((err) => setError(err?.response?.data?.message || "Couldn't load coupons."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openNew = () => {
    setForm(BLANK);
    setFormError("");
    setEditing("new");
  };

  const openEdit = (c) => {
    setForm({
      code: c.code,
      description: c.description || "",
      type: c.type,
      value: c.type === "freeShipping" ? "" : String(c.value ?? ""),
      minOrderValue: c.minOrderValue ? String(c.minOrderValue) : "",
      maxDiscount: c.maxDiscount ? String(c.maxDiscount) : "",
      startAt: toInputDate(c.startAt),
      expiresAt: toInputDate(c.expiresAt),
      usageLimit: c.usageLimit ? String(c.usageLimit) : "",
      perUserLimit: c.perUserLimit ? String(c.perUserLimit) : "1",
      active: c.active,
      showOnProductPage: c.showOnProductPage,
    });
    setFormError("");
    setEditing(c);
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.code.trim()) return setFormError("Enter a coupon code.");
    if (form.type !== "freeShipping" && (!form.value || Number(form.value) <= 0)) {
      return setFormError("Enter a discount value.");
    }
    if (form.type === "percentage" && Number(form.value) > 100) {
      return setFormError("A percentage discount can't exceed 100%.");
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      type: form.type,
      value: form.type === "freeShipping" ? 0 : Number(form.value),
      minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
      startAt: form.startAt || null,
      expiresAt: form.expiresAt || null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : 1,
      active: form.active,
      showOnProductPage: form.showOnProductPage,
    };

    setSaving(true);
    try {
      if (editing === "new") {
        const created = await createCouponApi(payload);
        setCoupons((prev) => [created, ...prev]);
      } else {
        const updated = await updateCouponApi(editing.id, payload);
        setCoupons((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      }
      setEditing(null);
    } catch (err) {
      setFormError(err?.response?.data?.message || "Couldn't save that coupon.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete coupon "${c.code}"? This can't be undone.`)) return;
    try {
      await deleteCouponApi(c.id);
      setCoupons((prev) => prev.filter((x) => x.id !== c.id));
    } catch (err) {
      alert(err?.response?.data?.message || "Couldn't delete that coupon.");
    }
  };

  const toggle = async (c) => {
    // Optimistic flip, corrected if the request fails.
    setCoupons((prev) => prev.map((x) => (x.id === c.id ? { ...x, active: !x.active } : x)));
    try {
      const updated = await toggleCouponApi(c.id);
      setCoupons((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch (err) {
      setCoupons((prev) => prev.map((x) => (x.id === c.id ? { ...x, active: c.active } : x)));
      alert(err?.response?.data?.message || "Couldn't update that coupon.");
    }
  };

  const q = query.trim().toLowerCase();
  const visible = coupons.filter(
    (c) => !q || c.code.toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q)
  );

  return (
    <div>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>Coupons</h1>
          <p className={ui.pageSub}>Create and manage discount codes for your store.</p>
        </div>
        <div className={ui.headActions}>
          <button className={`${ui.btn} ${ui.btnGhost}`} onClick={load}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Refresh
          </button>
          <button className={ui.btn} onClick={openNew}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add coupon
          </button>
        </div>
      </div>

      <div className={styles.searchCard}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={styles.searchIcon}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          className={styles.search}
          placeholder="Search by code or description"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className={styles.count}>
          {visible.length} of {coupons.length}
        </span>
      </div>

      {loading ? (
        <div className={ui.empty}>
          <p className={ui.emptyTitle}>Loading…</p>
        </div>
      ) : error ? (
        <div className={ui.empty}>
          <p className={ui.emptyTitle}>{error}</p>
        </div>
      ) : visible.length === 0 ? (
        <div className={ui.empty}>
          <p className={ui.emptyTitle}>{query ? "No coupons match that search." : "No coupons yet."}</p>
          {!query && <p className={ui.emptyBody}>Create your first coupon to start offering discounts.</p>}
        </div>
      ) : (
        <div className={styles.grid}>
          {visible.map((c) => {
            const live = isLive(c);
            return (
              <div className={styles.card} key={c.id}>
                <div className={styles.cardTop}>
                  <div>
                    <p className={styles.code}>{c.code}</p>
                    {c.description && <p className={styles.desc}>{c.description}</p>}
                  </div>
                  <button
                    className={`${styles.switch} ${c.active ? styles.switchOn : ""}`}
                    onClick={() => toggle(c)}
                    aria-pressed={c.active}
                    aria-label={c.active ? "Deactivate coupon" : "Activate coupon"}
                    title={c.active ? "Active — click to deactivate" : "Inactive — click to activate"}
                  >
                    <span className={styles.knob} />
                  </button>
                </div>

                <div className={styles.badges}>
                  <span className={styles.typeBadge}>{TYPE_LABEL[c.type]}</span>
                  <span className={styles.valueBadge}>{summarize(c)}</span>
                  {!live && <span className={styles.scheduleBadge}>Scheduled / expired</span>}
                </div>

                <ul className={styles.meta}>
                  {c.minOrderValue > 0 && <li>Min order ₹{c.minOrderValue.toLocaleString("en-IN")}</li>}
                  <li>{windowLabel(c)}</li>
                  <li>
                    Used {c.usedCount || 0}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ""} · {c.perUserLimit || 1} per customer
                  </li>
                  <li>{c.showOnProductPage ? "Shown on product pages" : "Hidden from product pages"}</li>
                </ul>

                <div className={styles.cardActions}>
                  <button className={styles.actionBtn} onClick={() => openEdit(c)}>
                    Edit
                  </button>
                  <button className={`${styles.actionBtn} ${styles.actionDanger}`} onClick={() => remove(c)}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <div className={styles.overlay} role="dialog" aria-modal="true" onClick={() => setEditing(null)}>
          <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
            <header className={styles.panelHead}>
              <h2 className={styles.panelTitle}>{editing === "new" ? "Add coupon" : "Edit coupon"}</h2>
              <button className={styles.close} onClick={() => setEditing(null)} aria-label="Close">
                ✕
              </button>
            </header>

            <form className={styles.form} onSubmit={submit}>
              {formError && <p className={styles.formError}>{formError}</p>}

              <label className={styles.field}>
                <span className={styles.label}>Coupon code</span>
                <input
                  className={styles.input}
                  value={form.code}
                  onChange={(e) => set("code", e.target.value.toUpperCase())}
                  placeholder="WELCOME10"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Description (shown to customers)</span>
                <input
                  className={styles.input}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="10% off your first order"
                />
              </label>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span className={styles.label}>Type</span>
                  <select className={styles.select} value={form.type} onChange={(e) => set("type", e.target.value)}>
                    <option value="percentage">Percentage off</option>
                    <option value="flat">Flat amount off</option>
                    <option value="freeShipping">Free shipping</option>
                  </select>
                </label>
                {form.type !== "freeShipping" && (
                  <label className={styles.field}>
                    <span className={styles.label}>
                      {form.type === "percentage" ? "Discount (%)" : "Discount (₹)"}
                    </span>
                    <input
                      className={styles.input}
                      type="number"
                      min="0"
                      max={form.type === "percentage" ? 100 : undefined}
                      value={form.value}
                      onChange={(e) => set("value", e.target.value)}
                      placeholder={form.type === "percentage" ? "10" : "500"}
                    />
                  </label>
                )}
              </div>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span className={styles.label}>Minimum order value (₹)</span>
                  <input
                    className={styles.input}
                    type="number"
                    min="0"
                    value={form.minOrderValue}
                    onChange={(e) => set("minOrderValue", e.target.value)}
                    placeholder="0"
                  />
                </label>
                {form.type === "percentage" && (
                  <label className={styles.field}>
                    <span className={styles.label}>Max discount cap (₹, optional)</span>
                    <input
                      className={styles.input}
                      type="number"
                      min="0"
                      value={form.maxDiscount}
                      onChange={(e) => set("maxDiscount", e.target.value)}
                      placeholder="e.g. 500"
                    />
                  </label>
                )}
              </div>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span className={styles.label}>Starts (optional)</span>
                  <input
                    className={styles.input}
                    type="date"
                    value={form.startAt}
                    onChange={(e) => set("startAt", e.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Expires (optional)</span>
                  <input
                    className={styles.input}
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => set("expiresAt", e.target.value)}
                  />
                </label>
              </div>

              <div className={styles.fieldRow}>
                <label className={styles.field}>
                  <span className={styles.label}>Total usage limit (optional)</span>
                  <input
                    className={styles.input}
                    type="number"
                    min="1"
                    value={form.usageLimit}
                    onChange={(e) => set("usageLimit", e.target.value)}
                    placeholder="Unlimited"
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>Uses per customer</span>
                  <input
                    className={styles.input}
                    type="number"
                    min="1"
                    value={form.perUserLimit}
                    onChange={(e) => set("perUserLimit", e.target.value)}
                  />
                </label>
              </div>

              <div className={styles.toggles}>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => set("active", e.target.checked)}
                  />
                  Active
                </label>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={form.showOnProductPage}
                    onChange={(e) => set("showOnProductPage", e.target.checked)}
                  />
                  Show as a banner on product pages
                </label>
              </div>

              <div className={styles.formFoot}>
                <button type="button" className={styles.cancel} onClick={() => setEditing(null)}>
                  Cancel
                </button>
                <button type="submit" className={styles.save} disabled={saving}>
                  {saving ? "Saving…" : editing === "new" ? "Add coupon" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
