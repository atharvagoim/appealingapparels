import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settingsController.js";
import { protect, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", getSettings); // public read
router.put("/", protect, requireAdmin, updateSettings); // admin write

export default router;
