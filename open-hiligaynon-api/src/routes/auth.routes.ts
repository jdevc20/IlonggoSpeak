import { Router } from "express";
import { login, me, teamMembers } from "../controllers/auth.controller.js";
import {
  requireTeamAuth,
  requireTeamRole,
} from "../middleware/team-auth.middleware.js";

const router = Router();

router.post("/login", login);
router.get("/me", requireTeamAuth, me);
router.get(
  "/team",
  requireTeamAuth,
  requireTeamRole("ADMIN"),
  teamMembers
);

export default router;
