import { apiClient } from './apiClient';
import { RedistributionRecommendation } from '../types/recommendation';

export const recommendationsApi = {
  getRedistributionRecommendations: async (): Promise<RedistributionRecommendation[]> => {
    return apiClient.get<RedistributionRecommendation[]>('/recommendations/redistribution');
  },
};
