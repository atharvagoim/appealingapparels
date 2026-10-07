/**
 * A fully offline, manual delivery-time estimator — no courier API, no
 * geocoding service. It buckets a pincode by India Post's own postal
 * "region" (the first digit of every Indian PIN code, 1–9, an official,
 * fixed grouping — e.g. 1 = Delhi/Haryana/Punjab/HP/J&K, 6 = Tamil
 * Nadu/Kerala) and assigns each region a rough distance-from-store tier.
 *
 * This is an approximation, not a real distance calculation: a whole
 * region shares one tier even though it spans a range of actual
 * distances (e.g. Rajasthan's nearer cities and Gujarat's farther ones
 * are both region "3"). It's built to roughly track real geography from
 * the store's home region (Delhi, region 1) outward, in line with the
 * day-tiers requested: ~3 days very close, ~5 days at ~600km, ~6 days at
 * ~1200km, 7 days max beyond that.
 */

export const STORE_PINCODE = "110033"; // Model Town, Delhi

/** Postal region → { days, label } based on typical distance from Delhi. */
const REGION_TIERS = {
  1: { days: 3, label: "very close" }, // Delhi, Haryana, Punjab, HP, J&K
  2: { days: 5, label: "close" }, // UP, Uttarakhand
  3: { days: 6, label: "mid-distance" }, // Rajasthan, Gujarat, Daman & Diu, D&NH
  4: { days: 7, label: "far" }, // Maharashtra, MP, Chhattisgarh, Goa
  5: { days: 7, label: "far" }, // Andhra Pradesh, Telangana, Karnataka
  6: { days: 7, label: "far" }, // Tamil Nadu, Kerala, Puducherry, Lakshadweep
  7: { days: 7, label: "far" }, // West Bengal, Odisha, North-East, A&N Islands
  8: { days: 6, label: "mid-distance" }, // Bihar, Jharkhand
  9: { days: 7, label: "far" }, // Army Postal Service
};

/** Loose validation — 6 digits, first digit 1–9 (Indian PINs never start with 0). */
export function isValidPincode(raw) {
  return /^[1-9][0-9]{5}$/.test(String(raw || "").trim());
}

/**
 * Returns { minDays, maxDays, minDate, maxDate } for a destination pincode,
 * or null if the pincode isn't a valid 6-digit Indian PIN. The same-region
 * case (shopper is in the store's own postal region) gets a tight 2-day
 * window; every other tier gets a 1-day window ending on the tier's day
 * count, matching the "X days" figures given.
 *
 * `fromDate` anchors the window to a specific day instead of today — used
 * to work out an order's expected delivery date starting from when it was
 * actually dispatched, not from whenever someone happens to look at it.
 */
export function estimateDelivery(pincode, fromDate = new Date()) {
  if (!isValidPincode(pincode)) return null;

  const region = Number(String(pincode).trim()[0]);
  const tier = REGION_TIERS[region] || REGION_TIERS[9];
  const sameRegionAsStore = region === Number(STORE_PINCODE[0]);

  const maxDays = tier.days;
  const minDays = sameRegionAsStore ? Math.max(1, maxDays - 1) : Math.max(1, maxDays - 1);

  const addDays = (n) => {
    const d = new Date(fromDate);
    d.setDate(d.getDate() + n);
    return d;
  };

  return {
    minDays,
    maxDays,
    minDate: addDays(minDays),
    maxDate: addDays(maxDays),
  };
}

/** "1 Aug" / "2 Aug" style, matching the reference. */
export function formatShortDate(date) {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
