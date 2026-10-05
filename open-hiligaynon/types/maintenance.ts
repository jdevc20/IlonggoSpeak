export type MaintenanceCategory =
  | "intent"
  | "sentiment"
  | "register"
  | "domain"
  | "sarcasm"
  | "translation_type"
  | "language_pair"
  | "unit_type";

export interface MaintenanceOption {
  id: string;
  category: MaintenanceCategory;
  code: string;
  label: string;
  value: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

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

export const MAINTENANCE_CATEGORY_LABELS: Record<MaintenanceCategory, string> = {
  intent: "Intent",
  sentiment: "Sentiment",
  register: "Register",
  domain: "Domain",
  sarcasm: "Sarcasm",
  translation_type: "Translation type",
  language_pair: "Language pair",
  unit_type: "Unit type",
};
