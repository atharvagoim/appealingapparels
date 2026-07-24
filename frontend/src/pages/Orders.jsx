import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchMyOrders, downloadInvoice } from "../api/ordersApi";
import BackButton from "../components/BackButton";
import styles from "./Orders.module.css";

const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const STEPS = ["Order placed", "Payment confirmed", "Shipped", "Delivered"];
const STEP_INDEX = { pending: 0, paid: 1, shipped: 2, delivered: 3 };

export default function Orders() {
  const { isAuthenticated } = useAuth();
  const [params] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    let active = true;
    fetchMyOrders()
      .then((data) => active && setOrders(data))
      .catch((err) => active && setError(err?.response?.data?.message || "Couldn't load orders."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const handleDownload = async (order) => {
    setDownloadingId(order.id);
    try {
      await downloadInvoice(order.id, order.orderNumber);
    } catch {
      alert("Couldn't download the invoice. Please try again in a moment.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.head}>
        <BackButton />
        <h1 className={styles.title}>Your orders</h1>
      </div>

      {params.get("status") === "success" && (
        <div className={styles.success} role="status">
          <span className={styles.successIcon}>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </span>
          <span className={styles.successText}>
            <strong>Payment successful</strong>
            Thank you for your order!
          </span>
        </div>
      )}

      {!isAuthenticated ? (
        <p className={styles.empty}>
          Please <Link to="/login" className={styles.link}>sign in</Link> to see your orders.
        </p>
      ) : loading ? (
        <p className={styles.empty}>Loading…</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : orders.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.empty}>You haven't placed any orders yet.</p>
          <Link to="/shop" className={styles.shopLink}>
            Start shopping
          </Link>
        </div>
      ) : (
        <div className={styles.list}>
          {orders.map((o) => (
            <div className={styles.order} key={o.id}>
              <div className={styles.orderHead}>
                <span className={styles.orderId}>#{o.id.slice(-6).toUpperCase()}</span>
                <span className={styles.date}>{fmtDate(o.createdAt)}</span>
                <span className={`${styles.status} ${styles[o.status] || ""}`}>{o.status}</span>
              </div>

              <ul className={styles.items}>
                {o.items.map((it, idx) => (
                  <li key={idx} className={styles.itemRow}>
                    <span className={styles.itemThumb}>
                      {it.image && <img src={it.image} alt="" />}
                    </span>
                    <span className={styles.itemInfo}>
                      <span className={styles.itemName}>{it.name}</span>
                      <span className={styles.itemMeta}>
                        {it.size ? `Size ${it.size} · ` : ""}Qty {it.quantity}
                      </span>
                    </span>
                    <span className={styles.itemPrice}>{inr(it.price * it.quantity)}</span>
                  </li>
                ))}
              </ul>

              <div className={styles.total}>
                <span>Total</span>
                <span>{inr(o.amounts?.total ?? 0)}</span>
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionBtnGhost}`}
                  onClick={() => setTrackingOrder(o)}
                >
                  Track your order
                </button>
                {o.status !== "pending" && (
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => handleDownload(o)}
                    disabled={downloadingId === o.id}
                  >
                    {downloadingId === o.id ? "Preparing…" : "Download invoice"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {trackingOrder && (
        <div className={styles.trackOverlay} onClick={() => setTrackingOrder(null)}>
          <div
            className={styles.trackModal}
            role="dialog"
            aria-modal="true"
            aria-label="Order tracking"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.trackHead}>
              <div>
                <strong>#{trackingOrder.id.slice(-6).toUpperCase()}</strong>
                <span>{fmtDate(trackingOrder.createdAt)}</span>
              </div>
              <button
                type="button"
                className={styles.trackClose}
                onClick={() => setTrackingOrder(null)}
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </button>
            </div>

            {trackingOrder.status === "cancelled" ? (
              <div className={styles.trackCancelled}>
                <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                </svg>
                <p>This order was cancelled.</p>
              </div>
            ) : (
              <ol className={styles.trackSteps}>
                {STEPS.map((label, i) => {
                  const current = STEP_INDEX[trackingOrder.status] ?? 0;
                  const done = i <= current;
                  return (
                    <li
                      key={label}
                      className={`${styles.trackStep} ${done ? styles.trackStepDone : ""}`}
                    >
                      <span className={styles.trackDot}>
                        {done && (
                          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </span>
                      <span className={styles.trackLabel}>{label}</span>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
