import { Router } from "express";
import {
  createSentence,
  deleteSentence,
  deleteSentencesBulk,
  getSentenceById,
  getSentences,
  updateSentence,
  updateSentenceStatus,
} from "../controllers/sentence.controller.js";
import {
  requireTeamAuth,
  requireTeamRole,
} from "../middleware/team-auth.middleware.js";

const router = Router();

router.use(requireTeamAuth);

router.get("/", getSentences);
router.post("/", createSentence);
router.post("/bulk-delete", requireTeamRole("ADMIN"), deleteSentencesBulk);

router.get("/:id", getSentenceById);
router.patch(
  "/:id/status",
  requireTeamRole("REVIEWER", "ADMIN"),
  updateSentenceStatus
);
router.patch("/:id", updateSentence);
router.delete("/:id", requireTeamRole("ADMIN"), deleteSentence);

export default router;
