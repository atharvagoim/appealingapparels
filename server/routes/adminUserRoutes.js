import { Router } from "express";
import { listCustomers, getCustomer } from "../controllers/adminUserController.js";
import { protect, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/customers", protect, requireAdmin, listCustomers);
router.get("/customers/:id", protect, requireAdmin, getCustomer);

export default router;
