import { Router } from "express";
import {
  castVote,
  createSentence,
  deleteSentence,
  deleteSentencesBulk,
  getSentenceById,
  getSentences,
  updateSentence,
  updateSentenceStatus,
} from "../controllers/sentence.controller.js";

const router = Router();

router.get("/", getSentences);
router.post("/", createSentence);
router.post("/bulk-delete", deleteSentencesBulk);
router.post("/vote", castVote);

router.get("/:id", getSentenceById);
router.patch("/:id/status", updateSentenceStatus);
router.patch("/:id", updateSentence);
router.delete("/:id", deleteSentence);

export default router;
