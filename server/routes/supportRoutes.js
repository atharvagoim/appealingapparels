import { Router } from "express";
import {
  listMyThreads,
  getMyThreadById,
  createMyThread,
  postMyMessage,
  listThreads,
  getThread,
  postAdminMessage,
  setThreadStatus,
  deleteThread,
} from "../controllers/supportController.js";
import { protect, requireAdmin } from "../middleware/auth.js";
import { adminWriteLimiter, contentLimiter } from "../middleware/rateLimiters.js";

const router = Router();

// Customer — declared above the admin "/:id" routes so they aren't shadowed.
router.get("/me/threads", protect, listMyThreads);
router.post("/me/threads", protect, contentLimiter, createMyThread);
router.get("/me/threads/:id", protect, getMyThreadById);
router.post("/me/threads/:id/messages", protect, contentLimiter, postMyMessage);

// Admin
router.get("/", protect, requireAdmin, listThreads);
router.get("/:id", protect, requireAdmin, getThread);
router.post("/:id/messages", protect, requireAdmin, adminWriteLimiter, postAdminMessage);
router.put("/:id/status", protect, requireAdmin, adminWriteLimiter, setThreadStatus);
router.delete("/:id", protect, requireAdmin, adminWriteLimiter, deleteThread);

export default router;
