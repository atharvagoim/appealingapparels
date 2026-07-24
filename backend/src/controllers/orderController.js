import Order from "../models/Order.js";
import { streamInvoice } from "../utils/invoice.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import { evaluateCoupon, computeDiscount } from "../utils/coupons.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { razorpay, paymentsConfigured, verifyPaymentSignature } from "../utils/razorpay.js";

const FREE_SHIPPING_THRESHOLD = 1499; // ₹
const FLAT_SHIPPING = 99; // ₹
const MIN_AMOUNT_PAISE = 100;

/**
 * POST /api/orders/create-order  (auth required)
 * Body: { items: [{ id|productId, size, quantity }], shippingAddress? }
 * Prices are recomputed from the database — client amounts are never trusted.
 * Creates a Razorpay order + a local pending Order, returns what the frontend
 * needs to open Standard Checkout.
 */
export const createOrder = asyncHandler(async (req, res) => {
  if (!paymentsConfigured || !razorpay) {
    throw new ApiError(503, "Payments are not configured on the server.");
  }

  const { items = [], shippingAddress, couponCode } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Your cart is empty.");
  }

  // Re-price every line from the DB.
  const orderItems = [];
  let subtotal = 0;
  for (const line of items) {
    const productId = line.id || line.productId;
    const quantity = Math.max(1, Number(line.quantity) || 1);
    if (!productId) throw new ApiError(400, "Invalid cart item.");

    const product = await Product.findById(productId);
    if (!product) throw new ApiError(400, `Product no longer available.`);

    // Snapshot the photo of the colourway actually bought, not just the first
    // image on the product.
    const color = line.color ? String(line.color) : "";
    const variant = color
      ? (product.colors || []).find((c) => c.name === color)
      : null;
    const image = variant?.images?.[0] || product.images?.[0] || "";

    subtotal += product.price * quantity;
    orderItems.push({
      product: product._id,
      name: product.name,
      code: product.code || "",
      image,
      size: line.size || "",
      color,
      price: product.price,
      quantity,
    });
  }

  // Coupon is re-validated here from scratch — the client's discount is never trusted.
  let couponSnapshot = undefined;
  let discount = 0;
  let freeShippingFromCoupon = false;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: String(couponCode).trim().toUpperCase() });
    if (!coupon) throw new ApiError(404, "That coupon code doesn't exist.");
    const result = evaluateCoupon(coupon, { subtotal, userId: req.user._id });
    if (!result.eligible) throw new ApiError(400, result.reason || "This coupon can't be applied.");
    discount = computeDiscount(coupon, subtotal);
    freeShippingFromCoupon = coupon.type === "freeShipping";
    couponSnapshot = {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount: discount,
    };
  }

  const shipping =
    freeShippingFromCoupon || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const total = Math.max(0, subtotal + shipping - discount);
  const amountPaise = Math.round(total * 100);

  if (amountPaise < MIN_AMOUNT_PAISE) {
    throw new ApiError(400, "Order total is below the minimum payable amount.");
  }

  // Create the Razorpay order (auth/API errors bubble to the catch below).
  let rzpOrder;
  try {
    rzpOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: { userId: String(req.user._id) },
    });
  } catch (err) {
    const status = err?.statusCode === 401 ? 401 : 500;
    throw new ApiError(status, "Could not create the payment order. Please try again.");
  }

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    amounts: { subtotal, shipping, discount, total },
    coupon: couponSnapshot,
    shippingAddress: shippingAddress || {},
    status: "pending",
    payment: {
      provider: "razorpay",
      status: "created",
      razorpayOrderId: rzpOrder.id,
    },
  });

  res.status(201).json({
    orderId: order.id,
    razorpayOrderId: rzpOrder.id,
    amount: amountPaise,
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID, // publishable key id only
    amounts: { subtotal, shipping, discount, total },
  });
});

