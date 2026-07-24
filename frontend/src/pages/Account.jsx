import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateMeApi } from "../api/authApi";
import {
  fetchAddresses,
  addAddressApi,
  updateAddressApi,
  setDefaultAddressApi,
  deleteAddressApi,
} from "../api/addressApi";
import { fetchMyOrders, downloadInvoice } from "../api/ordersApi";
import {
  fetchMyThreads,
  fetchMyThread,
  startMyThread,
  sendMyMessage,
} from "../api/supportApi";
import { fetchMyReviewableOrders } from "../api/reviewsApi";
import ReviewDialog from "../components/ReviewDialog";
import { Stars } from "../components/StarRating";
import { useSettings } from "../context/SettingsContext";
import BackButton from "../components/BackButton";
import { lookupPincode } from "../utils/pincode";
import { getCurrentCoords, reverseGeocode } from "../utils/geolocation";
import styles from "./Account.module.css";

const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const telHref = (p) => `tel:${String(p).replace(/[^\d+]/g, "")}`;

/** Pre-written questions offered against each order in Help & support. */
const QUICK_QUESTIONS = [
  "Issue with this item",
  "Did not get the item",
  "Return or exchange item",
  "Other issue",
];
const TABS = ["Profile", "Addresses", "Orders", "Help"];

/** The journey an order travels; used for the tracker. */
const STEPS = ["paid", "shipped", "delivered"];
const STEP_LABEL = {
  paid: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
};

