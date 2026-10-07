import { useEffect, useState } from "react";
import StarRating from "./StarRating";
import { submitReviewApi } from "../api/reviewsApi";
import styles from "./ReviewDialog.module.css";

/**
 * Rate and (optionally) write about the products in one delivered order.
 *
 * Nothing is compulsory — a customer can rate one item, all of them, or close
 * the dialog without saying anything at all.
 *
 * @param order  { orderId, orderNumber, items: [{ product, name, image, size, rating?, body? }] }
 */
export default function ReviewDialog({ order, title, subtitle, onClose, onSaved }) {
  const [drafts, setDrafts] = useState({});
  const [saved, setSaved] = useState({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Pre-fill with anything already written for this order.
  useEffect(() => {
    const seed = {};
    (order?.items || []).forEach((i) => {
      seed[i.product] = { rating: i.rating || 0, body: i.body || "" };
    });
    setDrafts(seed);
  }, [order]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!order) return null;

  const items = order.items || [];
  const set = (id, patch) =>
    setDrafts((d) => ({ ...d, [id]: { ...(d[id] || {}), ...patch } }));

  const rated = items.filter((i) => (drafts[i.product]?.rating || 0) > 0);

  const submit = async () => {
    if (!rated.length) {
      setErr("Tap a star to rate at least one item, or just close this.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      for (const i of rated) {
        const d = drafts[i.product];
        await submitReviewApi({
          orderId: order.orderId,
          productId: i.product,
          rating: d.rating,
          body: d.body || "",
        });
        setSaved((s) => ({ ...s, [i.product]: true }));
      }
      onSaved?.();
      onClose?.();
    } catch (e) {
      setErr(e?.response?.data?.message || "Couldn't save that review.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-label="Rate your order"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.head}>
          <div>
            <h2 className={styles.title}>{title || "How was your order?"}</h2>
            <p className={styles.sub}>
              {subtitle ||
                `Order ${order.orderNumber || ""} has been delivered. Rate it if you'd like — it's completely optional.`}
            </p>
          </div>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {err && <p className={styles.error}>{err}</p>}

        <div className={styles.items}>
          {items.map((i) => {
            const d = drafts[i.product] || { rating: 0, body: "" };
            return (
              <div className={styles.item} key={i.product}>
                <div className={styles.itemHead}>
                  {i.image ? (
                    <img className={styles.thumb} src={i.image} alt="" />
                  ) : (
                    <span className={styles.thumbBlank} />
                  )}
                  <div className={styles.itemText}>
                    <p className={styles.itemName}>{i.name}</p>
                    {i.size && <p className={styles.itemMeta}>Size {i.size}</p>}
                    {saved[i.product] && (
                      <p className={styles.savedTag}>Saved ✓</p>
                    )}
                  </div>
                </div>

                <StarRating
                  value={d.rating}
                  onChange={(n) => set(i.product, { rating: n })}
                  disabled={busy}
                />

                <textarea
                  className={styles.textarea}
                  rows={3}
                  maxLength={1500}
                  placeholder="Write a review (optional) — how did it fit, how's the fabric?"
                  value={d.body}
                  disabled={busy}
                  onChange={(e) => set(i.product, { body: e.target.value })}
                />
              </div>
            );
          })}
        </div>

        <div className={styles.foot}>
          <button type="button" className={styles.ghost} onClick={onClose} disabled={busy}>
            Maybe later
          </button>
          <button type="button" className={styles.primary} onClick={submit} disabled={busy}>
            {busy
              ? "Saving…"
              : rated.length > 1
              ? `Submit ${rated.length} reviews`
              : "Submit review"}
          </button>
        </div>
      </div>
    </div>
  );
}
