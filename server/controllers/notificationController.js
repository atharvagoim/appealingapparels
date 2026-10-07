import Order from "../models/Order.js";
import SupportThread from "../models/SupportThread.js";
import Review from "../models/Review.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const MAX_EVENTS = 30;

/**
 * GET /api/admin/notifications?since=<ISO timestamp>
 *
 * Polled from the admin panel every so often — this isn't a live socket
 * connection, it's "what's happened since I last checked", which is simpler
 * to run reliably on any host and doesn't need a persistent connection kept
 * open. Covers the three things worth an admin's attention as they happen:
 * new orders, new customer messages in support, and new reviews.
 */
export const getRecentEvents = asyncHandler(async (req, res) => {
  const now = new Date();
  const sinceRaw = req.query.since;
  // First-ever check (no `since` yet) only looks back an hour, so opening
  // the admin panel for the first time doesn't dump the site's entire
  // history in as "new".
  const since =
    sinceRaw && !Number.isNaN(Date.parse(sinceRaw))
      ? new Date(sinceRaw)
      : new Date(now.getTime() - 60 * 60 * 1000);

  const [orders, threads, reviews] = await Promise.all([
    Order.find({ createdAt: { $gt: since }, status: { $ne: "pending" } })
      .sort({ createdAt: -1 })
      .limit(MAX_EVENTS)
      .select("orderNumber amounts.total shippingAddress.fullName user createdAt")
      .populate("user", "name")
      .lean(),

    SupportThread.find({
      messages: { $elemMatch: { from: "user", createdAt: { $gt: since } } },
    })
      .sort({ lastMessageAt: -1 })
      .limit(MAX_EVENTS)
      .select("messages user")
      .populate("user", "name")
      .lean(),

    Review.find({ createdAt: { $gt: since } })
      .sort({ createdAt: -1 })
      .limit(MAX_EVENTS)
      .select("name productName rating createdAt")
      .lean(),
  ]);

  const orderEvents = orders.map((o) => ({
    type: "order",
    id: String(o._id),
    at: o.createdAt,
    message: `New order ${o.orderNumber} — ₹${Number(o.amounts?.total || 0).toLocaleString("en-IN")}`,
    sub: o.shippingAddress?.fullName || o.user?.name || "Customer",
    link: "/admin/orders",
  }));

  // A thread can have several new messages since `since` — one event per
  // thread (not per message) is what an admin actually wants to see here.
  const supportEvents = threads.map((t) => {
    const newest = [...t.messages]
      .filter((m) => m.from === "user" && new Date(m.createdAt) > since)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    return {
      type: "support",
      id: String(t._id),
      at: newest?.createdAt || t.updatedAt,
      message: `New message from ${t.user?.name || "a customer"}`,
      sub: (newest?.body || "").slice(0, 80),
      link: `/admin/support?thread=${t._id}`,
    };
  });

  const reviewEvents = reviews.map((r) => ({
    type: "review",
    id: String(r._id),
    at: r.createdAt,
    message: `New ${r.rating}★ review from ${r.name || "a customer"}`,
    sub: r.productName || "",
    link: "/admin/reviews",
  }));

  const events = [...orderEvents, ...supportEvents, ...reviewEvents]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, MAX_EVENTS);

  res.json({ now: now.toISOString(), events });
});
