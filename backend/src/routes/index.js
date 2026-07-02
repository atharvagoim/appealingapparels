import { Router } from "express";
import productRoutes from "./productRoutes.js";
import authRoutes from "./authRoutes.js";
import settingsRoutes from "./settingsRoutes.js";

const router = Router();

router.get("/health", (req, res) =>
  res.json({ status: "ok", service: "appealing-apparels-api", time: new Date().toISOString() })
);

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/settings", settingsRoutes);

// Phase 6 will mount: /orders, /cart, /wishlist

export default router;
