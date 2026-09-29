import { apiClient } from './apiClient';
import { Resource } from '../types/inventory';

export const resourcesApi = {
  getResources: async (): Promise<Resource[]> => {
    return apiClient.get<Resource[]>('/resources');
  },

  getResourceById: async (id: string): Promise<Resource> => {
    return apiClient.get<Resource>(`/resources/${id}`);
  },
};
