import { Request, Response } from "express";
import type { TeamRequest } from "../middleware/team-auth.middleware.js";
import * as sentenceService from "../services/sentence.service.js";
import { assertActiveMaintenanceValue } from "../services/maintenance.service.js";
import { buildPaginationMeta, parsePagination } from "../utils/pagination.js";

const ALLOWED_STATUSES = new Set(["pending", "verified", "approved", "rejected"]);
const validateMaintenanceSelections = async (input: {
  sentiment?: number;
  intent?: string | null;
  isSarcastic?: boolean;
  translationType?: string | null;
  register?: string | null;
  domain?: string | null;
  languagePair?: string | null;
  unitType?: string | null;
}) => {
  await Promise.all([
    assertActiveMaintenanceValue("sentiment", input.sentiment, "sentiment"),
    assertActiveMaintenanceValue("intent", input.intent, "intent"),
    assertActiveMaintenanceValue("sarcasm", input.isSarcastic, "isSarcastic"),
    assertActiveMaintenanceValue("translation_type", input.translationType, "translationType"),
    assertActiveMaintenanceValue("register", input.register, "register"),
    assertActiveMaintenanceValue("domain", input.domain, "domain"),
    assertActiveMaintenanceValue("language_pair", input.languagePair, "languagePair"),
    assertActiveMaintenanceValue("unit_type", input.unitType, "unitType"),
  ]);
};


const parseSentiment = (value: unknown) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? NaN : parsed;
};

const validateSemanticInput = (
  sentiment: number | undefined,
  status?: string,
  confidence?: number | null
) => {
  if (sentiment !== undefined && (Number.isNaN(sentiment) || sentiment < 0 || sentiment > 2)) {
    return "'sentiment' must be 0 (negative), 1 (neutral), or 2 (positive).";
  }

  if (status !== undefined && !ALLOWED_STATUSES.has(status)) {
    return "'status' must be pending, verified, approved, or rejected.";
  }

  if (
    confidence !== undefined &&
    confidence !== null &&
    (Number.isNaN(confidence) || confidence < 0 || confidence > 1)
  ) {
    return "'confidence' must be a number between 0 and 1.";
  }

  return null;
};

export const getSentences = async (req: Request, res: Response) => {
  try {
    const pagination = parsePagination(req.query.page, req.query.limit, 25, 100);
    if (!pagination) {
      return res.status(400).json({
        error: "Invalid pagination parameter",
        details: "'page' must be positive and 'limit' must be between 1 and 100.",
      });
    }

    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const statuses =
      typeof req.query.status === "string"
        ? req.query.status.split(",").map((value) => value.trim()).filter(Boolean)
        : [];
    const sentiment = parseSentiment(req.query.sentiment);
    const isSarcastic =
      typeof req.query.isSarcastic === "string"
        ? req.query.isSarcastic === "true"
        : undefined;

    const invalidStatus = statuses.find((status) => !ALLOWED_STATUSES.has(status));
    const validationError = validateSemanticInput(sentiment, invalidStatus);
    if (validationError) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationError,
      });
    }

    const result = await sentenceService.getAllSentences({
      skip: pagination.skip,
      take: pagination.limit,
      search,
      sentiment,
      isSarcastic,
      status: statuses.length > 0 ? statuses : undefined,
    });

    return res.status(200).json({
      items: result.items,
      meta: {
        ...buildPaginationMeta(result.meta.total, pagination.page, pagination.limit),
        skip: pagination.skip,
        take: pagination.limit,
      },
    });
  } catch (error: any) {
    console.error("[getSentences Error]:", error);
    return res.status(500).json({
      error: "Failed to fetch translations",
      details: error?.message || "An unexpected error occurred.",
    });
  }
};

export const getSentenceById = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id) {
      return res.status(400).json({
        error: "Missing required parameter",
        details: "A valid translation ID is required.",
      });
    }

    const data = await sentenceService.getSentenceById(id);

    if (!data) {
      return res.status(404).json({
        error: "Resource not found",
        details: `No translation found with ID: ${id}`,
      });
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error("[getSentenceById Error]:", error);
    return res.status(500).json({
      error: "Failed to fetch the translation",
      details: error?.message || "An unexpected error occurred.",
    });
  }
};

