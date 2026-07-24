import { useEffect, useMemo, useState } from "react";
import {
  fetchAllOrders,
  updateOrderStatusApi,
  updateShipmentApi,
  addOrderNoteApi,
  viewInvoice,
  deleteOrderApi,
  clearPendingOrdersApi,
} from "../../api/ordersApi";
import ui from "../admin.module.css";
import styles from "./AdminOrders.module.css";

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
};
/** Badge colours, per spec: Paid blue, Shipped orange, Delivered green, Cancelled red. */
const COLOR = {
  paid: "blue",
  shipped: "orange",
  delivered: "green",
  cancelled: "red",
  pending: "amber",
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
  pending: "clock",
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

const PAYMENT_FILTERS = [
  { key: "all", label: "All payments" },
  { key: "captured", label: "Captured" },
  { key: "created", label: "Not captured" },
  { key: "refunded", label: "Refunded" },
  { key: "failed", label: "Failed" },
];

const VIEWS = [
  { key: "paid", label: "Paid" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "pending", label: "Pending / unpaid" },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [view, setView] = useState("paid");
  const [sort, setSort] = useState("newest");
  const [openId, setOpenId] = useState("");
  const [activeId, setActiveId] = useState("");
  const [menuId, setMenuId] = useState("");
  const [page, setPage] = useState(1);

  // H — extra filters beyond the status tabs.
  const [payFilter, setPayFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // C — the dispatch form that has to be filled in before shipping.
  const [shipFor, setShipFor] = useState(null);
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
  }, [view, query, sort, payFilter, from, to]);

  const byStatus = useMemo(() => {
    const b = { paid: [], shipped: [], delivered: [], cancelled: [], pending: [] };
    orders.forEach((o) => {
      if (b[o.status]) b[o.status].push(o);
    });
    return b;
  }, [orders]);

  const base = byStatus[view] || [];
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    let list = base;

    // G — customer name, email, phone, invoice/order number and tracking number.
    if (q) {
      list = list.filter((o) => {
        const a = o.shippingAddress || {};
        return [
          o.orderNumber,
          o.user?.name,
          o.user?.email,
          o.user?.phone,
          a.fullName,
          a.email,
          a.phone,
          o.shipment?.trackingNumber,
          o.shipment?.courier,
          o.payment?.razorpayPaymentId,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      });
    }

    if (payFilter !== "all") {
      list = list.filter((o) => (o.payment?.status || "created") === payFilter);
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
  }, [base, q, payFilter, from, to]);

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
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = (d) => d && new Date(d) >= today;

    // "Today" means the day the status actually moved, read off the timeline.
    const movedToday = (o, status) =>
      (o.timeline || []).some((t) => t.status === status && isToday(t.at));

    const live = orders.filter((o) => o.status !== "pending");
    return {
      total: live.length,
      paid: live.filter((o) => o.status === "paid").length,
      shippedToday: live.filter((o) => movedToday(o, "shipped")).length,
      deliveredToday: live.filter((o) => movedToday(o, "delivered")).length,
      cancelled: live.filter((o) => o.status === "cancelled").length,
      revenue: live
        .filter((o) => o.status !== "cancelled")
        .reduce((n, o) => n + Number(o.amounts?.total || 0), 0),
    };
  }, [orders]);

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

  /**
   * B / D — move an order along. Shipping opens the dispatch form first;
   * delivering and cancelling ask for confirmation, since neither can be undone.
   */
  const advance = async (o, status, extra = {}) => {
    const id = o.id || o._id;

    if (status === "shipped" && !extra.courier) {
      setShipFor(o);
      return;
    }

    if (status === "delivered") {
      if (
        !window.confirm(
          `Mark order ${ref(o)} as delivered?\n\nThis is the final step and can't be undone.`
        )
      )
        return;
    }

    if (status === "cancelled") {
      if (
        !window.confirm(
          `Cancel order ${ref(o)}?\n\nThe order will be closed and can't be moved forward again. This can't be undone.`
        )
      )
        return;
    }

    setBusyId(id);
    try {
      replaceOrder(await updateOrderStatusApi(id, status, extra));
      setShipFor(null);
    } catch (err) {
      alert(err?.response?.data?.message || "Couldn't update that order's status.");
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
        (i) => `  - ${i.name}${i.size ? ` (${i.size})` : ""} x${i.quantity} — ${inr(i.price * i.quantity)}`
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

  const resetFilters = () => {
    setQuery("");
    setView("paid");
    setSort("newest");
    setPayFilter("all");
    setFrom("");
    setTo("");
    setOpenId("");
    setActiveId("");
    setMenuId("");
    setPage(1);
    load();
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
          <p className={ui.pageSub}>
            {orders.length - byStatus.pending.length} orders • {byStatus.pending.length} unpaid
          </p>
        </div>
        <div className={ui.headActions}>
          <button className={`${ui.btn} ${ui.btnGhost}`} onClick={resetFilters}>
            <Icon name="refresh" size={16} sw={2} />
            Reset
          </button>
          <button
            className={ui.btn}
            onClick={() =>
              alert("Manual order entry will arrive with the Shiprocket step. For now, orders are created at checkout.")
            }
          >
            <Icon name="plus" size={16} sw={2.4} />
            Add order
          </button>
        </div>
      </div>

      <div className={styles.stats}>
        {[
          { key: "total", label: "Total orders", value: stats.total, tone: "slate", icon: "box" },
          { key: "paid", label: "Paid orders", value: stats.paid, tone: "blue", icon: "wallet" },
          { key: "shipped", label: "Shipped today", value: stats.shippedToday, tone: "orange", icon: "truck" },
          { key: "delivered", label: "Delivered today", value: stats.deliveredToday, tone: "green", icon: "checkCircle" },
          { key: "cancelled", label: "Cancelled orders", value: stats.cancelled, tone: "red", icon: "xCircle" },
          { key: "revenue", label: "Total revenue", value: inr(stats.revenue), tone: "green", icon: "wallet" },
        ].map((c) => (
          <div className={`${styles.stat} ${styles["s_" + c.tone]}`} key={c.key}>
            <span className={styles.statIcon}>
              <Icon name={c.icon} size={18} />
            </span>
            <div className={styles.statBody}>
              <span className={styles.statValue}>{c.value}</span>
              <span className={styles.statLabel}>{c.label}</span>
            </div>
          </div>
        ))}
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
          {(payFilter !== "all" || from || to) && <span className={styles.filterDot} />}
        </button>

        <span className={styles.count}>
          {shown.length} of {base.length}
        </span>
      </div>

      {showFilters && (
        <div className={styles.filterBar}>
          <label className={styles.filterField}>
            <span className={styles.filterLabel}>Payment status</span>
            <select
              className={styles.sortSelect}
              value={payFilter}
              onChange={(e) => setPayFilter(e.target.value)}
            >
              {PAYMENT_FILTERS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>

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

          {(payFilter !== "all" || from || to) && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => {
                setPayFilter("all");
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
            {query
              ? "No orders match that search."
              : `No ${VIEWS.find((v) => v.key === view)?.label.toLowerCase()} orders.`}
          </p>
        </div>
      ) : (
        <>
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

                      <span className={`${styles.badge} ${styles["b_" + color]}`}>
                        <Icon name="checkCircle" size={14} sw={2} />
                        {SHORT[o.status] || o.status}
                      </span>
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

                      {nextSteps.length > 0 && (
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
                              value={[a.city, a.state, a.postalCode].filter(Boolean).join(", ")}
                              label="city, state and PIN"
                              fieldKey={`${id}:csp`}
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
                                  <span>{i.name}</span>
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
