import { apiClient } from './apiClient';
import { InventoryItem } from '../types/inventory';

export interface UpdateStockPayload {
  facilityId: string;
  resourceId: string;
  quantity: number;
  dailyConsumption?: number;
  safetyStock?: number;
}

export const inventoryApi = {
  getInventory: async (facilityId?: string): Promise<InventoryItem[]> => {
    const endpoint = facilityId ? `/inventory?facilityId=${encodeURIComponent(facilityId)}` : '/inventory';
    return apiClient.get<InventoryItem[]>(endpoint);
  },

  getInventoryById: async (id: string): Promise<InventoryItem> => {
    return apiClient.get<InventoryItem>(`/inventory/${id}`);
  },

  updateStock: async (payload: UpdateStockPayload): Promise<InventoryItem> => {
    return apiClient.post<InventoryItem>('/inventory/update', payload);
  },

  updateInventoryById: async (
    id: string,
    data: { quantity?: number; dailyConsumption?: number; safetyStock?: number }
  ): Promise<InventoryItem> => {
    return apiClient.patch<InventoryItem>(`/inventory/${id}`, data);
  },

  deleteInventory: async (id: string): Promise<void> => {
    return apiClient.delete(`/inventory/${id}`);
  },
};