export const createSentence = async (req: Request, res: Response) => {
  try {
    const actor = (req as TeamRequest).teamUser!;
    const {
      english,
      hiligaynon,
      intent,
      translationType,
      confidence,
      notes,
      register,
      domain,
      languagePair,
      unitType,
    } = req.body;

    const sentiment = parseSentiment(req.body.sentiment);
    const parsedConfidence =
      confidence === undefined || confidence === null ? confidence : Number(confidence);
    const isSarcastic =
      req.body.isSarcastic === true || req.body.isSarcastic === "true";

    if (typeof english !== "string" || !english.trim() || typeof hiligaynon !== "string" || !hiligaynon.trim()) {
      return res.status(400).json({
        error: "Validation failed",
        details: "Both 'english' and 'hiligaynon' must be non-empty strings.",
      });
    }

    const validationError = validateSemanticInput(sentiment, undefined, parsedConfidence);
    if (validationError) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationError,
      });
    }

    await validateMaintenanceSelections({
      sentiment,
      intent,
      isSarcastic,
      translationType: translationType ?? "natural",
      register,
      domain,
      languagePair: languagePair ?? "en-hil",
      unitType: unitType ?? "sentence",
    });

    const data = await sentenceService.createSentence({
      english: english.trim(),
      hiligaynon: hiligaynon.trim(),
      sentiment,
      intent,
      isSarcastic,
      createdBy: actor.username,
      translationType,
      confidence: parsedConfidence,
      notes,
      register,
      domain,
      languagePair: languagePair ?? "en-hil",
      unitType: unitType ?? "sentence",
    });

    return res.status(201).json({ data });
  } catch (error: any) {
    console.error("[createSentence Error]:", error);

    if (error?.message?.startsWith("Invalid ")) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.message,
      });
    }

    if (error?.code === "P2002") {
      return res.status(409).json({
        error: "Conflict",
        details: "This translation pair already exists.",
        code: error.code,
      });
    }

    return res.status(500).json({
      error: "Failed to create the translation",
      details: error?.message || "An unexpected error occurred.",
    });
  }
};

export const updateSentence = async (req: Request, res: Response) => {
  try {
    const actor = (req as TeamRequest).teamUser!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      return res.status(400).json({
        error: "Missing required parameter",
        details: "A valid translation ID is required.",
      });
    }

    if (req.body.status !== undefined) {
      return res.status(400).json({
        error: "Use the moderation endpoint",
        details: "Translation status can only be changed through PATCH /api/sentences/:id/status.",
      });
    }

    const existing = await sentenceService.getSentenceById(id);
    if (!existing) {
      return res.status(404).json({
        error: "Resource not found",
        details: `No translation found with ID: ${id}`,
      });
    }

    if (
      actor.role === "CONTRIBUTOR" &&
      (existing.status !== "pending" || existing.createdBy !== actor.username)
    ) {
      return res.status(403).json({
        error: "Permission denied",
        details: "Contributors may edit only their own pending translations.",
      });
    }

    if (actor.role === "REVIEWER" && existing.status !== "pending") {
      return res.status(403).json({
        error: "Permission denied",
        details: "Reviewers may edit pending translations before review.",
      });
    }

    const sentiment = parseSentiment(req.body.sentiment);
    const parsedConfidence =
      req.body.confidence === undefined || req.body.confidence === null
        ? req.body.confidence
        : Number(req.body.confidence);

    if (
      (req.body.english !== undefined && !String(req.body.english).trim()) ||
      (req.body.hiligaynon !== undefined && !String(req.body.hiligaynon).trim())
    ) {
      return res.status(400).json({
        error: "Validation failed",
        details: "Updated English/Hiligaynon text cannot be empty.",
      });
    }

    const validationError = validateSemanticInput(sentiment, undefined, parsedConfidence);

    if (validationError) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationError,
      });
    }

    await validateMaintenanceSelections({
      ...(sentiment !== undefined ? { sentiment } : {}),
      ...(req.body.intent !== undefined ? { intent: req.body.intent } : {}),
      ...(req.body.isSarcastic !== undefined
        ? { isSarcastic: req.body.isSarcastic === true || req.body.isSarcastic === "true" }
        : {}),
      ...(req.body.translationType !== undefined
        ? { translationType: String(req.body.translationType) }
        : {}),
      ...(req.body.register !== undefined ? { register: req.body.register } : {}),
      ...(req.body.domain !== undefined ? { domain: req.body.domain } : {}),
      ...(req.body.languagePair !== undefined
        ? { languagePair: String(req.body.languagePair) }
        : {}),
      ...(req.body.unitType !== undefined
        ? { unitType: String(req.body.unitType) }
        : {}),
    });

    const data = await sentenceService.updateSentence(id, {
      ...(req.body.english !== undefined ? { english: String(req.body.english).trim() } : {}),
      ...(req.body.hiligaynon !== undefined ? { hiligaynon: String(req.body.hiligaynon).trim() } : {}),
      ...(sentiment !== undefined ? { sentiment } : {}),
      ...(req.body.intent !== undefined ? { intent: req.body.intent } : {}),
      ...(req.body.isSarcastic !== undefined
        ? { isSarcastic: req.body.isSarcastic === true || req.body.isSarcastic === "true" }
        : {}),
      ...(req.body.translationType !== undefined
        ? { translationType: String(req.body.translationType) }
        : {}),
      ...(req.body.confidence !== undefined
        ? { confidence: parsedConfidence }
        : {}),
      ...(req.body.notes !== undefined ? { notes: req.body.notes } : {}),
      ...(req.body.register !== undefined ? { register: req.body.register } : {}),
      ...(req.body.domain !== undefined ? { domain: req.body.domain } : {}),
      ...(req.body.languagePair !== undefined
        ? { languagePair: String(req.body.languagePair) }
        : {}),
      ...(req.body.unitType !== undefined
        ? { unitType: String(req.body.unitType) }
        : {}),
    }, actor.role === "ADMIN" && existing.status !== "pending");

    if (!data) {
      return res.status(404).json({
        error: "Resource not found",
        details: `No translation found with ID: ${id}`,
      });
    }

    return res.status(200).json({ data });
  } catch (error: any) {
    console.error("[updateSentence Error]:", error);

    if (error?.message?.startsWith("Invalid ")) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.message,
      });
    }

    if (error?.code === "P2002") {
      return res.status(409).json({
        error: "Conflict",
        details: "The updated translation would duplicate an existing translation pair.",
      });
    }

    return res.status(500).json({
      error: "Failed to update the translation",
      details: error?.message || "An unexpected error occurred.",
    });
  }
};

