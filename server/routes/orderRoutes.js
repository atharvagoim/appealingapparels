import { Router } from "express";
import {
  createOrder,
  verifyPayment,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  refundOrder,
  updateShipment,
  addOrderNote,
  getInvoice,
  clearPendingOrders,
  deletePendingOrder,
} from "../controllers/orderController.js";
import { myTestMode } from "../controllers/testModeController.js";
import { protect, requireAdmin } from "../middleware/auth.js";
import { adminWriteLimiter, checkoutLimiter } from "../middleware/rateLimiters.js";

const router = Router();

// Customer (authenticated) — Standard Checkout flow
router.get("/test-mode", protect, myTestMode);
router.post("/create-order", protect, checkoutLimiter, createOrder);
router.post("/verify-payment", protect, checkoutLimiter, verifyPayment);
router.get("/mine", protect, getMyOrders);
router.get("/:id/invoice", protect, getInvoice);

// Admin
router.get("/", protect, requireAdmin, getAllOrders);
router.delete("/pending", protect, requireAdmin, adminWriteLimiter, clearPendingOrders);
router.delete("/:id", protect, requireAdmin, adminWriteLimiter, deletePendingOrder);
router.put("/:id/status", protect, requireAdmin, adminWriteLimiter, updateOrderStatus);
router.post("/:id/refund", protect, requireAdmin, adminWriteLimiter, refundOrder);
router.put("/:id/shipment", protect, requireAdmin, adminWriteLimiter, updateShipment);
router.post("/:id/notes", protect, requireAdmin, adminWriteLimiter, addOrderNote);

export default router;