/**
 * POST /api/orders/verify-payment  (auth required)
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }
 * Verifies the signature; only marks the order paid + decrements stock on match.
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ApiError(400, "Missing payment fields.");
  }

  const valid = verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!valid) {
    // Signature mismatch — never mark as paid.
    throw new ApiError(400, "Payment verification failed.");
  }

  // Match the local order to this user + this Razorpay order.
  const order = await Order.findOne({
    _id: orderId,
    user: req.user._id,
    "payment.razorpayOrderId": razorpay_order_id,
  });
  if (!order) throw new ApiError(404, "Order not found.");

  if (order.status !== "paid") {
    order.status = "paid";
    order.payment.status = "captured";
    order.payment.razorpayPaymentId = razorpay_payment_id;
    order.payment.razorpaySignature = razorpay_signature;

    // Human-facing order number, issued only once payment succeeds. Derived
    // from the order id, so it's unique and stable without a counter.
    if (!order.orderNumber) {
      const d = new Date();
      const yy = String(d.getFullYear()).slice(-2);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const tail = String(order._id).slice(-6).toUpperCase();
      order.orderNumber = `AA-${yy}${mm}-${tail}`;
    }

    order.timeline.push({
      status: "paid",
      at: new Date(),
      byName: "Razorpay",
      note: "Payment verified automatically.",
    });
    order.activity.push({
      action: "Payment verified",
      detail: `Razorpay payment ${razorpay_payment_id}`,
      at: new Date(),
      byName: "Razorpay",
    });

    await order.save();

    // Coupon usage only counts once payment is actually confirmed — an
    // abandoned checkout should never eat into a limited coupon's stock.
    if (order.coupon?.code) {
      const coupon = await Coupon.findOne({ code: order.coupon.code });
      if (coupon) {
        coupon.redemptions.push({
          user: order.user,
          order: order._id,
          amount: order.coupon.discountAmount || 0,
        });
        await coupon.save();
      }
    }

    // Decrement stock for each purchased size.
    for (const item of order.items) {
      if (!item.product) continue;
      const product = await Product.findById(item.product);
      if (!product) continue;
      // Match on a normalised size so casing/spacing never causes a silent miss.
      const wanted = String(item.size || "").trim().toUpperCase();
      const sizeRow = product.sizes.find(
        (s) => String(s.size || "").trim().toUpperCase() === wanted
      );
      if (sizeRow) {
        sizeRow.stock = Math.max(0, sizeRow.stock - item.quantity);
        await product.save();
      }
    }
  }

  res.json({ success: true, orderId: order.id, status: order.status });
});

/** GET /api/orders/mine — the signed-in customer's orders. */
export const getMyOrders = asyncHandler(async (req, res) => {
  // "pending" orders are unfinished payment attempts — they aren't real orders
  // yet, so we never show them to the customer.
  const orders = await Order.find({
    user: req.user._id,
    status: { $ne: "pending" },
  }).sort("-createdAt");
  res.json(orders);
});

/** GET /api/orders — all orders (admin). */
export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate("user", "name email phone")
    .sort("-createdAt");
  res.json(orders);
});

/**
 * The only moves an order is allowed to make. Fulfilment runs forwards only —
 * paid → shipped → delivered — and cancelling is possible right up until the
 * parcel is delivered.
 */
