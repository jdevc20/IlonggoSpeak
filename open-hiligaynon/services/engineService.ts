import * as engineApi from "@/lib/engine";
import type { GenerateDatasetInput } from "@/types/engine";

export const EngineService = {
  async dictionary(query: string, language = "hil", page = 1, limit = 20) {
    return engineApi.searchDictionary(query, language, page, limit);
  },

  async exportDataset(datasetId: string, split?: string, page = 1, limit = 20) {
    return engineApi.exportDataset(datasetId, split, page, limit);
  },

  async generateDataset(input: GenerateDatasetInput) {
    return engineApi.generateDataset(input);
  },
};
