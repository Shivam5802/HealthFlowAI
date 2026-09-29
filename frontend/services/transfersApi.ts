import { apiClient } from './apiClient';
import { TransferItem, TransferStatus, TransferPriority } from '../types/transfer';

export interface CreateTransferPayload {
  sourceFacilityId: string;
  destinationFacilityId: string;
  resourceId: string;
  quantity: number;
  priority?: TransferPriority;
}

export const transfersApi = {
  getTransfers: async (facilityId?: string): Promise<TransferItem[]> => {
    const endpoint = facilityId ? `/transfers?facilityId=${encodeURIComponent(facilityId)}` : '/transfers';
    return apiClient.get<TransferItem[]>(endpoint);
  },

  createTransfer: async (payload: CreateTransferPayload): Promise<TransferItem> => {
    return apiClient.post<TransferItem>('/transfers', payload);
  },

  updateStatus: async (id: string, status: TransferStatus, note?: string): Promise<TransferItem> => {
    return apiClient.patch<TransferItem>(`/transfers/${id}/status`, { status, note });
  },

  getTransferSources: async (): Promise<Array<{ id: string; name: string; type: string; district: string }>> => {
    return apiClient.get<Array<{ id: string; name: string; type: string; district: string }>>('/transfers/transfer-sources');
  },
};
