import type { Response } from "express";
import type { TeamRequest } from "../middleware/team-auth.middleware.js";
import {
  MAINTENANCE_CATEGORIES,
  createMaintenanceOption,
  deleteMaintenanceOption,
  isMaintenanceCategory,
  listMaintenanceOptions,
  updateMaintenanceOption,
  type MaintenanceOptionInput,
} from "../services/maintenance.service.js";

const parseInput = (body: any, partial = false) => {
  const category = body.category === undefined ? undefined : String(body.category);
  if (!partial && category === undefined) {
    return { error: "category is required." };
  }

  if (category !== undefined && !isMaintenanceCategory(category)) {
    return { error: `category must be one of: ${MAINTENANCE_CATEGORIES.join(", ")}` };
  }

  for (const field of ["code", "label", "value"]) {
    if (!partial && (typeof body[field] !== "string" || !body[field].trim())) {
      return { error: `${field} is required.` };
    }
    if (body[field] !== undefined && (typeof body[field] !== "string" || !body[field].trim())) {
      return { error: `${field} must be a non-empty string.` };
    }
  }

  const sortOrder =
    body.sortOrder === undefined ? undefined : Number.parseInt(String(body.sortOrder), 10);
  if (sortOrder !== undefined && !Number.isInteger(sortOrder)) {
    return { error: "sortOrder must be an integer." };
  }

  return {
    data: {
      ...(category !== undefined ? { category } : {}),
      ...(body.code !== undefined ? { code: String(body.code) } : {}),
      ...(body.label !== undefined ? { label: String(body.label) } : {}),
      ...(body.value !== undefined ? { value: String(body.value) } : {}),
      ...(body.description !== undefined
        ? { description: body.description === null ? null : String(body.description) }
        : {}),
      ...(sortOrder !== undefined ? { sortOrder } : {}),
      ...(body.active !== undefined ? { active: Boolean(body.active) } : {}),
      ...(body.isDefault !== undefined ? { isDefault: Boolean(body.isDefault) } : {}),
    } as Partial<MaintenanceOptionInput>,
  };
};

export const getMaintenanceOptions = async (req: TeamRequest, res: Response) => {
  try {
    const category =
      typeof req.query.category === "string" ? req.query.category : undefined;

    if (category && !isMaintenanceCategory(category)) {
      return res.status(400).json({
        error: "Validation failed",
        details: `category must be one of: ${MAINTENANCE_CATEGORIES.join(", ")}`,
      });
    }

    const includeInactive =
      req.teamUser?.role === "ADMIN" && req.query.includeInactive === "true";

    const items = await listMaintenanceOptions({
      category,
      activeOnly: !includeInactive,
    });

    return res.status(200).json({
      items,
      categories: MAINTENANCE_CATEGORIES,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to load maintenance options",
      details: error?.message || "Unexpected error.",
    });
  }
};

export const createMaintenance = async (req: TeamRequest, res: Response) => {
  const parsed = parseInput(req.body);
  if (parsed.error) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error });
  }

  try {
    const item = await createMaintenanceOption(parsed.data as MaintenanceOptionInput);
    return res.status(201).json({ data: item });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({
        error: "Conflict",
        details: "That category/code already exists.",
      });
    }
    return res.status(500).json({
      error: "Failed to create maintenance option",
      details: error?.message || "Unexpected error.",
    });
  }
};

export const updateMaintenance = async (req: TeamRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) return res.status(400).json({ error: "Missing option ID" });

  const parsed = parseInput(req.body, true);
  if (parsed.error) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error });
  }

  try {
    const item = await updateMaintenanceOption(id, parsed.data);
    if (!item) return res.status(404).json({ error: "Maintenance option not found" });
    return res.status(200).json({ data: item });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({
        error: "Conflict",
        details: "That category/code already exists.",
      });
    }
    return res.status(500).json({
      error: "Failed to update maintenance option",
      details: error?.message || "Unexpected error.",
    });
  }
};

export const removeMaintenance = async (req: TeamRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) return res.status(400).json({ error: "Missing option ID" });

  try {
    await deleteMaintenanceOption(id);
    return res.status(204).send();
  } catch (error: any) {
    if (error?.code === "P2025") {
      return res.status(404).json({ error: "Maintenance option not found" });
    }
    return res.status(500).json({
      error: "Failed to delete maintenance option",
      details: error?.message || "Unexpected error.",
    });
  }
};
