import { apiClient } from './apiClient';
import { AlertItem, AlertSeverity, AlertStatus } from '../types/alert';

export interface AlertFilterParams {
  severity?: AlertSeverity;
  status?: AlertStatus;
  facilityId?: string;
  type?: string;
}

export const alertsApi = {
  getAlerts: async (params?: AlertFilterParams): Promise<AlertItem[]> => {
    const query = new URLSearchParams();
    if (params?.severity) query.append('severity', params.severity);
    if (params?.status) query.append('status', params.status);
    if (params?.facilityId) query.append('facilityId', params.facilityId);
    if (params?.type) query.append('type', params.type);

    const queryString = query.toString();
    const endpoint = queryString ? `/alerts?${queryString}` : '/alerts';
    return apiClient.get<AlertItem[]>(endpoint);
  },

  getAlertById: async (id: string): Promise<AlertItem> => {
    return apiClient.get<AlertItem>(`/alerts/${id}`);
  },

  createAlert: async (data: {
    facilityId: string;
    resourceId?: string;
    type: string;
    severity: AlertSeverity;
    title: string;
    message: string;
  }): Promise<AlertItem> => {
    return apiClient.post<AlertItem>('/alerts', data);
  },

  acknowledgeAlert: async (id: string): Promise<AlertItem> => {
    return apiClient.patch<AlertItem>(`/alerts/${id}`, { status: 'ACKNOWLEDGED' });
  },

  resolveAlert: async (id: string, note?: string): Promise<AlertItem> => {
    return apiClient.patch<AlertItem>(`/alerts/${id}/resolve`, { resolutionNote: note || 'Resolved by user' });
  },
};
