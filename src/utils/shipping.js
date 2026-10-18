/**
 * Shipping rules as set by the admin (Admin → Coupons → Shipping). The server
 * recomputes the real charge at checkout; this only mirrors it for display.
 *  - enabled:   false → shipping is free for everyone.
 *  - flatRate:  the charge (₹) when shipping applies.
 *  - freeAbove: orders at or above this subtotal (₹) ship free. 0 = no threshold.
 */
export const DEFAULT_SHIPPING = { enabled: true, flatRate: 99, freeAbove: 1499 };

export function normalizeShipping(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const num = (v, fallback) => (Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v))) : fallback);
  return {
    enabled: typeof r.enabled === "boolean" ? r.enabled : DEFAULT_SHIPPING.enabled,
    flatRate: num(r.flatRate, DEFAULT_SHIPPING.flatRate),
    freeAbove: num(r.freeAbove, DEFAULT_SHIPPING.freeAbove),
  };
}

/** Shipping charge (₹) for a bag subtotal; an empty bag ships free. */
export function shippingFor(subtotal, rules, freeFromCoupon = false) {
  if (subtotal <= 0 || freeFromCoupon || !rules.enabled) return 0;
  if (rules.freeAbove > 0 && subtotal >= rules.freeAbove) return 0;
  return rules.flatRate;
}

/** Short promise line for banners, e.g. "On orders above ₹1,499". */
export function shippingPromise(rules) {
  if (!rules.enabled) return { title: "Free shipping", sub: "On every order" };
  if (rules.freeAbove > 0) {
    return {
      title: "Free shipping",
      sub: `On orders above ₹${rules.freeAbove.toLocaleString("en-IN")}`,
    };
  }
  return { title: "Flat-rate shipping", sub: `Just ₹${rules.flatRate} on every order` };
}
