/** True while `now` falls inside the coupon's optional start/expiry window. */
export function isWithinWindow(coupon, now = new Date()) {
  if (coupon.startAt && now < new Date(coupon.startAt)) return false;
  if (coupon.expiresAt && now > new Date(coupon.expiresAt)) return false;
  return true;
}

/** The ₹ amount a coupon takes off a given subtotal (0 for freeShipping — that discount is on shipping, not the subtotal). */
export function computeDiscount(coupon, subtotal) {
  if (coupon.type === "percentage") {
    let discount = Math.round((subtotal * coupon.value) / 100);
    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    return Math.max(0, Math.min(discount, subtotal));
  }
  if (coupon.type === "flat") {
    return Math.max(0, Math.min(coupon.value, subtotal));
  }
  return 0;
}

/**
 * Full eligibility check for one customer's cart: active, within its date
 * window, under both usage caps, and the cart meets the minimum order value.
 * Returns { eligible, reason } — reason is a short, customer-facing string.
 */
export function evaluateCoupon(coupon, { subtotal, userId }) {
  const now = new Date();

  if (!coupon.active) {
    return { eligible: false, reason: "This coupon is no longer active." };
  }
  if (!isWithinWindow(coupon, now)) {
    return { eligible: false, reason: "This coupon isn't valid right now." };
  }
  if (coupon.usageLimit && coupon.redemptions.length >= coupon.usageLimit) {
    return { eligible: false, reason: "This coupon has reached its usage limit." };
  }
  if (userId && coupon.perUserLimit) {
    const used = coupon.redemptions.filter((r) => String(r.user) === String(userId)).length;
    if (used >= coupon.perUserLimit) {
      return { eligible: false, reason: "You've already used this coupon." };
    }
  }
  if (subtotal < coupon.minOrderValue) {
    const gap = coupon.minOrderValue - subtotal;
    return { eligible: false, reason: `Add ₹${gap.toLocaleString("en-IN")} more to unlock this coupon.` };
  }

  return { eligible: true, reason: null };
}
