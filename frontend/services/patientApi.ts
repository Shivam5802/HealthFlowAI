import { apiClient } from './apiClient';
import { PatientDemandRecord } from '../types/patient';

export const patientApi = {
  getDemand: async (facilityId?: string): Promise<PatientDemandRecord[]> => {
    const endpoint = facilityId ? `/patients/demand/${facilityId}` : '/patients/demand';
    return apiClient.get<PatientDemandRecord[]>(endpoint);
  },

  recordDemand: async (data: {
    facilityId: string;
    date: string;
    patientCount: number;
    inflowRate?: number;
    bedOccupancyRate?: number;
    criticalCases?: number;
    notes?: string;
  }): Promise<PatientDemandRecord> => {
    return apiClient.post<PatientDemandRecord>('/patients/demand', data);
  },
};
