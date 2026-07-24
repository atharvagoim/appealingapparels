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

const router = Router();

// Storefront
router.get("/public", listPublicCoupons);
router.get("/checkout", protect, listCheckoutCoupons);
router.post("/apply", protect, applyCoupon);

// Admin
router.get("/", protect, requireAdmin, listCoupons);
router.post("/", protect, requireAdmin, createCoupon);
router.put("/:id", protect, requireAdmin, updateCoupon);
router.delete("/:id", protect, requireAdmin, deleteCoupon);
router.patch("/:id/toggle", protect, requireAdmin, toggleCoupon);

export default router;
