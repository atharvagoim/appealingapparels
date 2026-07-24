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

const router = Router();

// Customer — declared above the admin "/:id" routes so they aren't shadowed.
router.get("/me/threads", protect, listMyThreads);
router.post("/me/threads", protect, createMyThread);
router.get("/me/threads/:id", protect, getMyThreadById);
router.post("/me/threads/:id/messages", protect, postMyMessage);

// Admin
router.get("/", protect, requireAdmin, listThreads);
router.get("/:id", protect, requireAdmin, getThread);
router.post("/:id/messages", protect, requireAdmin, postAdminMessage);
router.put("/:id/status", protect, requireAdmin, setThreadStatus);
router.delete("/:id", protect, requireAdmin, deleteThread);

export default router;
