import { apiClient } from './apiClient';
import { Facility } from '../types/facility';

export const facilitiesApi = {
  getFacilities: async (params?: { type?: string; status?: string; search?: string }): Promise<Facility[]> => {
    const query = new URLSearchParams();
    if (params?.type) query.append('type', params.type);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);

    const queryString = query.toString();
    const endpoint = queryString ? `/facilities?${queryString}` : '/facilities';
    return apiClient.get<Facility[]>(endpoint);
  },

  getFacilityById: async (id: string): Promise<Facility> => {
    return apiClient.get<Facility>(`/facilities/${id}`);
  },

  createFacility: async (data: Partial<Facility>): Promise<Facility> => {
    return apiClient.post<Facility>('/facilities', data);
  },

  updateFacility: async (id: string, data: Partial<Facility>): Promise<Facility> => {
    return apiClient.patch<Facility>(`/facilities/${id}`, data);
  },

  deleteFacility: async (id: string): Promise<void> => {
    return apiClient.delete(`/facilities/${id}`);
  },
};
