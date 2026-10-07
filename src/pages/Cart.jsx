import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { fetchCheckoutCoupons, applyCouponApi } from "../api/couponsApi";
import {
  useProducts,
  totalStock,
  sizesOf,
  isSized,
  variantStock,
} from "../context/ProductsContext";
import styles from "./Cart.module.css";
import BackButton from "../components/BackButton";

const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const FREE_SHIPPING = 1499;
const FLAT_SHIPPING = 99;
const LOW_STOCK = 10;

export default function Cart() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    updateSize,
    appliedCoupon,
    setAppliedCoupon,
  } = useCart();
  const { getById } = useProducts();

  const [couponCode, setCouponCode] = useState("");
  const [couponList, setCouponList] = useState([]);
  const [couponsOpen, setCouponsOpen] = useState(false);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Totals — MRP uses compareAtPrice where there's a discount.
  const totalMrp = cart.reduce((s, i) => {
    const p = getById(i.id);
    const mrp =
      p?.compareAtPrice && p.compareAtPrice > i.price ? p.compareAtPrice : i.price;
    return s + mrp * i.quantity;
  }, 0);
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = totalMrp - subtotal;
  const itemCount = cart.reduce((n, i) => n + i.quantity, 0);

  // A coupon stays applied even if the bag later dips below its minimum — it's
  // just paused, so the shopper can see what they'd need to spend to keep it.
  const couponPaused =
    !!appliedCoupon && subtotal < (appliedCoupon.minOrderValue || 0);

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

  const shipping =
    appliedCoupon?.freeShipping && !couponPaused
      ? 0
      : subtotal >= FREE_SHIPPING
      ? 0
      : FLAT_SHIPPING;

  const total = Math.max(0, subtotal + shipping - couponDiscount);
  const totalSaved = discount + couponDiscount;

  useEffect(() => {
    let active = true;
    fetchCheckoutCoupons(subtotal)
      .then((list) => active && setCouponList(list || []))
      .catch(() => active && setCouponList([]));
    return () => {
      active = false;
    };
  }, [subtotal]);

  // Every hook above has run by this point, so bailing out here is safe —
  // React needs the same hooks in the same order on every render.
  if (cart.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.inner}>
          <div className={styles.head}>
            <BackButton />
            <h1 className={styles.title}>Shopping bag</h1>
          </div>
          <p className={styles.empty}>Your bag is empty.</p>
          <Link to="/shop" className={styles.shopLink}>
            Continue shopping
          </Link>
        </div>
      </main>
    );
  }

  const applyCoupon = async (code) => {
    const clean = String(code || "").trim().toUpperCase();
    if (!clean || couponBusy) return;
    setCouponBusy(true);
    setCouponError("");
    try {
      const res = await applyCouponApi(clean, subtotal);
      setAppliedCoupon(res.coupon || res);
      setCouponCode("");
      setCouponsOpen(false);
    } catch (e) {
      setCouponError(e?.response?.data?.message || "That code isn't valid.");
    } finally {
      setCouponBusy(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
      <div className={styles.head}>
        <BackButton />
        <h1 className={styles.title}>
          Shopping bag <span className={styles.count}>({itemCount} items)</span>
        </h1>
      </div>

      <div className={styles.layout}>
      <div className={styles.items}>
        {cart.map((item) => {
          const p = getById(item.id);
          const mrp =
            p?.compareAtPrice && p.compareAtPrice > item.price
              ? p.compareAtPrice
              : null;
          const off = mrp ? mrp - item.price : 0;
          // Stock lives on the colourway when the product has any.
          const rows = p ? sizesOf(p, item.color) : [];
          const sizeRow = rows.find((s) => s.size === item.size);
          const left = p
            ? isSized(p)
              ? sizeRow?.stock ?? null
              : variantStock(p, item.color)
            : null;
          const sizeOptions = rows
            .filter((s) => (s.stock ?? 0) > 0 || s.size === item.size)
            .map((s) => s.size);
          const maxQty = Math.max(1, Math.min(10, left ?? 10));
          // Only flag stock that's genuinely worth flagging — "0 left" and
          // "1 left" read as alarming/out of stock, so they stay hidden.
          const showLeft = left !== null && left > 1 && left <= LOW_STOCK;

          return (
            <article className={styles.card} key={`${item.id}-${item.size}-${item.color || ""}`}>
              <Link to={`/product/${p?.slug || ""}`} className={styles.thumbWrap}>
                <img className={styles.thumb} src={item.image} alt={item.name} />
              </Link>

              <div className={styles.info}>
                <div className={styles.topRow}>
                  <h3 className={styles.name}>{item.name}</h3>
                  <button
                    className={styles.close}
                    onClick={() => removeFromCart(item.id, item.size, item.color)}
                    aria-label={`Remove ${item.name}`}
                  >
                    ✕
                  </button>
                </div>

                {(item.color || p?.category) && (
                  <p className={styles.sub}>
                    {[item.color, p?.category].filter(Boolean).join(" · ")}
                  </p>
                )}

                <div className={styles.selects}>
                  {sizeOptions.length > 0 && (
                    <label className={styles.selectBox}>
                      <span className={styles.srOnly}>Size</span>
                      <select
                        className={styles.select}
                        value={item.size}
                        onChange={(e) =>
                          updateSize(item.id, item.size, e.target.value, item.color)
                        }
                      >
                        {sizeOptions.map((s) => (
                          <option key={s} value={s}>
                            Size: {s}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  <label
                    className={`${styles.selectBox} ${
                      showLeft ? styles.selectAlert : ""
                    }`}
                  >
                    <span className={styles.srOnly}>Quantity</span>
                    <select
                      className={styles.select}
                      value={item.quantity}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        updateQuantity(item.id, item.size, next - item.quantity, item.color);
                      }}
                    >
                      {Array.from({ length: maxQty }, (_, n) => n + 1).map((q) => (
                        <option key={q} value={q}>
                          Qty: {q}
                        </option>
                      ))}
                    </select>
                  </label>

                  {showLeft && <span className={styles.left}>{left} left</span>}
                </div>

                <div className={styles.priceRow}>
                  <span className={styles.price}>{inr(item.price)}</span>
                  {mrp && <span className={styles.mrp}>{inr(mrp)}</span>}
                  {off > 0 && (
                    <span className={styles.off}>
                      {Math.round((off / mrp) * 100)}% off
                    </span>
                  )}
                </div>

                {p && totalStock(p) === 0 && (
                  <p className={styles.oos}>Out of stock</p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <aside className={styles.side}>
      {/* price details */}
      <section className={styles.summary} aria-label="Price details">
        <div className={styles.sumRow}>
          <span>Total MRP</span>
          <span>{inr(totalMrp)}</span>
        </div>
        {discount > 0 && (
          <div className={styles.sumRow}>
            <span>Discount on MRP</span>
            <span className={styles.green}>− {inr(discount)}</span>
          </div>
        )}
        <div className={styles.sumRow}>
          <span>Shipping</span>
          <span>{shipping === 0 ? "Free" : inr(shipping)}</span>
        </div>

        {/* Coupons are applied here, not at checkout, and carried across. */}
        <div className={styles.couponBlock}>
          <p className={styles.couponTitle}>Have a coupon?</p>

          {appliedCoupon ? (
            <div className={styles.couponApplied}>
              <div>
                <p className={styles.couponCode}>{appliedCoupon.code}</p>
                <p className={styles.couponNote}>
                  {couponPaused
                    ? `Spend ${inr(appliedCoupon.minOrderValue)} to use this`
                    : `${inr(couponDiscount)} off applied`}
                </p>
              </div>
              <button
                type="button"
                className={styles.couponRemove}
                onClick={() => setAppliedCoupon(null)}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className={styles.couponRow}>
              <input
                className={styles.couponInput}
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyCoupon(couponCode)}
                placeholder="Enter coupon code"
                aria-label="Coupon code"
              />
              <button
                type="button"
                className={styles.couponApply}
                disabled={couponBusy || !couponCode.trim()}
                onClick={() => applyCoupon(couponCode)}
              >
                {couponBusy ? "…" : "Apply"}
              </button>
            </div>
          )}

          {couponError && <p className={styles.couponError}>{couponError}</p>}

          {couponList.length > 0 && (
            <div className={styles.couponAvail}>
              <button
                type="button"
                className={styles.couponToggle}
                onClick={() => setCouponsOpen((v) => !v)}
                aria-expanded={couponsOpen}
              >
                View available coupons ({couponList.length})
                <span className={couponsOpen ? styles.chevOn : styles.chev}>⌄</span>
              </button>

              {couponsOpen && (
                <ul className={styles.couponList}>
                  {couponList.map((c) => (
                    <li className={styles.couponItem} key={c.code}>
                      <div>
                        <p className={styles.couponCode}>{c.code}</p>
                        <p className={styles.couponNote}>{c.description || ""}</p>
                      </div>
                      <button
                        type="button"
                        className={styles.couponUse}
                        disabled={couponBusy}
                        onClick={() => applyCoupon(c.code)}
                      >
                        Apply
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className={styles.sumTotal}>
          <span>Total Amount</span>
          <span>{inr(total)}</span>
        </div>
      </section>

      {/* action bar — sits under the summary, savings strip joined on top */}
      <div className={styles.bar}>
        {totalSaved > 0 && (
          <p className={styles.barSavings}>
            You're saving <strong>{inr(totalSaved)}</strong> on this order
          </p>
        )}
        <div className={styles.barRow}>
          <p className={styles.barNote}>
            {itemCount} {itemCount === 1 ? "item" : "items"} · {inr(total)}
          </p>
          <Link to="/checkout" className={styles.placeOrder}>
            Proceed to checkout
          </Link>
        </div>
      </div>
      </aside>
      </div>
      </div>
    </main>
  );
}