export const deleteSentence = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id) {
      return res.status(400).json({
        error: "Missing required parameter",
        details: "A valid translation ID is required.",
      });
    }

    await sentenceService.deleteSentence(id);
    return res.status(200).json({ message: "Translation deleted successfully" });
  } catch (error: any) {
    console.error("[deleteSentence Error]:", error);

    if (error?.code === "P2025") {
      return res.status(404).json({
        error: "Resource not found",
        details: "The specified translation does not exist.",
      });
    }

    return res.status(500).json({
      error: "Failed to delete the translation",
      details: error?.message || "An unexpected error occurred.",
    });
  }
};

export const deleteSentencesBulk = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === "string")) {
      return res.status(400).json({
        error: "Validation failed",
        details: "'ids' must be a non-empty array of translation IDs.",
      });
    }

    const result = await sentenceService.deleteSentencesBulk(ids);

    return res.status(200).json({
      message: "Translations deleted successfully",
      deletedCount: result.count,
    });
  } catch (error: any) {
    console.error("[deleteSentencesBulk Error]:", error);
    return res.status(500).json({
      error: "Failed to perform bulk deletion",
      details: error?.message || "An unexpected error occurred.",
    });
  }
};

export const updateSentenceStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const actor = (req as TeamRequest).teamUser!;
    const targetStatus = req.body.status as string | undefined;

    if (!id) {
      return res.status(400).json({
        error: "Missing required parameter",
        details: "A valid translation ID is required.",
      });
    }


    if (
      targetStatus !== "approved" &&
      targetStatus !== "verified" &&
      targetStatus !== "rejected"
    ) {
      return res.status(400).json({
        error: "Invalid review status",
        details: "Status must be approved, verified, or rejected.",
      });
    }

    const existing = await sentenceService.getSentenceById(id);

    if (!existing) {
      return res.status(404).json({
        error: "Resource not found",
        details: `No translation found with ID: ${id}`,
      });
    }

    if (targetStatus === "approved" && existing.status !== "pending") {
      return res.status(409).json({
        error: "Invalid status transition",
        details: `Only pending translations can be approved. Current status: ${existing.status}.`,
      });
    }

    if (targetStatus === "verified") {
      if (actor.role !== "ADMIN") {
        return res.status(403).json({
          error: "Language Lead permission required",
          details: "Only the Language Lead can verify translations.",
        });
      }

      if (existing.status !== "approved") {
        return res.status(409).json({
          error: "Invalid status transition",
          details: `Only approved translations can be verified. Current status: ${existing.status}.`,
        });
      }
    }

    if (
      targetStatus === "rejected" &&
      existing.status !== "pending" &&
      existing.status !== "approved"
    ) {
      return res.status(409).json({
        error: "Invalid status transition",
        details: `Only pending or approved translations can be rejected. Current status: ${existing.status}.`,
      });
    }

    const data = await sentenceService.setModerationStatus(
      id,
      targetStatus,
      actor.username
    );

    if (!data) {
      return res.status(409).json({
        error: "Status changed concurrently",
        details: "The contribution changed while it was being moderated. Refresh and try again.",
      });
    }

    return res.status(200).json({ data });
  } catch (error: any) {
    console.error("[updateSentenceStatus Error]:", error);
    return res.status(500).json({
      error: "Failed to update moderation status",
      details: error?.message || "An unexpected error occurred.",
    });
  }
};
