import { Router } from "express";
import { getTestMode, setTestMode } from "../controllers/testModeController.js";
import { protect, requireAdmin } from "../middleware/auth.js";
import { requireAdminPin } from "../middleware/adminPin.js";
import { adminPinLimiter, adminWriteLimiter } from "../middleware/rateLimiters.js";

const router = Router();

// Same protection as the Admin Access panel: signed in, an admin, AND the PIN —
// checked on every request, so it can't be bypassed by calling the API directly.
router.use(protect, requireAdmin, adminPinLimiter, requireAdminPin);

router.get("/", getTestMode);
router.put("/", adminWriteLimiter, setTestMode);

export default router;
