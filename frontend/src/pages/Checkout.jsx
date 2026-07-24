import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useProducts, sizesOf } from "../context/ProductsContext";
import { useAuth } from "../context/AuthContext";
import { createOrderApi, verifyPaymentApi } from "../api/ordersApi";
import {
  fetchAddresses,
  addAddressApi,
  updateAddressApi,
  setDefaultAddressApi,
  deleteAddressApi,
} from "../api/addressApi";
import { loadRazorpay } from "../utils/loadRazorpay";
import { lookupPincode } from "../utils/pincode";
import { getCurrentCoords, reverseGeocode } from "../utils/geolocation";
import BackButton from "../components/BackButton";
import styles from "./Checkout.module.css";

const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const FREE_SHIPPING = 1499;
const FLAT_SHIPPING = 99;

const BLANK = {
  label: "Home",
  fullName: "",
  phone: "",
  line1: "",
  city: "",
  state: "",
  postalCode: "",
};

export default function Checkout() {
  const {
    cart,
    clearCart,
    updateQuantity,
    updateSize,
    removeFromCart,
    appliedCoupon,
    setAppliedCoupon,
  } = useCart();
  const { getById } = useProducts();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loadingAddr, setLoadingAddr] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(BLANK);

  // Contact defaults to the account's email/phone; both stay editable.
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setEmail(user?.email || "");
    setPhone(user?.phone || "");
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoadingAddr(false);
      return;
    }
    let active = true;
    fetchAddresses()
      .then((list) => {
        if (!active) return;
        setAddresses(list);
        const def = list.find((a) => a.isDefault) || list[0];
        if (def) {
          setSelectedId(def._id);
          if (!user?.phone) setPhone(def.phone || "");
        } else {
          setShowForm(true);
        }
      })
      .catch(() => active && setShowForm(true))
      .finally(() => active && setLoadingAddr(false));
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const { subtotal, totalMrp, mrpDiscount } = useMemo(() => {
    const sub = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const mrp = cart.reduce((s, i) => {
      const p = getById(i.id);
      const line =
        p?.compareAtPrice && p.compareAtPrice > i.price ? p.compareAtPrice : i.price;
      return s + line * i.quantity;
    }, 0);
    return { subtotal: sub, totalMrp: mrp, mrpDiscount: mrp - sub };
  }, [cart, getById]);

  // Coupons are applied in the shopping bag; checkout only honours what's set.

  // A coupon stays "applied" even if the cart later dips below its minimum —
  // it just pauses (no discount) until the cart qualifies again.
  const couponPaused = !!appliedCoupon && subtotal < appliedCoupon.minOrderValue;

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon || couponPaused) return 0;
    if (appliedCoupon.type === "percentage") {
      let d = Math.round((subtotal * appliedCoupon.value) / 100);
      if (appliedCoupon.maxDiscount) d = Math.min(d, appliedCoupon.maxDiscount);
      return Math.max(0, Math.min(d, subtotal));
    }
    if (appliedCoupon.type === "flat") {
      return Math.max(0, Math.min(appliedCoupon.value, subtotal));
    }
    return 0;
  }, [appliedCoupon, couponPaused, subtotal]);

  const shipping = useMemo(() => {
    if (appliedCoupon?.freeShipping && !couponPaused) return 0;
    return subtotal >= FREE_SHIPPING || subtotal === 0 ? 0 : FLAT_SHIPPING;
  }, [appliedCoupon, couponPaused, subtotal]);

  const total = Math.max(0, subtotal + shipping - couponDiscount);
  const discount = mrpDiscount; // kept for the existing "Discount on MRP" line below

  const selected = addresses.find((a) => a._id === selectedId);
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
    setForm({ ...BLANK, fullName: user?.name || "", phone: phone || "" });
    setEditingId("");
    setShowForm(true);
    setLocError("");
  };

  const openEdit = (addr) => {
    setForm({
      label: addr.label || "Home",
      fullName: addr.fullName,
      phone: addr.phone,
      line1: addr.line1,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
    });
    setEditingId(addr._id);
    setShowForm(true);
    setLocError("");
  };

  const saveAddress = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.label.trim()) form.label = "Home";
    const missing = ["fullName", "phone", "line1", "city", "state", "postalCode"].filter(
      (k) => !form[k].trim()
    );
    if (missing.length) {
      setError("Please fill in every address field.");
      return;
    }

    setBusy(true);
    try {
      const list = editingId
        ? await updateAddressApi(editingId, form)
        : await addAddressApi(form);
      setAddresses(list);
      const target = editingId
        ? list.find((a) => a._id === editingId)
        : list[list.length - 1];
      if (target) setSelectedId(target._id);
      setShowForm(false);
      setEditingId("");
      setPickerOpen(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't save that address.");
    } finally {
      setBusy(false);
    }
  };

  const chooseAddress = async (id) => {
    setSelectedId(id);
    setPickerOpen(false);
    try {
      const list = await setDefaultAddressApi(id);
      setAddresses(list);
    } catch {
      /* selection still works locally */
    }
  };

  const removeAddress = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      const list = await deleteAddressApi(id);
      setAddresses(list);
      if (selectedId === id) {
        const next = list.find((a) => a.isDefault) || list[0];
        setSelectedId(next?._id || "");
        if (!next) setShowForm(true);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't delete that address.");
    }
  };

  const pay = async () => {
    setError("");

    if (!isAuthenticated) {
      setError("Please sign in to place your order.");
      return;
    }
    if (!selected) {
      setError("Please select a delivery address.");
      return;
    }
    if (!email.trim() || !phone.trim()) {
      setError("Email and phone number are required.");
      return;
    }
    if (cart.length === 0) return;

    setBusy(true);
    try {
      const order = await createOrderApi({
        items: cart.map((i) => ({
          id: i.id,
          size: i.size,
          color: i.color,
          quantity: i.quantity,
        })),
        couponCode: appliedCoupon && !couponPaused ? appliedCoupon.code : undefined,
        shippingAddress: {
          fullName: selected.fullName,
          phone: phone.trim(),
          email: email.trim(),
          line1: selected.line1,
          city: selected.city,
          state: selected.state,
          postalCode: selected.postalCode,
        },
      });

      const ready = await loadRazorpay();
      if (!ready) {
        setError("Couldn't load the payment window. Check your connection and retry.");
        setBusy(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: order.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: "Appealing Apparels",
        description: "Order payment",
        prefill: {
          name: selected.fullName,
          email: email.trim(),
          contact: phone.trim(),
        },
        theme: { color: "#111111" },
        handler: async (response) => {
          try {
            await verifyPaymentApi({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order.orderId,
            });
            clearCart();
            setAppliedCoupon(null);
            navigate("/orders?status=success");
          } catch (err) {
            setError(
              err?.response?.data?.message ||
                "Payment could not be verified. If money was deducted, contact support."
            );
          } finally {
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setError("Payment cancelled. Your bag is still saved.");
          },
        },
      });

      rzp.on("payment.failed", (resp) => {
        setBusy(false);
        setError(resp?.error?.description || "Payment failed. Please try again.");
      });

      rzp.open();
    } catch (err) {
      setBusy(false);
      setError(err?.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  if (cart.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.head}>
            <BackButton />
            <h1 className={styles.title}>Checkout</h1>
          </div>
          <p className={styles.empty}>Your bag is empty.</p>
          <Link to="/shop" className={styles.shopLink}>
            Continue shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.head}>
          <BackButton />
          <h1 className={styles.title}>Checkout</h1>
        </div>

        {!isAuthenticated && (
          <p className={styles.notice}>
            Please <Link to="/login">sign in</Link> to complete your purchase.
          </p>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.grid}>
          <div className={styles.left}>
            {/* ---- saved addresses ---- */}
            <section className={styles.card}>
              <div className={styles.cardHead}>
                <h2 className={styles.cardTitle}>
                  {selected && !pickerOpen && !showForm ? "Deliver to" : "Select saved address"}
                </h2>
              </div>

              {loadingAddr ? (
                <p className={styles.muted}>Loading your addresses…</p>
              ) : selected && !pickerOpen && !showForm ? (
                /* ---- compact: just the address in use ---- */
                <div className={styles.addrCompact}>
                  <div className={styles.addrCompactMain}>
                    <p className={styles.addrCompactName}>
                      {selected.fullName}
                      <span className={styles.tag}>{selected.label || "Home"}</span>
                    </p>
                    <p className={styles.addrCompactLine}>
                      {selected.line1}, {selected.city}, {selected.state}
                      {selected.postalCode ? ` ${selected.postalCode}` : ""}
                    </p>
                    <p className={styles.addrCompactMob}>Mob: {selected.phone}</p>
                  </div>
                  <div className={styles.addrCompactActions}>
                    <button className={styles.linkBtn} onClick={() => setPickerOpen(true)}>
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {addresses.map((a) => {
                    const on = a._id === selectedId;
                    return (
                      <div
                        key={a._id}
                        className={`${styles.addr} ${on ? styles.addrOn : ""}`}
                        onClick={() =>
                          on ? setPickerOpen(false) : chooseAddress(a._id)
                        }
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            on ? setPickerOpen(false) : chooseAddress(a._id);
                          }
                        }}
                      >
                        {on && (
                          <span className={styles.chip}>Currently selected</span>
                        )}

                        <div className={styles.addrTop}>
                          <p className={styles.addrName}>
                            {a.fullName}
                            {a.postalCode ? `, ${a.postalCode}` : ""}
                          </p>
                          <span className={styles.tag}>{a.label || "Home"}</span>
                        </div>

                        <p className={styles.addrLine}>
                          {a.line1}, {a.city}, {a.state}
                        </p>
                        <p className={styles.addrMob}>Mob: {a.phone}</p>

                        <div className={styles.addrActions}>
                          <button
                            className={styles.linkBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(a);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className={`${styles.linkBtn} ${styles.danger}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAddress(a._id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {!showForm && (
                    <button className={styles.addBox} onClick={openNew}>
                      ⊕ Add New Address
                    </button>
                  )}
                </>
              )}

              {showForm && (
                <form className={styles.form} onSubmit={saveAddress}>
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
                    <button className={styles.saveBtn} type="submit" disabled={busy}>
                      {busy ? "Saving…" : "Save address"}
                    </button>
                    {addresses.length > 0 && (
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
                    )}
                  </div>
                </form>
              )}
            </section>

            {/* ---- contact ---- */}
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Contact details</h2>
              <p className={styles.muted}>
                We'll send your order updates here. Both are required.
              </p>
              <div className={styles.fields}>
                <label className={styles.field}>
                  <span>Email*</span>
                  <input
                    className={styles.input}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span>Phone*</span>
                  <input
                    className={styles.input}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>
              </div>
            </section>
          </div>

          {/* ---- order summary ---- */}
          <aside className={`${styles.card} ${styles.summaryCard}`}>
            <h2 className={styles.cardTitle}>Order summary</h2>

            <ul className={styles.items}>
              {cart.map((i) => {
                const p = getById(i.id);
                const sizeOptions = (p ? sizesOf(p, i.color) : [])
                  .filter((s) => (s.stock ?? 0) > 0 || s.size === i.size)
                  .map((s) => s.size);

                return (
                  <li className={styles.item} key={`${i.id}-${i.size}-${i.color || ""}`}>
                    <div className={styles.itemTop}>
                      <span className={styles.itemName}>{i.name}</span>
                      <span className={styles.itemPrice}>
                        {inr(i.price * i.quantity)}
                      </span>
                    </div>

                    <div className={styles.itemControls}>
                      {sizeOptions.length > 0 && (
                        <select
                          className={styles.sizeSelect}
                          value={i.size}
                          onChange={(e) => updateSize(i.id, i.size, e.target.value, i.color)}
                        >
                          {sizeOptions.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      )}

                      <div className={styles.qty}>
                        <button
                          type="button"
                          onClick={() => updateQuantity(i.id, i.size, -1, i.color)}
                          disabled={i.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span>{i.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(i.id, i.size, 1, i.color)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => removeFromCart(i.id, i.size, i.color)}
                        aria-label="Remove item"
                      >
                        ×
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className={styles.line}>
              <span>Total MRP</span>
              <span>{inr(totalMrp)}</span>
            </div>
            {discount > 0 && (
              <div className={styles.line}>
                <span>Discount on MRP</span>
                <span className={styles.green}>− {inr(discount)}</span>
              </div>
            )}
            {couponDiscount > 0 && (
              <div className={styles.line}>
                <span>Coupon ({appliedCoupon.code})</span>
                <span className={styles.green}>− {inr(couponDiscount)}</span>
              </div>
            )}
            <div className={styles.line}>
              <span>Shipping</span>
              <span>{shipping === 0 ? "Free" : inr(shipping)}</span>
            </div>

            <div className={styles.total}>
              <span>Total Amount</span>
              <span>{inr(total)}</span>
            </div>

            {(discount > 0 || couponDiscount > 0) && (
              <p className={styles.savings}>
                You're saving <strong>{inr(discount + couponDiscount)}</strong> on this order
              </p>
            )}

            <button
              className={styles.payBtn}
              onClick={pay}
              disabled={busy || !isAuthenticated}
            >
              {busy ? "Processing…" : `Pay ${inr(total)}`}
            </button>
            <p className={styles.secure}>Secured by Razorpay</p>
          </aside>
        </div>
      </div>
    </main>
  );
}
