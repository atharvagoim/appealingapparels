import { useEffect, useMemo, useState } from "react";
import {
  fetchAllOrders,
  updateOrderStatusApi,
  refundOrderApi,
  updateShipmentApi,
  addOrderNoteApi,
  viewInvoice,
  deleteOrderApi,
  clearPendingOrdersApi,
} from "../../api/ordersApi";
import ui from "../admin.module.css";
import styles from "./AdminOrders.module.css";
import { estimateDelivery, formatShortDate } from "../../utils/deliveryEstimate";

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const fmtTime = (d) =>
  new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const PAGE_SIZE = 8;

const SHORT = {
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  pending: "Unpaid",
  refunded: "Refunded",
};
/** Badge colours, per spec: Paid blue, Shipped orange, Delivered green, Cancelled red. */
const COLOR = {
  paid: "blue",
  shipped: "orange",
  delivered: "green",
  cancelled: "red",
  pending: "amber",
  refunded: "purple",
};

/**
 * B — guided workflow. Fulfilment only ever runs forwards, and cancelling is
 * possible right up until the parcel is delivered. Mirrors the server's rules.
 */
const NEXT_STATUS = {
  paid: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

const ACTION_LABEL = {
  shipped: "Mark shipped",
  delivered: "Mark delivered",
  cancelled: "Cancel order",
};

/* ---------- inline icons ---------- */
const paths = {
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10.5h18" />
      <circle cx="16.5" cy="14.5" r="1" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6.5h10.5v9.5H3z" />
      <path d="M13.5 9.5H18l3 3v3.5h-7.5z" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17.5" cy="18" r="1.6" />
    </>
  ),
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.4 2.4 4.6-5" />
    </>
  ),
  xCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5l3 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4.5" width="18" height="16.5" rx="2" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
    </>
  ),
  box: (
    <>
      <path d="M12 3l8 4v10l-8 4-8-4V7z" />
      <path d="M4 7l8 4 8-4" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  phone: <path d="M4 4h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 2 6a2 2 0 0 1 2-2z" />,
  pin: (
    <>
      <path d="M12 21s7-6.6 7-12a7 7 0 1 0-14 0c0 5.4 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.4" />
    </>
  ),
  refund: (
    <>
      <path d="M3 10a9 9 0 1 1 2.6 6.4" />
      <path d="M3 4v6h6" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </>
  ),
  refresh: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 7.5h.01" />
    </>
  ),
  chevL: <path d="M15 6l-6 6 6 6" />,
  chevR: <path d="M9 6l6 6-6 6" />,
};

