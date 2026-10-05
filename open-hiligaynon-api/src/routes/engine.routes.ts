import { Router } from "express";
import {
  datasetExport,
  dictionaryLookup,
  generateDataset,
  textAnalysis,
} from "../controllers/engine.controller.js";

const router = Router();

router.get("/dictionary", dictionaryLookup);
router.get("/text-units/:id/analysis", textAnalysis);
router.post("/datasets/generate", generateDataset);
router.get("/datasets/:id/export", datasetExport);

export default router;
