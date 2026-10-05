import { api } from "./api";
import type {
  DatasetExportResponse,
  DictionarySearchResponse,
  GeneratedDatasetResult,
  GenerateDatasetInput,
} from "@/types/engine";

export const searchDictionary = async (
  query: string,
  language = "hil",
  page = 1,
  limit = 20
): Promise<DictionarySearchResponse> => {
  const res = await api.get("/engine/dictionary", {
    params: { q: query, language, page, limit },
  });

  return res.data;
};


export const exportDataset = async (
  datasetId: string,
  split?: string,
  page = 1,
  limit = 20
): Promise<DatasetExportResponse> => {
  const res = await api.get("/engine/datasets/" + datasetId + "/export", {
    params: { ...(split ? { split } : {}), page, limit },
  });

  return res.data;
};


export const generateDataset = async (
  input: GenerateDatasetInput
): Promise<GeneratedDatasetResult> => {
  const res = await api.post("/engine/datasets/generate", input);
  return res.data.data;
};
