import { apiClient } from './apiClient';
import { PredictionItem } from '../types/prediction';

export const predictionsApi = {
  getPredictions: async (facilityId?: string): Promise<PredictionItem[]> => {
    const endpoint = facilityId ? `/predictions/${encodeURIComponent(facilityId)}` : '/predictions';
    return apiClient.get<PredictionItem[]>(endpoint);
  },

  getCriticalRisks: async (): Promise<PredictionItem[]> => {
    return apiClient.get<PredictionItem[]>('/risks');
  },

  runPredictionsPipeline: async (): Promise<{ message: string; results?: unknown }> => {
    return apiClient.post<{ message: string; results?: unknown }>('/predictions/run', {});
  },
};
