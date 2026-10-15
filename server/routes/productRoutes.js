import { Router } from "express";
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  backfillProductCodes,
  backfillProductDefaults,
} from "../controllers/productController.js";
import { protect, requireAdmin } from "../middleware/auth.js";
import { adminWriteLimiter } from "../middleware/rateLimiters.js";

const router = Router();

// Public reads
router.get("/", getProducts);
router.get("/:slug", getProductBySlug);

// Admin-only writes (Phase 5)
router.post("/", protect, requireAdmin, adminWriteLimiter, createProduct);
router.put("/:id", protect, requireAdmin, adminWriteLimiter, updateProduct);
router.delete("/:id", protect, requireAdmin, adminWriteLimiter, deleteProduct);
router.post("/backfill-codes", protect, requireAdmin, adminWriteLimiter, backfillProductCodes);
router.post("/backfill-defaults", protect, requireAdmin, adminWriteLimiter, backfillProductDefaults);

export default router;
