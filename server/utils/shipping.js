import Settings from "../models/Settings.js";

/**
 * Shipping rules, set by the admin (Admin → Coupons → Shipping) and applied to
 * every customer. The server is the source of truth: checkout recomputes the
 * charge from these rules, so a customer can't change it from the browser.
 *
 *  - enabled:   false → shipping is free for everyone.
 *  - flatRate:  the charge (₹) when shipping applies.
 *  - freeAbove: orders at or above this subtotal (₹) ship free. 0 = no threshold.
 */
export const DEFAULT_SHIPPING = { enabled: true, flatRate: 99, freeAbove: 1499 };

const clampMoney = (v, fallback, max) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : fallback;
};

/** Always returns a complete, sane object, whatever was stored or sent. */
export function normalizeShipping(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  return {
    enabled: typeof r.enabled === "boolean" ? r.enabled : DEFAULT_SHIPPING.enabled,
    flatRate: clampMoney(r.flatRate, DEFAULT_SHIPPING.flatRate, 5000),
    freeAbove: clampMoney(r.freeAbove, DEFAULT_SHIPPING.freeAbove, 1000000),
  };
}

export async function readShippingRules() {
  const doc = await Settings.findOne({ key: "site" }).select("shippingSettings").lean();
  return normalizeShipping(doc?.shippingSettings);
}

/** The shipping charge (₹) for an order subtotal under the given rules. */
export function computeShipping(subtotal, rules, freeFromCoupon = false) {
  if (freeFromCoupon || !rules.enabled) return 0;
  if (rules.freeAbove > 0 && subtotal >= rules.freeAbove) return 0;
  return rules.flatRate;
}