const NEXT_STATUS = {
  paid: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

const STATUS_LABEL = {
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Append to the audit trail. */
function logActivity(order, req, action, detail = "") {
  order.activity.push({
    action,
    detail,
    at: new Date(),
    byName: req.user?.name || "Admin",
    by: req.user?._id || null,
  });
}

/**
 * PUT /api/orders/:id/status — admin moves an order along.
 *
 * Marking an order shipped requires the dispatch details, so a parcel is never
 * recorded as sent without a courier and tracking number attached.
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note = "", courier, trackingNumber, dispatchDate, trackingUrl } =
    req.body;

  if (!Object.keys(NEXT_STATUS).includes(status)) {
    throw new ApiError(400, "Unknown order status.");
  }

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found.");

  // Unpaid orders aren't fulfillable, so their status is locked.
  if (order.status === "pending") {
    throw new ApiError(
      400,
      "This order hasn't been paid for, so its status can't be changed."
    );
  }

  if (order.status === status) {
    throw new ApiError(400, `This order is already marked ${STATUS_LABEL[status]}.`);
  }

  const allowed = NEXT_STATUS[order.status] || [];
  if (!allowed.includes(status)) {
    throw new ApiError(
      400,
      `A ${STATUS_LABEL[order.status].toLowerCase()} order can't be moved to ${STATUS_LABEL[
        status
      ].toLowerCase()}.`
    );
  }

  // Shipping needs its paperwork before the status can move.
  if (status === "shipped") {
    const missing = [];
    if (!String(courier || "").trim()) missing.push("courier name");
    if (!String(trackingNumber || "").trim()) missing.push("tracking number");
    if (!dispatchDate) missing.push("dispatch date");
    if (missing.length) {
      throw new ApiError(400, `Please provide the ${missing.join(", ")}.`);
    }

    const when = new Date(dispatchDate);
    if (Number.isNaN(when.getTime())) {
      throw new ApiError(400, "That dispatch date doesn't look right.");
    }

    order.shipment = {
      courier: String(courier).trim(),
      trackingNumber: String(trackingNumber).trim(),
      dispatchDate: when,
      trackingUrl: String(trackingUrl || "").trim(),
    };
  }

  const from = order.status;
  order.status = status;

  const byName = req.user?.name || "Admin";
  order.timeline.push({
    status,
    at: new Date(),
    byName,
    by: req.user?._id || null,
    note: String(note || "").trim().slice(0, 500),
  });

  logActivity(
    order,
    req,
    `Status changed to ${STATUS_LABEL[status]}`,
    status === "shipped"
      ? `From ${STATUS_LABEL[from]} · ${order.shipment.courier} · ${order.shipment.trackingNumber}`
      : `From ${STATUS_LABEL[from]}`
  );

  await order.save();
  res.json(order);
});

/** PUT /api/orders/:id/shipment — correct the dispatch details after the fact. */
export const updateShipment = asyncHandler(async (req, res) => {
  const { courier, trackingNumber, dispatchDate, trackingUrl } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found.");
  if (!["shipped", "delivered"].includes(order.status)) {
    throw new ApiError(400, "This order hasn't been dispatched yet.");
  }

  if (courier !== undefined) order.shipment.courier = String(courier).trim();
  if (trackingNumber !== undefined) {
    order.shipment.trackingNumber = String(trackingNumber).trim();
  }
  if (trackingUrl !== undefined) {
    order.shipment.trackingUrl = String(trackingUrl).trim();
  }
  if (dispatchDate) {
    const when = new Date(dispatchDate);
    if (Number.isNaN(when.getTime())) {
      throw new ApiError(400, "That dispatch date doesn't look right.");
    }
    order.shipment.dispatchDate = when;
  }

  logActivity(
    order,
    req,
    "Shipping details updated",
    `${order.shipment.courier} · ${order.shipment.trackingNumber}`
  );

  await order.save();
  res.json(order);
});

/** POST /api/orders/:id/notes — attach a note without changing the status. */
export const addOrderNote = asyncHandler(async (req, res) => {
  const note = String(req.body.note || "").trim();
  if (!note) throw new ApiError(400, "Please type a note.");

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found.");

  logActivity(order, req, "Note added", note.slice(0, 500));
  await order.save();

  res.json(order);
});

/** GET /api/orders/:id/invoice — PDF invoice for a paid order. */
export const getInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found.");

  const isOwner = String(order.user) === String(req.user._id);
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "You can't view this invoice.");
  }

  if (order.status === "pending") {
    throw new ApiError(400, "An invoice is only issued once payment is complete.");
  }

  const name = order.orderNumber || order.id;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="invoice-${name}.pdf"`);
  streamInvoice(order, res);
});

/** DELETE /api/orders/pending — remove ALL pending (unpaid) orders. */
export const clearPendingOrders = asyncHandler(async (_req, res) => {
  const result = await Order.deleteMany({ status: "pending" });
  res.json({ deleted: result.deletedCount || 0 });
});

/** DELETE /api/orders/:id — remove ONE order, but only if it's still pending. */
export const deletePendingOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, "Order not found.");
  if (order.status !== "pending") {
    throw new ApiError(400, "Only pending (unpaid) orders can be deleted.");
  }
  await order.deleteOne();
  res.json({ deleted: 1, id: req.params.id });
});
