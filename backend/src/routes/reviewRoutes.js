import { Router } from "express";
import {
  listProductReviews,
  listRatingSummary,
  listMyReviewableOrders,
  listMyReviews,
  getReviewPrompt,
  markPromptSeen,
  createReview,
  deleteMyReview,
  listAllReviews,
  deleteReview,
} from "../controllers/reviewController.js";
import { protect, requireAdmin } from "../middleware/auth.js";

const router = Router();

// Public — anyone browsing the shop.
router.get("/summary", listRatingSummary);
router.get("/product/:productId", listProductReviews);

// Customer. These sit above "/:id" so they aren't swallowed by it.
router.get("/mine", protect, listMyReviews);
router.get("/mine/orders", protect, listMyReviewableOrders);
router.delete("/mine/:id", protect, deleteMyReview);
router.get("/prompt", protect, getReviewPrompt);
router.post("/prompt/:orderId/seen", protect, markPromptSeen);
router.post("/", protect, createReview);

// Admin
router.get("/", protect, requireAdmin, listAllReviews);
router.delete("/:id", protect, requireAdmin, deleteReview);

export default router;
