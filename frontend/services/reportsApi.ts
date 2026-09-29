import { apiClient } from './apiClient';
import { DailyReportData, WeeklyReportData } from '../types/report';

export const reportsApi = {
  getDailyReport: async (): Promise<DailyReportData> => {
    return apiClient.get<DailyReportData>('/reports/daily');
  },

  getWeeklyReport: async (): Promise<WeeklyReportData> => {
    return apiClient.get<WeeklyReportData>('/reports/weekly');
  },
};
