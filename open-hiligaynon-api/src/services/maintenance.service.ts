import { prisma } from "../lib/prisma.js";

export const MAINTENANCE_CATEGORIES = [
  "intent",
  "sentiment",
  "register",
  "domain",
  "sarcasm",
  "translation_type",
  "language_pair",
  "unit_type",
] as const;

export type MaintenanceCategory = (typeof MAINTENANCE_CATEGORIES)[number];

export const isMaintenanceCategory = (value: string): value is MaintenanceCategory =>
  (MAINTENANCE_CATEGORIES as readonly string[]).includes(value);

export interface MaintenanceOptionInput {
  category: MaintenanceCategory;
  code: string;
  label: string;
  value: string;
  description?: string | null;
  sortOrder?: number;
  active?: boolean;
  isDefault?: boolean;
}

const normalizeCode = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");

export const listMaintenanceOptions = async (args?: {
  category?: MaintenanceCategory;
  activeOnly?: boolean;
  skip?: number;
  take?: number;
}) => {
  const where = {
    ...(args?.category ? { category: args.category } : {}),
    ...(args?.activeOnly ? { active: true } : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.maintenanceOption.findMany({
      where,
      skip: args?.skip ?? 0,
      take: args?.take ?? 25,
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { label: "asc" }],
    }),
    prisma.maintenanceOption.count({ where }),
  ]);

  return { items, total };
};

export const createMaintenanceOption = async (input: MaintenanceOptionInput) => {
  const code = normalizeCode(input.code);
  if (!code) throw new Error("Option code is required.");

  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.maintenanceOption.updateMany({
        where: { category: input.category, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.maintenanceOption.create({
      data: {
        id: `${input.category}:${code}`,
        category: input.category,
        code,
        label: input.label.trim(),
        value: input.value.trim(),
        description: input.description?.trim() || null,
        sortOrder: input.sortOrder ?? 0,
        active: input.active ?? true,
        isDefault: input.isDefault ?? false,
      },
    });
  });
};

export const updateMaintenanceOption = async (
  id: string,
  input: Partial<MaintenanceOptionInput>
) => {
  const existing = await prisma.maintenanceOption.findUnique({ where: { id } });
  if (!existing) return null;

  const nextCategory = input.category ?? (existing.category as MaintenanceCategory);

  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.maintenanceOption.updateMany({
        where: { category: nextCategory, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    return tx.maintenanceOption.update({
      where: { id },
      data: {
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.code !== undefined ? { code: normalizeCode(input.code) } : {}),
        ...(input.label !== undefined ? { label: input.label.trim() } : {}),
        ...(input.value !== undefined ? { value: input.value.trim() } : {}),
        ...(input.description !== undefined
          ? { description: input.description?.trim() || null }
          : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
        ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
      },
    });
  });
};

export const deleteMaintenanceOption = async (id: string) => {
  return prisma.maintenanceOption.delete({ where: { id } });
};

export const assertActiveMaintenanceValue = async (
  category: MaintenanceCategory,
  value: string | number | boolean | null | undefined,
  fieldName: string = category
) => {
  if (value === undefined || value === null || value === "") return;

  const serialized = String(value);
  const match = await prisma.maintenanceOption.findFirst({
    where: { category, value: serialized, active: true },
    select: { id: true },
  });

  if (!match) {
    throw new Error(`Invalid ${fieldName}: '${serialized}' is not an active maintenance option.`);
  }
};
