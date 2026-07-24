import client from "./client";

/* ---------------------------- storefront ---------------------------- */

/** Banners for the product page — active coupons flagged to advertise there. */
export async function fetchPublicCoupons() {
  const { data } = await client.get("/coupons/public");
  return data;
}

/** Eligibility-aware coupon list for the checkout dropdown. */
export async function fetchCheckoutCoupons(subtotal) {
  const { data } = await client.get("/coupons/checkout", { params: { subtotal } });
  return data;
}

/** Validate + apply a coupon code against the current subtotal. */
export async function applyCouponApi(code, subtotal) {
  const { data } = await client.post("/coupons/apply", { code, subtotal });
  return data;
}

/* ------------------------------- admin ------------------------------- */

export async function fetchAllCoupons() {
  const { data } = await client.get("/coupons");
  return data;
}

export async function createCouponApi(payload) {
  const { data } = await client.post("/coupons", payload);
  return data;
}

export async function updateCouponApi(id, payload) {
  const { data } = await client.put(`/coupons/${id}`, payload);
  return data;
}

export async function deleteCouponApi(id) {
  const { data } = await client.delete(`/coupons/${id}`);
  return data;
}

export async function toggleCouponApi(id) {
  const { data } = await client.patch(`/coupons/${id}/toggle`);
  return data;
}
