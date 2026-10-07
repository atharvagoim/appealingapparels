import { Router } from "express";
import { listTeam, addTeamMember, removeTeamMember, setPrimaryAdmin } from "../controllers/teamController.js";
import { protect, requireAdmin } from "../middleware/auth.js";
import { requireAdminPin } from "../middleware/adminPin.js";

const router = Router();

// Every route here needs: signed in, an admin, AND the access PIN — the PIN
// is checked per-request (not just once client-side) so this can't be
// bypassed by calling the API directly.
router.use(protect, requireAdmin, requireAdminPin);

router.get("/", listTeam);
router.post("/", addTeamMember);
router.post("/primary", setPrimaryAdmin);
router.delete("/:id", removeTeamMember);

export default router;
