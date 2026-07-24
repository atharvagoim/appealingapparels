import mongoose from "mongoose";
import Review from "../models/Review.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const MAX_BODY = 1500;

/** Average, count and 5→1 breakdown for a set of reviews. */
function summarise(reviews) {
  const count = reviews.length;
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  reviews.forEach((r) => {
    sum += r.rating;
    if (breakdown[r.rating] !== undefined) breakdown[r.rating] += 1;
  });
  return {
    count,
    average: count ? Math.round((sum / count) * 10) / 10 : 0,
    breakdown,
  };
}

/* ---------------- public ---------------- */

/** GET /api/reviews/product/:productId — everything shown on a product page. */
export const listProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (!mongoose.isValidObjectId(productId)) {
    return res.json({ reviews: [], count: 0, average: 0, breakdown: {} });
  }

  const reviews = await Review.find({ product: productId }).sort({ createdAt: -1 });
  res.json({ ...summarise(reviews), reviews });
});

/**
 * GET /api/reviews/summary — one compact rating summary per product, so the
 * catalogue can show stars without a request per card.
 */
export const listRatingSummary = asyncHandler(async (_req, res) => {
  const rows = await Review.aggregate([
    {
      $group: {
        _id: "$product",
        count: { $sum: 1 },
        average: { $avg: "$rating" },
      },
    },
  ]);

  const summary = {};
  rows.forEach((r) => {
    summary[String(r._id)] = {
      count: r.count,
      average: Math.round(r.average * 10) / 10,
    };
  });
  res.json(summary);
});

/* ---------------- customer ---------------- */

/**
 * Delivered orders belonging to this customer, with each line marked as
 * already-reviewed or still open. Powers the Rate & review buttons.
 */
async function reviewableOrders(userId, extraFilter = {}) {
  const orders = await Order.find({
    user: userId,
    status: "delivered",
    ...extraFilter,
  }).sort({ updatedAt: -1 });

  if (!orders.length) return [];

  const done = await Review.find({
    user: userId,
    order: { $in: orders.map((o) => o._id) },
  }).select("order product rating body");

  const key = (o, p) => `${o}:${p}`;
  const map = new Map(done.map((r) => [key(r.order, r.product), r]));

  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    createdAt: o.createdAt,
    items: (o.items || [])
      .filter((i) => i.product)
      .map((i) => {
        const mine = map.get(key(o._id, i.product));
        return {
          product: String(i.product),
          name: i.name,
          image: i.image,
          size: i.size,
          reviewed: !!mine,
          rating: mine?.rating || 0,
          body: mine?.body || "",
        };
      }),
  }));
}

/** GET /api/reviews/mine/orders — delivered orders this customer can rate. */
export const listMyReviewableOrders = asyncHandler(async (req, res) => {
  res.json(await reviewableOrders(req.user._id));
});

/** GET /api/reviews/mine — every review this customer has written. */
export const listMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(reviews);
});

/**
 * GET /api/reviews/prompt — the one delivered order we still owe this customer
 * a popup for, or null. Nothing is marked here; the client confirms separately
 * once the popup is actually on screen.
 */
export const getReviewPrompt = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    user: req.user._id,
    status: "delivered",
    reviewPromptedAt: null,
  }).sort({ updatedAt: 1 });

  if (!order) return res.json(null);

  const reviewed = await Review.find({ user: req.user._id, order: order._id }).select(
    "product"
  );
  const seen = new Set(reviewed.map((r) => String(r.product)));

  const items = (order.items || [])
    .filter((i) => i.product && !seen.has(String(i.product)))
    .map((i) => ({
      product: String(i.product),
      name: i.name,
      image: i.image,
      size: i.size,
    }));

  // Everything in it is already rated — retire the prompt silently.
  if (!items.length) {
    order.reviewPromptedAt = new Date();
    await order.save();
    return res.json(null);
  }

  res.json({
    orderId: order.id,
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    items,
  });
});

/**
 * POST /api/reviews/prompt/:orderId/seen — burn the prompt for this order.
 * Called the instant the popup renders, so it can never appear a second time,
 * whether the customer writes a review, closes it, or reloads the page.
 */
export const markPromptSeen = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.orderId, user: req.user._id });
  if (!order) throw new ApiError(404, "Order not found.");

  if (!order.reviewPromptedAt) {
    order.reviewPromptedAt = new Date();
    await order.save();
  }
  res.json({ id: order.id, reviewPromptedAt: order.reviewPromptedAt });
});

/** POST /api/reviews — leave (or update) a rating for one purchased product. */
export const createReview = asyncHandler(async (req, res) => {
  const { orderId, productId } = req.body;
  const rating = Number(req.body.rating);
  const body = String(req.body.body || "").trim().slice(0, MAX_BODY);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, "Please give a rating between 1 and 5 stars.");
  }
  if (!mongoose.isValidObjectId(orderId) || !mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "That order or product doesn't look right.");
  }

  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) throw new ApiError(404, "Order not found.");
  if (order.status !== "delivered") {
    throw new ApiError(400, "You can review a product once its order is delivered.");
  }

  const line = (order.items || []).find((i) => String(i.product) === String(productId));
  if (!line) throw new ApiError(400, "That product isn't part of this order.");

  const product = await Product.findById(productId).select("name");

  const review = await Review.findOneAndUpdate(
    { order: order._id, product: productId },
    {
      $set: {
        user: req.user._id,
        name: req.user.name || "Customer",
        productName: product?.name || line.name || "",
        rating,
        body,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.status(201).json(review);
});

/** DELETE /api/reviews/mine/:id — a customer removing their own review. */
export const deleteMyReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
  if (!review) throw new ApiError(404, "Review not found.");
  await review.deleteOne();
  res.json({ id: req.params.id, deleted: true });
});

/* ---------------- admin ---------------- */

/** GET /api/reviews — every review on the site, newest first. */
export const listAllReviews = asyncHandler(async (_req, res) => {
  const reviews = await Review.find()
    .populate("user", "name email")
    .populate("product", "name slug code images")
    .sort({ createdAt: -1 });

  res.json(reviews);
});

/** DELETE /api/reviews/:id — take a review off the website. */
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, "Review not found.");
  await review.deleteOne();
  res.json({ id: req.params.id, deleted: true });
});
