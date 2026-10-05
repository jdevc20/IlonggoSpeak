import { api } from "./api";
import type {
  MaintenanceCategory,
  MaintenanceOption,
  MaintenanceOptionInput,
} from "@/types/maintenance";
import type { PaginationMeta } from "@/types/pagination";

export const getMaintenanceOptions = async (params?: {
  category?: MaintenanceCategory;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
}): Promise<{
  items: MaintenanceOption[];
  categories: MaintenanceCategory[];
  meta: PaginationMeta;
}> => {
  const response = await api.get("/maintenance/options", { params });
  return response.data;
};

export const createMaintenanceOption = async (data: MaintenanceOptionInput) => {
  const response = await api.post("/maintenance/options", data);
  return response.data;
};

export const updateMaintenanceOption = async (
  id: string,
  data: Partial<MaintenanceOptionInput>
) => {
  const response = await api.patch("/maintenance/options/" + encodeURIComponent(id), data);
  return response.data;
};

export const deleteMaintenanceOption = async (id: string) => {
  await api.delete("/maintenance/options/" + encodeURIComponent(id));
};

export const groupMaintenanceOptions = (items: MaintenanceOption[]) =>
  items.reduce<Record<string, MaintenanceOption[]>>((groups, item) => {
    (groups[item.category] ||= []).push(item);
    return groups;
  }, {});
