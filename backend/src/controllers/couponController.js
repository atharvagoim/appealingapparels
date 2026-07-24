import Coupon from "../models/Coupon.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { evaluateCoupon, computeDiscount, isWithinWindow } from "../utils/coupons.js";

const TYPES = ["percentage", "flat", "freeShipping"];

function readBody(req) {
  const {
    code,
    description,
    type,
    value,
    minOrderValue,
    maxDiscount,
    startAt,
    expiresAt,
    usageLimit,
    perUserLimit,
    active,
    showOnProductPage,
  } = req.body;
  return {
    code,
    description,
    type,
    value,
    minOrderValue,
    maxDiscount,
    startAt,
    expiresAt,
    usageLimit,
    perUserLimit,
    active,
    showOnProductPage,
  };
}

/* ---------------------------- admin ---------------------------- */

/** GET /api/coupons (admin) — every coupon, full detail. */
export const listCoupons = asyncHandler(async (_req, res) => {
  const coupons = await Coupon.find().sort("-createdAt");
  res.json(coupons);
});

/** POST /api/coupons (admin) — create. */
export const createCoupon = asyncHandler(async (req, res) => {
  const b = readBody(req);

  if (!b.code || !String(b.code).trim()) throw new ApiError(400, "A coupon code is required.");
  if (!TYPES.includes(b.type)) throw new ApiError(400, "Choose a coupon type.");
  if (b.type !== "freeShipping" && (!b.value || Number(b.value) <= 0)) {
    throw new ApiError(400, "Enter a discount value.");
  }
  if (b.type === "percentage" && Number(b.value) > 100) {
    throw new ApiError(400, "A percentage discount can't exceed 100%.");
  }

  const code = String(b.code).trim().toUpperCase();
  if (await Coupon.findOne({ code })) {
    throw new ApiError(409, "A coupon with this code already exists.");
  }

  const coupon = await Coupon.create({
    code,
    description: (b.description || "").trim(),
    type: b.type,
    value: b.type === "freeShipping" ? 0 : Number(b.value),
    minOrderValue: Number(b.minOrderValue) || 0,
    maxDiscount: b.maxDiscount ? Number(b.maxDiscount) : null,
    startAt: b.startAt ? new Date(b.startAt) : null,
    expiresAt: b.expiresAt ? new Date(b.expiresAt) : null,
    usageLimit: b.usageLimit ? Number(b.usageLimit) : null,
    perUserLimit: b.perUserLimit ? Number(b.perUserLimit) : 1,
    active: b.active !== undefined ? Boolean(b.active) : true,
    showOnProductPage: b.showOnProductPage !== undefined ? Boolean(b.showOnProductPage) : true,
  });

  res.status(201).json(coupon);
});

/** PUT /api/coupons/:id (admin) — edit. */
export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new ApiError(404, "Coupon not found.");

  const b = readBody(req);

  if (b.code !== undefined) {
    const code = String(b.code).trim().toUpperCase();
    if (!code) throw new ApiError(400, "A coupon code is required.");
    if (code !== coupon.code) {
      const clash = await Coupon.findOne({ code, _id: { $ne: coupon._id } });
      if (clash) throw new ApiError(409, "A coupon with this code already exists.");
    }
    coupon.code = code;
  }
  if (b.type !== undefined) {
    if (!TYPES.includes(b.type)) throw new ApiError(400, "Choose a coupon type.");
    coupon.type = b.type;
  }
  if (b.description !== undefined) coupon.description = String(b.description).trim();
  if (b.value !== undefined) {
    if (coupon.type === "percentage" && Number(b.value) > 100) {
      throw new ApiError(400, "A percentage discount can't exceed 100%.");
    }
    coupon.value = coupon.type === "freeShipping" ? 0 : Number(b.value) || 0;
  }
  if (b.minOrderValue !== undefined) coupon.minOrderValue = Number(b.minOrderValue) || 0;
  if (b.maxDiscount !== undefined) coupon.maxDiscount = b.maxDiscount ? Number(b.maxDiscount) : null;
  if (b.startAt !== undefined) coupon.startAt = b.startAt ? new Date(b.startAt) : null;
  if (b.expiresAt !== undefined) coupon.expiresAt = b.expiresAt ? new Date(b.expiresAt) : null;
  if (b.usageLimit !== undefined) coupon.usageLimit = b.usageLimit ? Number(b.usageLimit) : null;
  if (b.perUserLimit !== undefined) coupon.perUserLimit = Number(b.perUserLimit) || 1;
  if (b.active !== undefined) coupon.active = Boolean(b.active);
  if (b.showOnProductPage !== undefined) coupon.showOnProductPage = Boolean(b.showOnProductPage);

  await coupon.save();
  res.json(coupon);
});

/** DELETE /api/coupons/:id (admin). */
export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new ApiError(404, "Coupon not found.");
  await coupon.deleteOne();
  res.json({ deleted: 1, id: req.params.id });
});

/** PATCH /api/coupons/:id/toggle (admin) — flip active on/off. */
export const toggleCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new ApiError(404, "Coupon not found.");
  coupon.active = !coupon.active;
  await coupon.save();
  res.json(coupon);
});

/* -------------------------- storefront -------------------------- */

/** GET /api/coupons/public — banners for the product page (no cart context, no auth). */
export const listPublicCoupons = asyncHandler(async (_req, res) => {
  const now = new Date();
  const coupons = await Coupon.find({ active: true, showOnProductPage: true }).sort(
    "minOrderValue"
  );
  const visible = coupons
    .filter((c) => isWithinWindow(c, now))
    .map((c) => ({
      code: c.code,
      description: c.description,
      type: c.type,
      value: c.value,
      minOrderValue: c.minOrderValue,
      maxDiscount: c.maxDiscount,
    }));
  res.json(visible);
});

/** GET /api/coupons/checkout?subtotal=NNN (auth) — eligibility-aware list for the cart. */
export const listCheckoutCoupons = asyncHandler(async (req, res) => {
  const subtotal = Math.max(0, Number(req.query.subtotal) || 0);
  const now = new Date();
  const coupons = await Coupon.find({ active: true }).sort("minOrderValue");

  const list = coupons
    .filter((c) => isWithinWindow(c, now))
    .map((c) => {
      const result = evaluateCoupon(c, { subtotal, userId: req.user?._id });
      return {
        code: c.code,
        description: c.description,
        type: c.type,
        value: c.value,
        minOrderValue: c.minOrderValue,
        maxDiscount: c.maxDiscount,
        eligible: result.eligible,
        reason: result.reason,
        estimatedDiscount: result.eligible ? computeDiscount(c, subtotal) : 0,
      };
    });

  res.json(list);
});

/** POST /api/coupons/apply (auth) — { code, subtotal } → validated discount preview. */
export const applyCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  if (!code || !String(code).trim()) throw new ApiError(400, "Enter a coupon code.");

  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase() });
  if (!coupon) throw new ApiError(404, "That coupon code doesn't exist.");

  const sub = Math.max(0, Number(subtotal) || 0);
  const result = evaluateCoupon(coupon, { subtotal: sub, userId: req.user._id });
  if (!result.eligible) throw new ApiError(400, result.reason || "This coupon can't be applied.");

  res.json({
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    maxDiscount: coupon.maxDiscount,
    minOrderValue: coupon.minOrderValue,
    discount: computeDiscount(coupon, sub),
    freeShipping: coupon.type === "freeShipping",
  });
});
