import { Router } from "express";
import {
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCoupon,
  listPublicCoupons,
  listCheckoutCoupons,
  applyCoupon,
} from "../controllers/couponController.js";
import { protect, requireAdmin } from "../middleware/auth.js";
import { adminWriteLimiter, couponLimiter } from "../middleware/rateLimiters.js";

const router = Router();

// Storefront
router.get("/public", listPublicCoupons);
router.get("/checkout", protect, listCheckoutCoupons);
router.post("/apply", protect, couponLimiter, applyCoupon);

// Admin
router.get("/", protect, requireAdmin, listCoupons);
router.post("/", protect, requireAdmin, adminWriteLimiter, createCoupon);
router.put("/:id", protect, requireAdmin, adminWriteLimiter, updateCoupon);
router.delete("/:id", protect, requireAdmin, adminWriteLimiter, deleteCoupon);
router.patch("/:id/toggle", protect, requireAdmin, adminWriteLimiter, toggleCoupon);

export default router;
