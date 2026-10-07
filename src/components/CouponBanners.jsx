import { useEffect, useState } from "react";
import { fetchPublicCoupons } from "../api/couponsApi";
import styles from "./CouponBanners.module.css";

/** What a coupon actually gets you, written out as a sentence. */
function benefitText(c) {
  const min =
    c.minOrderValue > 0
      ? ` on orders over ₹${c.minOrderValue.toLocaleString("en-IN")}`
      : "";
  if (c.type === "freeShipping") return `Free shipping${min}`;
  if (c.type === "percentage") {
    const cap = c.maxDiscount
      ? `, up to ₹${c.maxDiscount.toLocaleString("en-IN")}`
      : "";
    return `${c.value}% off${min}${cap}`;
  }
  return `₹${Number(c.value).toLocaleString("en-IN")} off${min}`;
}

/** "Active offers" panel on the product page, listing every live coupon. */
export default function CouponBanners() {
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    let on = true;
    fetchPublicCoupons()
      .then((data) => on && setCoupons(data))
      .catch(() => on && setCoupons([]));
    return () => {
      on = false;
    };
  }, []);

  if (coupons.length === 0) return null;

  return (
    <section className={styles.panel} aria-label="Active offers">
      <h2 className={styles.title}>
        <svg className={styles.icon} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.6 13.4 11 3.8A2 2 0 0 0 9.6 3.2H4v5.6a2 2 0 0 0 .6 1.4l9.6 9.6a2 2 0 0 0 2.8 0l3.6-3.6a2 2 0 0 0 0-2.8z" />
          <circle cx="7.7" cy="7.7" r="1.1" />
        </svg>
        Active offers
      </h2>

      <ul className={styles.list}>
        {coupons.map((c) => (
          <li className={styles.row} key={c.code}>
            <span className={styles.code}>{c.code}</span>
            <span className={styles.benefit}>{benefitText(c)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
