import { Router } from "express";
import {
  datasetExport,
  dictionaryLookup,
  generateDataset,
  textAnalysis,
} from "../controllers/engine.controller.js";
import {
  requireTeamAuth,
  requireTeamRole,
} from "../middleware/team-auth.middleware.js";

const router = Router();

router.use(requireTeamAuth);

router.get("/dictionary", dictionaryLookup);
router.get("/text-units/:id/analysis", textAnalysis);
router.post("/datasets/generate", requireTeamRole("ADMIN"), generateDataset);
router.get("/datasets/:id/export", requireTeamRole("REVIEWER", "ADMIN"), datasetExport);

export default router;
