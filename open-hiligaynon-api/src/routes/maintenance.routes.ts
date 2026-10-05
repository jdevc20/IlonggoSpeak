import { Router } from "express";
import {
  createMaintenance,
  getMaintenanceOptions,
  removeMaintenance,
  updateMaintenance,
} from "../controllers/maintenance.controller.js";
import {
  requireTeamAuth,
  requireTeamRole,
} from "../middleware/team-auth.middleware.js";

const router = Router();

router.use(requireTeamAuth);
router.get("/options", getMaintenanceOptions);
router.post("/options", requireTeamRole("ADMIN"), createMaintenance);
router.patch("/options/:id", requireTeamRole("ADMIN"), updateMaintenance);
router.delete("/options/:id", requireTeamRole("ADMIN"), removeMaintenance);

export default router;
