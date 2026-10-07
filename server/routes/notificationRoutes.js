import { Router } from "express";
import { getRecentEvents } from "../controllers/notificationController.js";
import { protect, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", protect, requireAdmin, getRecentEvents);

export default router;