function Icon({ name, size = 18, sw = 1.8 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
const Dots = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <circle cx="5" cy="12" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="19" cy="12" r="1.7" />
  </svg>
);

const TAB_ICON = {
  paid: "wallet",
  shipped: "truck",
  delivered: "checkCircle",
  cancelled: "xCircle",
  refunded: "refund",
  pending: "clock",
  history: "box",
};

/** A single detail value with its own copy button. */
function CopyLine({ value, label, fieldKey, muted, copiedField, onCopy }) {
  const has = value !== undefined && value !== null && String(value).trim() !== "";
  if (!has) {
    return <p className={muted ? styles.meta : undefined}>—</p>;
  }
  const copied = copiedField === fieldKey;
  return (
    <div className={styles.copyLine}>
      <span className={muted ? `${styles.copyVal} ${styles.copyValMuted}` : styles.copyVal}>
        {value}
      </span>
      <button
        type="button"
        className={`${styles.copyBtn} ${copied ? styles.copyBtnOn : ""}`}
        onClick={() => onCopy(fieldKey, value)}
        aria-label={copied ? `${label} copied` : `Copy ${label}`}
        title={copied ? "Copied" : `Copy ${label}`}
      >
        {copied ? (
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </svg>
        )}
      </button>
    </div>
  );
}

const SORTS = [
  { key: "newest", label: "Newest orders" },
  { key: "oldest", label: "Oldest orders" },
  { key: "high", label: "Highest order value" },
  { key: "low", label: "Lowest order value" },
  { key: "updated", label: "Recently updated" },
];

const VIEWS = [
  { key: "paid", label: "Paid" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "refunded", label: "Refunded" },
  { key: "pending", label: "Pending / unpaid" },
  { key: "history", label: "Order History" },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [pinQuery, setPinQuery] = useState("");
  const [view, setView] = useState("paid");
  const [sort, setSort] = useState("newest");
  const [openId, setOpenId] = useState("");
  const [activeId, setActiveId] = useState("");
  const [menuId, setMenuId] = useState("");
  const [page, setPage] = useState(1);

  // H — extra filters beyond the status tabs.
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // C — the dispatch form that has to be filled in before shipping.
  const [shipFor, setShipFor] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { order, status }
  const [busyId, setBusyId] = useState("");

  const load = () => {
    setLoading(true);
    fetchAllOrders()
      .then((data) => setOrders(data))
      .catch((err) => setError(err?.response?.data?.message || "Couldn't load orders."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    fetchAllOrders()
      .then((data) => active && setOrders(data))
      .catch((err) => active && setError(err?.response?.data?.message || "Couldn't load orders."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setPage(1);
    setActiveId("");
  }, [view, query, sort, from, to]);

  const byStatus = useMemo(() => {
    const b = { paid: [], shipped: [], delivered: [], cancelled: [], refunded: [], pending: [] };
    orders.forEach((o) => {
      if (b[o.status]) b[o.status].push(o);
    });
    // Everything that's actually happened to an order, in one place —
    // every status except pending (nothing was ever charged for those).
    b.history = orders.filter((o) => o.status !== "pending");
    return b;
  }, [orders]);

  const base = byStatus[view] || [];
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    let list = base;

    // G — customer name, email, phone, PIN code, invoice/order number and
    // tracking number. Split into words so "Arora Priya" still finds
    // "Priya Arora" — searching just a first name or just a last name
    // already worked since each is its own substring of the full name, but
    // typing both in the opposite order didn't match before this.
    if (q) {
      const words = q.split(/\s+/).filter(Boolean);
      list = list.filter((o) => {
        const a = o.shippingAddress || {};
        const haystack = [
          o.orderNumber,
          o.user?.name,
          o.user?.email,
          o.user?.phone,
          a.fullName,
          a.email,
          a.phone,
          a.postalCode,
          o.shipment?.trackingNumber,
          o.shipment?.courier,
          o.payment?.razorpayPaymentId,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return words.every((w) => haystack.includes(w));
      });
    }

    // A separate PIN code box — narrows whatever the main search already
    // found, so both can be used at the same time (e.g. "Arora" in the main
    // box + "400" here finds only Aroras shipping to a 400xx PIN).
    const pin = pinQuery.trim().toLowerCase();
    if (pin) {
      list = list.filter((o) => {
        const a = o.shippingAddress || {};
        return String(a.postalCode || "").toLowerCase().includes(pin);
      });
    }

    if (from) {
      const start = new Date(from);
      start.setHours(0, 0, 0, 0);
      list = list.filter((o) => new Date(o.createdAt) >= start);
    }
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      list = list.filter((o) => new Date(o.createdAt) <= end);
    }

    return list;
  }, [base, q, pinQuery, from, to]);

  const shown = useMemo(() => {
    const list = [...filtered];
    const time = (o) => new Date(o.createdAt).getTime() || 0;
    const touched = (o) => new Date(o.updatedAt || o.createdAt).getTime() || 0;
    const value = (o) => Number(o.amounts?.total || 0);
    if (sort === "oldest") list.sort((a, b) => time(a) - time(b));
    else if (sort === "high") list.sort((a, b) => value(b) - value(a));
    else if (sort === "low") list.sort((a, b) => value(a) - value(b));
    else if (sort === "updated") list.sort((a, b) => touched(b) - touched(a));
    else list.sort((a, b) => time(b) - time(a));
    return list;
  }, [filtered, sort]);

  /* I — headline numbers across every order, not just the current tab. */
  const totalPages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = shown.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /** Drop the server's fresh copy of an order back into the list. */
  const replaceOrder = (updated) =>
    setOrders((prev) =>
      prev.map((x) => ((x.id || x._id) === (updated.id || updated._id) ? updated : x))
    );

  const ref = (o) =>
    o.orderNumber || `#${String(o.id || o._id).slice(-6).toUpperCase()}`;

  /** Indian numbers as typed (10 digits, or with a +91/91 prefix, spaces,
   *  dashes) all need to become a plain "91XXXXXXXXXX" for a wa.me link. */
  const toWhatsAppNumber = (raw) => {
    const digits = String(raw || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.length === 10) return `91${digits}`;
    if (digits.length > 10) return digits.replace(/^0+/, "");
    return "";
  };

  /** Opens a WhatsApp chat to the customer with a status-update message
   *  already filled in, after a shipment or delivery is confirmed — admin
   *  just reviews and hits send. Silently does nothing if there's no phone
   *  on file for that order. */
  /** Builds the wa.me URL for a status update, or null if there's no phone
   *  on file for this order. Pure/synchronous — doesn't open anything. */
  const buildStatusWhatsAppUrl = (o, status, extra) => {
    const a = o.shippingAddress || {};
    const phone = toWhatsAppNumber(a.phone || o.user?.phone);
    if (!phone) return null;

    const name = (a.fullName || o.user?.name || "there").split(" ")[0];

    let message;
    if (status === "shipped") {
      // Both the number and the link when we have them — the link is handy
      // for one tap, but the number itself is what most courier sites and
      // support calls actually ask for.
      const lines = [];
      if (extra?.trackingNumber) {
        lines.push(
          `Tracking number: ${extra.trackingNumber}${extra?.courier ? ` (${extra.courier})` : ""}`
        );
      }
      if (extra?.trackingUrl) lines.push(`Track it here: ${extra.trackingUrl}`);
      const trackLine = lines.length ? `\n${lines.join("\n")}` : "";

      message =
        `\n\nHi ${name}, good news! Your Appealing Apparels order ${ref(o)} has been shipped` +
        `${extra?.courier ? ` via ${extra.courier}` : ""}.${trackLine}\n\nThank you for shopping with us!`;
    } else if (status === "cancelled") {
      message =
        `\n\nHi ${name}, your Appealing Apparels order ${ref(o)} has been cancelled.` +
        `\n\nIf you paid online, your refund will be processed shortly. Sorry for the inconvenience — let us know if you have any questions!`;
    } else if (status === "refunded") {
      message =
        `\n\nHi ${name}, a refund of ${inr(extra?.amount ?? o.amounts?.total)} has been issued for your Appealing Apparels order ${ref(o)}.` +
        `\n\nIt should reflect in your original payment method within 5–7 business days, depending on your bank. Let us know if you have any questions!`;
    } else {
      message =
        `\n\nHi ${name}, your Appealing Apparels order ${ref(o)} has been delivered!` +
        `\n\nWe hope you love it. Thank you for shopping with us!`;
    }

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  /**
   * B / D — move an order along. Shipping opens the dispatch form first;
   * delivering and cancelling open an in-app confirmation dialog first (see
   * confirmAction / ConfirmDialog below) rather than window.confirm — a
   * native confirm() dialog is unreliable at preserving the "trusted user
   * gesture" that WhatsApp's popup needs, especially on mobile Safari, in a
   * way a real in-page dialog isn't.
   */
  const advance = async (o, status, extra = {}) => {
    const id = o.id || o._id;

    if (status === "shipped" && !extra.courier) {
      setShipFor(o);
      return;
    }
    if ((status === "delivered" || status === "cancelled") && !extra.confirmed) {
      setConfirmAction({ order: o, status });
      return;
    }

    // Opened here, as the first thing that happens once we're actually
    // proceeding — still inside whatever real click (the dialog's own
    // confirm button, or the ship form's submit) triggered this call.
    const needsWhatsApp = status === "shipped" || status === "delivered" || status === "cancelled";
    const waWindow = needsWhatsApp ? window.open("", "_blank") : null;

    setBusyId(id);
    try {
      const updated = await updateOrderStatusApi(id, status, extra);
      replaceOrder(updated);
      setShipFor(null);
      setConfirmAction(null);
      if (waWindow) {
        const url = buildStatusWhatsAppUrl(o, status, extra);
        if (url) waWindow.location.href = url;
        else waWindow.close();
      }
    } catch (err) {
      if (waWindow) waWindow.close();
      alert(err?.response?.data?.message || "Couldn't update that order's status.");
    } finally {
      setBusyId("");
    }
  };

  /**
   * Issue a real refund through Razorpay for this order's payment, then mark
   * it refunded. This actually moves money, so confirmation happens via the
   * same in-app ConfirmDialog as delivered/cancelled — not window.confirm —
   * for the same reason: a native dialog isn't reliable at preserving the
   * gesture that opening WhatsApp afterward depends on.
   */
  const refund = async (o) => {
    const id = o.id || o._id;
    const waWindow = window.open("", "_blank");

    setBusyId(id);
    try {
      const updated = await refundOrderApi(id);
      replaceOrder(updated);
      setConfirmAction(null);
      if (waWindow) {
        const amount = updated.refund?.amount ?? o.amounts?.total;
        const url = buildStatusWhatsAppUrl(o, "refunded", { amount });
        if (url) waWindow.location.href = url;
        else waWindow.close();
      }
    } catch (err) {
      if (waWindow) waWindow.close();
      alert(err?.response?.data?.message || "Couldn't issue that refund.");
    } finally {
      setBusyId("");
    }
  };

  /** C — correct courier details after dispatch. */
  const saveShipment = async (o, shipment) => {
    const id = o.id || o._id;
    setBusyId(id);
    try {
      replaceOrder(await updateShipmentApi(id, shipment));
      setShipFor(null);
    } catch (err) {
      alert(err?.response?.data?.message || "Couldn't save those shipping details.");
    } finally {
      setBusyId("");
    }
  };

  /** E — attach a note to the audit trail without changing the status. */
  const addNote = async (o) => {
    const note = window.prompt(`Add a note to order ${ref(o)}:`);
    if (!note || !note.trim()) return;
    try {
      replaceOrder(await addOrderNoteApi(o.id || o._id, note.trim()));
    } catch (err) {
      alert(err?.response?.data?.message || "Couldn't save that note.");
    }
  };

  const [copiedId, setCopiedId] = useState("");
  const [copiedField, setCopiedField] = useState("");
  const copyDetails = async (o) => {
    const a = o.shippingAddress || {};
    const lines = [
      `Order: ${o.orderNumber || String(o.id || o._id)}`,
      `Status: ${o.status}`,
      `Placed: ${fmtTime(o.createdAt)}`,
      "",
      `Customer: ${a.fullName || o.user?.name || "-"}`,
      `Email: ${a.email || o.user?.email || "-"}`,
      `Phone: ${a.phone || o.user?.phone || "-"}`,
      "",
      "Deliver to:",
      `  ${a.line1 || "-"}`,
      `  ${[a.city, a.state, a.postalCode].filter(Boolean).join(", ")}`,
      `  ${a.country || "India"}`,
      "",
      "Items:",
      ...o.items.map(
        (i) => `  - ${i.name}${i.color ? ` [${i.color}]` : ""}${i.size ? ` (${i.size})` : ""} x${i.quantity} — ${inr(i.price * i.quantity)}`
      ),
      "",
      `Subtotal: ${inr(o.amounts?.subtotal)}`,
      `Shipping: ${o.amounts?.shipping ? inr(o.amounts.shipping) : "Free"}`,
      `Total: ${inr(o.amounts?.total)}`,
      o.payment?.razorpayPaymentId ? `Payment ref: ${o.payment.razorpayPaymentId}` : "",
    ]
      .filter((l) => l !== undefined)
      .join("\n");

    try {
      await navigator.clipboard.writeText(lines);
      const id = o.id || o._id;
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? "" : c)), 1800);
    } catch {
      alert("Couldn't copy to clipboard.");
    }
  };

  const copyField = async (key, text) => {
    try {
      await navigator.clipboard.writeText(String(text));
      setCopiedField(key);
      setTimeout(() => setCopiedField((c) => (c === key ? "" : c)), 1500);
    } catch {
      alert("Couldn't copy to clipboard.");
    }
  };

  const deleteOne = async (o) => {
    setMenuId("");
    if (!window.confirm("Delete this pending order? This can't be undone.")) return;
    try {
      await deleteOrderApi(o.id || o._id);
      setOrders((prev) => prev.filter((x) => (x.id || x._id) !== (o.id || o._id)));
    } catch (err) {
      alert(err?.response?.data?.message || "Couldn't delete that order.");
    }
  };

  const clearAllPending = async () => {
    if (!window.confirm("Delete ALL pending (unpaid) orders? This can't be undone.")) return;
    try {
      const { deleted } = await clearPendingOrdersApi();
      setOrders((prev) => prev.filter((x) => x.status !== "pending"));
      alert(`${deleted} pending order(s) deleted.`);
    } catch (err) {
      alert(err?.response?.data?.message || "Couldn't clear pending orders.");
    }
  };

  const openInvoice = async (id) => {
    setMenuId("");
    try {
      await viewInvoice(id);
    } catch {
      alert("Couldn't open that invoice.");
    }
  };

  return (
    <div onClick={() => menuId && setMenuId("")}>
      <div className={ui.pageHead}>
        <div>
          <h1 className={ui.pageTitle}>Orders</h1>
        </div>
        <button
          type="button"
          className={styles.refreshBtn}
          onClick={load}
          disabled={loading}
        >
          <svg
            className={loading ? styles.spinning : ""}
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 4v5h-5" />
          </svg>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className={styles.tabs}>
        {VIEWS.map((v) => {
          const on = view === v.key;
          return (
            <button
              key={v.key}
              className={`${styles.tab} ${on ? styles.tabOn : ""}`}
              onClick={() => {
                setView(v.key);
                setOpenId("");
              }}
            >
              <span className={`${styles.tabIcon} ${styles["c_" + COLOR[v.key]]}`}>
                <Icon name={TAB_ICON[v.key]} size={18} />
              </span>
              {v.label} ({(byStatus[v.key] || []).length})
            </button>
          );
        })}
      </div>

      <div className={styles.searchCard}>
        <span className={styles.searchIcon}>
          <Icon name="search" size={20} sw={2} />
        </span>
        <input
          className={styles.search}
          placeholder="Search by name, email, phone, invoice number or tracking number…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button className={styles.clearBtn} onClick={() => setQuery("")}>
            Clear
          </button>
        )}

        <span className={styles.pinSearchWrap}>
          <span className={styles.searchIcon}>
            <Icon name="pin" size={18} sw={2} />
          </span>
          <input
            className={styles.pinSearch}
            placeholder="PIN code"
            inputMode="numeric"
            maxLength={6}
            value={pinQuery}
            onChange={(e) => setPinQuery(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          {pinQuery && (
            <button className={styles.clearBtn} onClick={() => setPinQuery("")}>
              Clear
            </button>
          )}
        </span>

        <label className={styles.sortWrap}>
          <span className={styles.sortLabel}>Sort by</span>
          <select
            className={styles.sortSelect}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort orders"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className={`${styles.filterBtn} ${showFilters ? styles.filterBtnOn : ""}`}
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
        >
          Filters
          {(from || to) && <span className={styles.filterDot} />}
        </button>

        <span className={styles.count}>
          {shown.length} of {base.length}
        </span>
      </div>

      {showFilters && (
        <div className={styles.filterBar}>
          <label className={styles.filterField}>
            <span className={styles.filterLabel}>Placed from</span>
            <input
              type="date"
              className={styles.sortSelect}
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>

          <label className={styles.filterField}>
            <span className={styles.filterLabel}>Placed to</span>
            <input
              type="date"
              className={styles.sortSelect}
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>

          {(from || to) && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => {
                setFrom("");
                setTo("");
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {view === "pending" && (
        <div className={styles.pendingBar}>
          <p className={styles.note}>
            These checkouts were started but never paid for. They aren't shown to the customer,
            and their status can't be changed.
          </p>
          {base.length > 0 && (
            <button className={`${ui.btn} ${ui.btnDanger}`} onClick={clearAllPending}>
              Delete all pending
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className={ui.empty}>
          <p className={ui.emptyTitle}>Loading…</p>
        </div>
      ) : error ? (
        <div className={ui.empty}>
          <p className={ui.emptyTitle}>{error}</p>
        </div>
      ) : shown.length === 0 ? (
        <div className={ui.empty}>
          <p className={ui.emptyTitle}>
            {query || pinQuery
              ? "No orders match that search."
              : view === "history"
              ? "No order history yet."
              : `No ${VIEWS.find((v) => v.key === view)?.label.toLowerCase()} orders.`}
          </p>
        </div>
      ) : (
        <>
          {view === "history" ? (
            <ul className={styles.historyList}>
              {pageItems.map((o) => {
                const id = o.id || o._id;
                const a = o.shippingAddress || {};
                const negative = o.status === "cancelled" || o.status === "refunded";
                const amount =
                  o.status === "refunded"
                    ? o.refund?.amount ?? o.amounts?.total
                    : o.amounts?.total;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className={styles.historyRow}
                      onClick={() => {
                        setView(o.status);
                        setOpenId(id);
                      }}
                    >
                      <span className={styles.historyDate}>{fmtDate(o.createdAt)}</span>
                      <span className={styles.historyInfo}>
                        <span className={styles.historyOrderNo}>{ref(o)}</span>
                        <span className={styles.historyCustomer}>
                          {a.fullName || o.user?.name || "Customer"}
                        </span>
                      </span>
                      <span className={`${styles.badge} ${styles["b_" + COLOR[o.status]]}`}>
                        {SHORT[o.status] || o.status}
                      </span>
                      <span
                        className={`${styles.historyAmount} ${
                          negative ? styles.historyNeg : styles.historyPos
                        }`}
                      >
                        {negative ? "− " : "+ "}
                        {inr(amount)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
          <div className={styles.orders}>
            {pageItems.map((o) => {
              const id = o.id || o._id;
              const isOpen = openId === id;
              const a = o.shippingAddress || {};
              const color = COLOR[o.status] || "amber";
              const firstImg = o.items?.[0]?.image;
              const itemCount = o.items.reduce((n, i) => n + i.quantity, 0);
              const email = a.email || o.user?.email;
              const phone = a.phone || o.user?.phone;

              const isActive = isOpen || menuId === id || activeId === id;
              const nextSteps = o.status === "pending" ? [] : NEXT_STATUS[o.status] || [];

              return (
                <div
                  className={`${styles.order} ${isActive ? styles.orderOn : ""}`}
                  key={id}
                  aria-selected={isActive}
                  onClick={() => setActiveId(id)}
                >
                  <div className={styles.orderRow}>
                    <div className={styles.thumb}>
                      {firstImg ? (
                        <img src={firstImg} alt="" />
                      ) : (
                        <div className={styles.thumbBlank} />
                      )}
                      {o.items.length > 1 && (
                        <span className={styles.thumbMore}>+{o.items.length - 1}</span>
                      )}
                    </div>

                    <div className={styles.orderBody}>
                      <p className={styles.orderName}>
                        {o.orderNumber || `#${String(id).slice(-6).toUpperCase()}`} —{" "}
                        {a.fullName || o.user?.name || "Customer"}
                      </p>

                      <p className={styles.metaRow}>
                        <Icon name="calendar" size={15} /> {fmtDate(o.createdAt)}
                        <span className={styles.sep}>•</span>
                        <Icon name="box" size={15} /> {itemCount} item(s)
                        <span className={styles.sep}>•</span>
                        <span className={styles.strong}>{inr(o.amounts?.total)}</span>
                      </p>

                      {(email || phone) && (
                        <p className={styles.metaRow}>
                          {email && (
                            <>
                              <Icon name="mail" size={15} /> {email}
                            </>
                          )}
                          {email && phone && <span className={styles.sep}>•</span>}
                          {phone && (
                            <>
                              <Icon name="phone" size={15} /> {phone}
                            </>
                          )}
                        </p>
                      )}

                      <div className={styles.badgeRow}>
                        <span className={`${styles.badge} ${styles["b_" + color]}`}>
                          <Icon name="checkCircle" size={14} sw={2} />
                          {SHORT[o.status] || o.status}
                        </span>
                        {a.postalCode && (
                          <span className={styles.pinBox}>
                            <Icon name="pin" size={14} sw={2} />
                            {a.postalCode}
                          </span>
                        )}
                        {o.status === "shipped" &&
                          o.shipment?.dispatchDate &&
                          a.postalCode &&
                          (() => {
                            const est = estimateDelivery(a.postalCode, o.shipment.dispatchDate);
                            if (!est) return null;
                            const overdueDays = Math.floor(
                              (Date.now() - est.maxDate.getTime()) / 86400000
                            );
                            return overdueDays > 0 ? (
                              <span className={`${styles.etaBox} ${styles.etaOverdue}`}>
                                <Icon name="clock" size={14} sw={2} />
                                {overdueDays === 1 ? "1 day" : `${overdueDays} days`} past expected — check in
                              </span>
                            ) : (
                              <span className={styles.etaBox}>
                                <Icon name="clock" size={14} sw={2} />
                                Expected by {formatShortDate(est.maxDate)}
                              </span>
                            );
                          })()}
                      </div>
                    </div>

                    <div className={styles.actions}>
                      <div className={styles.actionTop}>
                        <span className={`${styles.statusPill} ${styles.pillStatic}`}>
                          <span className={`${styles.pillDot} ${styles["d_" + color]}`} />
                          {SHORT[o.status] || o.status}
                        </span>

                        <div className={styles.menuWrap}>
                          <button
                            className={styles.iconSquare}
                            aria-label="More actions"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuId(menuId === id ? "" : id);
                            }}
                          >
                            <Dots />
                          </button>
                          {menuId === id && (
                            <div className={styles.menu} onClick={(e) => e.stopPropagation()}>
                              {o.status !== "pending" && (
                                <button className={styles.menuItem} onClick={() => openInvoice(id)}>
                                  View invoice
                                </button>
                              )}
                              <button
                                className={styles.menuItem}
                                onClick={() => {
                                  setMenuId("");
                                  copyDetails(o);
                                }}
                              >
                                Copy details
                              </button>
                              {o.status === "pending" && (
                                <button
                                  className={`${styles.menuItem} ${styles.menuDanger}`}
                                  onClick={() => deleteOne(o)}
                                >
                                  Delete order
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {(nextSteps.length > 0 || ["paid", "shipped", "delivered"].includes(o.status)) && (
                        <div className={styles.stepRow}>
                          {nextSteps.map((next) => (
                            <button
                              key={next}
                              className={`${styles.stepBtn} ${
                                next === "cancelled" ? styles.stepCancel : ""
                              }`}
                              disabled={busyId === id}
                              onClick={(e) => {
                                e.stopPropagation();
                                advance(o, next);
                              }}
                            >
                              <Icon
                                name={next === "cancelled" ? "xCircle" : TAB_ICON[next]}
                                size={15}
                                sw={2}
                              />
                              {busyId === id ? "Working…" : ACTION_LABEL[next]}
                            </button>
                          ))}
                          {o.status === "shipped" && o.shipment?.trackingUrl && (
                            <a
                              className={styles.stepBtn}
                              href={o.shipment.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (o.shipment.trackingNumber) {
                                  copyField(`${id}:track`, o.shipment.trackingNumber);
                                }
                              }}
                            >
                              <Icon name="truck" size={15} sw={2} />
                              {copiedField === `${id}:track` ? "Number copied!" : "Track shipment"}
                            </a>
                          )}
                          {["paid", "shipped", "delivered"].includes(o.status) && (
                            <button
                              className={`${styles.stepBtn} ${styles.stepRefund}`}
                              disabled={busyId === id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmAction({ order: o, status: "refund" });
                              }}
                            >
                              <Icon name="refund" size={15} sw={2} />
                              {busyId === id ? "Working…" : "Refund"}
                            </button>
                          )}
                        </div>
                      )}

                      <div className={styles.actionBottom}>
                        <button
                          className={styles.actBtn}
                          onClick={() => setOpenId(isOpen ? "" : id)}
                        >
                          <Icon name="eye" size={16} />
                          {isOpen ? "Hide details" : "View details"}
                        </button>
                        <button className={styles.actBtn} onClick={() => copyDetails(o)}>
                          <Icon name="copy" size={16} />
                          {copiedId === id ? "Copied ✓" : "Copy details"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className={styles.details}>
                      <div className={styles.detailGrid}>
                        <section>
                          <h3 className={styles.detailTitle}>Customer</h3>
                          <div className={styles.copyStack}>
                            <CopyLine value={a.fullName || o.user?.name} label="name" fieldKey={`${id}:name`} copiedField={copiedField} onCopy={copyField} />
                            <CopyLine value={a.email || o.user?.email} label="email" fieldKey={`${id}:email`} muted copiedField={copiedField} onCopy={copyField} />
                            <CopyLine value={a.phone || o.user?.phone} label="phone" fieldKey={`${id}:phone`} muted copiedField={copiedField} onCopy={copyField} />
                          </div>
                        </section>

                        <section>
                          <h3 className={styles.detailTitle}>Deliver to</h3>
                          <div className={styles.copyStack}>
                            <CopyLine value={a.line1} label="address line" fieldKey={`${id}:line1`} copiedField={copiedField} onCopy={copyField} />
                            <CopyLine
                              value={[a.city, a.state].filter(Boolean).join(", ")}
                              label="city and state"
                              fieldKey={`${id}:cs`}
                              muted
                              copiedField={copiedField}
                              onCopy={copyField}
                            />
                            <CopyLine
                              value={a.postalCode}
                              label="PIN code"
                              fieldKey={`${id}:pin`}
                              muted
                              copiedField={copiedField}
                              onCopy={copyField}
                            />
                            <CopyLine value={a.country || "India"} label="country" fieldKey={`${id}:country`} muted copiedField={copiedField} onCopy={copyField} />
                            {(a.line1 || a.city || a.postalCode) && (
                              <button
                                type="button"
                                className={styles.copyAllBtn}
                                onClick={() =>
                                  copyField(
                                    `${id}:fulladdr`,
                                    [
                                      a.fullName || o.user?.name,
                                      a.line1,
                                      [a.city, a.state, a.postalCode].filter(Boolean).join(", "),
                                      a.country || "India",
                                      a.phone || o.user?.phone,
                                    ]
                                      .filter(Boolean)
                                      .join("\n")
                                  )
                                }
                              >
                                {copiedField === `${id}:fulladdr` ? "Address copied ✓" : "Copy full address"}
                              </button>
                            )}
                          </div>
                        </section>

                        <section>
                          <h3 className={styles.detailTitle}>Payment</h3>
                          <div className={styles.copyStack}>
                            <CopyLine
                              value={o.orderNumber || `#${String(id).slice(-6).toUpperCase()}`}
                              label="order number"
                              fieldKey={`${id}:order`}
                              copiedField={copiedField}
                              onCopy={copyField}
                            />
                            <p className={styles.meta}>Status: {o.status}</p>
                            <p className={styles.meta}>Placed: {fmtTime(o.createdAt)}</p>
                            <CopyLine value={o.payment?.razorpayPaymentId} label="payment ref" fieldKey={`${id}:ref`} muted copiedField={copiedField} onCopy={copyField} />
                          </div>
                        </section>
                      </div>

                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Size</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th className={styles.right}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {o.items.map((i, n) => (
                            <tr key={n}>
                              <td>
                                <div className={styles.cell}>
                                  {i.image && <img className={styles.cellImg} src={i.image} alt={i.name} />}
                                  <span>{i.name}{i.color ? ` · ${i.color}` : ""}</span>
                                </div>
                              </td>
                              <td>{i.size || "—"}</td>
                              <td>{i.quantity}</td>
                              <td>{inr(i.price)}</td>
                              <td className={styles.right}>{inr(i.price * i.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className={styles.totals}>
                        <div>
                          <span>Subtotal</span>
                          <span>{inr(o.amounts?.subtotal)}</span>
                        </div>
                        <div>
                          <span>Shipping</span>
                          <span>{o.amounts?.shipping ? inr(o.amounts.shipping) : "Free"}</span>
                        </div>
                        <div className={styles.grand}>
                          <span>Total</span>
                          <span>{inr(o.amounts?.total)}</span>
                        </div>
                      </div>

                      {/* C — dispatch details, once there are any. */}
                      {o.shipment?.trackingNumber && (
                        <section className={styles.shipBox}>
                          <div className={styles.shipHead}>
                            <h3 className={styles.detailTitle}>Shipping</h3>
                            <button
                              type="button"
                              className={styles.actBtn}
                              onClick={() => setShipFor(o)}
                            >
                              Edit
                            </button>
                          </div>
                          <div className={styles.shipGrid}>
                            <CopyLine value={o.shipment.courier} label="courier" fieldKey={`${id}:courier`} copiedField={copiedField} onCopy={copyField} />
                            <CopyLine value={o.shipment.trackingNumber} label="tracking number" fieldKey={`${id}:track`} copiedField={copiedField} onCopy={copyField} />
                            <p className={styles.meta}>
                              Dispatched {o.shipment.dispatchDate ? fmtDate(o.shipment.dispatchDate) : "—"}
                            </p>
                            {o.shipment.trackingUrl && (
                              <a
                                className={styles.trackLink}
                                href={o.shipment.trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Track parcel →
                              </a>
                            )}
                          </div>
                        </section>
                      )}

                      {/* A — every status change, in order. */}
                      {(o.timeline || []).length > 0 && (
                        <section className={styles.timeline}>
                          <h3 className={styles.detailTitle}>Order timeline</h3>
                          <ol className={styles.timeList}>
                            {[...o.timeline]
                              .sort((x, y) => new Date(x.at) - new Date(y.at))
                              .map((t, n) => (
                                <li className={styles.timeItem} key={n}>
                                  <span
                                    className={`${styles.timeDot} ${
                                      styles["d_" + (COLOR[t.status] || "amber")]
                                    }`}
                                  />
                                  <div className={styles.timeBody}>
                                    <p className={styles.timeTitle}>
                                      {SHORT[t.status] || t.status}
                                    </p>
                                    <p className={styles.meta}>
                                      {fmtTime(t.at)} · by {t.byName || "Admin"}
                                    </p>
                                    {t.note && <p className={styles.timeNote}>{t.note}</p>}
                                  </div>
                                </li>
                              ))}
                          </ol>
                        </section>
                      )}

                      {/* E — the wider audit trail. */}
                      <section className={styles.timeline}>
                        <div className={styles.shipHead}>
                          <h3 className={styles.detailTitle}>Activity log</h3>
                          <button
                            type="button"
                            className={styles.actBtn}
                            onClick={() => addNote(o)}
                          >
                            Add note
                          </button>
                        </div>
                        {(o.activity || []).length === 0 ? (
                          <p className={styles.meta}>Nothing recorded yet.</p>
                        ) : (
                          <ul className={styles.logList}>
                            {[...o.activity]
                              .sort((x, y) => new Date(y.at) - new Date(x.at))
                              .map((l, n) => (
                                <li className={styles.logItem} key={n}>
                                  <span className={styles.logAction}>{l.action}</span>
                                  {l.detail && (
                                    <span className={styles.logDetail}>{l.detail}</span>
                                  )}
                                  <span className={styles.meta}>
                                    {fmtTime(l.at)} · {l.byName || "Admin"}
                                  </span>
                                </li>
                              ))}
                          </ul>
                        )}
                      </section>

                      {o.status !== "pending" && (
                        <button className={ui.btn} onClick={() => openInvoice(id)}>
                          View invoice
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}

          <div className={styles.pager}>
            <span className={styles.pagerInfo}>
              <Icon name="info" size={16} />
              Showing {pageItems.length} of {shown.length} orders
            </span>
            <div className={styles.pagerNav}>
              <button
                className={styles.pageArrow}
                disabled={safePage === 1}
                onClick={() => setPage(safePage - 1)}
                aria-label="Previous page"
              >
                <Icon name="chevL" size={16} sw={2} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  className={`${styles.pageNum} ${n === safePage ? styles.pageOn : ""}`}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
              <button
                className={styles.pageArrow}
                disabled={safePage === totalPages}
                onClick={() => setPage(safePage + 1)}
                aria-label="Next page"
              >
                <Icon name="chevR" size={16} sw={2} />
              </button>
            </div>
          </div>
        </>
      )}

      {shipFor && (
        <ShipDialog
          order={shipFor}
          busy={busyId === (shipFor.id || shipFor._id)}
          onCancel={() => setShipFor(null)}
          onSubmit={(form) =>
            shipFor.status === "paid"
              ? advance(shipFor, "shipped", form)
              : saveShipment(shipFor, form)
          }
        />
      )}

      {confirmAction && (
        <ConfirmDialog
          title={
            confirmAction.status === "delivered"
              ? `Mark order ${ref(confirmAction.order)} as delivered?`
              : confirmAction.status === "refund"
              ? `Refund ${inr(confirmAction.order.amounts?.total)} for order ${ref(confirmAction.order)}?`
              : `Cancel order ${ref(confirmAction.order)}?`
          }
          body={
            confirmAction.status === "delivered"
              ? "This is the final step and can't be undone."
              : confirmAction.status === "refund"
              ? "This issues a real refund through Razorpay and can't be undone."
              : "The order will be closed and can't be moved forward again. This can't be undone."
          }
          confirmLabel={
            confirmAction.status === "delivered"
              ? "Mark delivered"
              : confirmAction.status === "refund"
              ? "Refund"
              : "Cancel order"
          }
          busy={busyId === (confirmAction.order.id || confirmAction.order._id)}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() =>
            confirmAction.status === "refund"
              ? refund(confirmAction.order)
              : advance(confirmAction.order, confirmAction.status, { confirmed: true })
          }
        />
      )}
    </div>
  );
}

/**
 * In-app replacement for window.confirm — used for Mark delivered / Cancel
 * order specifically because a native confirm() dialog doesn't reliably
 * preserve the "trusted user gesture" that opening the WhatsApp tab right
 * after depends on. This dialog's own Confirm button is a real click, so
 * everything triggered from it (including window.open) stays inside a
 * gesture every browser trusts — the same reason the Ship dialog's flow
 * never had this problem.
 */
function ConfirmDialog({ title, body, confirmLabel, busy, onCancel, onConfirm }) {
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div
        className={styles.modalCard}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={styles.modalTitle}>{title}</h2>
        <p className={styles.modalSub}>{body}</p>
        <div className={styles.modalActions}>
          <button type="button" className={ui.btnGhost} onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={ui.btn} onClick={onConfirm} disabled={busy}>
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * C — dispatch details. Courier, tracking number and dispatch date are all
 * required before an order can be recorded as shipped; the server enforces the
 * same rule, so this can't be side-stepped.
 */
function ShipDialog({ order, busy, onCancel, onSubmit }) {
  const existing = order.shipment || {};
  const editing = order.status !== "paid";

  const [courier, setCourier] = useState(existing.courier || "");
  const [trackingNumber, setTracking] = useState(existing.trackingNumber || "");
  const [dispatchDate, setDispatch] = useState(
    existing.dispatchDate
      ? new Date(existing.dispatchDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [trackingUrl, setUrl] = useState(existing.trackingUrl || "");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const submit = () => {
    const missing = [];
    if (!courier.trim()) missing.push("courier name");
    if (!trackingNumber.trim()) missing.push("tracking number");
    if (!dispatchDate) missing.push("dispatch date");
    if (missing.length) {
      setErr(`Please fill in the ${missing.join(", ")}.`);
      return;
    }
    setErr("");
    onSubmit({
      courier: courier.trim(),
      trackingNumber: trackingNumber.trim(),
      dispatchDate,
      trackingUrl: trackingUrl.trim(),
      ...(editing ? {} : { note: note.trim() }),
    });
  };

  const ref =
    order.orderNumber || `#${String(order.id || order._id).slice(-6).toUpperCase()}`;

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div
        className={styles.modalCard}
        role="dialog"
        aria-modal="true"
        aria-label="Shipping details"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={styles.modalTitle}>
          {editing ? "Edit shipping details" : "Mark as shipped"}
        </h2>
        <p className={styles.modalSub}>
          Order {ref} · {order.shippingAddress?.fullName || order.user?.name || "Customer"}
        </p>

        {err && <p className={styles.modalErr}>{err}</p>}

        <label className={styles.modalField}>
          <span className={styles.filterLabel}>Courier name *</span>
          <input
            className={styles.sortSelect}
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            placeholder="Delhivery, Blue Dart, India Post…"
            autoFocus
          />
        </label>

        <label className={styles.modalField}>
          <span className={styles.filterLabel}>Tracking number *</span>
          <input
            className={styles.sortSelect}
            value={trackingNumber}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="e.g. 1234567890"
          />
        </label>

        <label className={styles.modalField}>
          <span className={styles.filterLabel}>Dispatch date *</span>
          <input
            type="date"
            className={styles.sortSelect}
            value={dispatchDate}
            onChange={(e) => setDispatch(e.target.value)}
          />
        </label>

        <label className={styles.modalField}>
          <span className={styles.filterLabel}>Tracking link (optional)</span>
          <input
            className={styles.sortSelect}
            value={trackingUrl}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
          />
        </label>

        {!editing && (
          <label className={styles.modalField}>
            <span className={styles.filterLabel}>Note (optional)</span>
            <input
              className={styles.sortSelect}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything worth recording against this dispatch"
            />
          </label>
        )}

        <div className={styles.modalActions}>
          <button className={`${ui.btn} ${ui.btnGhost}`} onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className={ui.btn} onClick={submit} disabled={busy}>
            {busy ? "Saving…" : editing ? "Save details" : "Confirm shipped"}
          </button>
        </div>
      </div>
    </div>
  );
}
