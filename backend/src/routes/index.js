import { Router } from "express";
import productRoutes from "./productRoutes.js";
import authRoutes from "./authRoutes.js";
import settingsRoutes from "./settingsRoutes.js";
import orderRoutes from "./orderRoutes.js";
import addressRoutes from "./addressRoutes.js";
import supportRoutes from "./supportRoutes.js";
import adminUserRoutes from "./adminUserRoutes.js";
import couponRoutes from "./couponRoutes.js";
import reviewRoutes from "./reviewRoutes.js";

const router = Router();

router.get("/health", (req, res) =>
  res.json({ status: "ok", service: "appealing-apparels-api", time: new Date().toISOString() })
);

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/settings", settingsRoutes);
router.use("/orders", orderRoutes);
router.use("/addresses", addressRoutes);
router.use("/support", supportRoutes);
router.use("/admin", adminUserRoutes);
router.use("/coupons", couponRoutes);
router.use("/reviews", reviewRoutes);

// Phase 6 will mount: /orders, /cart, /wishlist

export default router;
