import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settingsController.js";
import { protect, requireAdmin } from "../middleware/auth.js";
import { adminWriteLimiter } from "../middleware/rateLimiters.js";

const router = Router();

router.get("/", getSettings); // public read
router.put("/", protect, requireAdmin, adminWriteLimiter, updateSettings); // admin write

export default router;
