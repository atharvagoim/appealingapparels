import { Router } from "express";
import {
  createOrder,
  verifyPayment,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  updateShipment,
  addOrderNote,
  getInvoice,
  clearPendingOrders,
  deletePendingOrder,
} from "../controllers/orderController.js";
import { protect, requireAdmin } from "../middleware/auth.js";

const router = Router();

// Customer (authenticated) — Standard Checkout flow
router.post("/create-order", protect, createOrder);
router.post("/verify-payment", protect, verifyPayment);
router.get("/mine", protect, getMyOrders);
router.get("/:id/invoice", protect, getInvoice);

// Admin
router.get("/", protect, requireAdmin, getAllOrders);
router.delete("/pending", protect, requireAdmin, clearPendingOrders);
router.delete("/:id", protect, requireAdmin, deletePendingOrder);
router.put("/:id/status", protect, requireAdmin, updateOrderStatus);
router.put("/:id/shipment", protect, requireAdmin, updateShipment);
router.post("/:id/notes", protect, requireAdmin, addOrderNote);

export default router;
