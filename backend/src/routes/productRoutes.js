import { Router } from "express";
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
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

export default router;