const BLANK = {
  label: "Home",
  fullName: "",
  phone: "",
  line1: "",
  city: "",
  state: "",
  postalCode: "",
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function Account() {
  const { isAuthenticated, user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const initialTab = TABS.includes(params.get("tab")) ? params.get("tab") : "Profile";
  const [tab, setTab] = useState(initialTab);
  // Set when an order card starts a chat, so Help opens that thread.
  const [openThreadId, setOpenThreadId] = useState("");

  const selectTab = (t) => {
    setTab(t);
    setParams({ tab: t }, { replace: true });
  };

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.head}>
          <BackButton />
          <h1 className={styles.title}>My account</h1>
        </div>

        <div className={styles.layout}>
          <nav className={styles.tabs} aria-label="Account sections">
            {TABS.map((t) => (
              <button
                key={t}
                className={`${styles.tab} ${tab === t ? styles.tabOn : ""}`}
                onClick={() => selectTab(t)}
              >
                {t}
              </button>
            ))}
            <button
              className={`${styles.tab} ${styles.logout}`}
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Log out
            </button>
          </nav>

          <div className={styles.panel}>
            {tab === "Profile" && <Profile user={user} setUser={setUser} />}
            {tab === "Addresses" && <Addresses user={user} />}
            {tab === "Orders" && (
              <Orders
                onOpenHelp={(threadId) => {
                  setOpenThreadId(threadId || "");
                  selectTab("Help");
                }}
              />
            )}
            {tab === "Help" && (
              <Help
                openThreadId={openThreadId}
                onConsumeOpen={() => setOpenThreadId("")}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/* ---------------- Profile ---------------- */

function Profile({ user, setUser }) {
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
  }, [user]);

  const save = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (!name.trim()) {
      setErr("Please enter your name.");
      return;
    }
    setBusy(true);
    try {
      const updated = await updateMeApi({ name: name.trim(), phone: phone.trim() });
      setUser?.(updated);
      setMsg("Your details have been saved.");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Couldn't save your details.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>My details</h2>

      {err && <p className={styles.error}>{err}</p>}
      {msg && <p className={styles.ok}>{msg}</p>}

      <form className={styles.form} onSubmit={save}>
        <label className={styles.field}>
          <span>Name</span>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span>Email</span>
          <input className={styles.input} value={user?.email || ""} disabled />
          <small className={styles.hint}>
            Your email is how you sign in, so it can't be changed here.
          </small>
        </label>

        <label className={styles.field}>
          <span>Phone</span>
          <input
            className={styles.input}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>

        <button className={styles.primary} type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
      </form>
    </section>
  );
}

/* ---------------- Addresses ---------------- */

function Addresses({ user }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(BLANK);
  const [editingId, setEditingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetchAddresses()
      .then(setList)
      .catch(() => setErr("Couldn't load your addresses."))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Typing a valid 6-digit PIN code automatically fills in city + state.
  useEffect(() => {
    const pin = form.postalCode.trim();
    if (!/^\d{6}$/.test(pin)) return;
    let active = true;
    lookupPincode(pin)
      .then((info) => {
        if (active && info) {
          setForm((f) => ({ ...f, city: info.city, state: info.state }));
        }
      })
      .catch(() => {
        /* silent — the person can still type city/state by hand */
      });
    return () => {
      active = false;
    };
  }, [form.postalCode]);

  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  const useCurrentLocation = async () => {
    setLocError("");
    setLocating(true);
    try {
      const { lat, lng } = await getCurrentCoords();
      const { postalCode, line1 } = await reverseGeocode(lat, lng);
      if (!postalCode) {
        throw new Error("Couldn't determine your PIN code from this location.");
      }
      set("postalCode", postalCode);
      if (line1 && !form.line1.trim()) set("line1", line1);
      const info = await lookupPincode(postalCode);
      if (info) {
        setForm((f) => ({ ...f, city: info.city, state: info.state }));
      }
    } catch (err) {
      setLocError(err.message || "Couldn't get your location.");
    } finally {
      setLocating(false);
    }
  };

  const openNew = () => {
    setForm({ ...BLANK, fullName: user?.name || "", phone: user?.phone || "" });
    setEditingId("");
    setShowForm(true);
    setLocError("");
  };

  const openEdit = (a) => {
    setForm({
      label: a.label || "Home",
      fullName: a.fullName,
      phone: a.phone,
      line1: a.line1,
      city: a.city,
      state: a.state,
      postalCode: a.postalCode,
    });
    setEditingId(a._id);
    setShowForm(true);
    setLocError("");
  };

  const save = async (e) => {
    e.preventDefault();
    setErr("");
    if (!form.label.trim()) form.label = "Home";
    const missing = ["fullName", "phone", "line1", "city", "state", "postalCode"].filter(
      (k) => !form[k].trim()
    );
    if (missing.length) {
      setErr("Please fill in every field.");
      return;
    }
    setBusy(true);
    try {
      const next = editingId
        ? await updateAddressApi(editingId, form)
        : await addAddressApi(form);
      setList(next);
      setShowForm(false);
      setEditingId("");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Couldn't save that address.");
    } finally {
      setBusy(false);
    }
  };

  const makeDefault = async (id) => {
    try {
      setList(await setDefaultAddressApi(id));
    } catch {
      setErr("Couldn't update your default address.");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      setList(await deleteAddressApi(id));
    } catch {
      setErr("Couldn't delete that address.");
    }
  };

  return (
    <section className={styles.card}>
      <div className={styles.cardHead}>
        <h2 className={styles.cardTitle}>Saved addresses</h2>
        {!showForm && (
          <button className={styles.linkBtn} onClick={openNew}>
            Add new
          </button>
        )}
      </div>

      {err && <p className={styles.error}>{err}</p>}

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : (
        <>
          {list.length === 0 && !showForm && (
            <p className={styles.muted}>
              You haven't saved an address yet. Add one and it'll be ready at
              checkout.
            </p>
          )}

          {list.map((a) => (
            <div className={styles.addr} key={a._id}>
              <div className={styles.addrTop}>
                <span className={styles.tag}>{a.label || "Home"}</span>
                {a.isDefault && <span className={styles.defaultTag}>Default</span>}
              </div>
              <p className={styles.addrName}>{a.fullName}</p>
              <p className={styles.addrLine}>
                {a.line1}, {a.city}, {a.state} — {a.postalCode}
              </p>
              <p className={styles.addrMob}>Mob: {a.phone}</p>

              <div className={styles.addrActions}>
                {!a.isDefault && (
                  <button className={styles.linkBtn} onClick={() => makeDefault(a._id)}>
                    Set as default
                  </button>
                )}
                <button className={styles.linkBtn} onClick={() => openEdit(a)}>
                  Edit
                </button>
                <button
                  className={`${styles.linkBtn} ${styles.danger}`}
                  onClick={() => remove(a._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {showForm && (
            <form className={styles.form} onSubmit={save}>
              <h3 className={styles.formTitle}>
                {editingId ? "Edit address" : "Add a new address"}
              </h3>

              <button
                type="button"
                className={styles.locateBtn}
                onClick={useCurrentLocation}
                disabled={locating}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                {locating ? "Finding your location…" : "Use my current location"}
              </button>
              {locError && <p className={styles.locError}>{locError}</p>}

              <div className={styles.fields}>
                <label className={styles.field}>
                  <span>Full name*</span>
                  <input
                    className={styles.input}
                    value={form.fullName}
                    onChange={(e) => set("fullName", e.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span>Phone*</span>
                  <input
                    className={styles.input}
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </label>
                <label className={`${styles.field} ${styles.wide}`}>
                  <span>Address*</span>
                  <input
                    className={styles.input}
                    value={form.line1}
                    onChange={(e) => set("line1", e.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span>PIN code*</span>
                  <input
                    className={styles.input}
                    inputMode="numeric"
                    maxLength={6}
                    value={form.postalCode}
                    onChange={(e) => set("postalCode", e.target.value.replace(/\D/g, ""))}
                    placeholder="6-digit PIN"
                  />
                </label>
                <label className={styles.field}>
                  <span>City*</span>
                  <input
                    className={styles.input}
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="Auto-filled from PIN code"
                  />
                </label>
                <label className={styles.field}>
                  <span>State*</span>
                  <input
                    className={styles.input}
                    value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                    placeholder="Auto-filled from PIN code"
                  />
                </label>
                <label className={styles.field}>
                  <span>Save as</span>
                  <div className={styles.labelPick}>
                    {["Home", "Work", "Custom"].map((opt) => {
                      const isCustom = opt === "Custom";
                      const active = isCustom
                        ? form.label !== "Home" && form.label !== "Work"
                        : form.label === opt;
                      return (
                        <button
                          type="button"
                          key={opt}
                          className={`${styles.labelChip} ${active ? styles.labelChipOn : ""}`}
                          onClick={() => set("label", isCustom ? "" : opt)}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {form.label !== "Home" && form.label !== "Work" && (
                    <input
                      className={styles.input}
                      style={{ marginTop: 8 }}
                      placeholder="Name this address (e.g. Mom's place)"
                      value={form.label}
                      onChange={(e) => set("label", e.target.value)}
                    />
                  )}
                </label>
              </div>

              <div className={styles.formActions}>
                <button className={styles.primary} type="submit" disabled={busy}>
                  {busy ? "Saving…" : "Save address"}
                </button>
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => {
                    setShowForm(false);
                    setEditingId("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </section>
  );
}

/* ---------------- Orders + tracking ---------------- */

function Orders({ onOpenHelp }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  // Which delivered lines already carry a rating, so the card can say so.
  const [reviewable, setReviewable] = useState({});

  const loadReviewable = () =>
    fetchMyReviewableOrders()
      .then((list) => {
        const map = {};
        (list || []).forEach((o) => (map[o.id] = o));
        setReviewable(map);
      })
      .catch(() => {});

  useEffect(() => {
    fetchMyOrders()
      .then(setOrders)
      .catch(() => setErr("Couldn't load your orders."))
      .finally(() => setLoading(false));
    loadReviewable();
  }, []);

  if (loading) return <p className={styles.muted}>Loading your orders…</p>;
  if (err) return <p className={styles.error}>{err}</p>;

  if (!orders.length) {
    return (
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Order history</h2>
        <p className={styles.muted}>You haven't placed an order yet.</p>
        <Link to="/shop" className={styles.primaryLink}>
          Start shopping
        </Link>
      </section>
    );
  }

  return (
    <div className={styles.orders}>
      {orders.map((o) => (
        <OrderCard
          key={o.id || o._id}
          order={o}
          onOpenHelp={onOpenHelp}
          reviewable={reviewable[o.id || o._id]}
          onReviewed={loadReviewable}
        />
      ))}
    </div>
  );
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.2a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.7-.9 1.3v.4" />
      <path d="M12 16.6h.01" />
    </svg>
  );
}

function OrderCard({ order, onOpenHelp, reviewable, onReviewed }) {
  const cancelled = order.status === "cancelled";
  const delivered = order.status === "delivered";
  const stepIndex = STEPS.indexOf(order.status);
  const id = order.id || order._id;

  const [helpOpen, setHelpOpen] = useState(false);
  const [sending, setSending] = useState("");
  const [sent, setSent] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);

  const ref =
    order.orderNumber || `#${String(id).slice(-8).toUpperCase()}`;

  /** Opens (or reuses) a conversation about this order with the question in it. */
  const ask = async (question) => {
    setSending(question);
    try {
      const first = order.items?.[0]?.name;
      const extra =
        order.items?.length > 1 ? ` and ${order.items.length - 1} more item(s)` : "";
      const thread = await startMyThread({
        topic: "order",
        orderId: id,
        orderNumber: ref,
        body: `${question} — Order ${ref}${
          first ? ` (${first}${extra})` : ""
        }, placed ${fmtDate(order.createdAt)}.`,
      });
      setSent(question);
      setTimeout(() => {
        setHelpOpen(false);
        setSent("");
        onOpenHelp?.(thread.id);
      }, 700);
    } catch {
      alert("Couldn't start that chat just now. Please try again.");
    } finally {
      setSending("");
    }
  };

  // Lines from this order that can still be rated, plus any already rated.
  const reviewItems = (reviewable?.items || []).map((i) => ({ ...i }));
  const rated = reviewItems.filter((i) => i.reviewed);
  const ratedCount = rated.length;
  const myAverage = ratedCount
    ? rated.reduce((n, i) => n + i.rating, 0) / ratedCount
    : 0;

  return (
    <section className={styles.card}>
      <div className={styles.orderHead}>
        <div>
          <p className={styles.orderId}>
            {order.orderNumber
              ? `Order ${order.orderNumber}`
              : `Order #${String(id).slice(-8).toUpperCase()}`}
          </p>
          <p className={styles.muted}>Placed on {fmtDate(order.createdAt)}</p>
        </div>
        <div className={styles.orderHeadRight}>
          <span
            className={`${styles.status} ${cancelled ? styles.statusBad : ""}`}
          >
            {cancelled ? "Cancelled" : STEP_LABEL[order.status] || order.status}
          </span>
          <div className={styles.helpWrap}>
            <button
              type="button"
              className={`${styles.helpBtn} ${helpOpen ? styles.helpBtnOn : ""}`}
              onClick={() => setHelpOpen((o) => !o)}
              aria-expanded={helpOpen}
              aria-label="Get help with this order"
              title="Get help with this order"
            >
              <HelpIcon />
              Need help?
            </button>

            {helpOpen && (
              <div className={styles.helpMenu} role="dialog" aria-label="Help with this order">
                <p className={styles.helpMenuTitle}>What do you need help with?</p>
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className={styles.helpItem}
                    disabled={!!sending}
                    onClick={() => ask(q)}
                  >
                    {sent === q ? "Sent ✓" : sending === q ? "Sending…" : q}
                  </button>
                ))}
                <button
                  type="button"
                  className={styles.helpChatLink}
                  onClick={() => {
                    setHelpOpen(false);
                    onOpenHelp?.();
                  }}
                >
                  View my chats
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!cancelled && (
        <div className={styles.track}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`${styles.step} ${i <= stepIndex ? styles.stepOn : ""}`}
            >
              <span className={styles.dot} aria-hidden="true" />
              <span className={styles.stepLabel}>{STEP_LABEL[s]}</span>
            </div>
          ))}
        </div>
      )}

      <ul className={styles.orderItems}>
        {(order.items || []).map((i, n) => (
          <li key={n} className={styles.orderItem}>
            <span>
              {i.name}
              {i.size ? ` · ${i.size}` : ""} × {i.quantity}
            </span>
            <span>{inr(i.price * i.quantity)}</span>
          </li>
        ))}
      </ul>

      <div className={styles.orderTotal}>
        <span>Total paid</span>
        <span>{inr(order.amounts?.total ?? 0)}</span>
      </div>

      {order.shippingAddress && (
        <p className={styles.muted}>
          Delivering to {order.shippingAddress.fullName}, {order.shippingAddress.line1},{" "}
          {order.shippingAddress.city} — {order.shippingAddress.postalCode}
        </p>
      )}

      {delivered && reviewItems.length > 0 && (
        <div className={styles.reviewRow}>
          <div>
            <p className={styles.reviewRowTitle}>
              {ratedCount === reviewItems.length
                ? "Thanks for rating this order"
                : "Rate & review this order"}
              {ratedCount > 0 && (
                <Stars value={myAverage} size={15} className={styles.rowStars} />
              )}
            </p>
            <p className={styles.muted}>
              {ratedCount
                ? `${ratedCount} of ${reviewItems.length} item(s) rated.`
                : "Tell other shoppers how it fits — completely optional."}
            </p>
          </div>
          <button
            type="button"
            className={styles.reviewBtn}
            onClick={() => setReviewOpen(true)}
          >
            {ratedCount ? "Edit review" : "Rate & review"}
          </button>
        </div>
      )}

      <button
        className={styles.invoiceBtn}
        onClick={async () => {
          try {
            await downloadInvoice(id, order.orderNumber);
          } catch {
            alert("Couldn't download that invoice. Please try again.");
          }
        }}
      >
        Download invoice
      </button>

      {reviewOpen && (
        <ReviewDialog
          order={{
            orderId: id,
            orderNumber: order.orderNumber,
            items: reviewItems,
          }}
          title="Rate & review"
          subtitle={`Order ${ref} — rate any of the items below. Writing a review is optional.`}
          onClose={() => setReviewOpen(false)}
          onSaved={onReviewed}
        />
      )}
    </section>
  );
}

/* ---------------- Help / chat with the store ---------------- */

/* ------------------------------------------------------------------ Help --
 * Three views: the list of conversations, the "start a new one" composer, and
 * an open thread. `openThreadId` lets other parts of the page (the order cards)
 * drop the customer straight into a specific conversation.
 * -------------------------------------------------------------------------*/

const fmtWhen = (d) =>
  new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

function Help({ openThreadId, onConsumeOpen }) {
  const { footer } = useSettings();
  const phone = footer?.phone;

  const [view, setView] = useState("list"); // list | new | thread
  const [threads, setThreads] = useState([]);
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const loadThreads = () =>
    fetchMyThreads()
      .then(setThreads)
      .catch(() => setErr("Couldn't load your conversations."))
      .finally(() => setLoading(false));

  useEffect(() => {
    loadThreads();
  }, []);

  // Arriving from an order card's help button.
  useEffect(() => {
    if (!openThreadId) return;
    openThread(openThreadId);
    onConsumeOpen?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openThreadId]);

  const openThread = async (id) => {
    setErr("");
    try {
      const t = await fetchMyThread(id);
      setThread(t);
      setView("thread");
    } catch {
      setErr("Couldn't open that conversation.");
    }
  };

  const backToList = () => {
    setThread(null);
    setView("list");
    loadThreads();
  };

  return (
    <section className={styles.card}>
      <div className={styles.helpHead}>
        <div>
          <h2 className={styles.cardTitle}>Help &amp; support</h2>
          <p className={styles.muted}>
            {view === "list"
              ? "Every conversation you've had with us, and a place to start a new one."
              : view === "new"
              ? "Tell us what you need help with."
              : thread?.subject}
          </p>
        </div>

        {view === "list" ? (
          <button
            type="button"
            className={styles.newChatBtn}
            onClick={() => {
              setErr("");
              setView("new");
            }}
          >
            <PlusIcon />
            New chat
          </button>
        ) : (
          <button type="button" className={styles.backLink} onClick={backToList}>
            ← All chats
          </button>
        )}
      </div>

      {err && <p className={styles.error}>{err}</p>}

      {view === "list" && (
        <ThreadList
          threads={threads}
          loading={loading}
          onOpen={openThread}
          onStart={() => setView("new")}
        />
      )}

      {view === "new" && (
        <NewChat
          onStarted={(t) => {
            setThread(t);
            setView("thread");
            loadThreads();
          }}
          onCancel={backToList}
        />
      )}

      {view === "thread" && thread && (
        <ThreadView thread={thread} setThread={setThread} />
      )}

      {phone && (
        <div className={styles.callRow}>
          <div className={styles.callText}>
            <p className={styles.callTitle}>Prefer to talk it through?</p>
            <p className={styles.muted}>Call us and we'll sort it out on the spot.</p>
          </div>
          <a className={styles.callBtn} href={telHref(phone)}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 4h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 2 6a2 2 0 0 1 2-2z" />
            </svg>
            {phone}
          </a>
        </div>
      )}
    </section>
  );
}

/** The customer's conversations, newest first. */
function ThreadList({ threads, loading, onOpen, onStart }) {
  if (loading) return <p className={styles.muted}>Loading…</p>;

  if (threads.length === 0) {
    return (
      <div className={styles.helpEmpty}>
        <p className={styles.helpEmptyTitle}>No conversations yet</p>
        <p className={styles.muted}>
          Start a chat about an order, a product, or anything else you'd like to
          ask.
        </p>
        <button type="button" className={styles.newChatBtn} onClick={onStart}>
          <PlusIcon />
          Start a new chat
        </button>
      </div>
    );
  }

  return (
    <ul className={styles.threadList}>
      {threads.map((t) => (
        <li key={t.id}>
          <button
            type="button"
            className={styles.threadRow}
            onClick={() => onOpen(t.id)}
          >
            <span className={`${styles.threadIcon} ${styles[`topic${t.topic}`]}`}>
              {t.productImage ? (
                <img src={t.productImage} alt="" />
              ) : (
                <TopicIcon topic={t.topic} />
              )}
            </span>

            <span className={styles.threadMain}>
              <span className={styles.threadTop}>
                <span className={styles.threadSubject}>{t.subject}</span>
                {t.unread > 0 && <span className={styles.threadUnread}>{t.unread} new</span>}
                {t.status === "closed" && (
                  <span className={styles.threadClosed}>Closed</span>
                )}
              </span>
              {t.lastMessage && (
                <span className={styles.threadPreview}>
                  {t.lastMessage.from === "user" ? "You: " : ""}
                  {t.lastMessage.body}
                </span>
              )}
              <span className={styles.threadWhen}>
                {fmtWhen(t.lastMessageAt)} · {t.messageCount} message
                {t.messageCount === 1 ? "" : "s"}
              </span>
            </span>

            <span className={styles.threadChev}>›</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/**
 * Start a conversation: pick what it's about, then either tap a pre-written
 * question or type your own.
 */
function NewChat({ onStarted, onCancel }) {
  const [about, setAbout] = useState(""); // "" | order | product | general
  const [orders, setOrders] = useState([]);
  const [picked, setPicked] = useState(null); // order or product line
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetchMyOrders()
      .then((list) => setOrders((list || []).filter((o) => o.status !== "pending")))
      .catch(() => {});
  }, []);

  // Every distinct product the customer has actually bought.
  const products = useMemo(() => {
    const map = new Map();
    orders.forEach((o) =>
      (o.items || []).forEach((i) => {
        if (!i.product || map.has(String(i.product))) return;
        map.set(String(i.product), {
          product: String(i.product),
          name: i.name,
          image: i.image,
        });
      })
    );
    return [...map.values()];
  }, [orders]);

  const start = async (body) => {
    const message = String(body || "").trim();
    if (!message || busy) return;
    setBusy(true);
    setErr("");
    try {
      const payload = { body: message, topic: about || "general" };

      if (about === "order" && picked) {
        payload.orderId = picked.id || picked._id;
        payload.orderNumber =
          picked.orderNumber ||
          `#${String(picked.id || picked._id).slice(-8).toUpperCase()}`;
      }
      if (about === "product" && picked) {
        payload.productId = picked.product;
        payload.productName = picked.name;
        payload.productImage = picked.image;
      }

      onStarted(await startMyThread(payload));
    } catch (e) {
      setErr(e?.response?.data?.message || "Couldn't start that conversation.");
    } finally {
      setBusy(false);
    }
  };

  /** Turns a canned question into a message with the context spelled out. */
  const askQuick = (q) => {
    if (about === "order" && picked) {
      const ref =
        picked.orderNumber ||
        `#${String(picked.id || picked._id).slice(-8).toUpperCase()}`;
      const first = picked.items?.[0]?.name;
      const extra =
        picked.items?.length > 1 ? ` and ${picked.items.length - 1} more item(s)` : "";
      return start(
        `${q} — Order ${ref}${first ? ` (${first}${extra})` : ""}, placed ${fmtDate(
          picked.createdAt
        )}.`
      );
    }
    if (about === "product" && picked) {
      return start(`${q} — ${picked.name}.`);
    }
    return start(q);
  };

  return (
    <div className={styles.newChat}>
      {err && <p className={styles.error}>{err}</p>}

      {/* step 1 — what's this about? */}
      <p className={styles.wizStep}>1. What's this about?</p>
      <div className={styles.aboutRow}>
        {[
          { key: "order", label: "An order", icon: <TopicIcon topic="order" /> },
          { key: "product", label: "A product", icon: <TopicIcon topic="product" /> },
          { key: "general", label: "Something else", icon: <TopicIcon topic="general" /> },
        ].map((o) => (
          <button
            key={o.key}
            type="button"
            className={`${styles.aboutBtn} ${about === o.key ? styles.aboutOn : ""}`}
            onClick={() => {
              setAbout(o.key);
              setPicked(null);
            }}
          >
            {o.icon}
            {o.label}
          </button>
        ))}
      </div>

      {/* step 2 — pick the order or product */}
      {about === "order" && (
        <>
          <p className={styles.wizStep}>2. Which order?</p>
          {orders.length === 0 ? (
            <p className={styles.muted}>You don't have any orders yet.</p>
          ) : (
            <div className={styles.pickList}>
              {orders.map((o) => {
                const id = o.id || o._id;
                const ref =
                  o.orderNumber || `#${String(id).slice(-8).toUpperCase()}`;
                const on = (picked?.id || picked?._id) === id;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`${styles.pickItem} ${on ? styles.pickOn : ""}`}
                    onClick={() => setPicked(o)}
                  >
                    {o.items?.[0]?.image ? (
                      <img className={styles.pickThumb} src={o.items[0].image} alt="" />
                    ) : (
                      <span className={styles.pickThumbBlank} />
                    )}
                    <span className={styles.pickText}>
                      <span className={styles.pickName}>Order {ref}</span>
                      <span className={styles.pickMeta}>
                        {(o.items || []).length} item(s) ·{" "}
                        {inr(o.amounts?.total || 0)} · {fmtDate(o.createdAt)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {about === "product" && (
        <>
          <p className={styles.wizStep}>2. Which product?</p>
          {products.length === 0 ? (
            <p className={styles.muted}>
              You haven't bought anything yet — pick "Something else" and tell us
              what you'd like to know.
            </p>
          ) : (
            <div className={styles.pickList}>
              {products.map((p) => {
                const on = picked?.product === p.product;
                return (
                  <button
                    key={p.product}
                    type="button"
                    className={`${styles.pickItem} ${on ? styles.pickOn : ""}`}
                    onClick={() => setPicked(p)}
                  >
                    {p.image ? (
                      <img className={styles.pickThumb} src={p.image} alt="" />
                    ) : (
                      <span className={styles.pickThumbBlank} />
                    )}
                    <span className={styles.pickText}>
                      <span className={styles.pickName}>{p.name}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* step 3 — the question itself */}
      {about && (about === "general" || picked) && (
        <>
          <p className={styles.wizStep}>
            {about === "general" ? "2." : "3."} What would you like to ask?
          </p>

          {about !== "general" && (
            <div className={styles.quickChips}>
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  className={styles.quickChip}
                  disabled={busy}
                  onClick={() => askQuick(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <textarea
            className={styles.newChatText}
            rows={4}
            placeholder={
              about === "general"
                ? "Ask us anything — sizing, delivery, an exchange, anything at all."
                : "…or write your own message instead."
            }
            value={text}
            disabled={busy}
            onChange={(e) => setText(e.target.value)}
          />

          <div className={styles.newChatActions}>
            <button
              type="button"
              className={styles.ghostBtn}
              onClick={onCancel}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.primary}
              disabled={busy || !text.trim()}
              onClick={() => start(text)}
            >
              {busy ? "Starting…" : "Start chat"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** An open conversation, with its own composer. */
function ThreadView({ thread, setThread }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const endRef = useRef(null);

  // Poll so replies from the store appear without a refresh.
  useEffect(() => {
    const t = setInterval(() => {
      fetchMyThread(thread.id).then(setThread).catch(() => {});
    }, 15000);
    return () => clearInterval(t);
  }, [thread.id, setThread]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [thread.messages?.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    setErr("");
    try {
      setThread(await sendMyMessage(thread.id, text.trim()));
      setText("");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Couldn't send that message.");
    } finally {
      setBusy(false);
    }
  };

  const messages = thread.messages || [];

  return (
    <>
      {(thread.productImage || thread.orderNumber || thread.productName) && (
        <div className={styles.threadContext}>
          {thread.productImage && (
            <img className={styles.pickThumb} src={thread.productImage} alt="" />
          )}
          <span className={styles.muted}>
            About {thread.orderNumber ? `order ${thread.orderNumber}` : thread.productName}
          </span>
        </div>
      )}

      {err && <p className={styles.error}>{err}</p>}

      <div className={styles.chat}>
        {messages.length === 0 ? (
          <p className={styles.chatEmpty}>No messages yet.</p>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`${styles.bubble} ${
                m.from === "user" ? styles.mine : styles.theirs
              }`}
            >
              <p>{m.body}</p>
              <span className={styles.bubbleMeta}>
                {m.from === "user" ? "You" : "Appealing Apparels"} ·{" "}
                {fmtWhen(m.createdAt)}
              </span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      <form className={styles.chatForm} onSubmit={send}>
        <input
          className={styles.input}
          placeholder="Type your message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className={styles.primary} type="submit" disabled={busy || !text.trim()}>
          {busy ? "Sending…" : "Send"}
        </button>
      </form>
    </>
  );
}

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

function TopicIcon({ topic }) {
  const common = {
    viewBox: "0 0 24 24",
    width: 18,
    height: 18,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
  if (topic === "order") {
    return (
      <svg {...common}>
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
      </svg>
    );
  }
  if (topic === "product") {
    return (
      <svg {...common}>
        <path d="M20.6 8.4 12 3 3.4 8.4v7.2L12 21l8.6-5.4z" />
        <path d="M3.4 8.4 12 13.8l8.6-5.4M12 13.8V21" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-4.2A8.4 8.4 0 1 1 21 11.5z" />
    </svg>
  );
}
