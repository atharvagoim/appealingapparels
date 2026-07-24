import User from "../models/User.js";
import Order from "../models/Order.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

/**
 * GET /api/admin/customers
 * Every non-admin customer with a light order summary, newest sign-ups first.
 */
export const listCustomers = asyncHandler(async (_req, res) => {
  const users = await User.find({ role: "user" }).sort("-createdAt").lean();

  // One aggregate pass for spend + order counts (paid orders only for spend).
  const stats = await Order.aggregate([
    { $match: { status: { $ne: "pending" } } },
    {
      $group: {
        _id: "$user",
        orders: { $sum: 1 },
        spend: { $sum: "$amounts.total" },
        last: { $max: "$createdAt" },
      },
    },
  ]);
  const byUser = new Map(stats.map((s) => [String(s._id), s]));

  const rows = users.map((u) => {
    const s = byUser.get(String(u._id));
    return {
      id: String(u._id),
      name: u.name,
      email: u.email,
      phone: u.phone || "",
      addressCount: (u.addresses || []).length,
      createdAt: u.createdAt,
      orders: s?.orders || 0,
      spend: s?.spend || 0,
      lastOrderAt: s?.last || null,
    };
  });

  res.json(rows);
});

/**
 * GET /api/admin/customers/:id
 * A single customer's full profile, saved addresses and order history.
 */
export const getCustomer = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user || user.role === "admin") {
    throw new ApiError(404, "Customer not found.");
  }

  const orders = await Order.find({ user: user._id }).sort("-createdAt").lean();

  res.json({
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    createdAt: user.createdAt,
    addresses: user.addresses || [],
    orders,
  });
});
