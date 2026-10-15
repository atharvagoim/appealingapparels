import { Router } from "express";
import {
  register,
  login,
  me,
  updateMe,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { authLimiter, loginAccountLimiter, forgotPasswordLimiter } from "../middleware/rateLimiters.js";

const router = Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, loginAccountLimiter, login);
router.post("/forgot-password", authLimiter, forgotPasswordLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.get("/me", protect, me);
router.put("/me", protect, updateMe);

export default router;
