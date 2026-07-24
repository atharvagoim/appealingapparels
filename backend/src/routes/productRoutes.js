import { Router } from "express";
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  backfillProductCodes,
} from "../controllers/productController.js";
import { protect, requireAdmin } from "../middleware/auth.js";

const router = Router();

// Public reads
router.get("/", getProducts);
router.get("/:slug", getProductBySlug);

// Admin-only writes (Phase 5)
router.post("/", protect, requireAdmin, createProduct);
router.put("/:id", protect, requireAdmin, updateProduct);
router.delete("/:id", protect, requireAdmin, deleteProduct);
router.post("/backfill-codes", protect, requireAdmin, backfillProductCodes);

export default router;
