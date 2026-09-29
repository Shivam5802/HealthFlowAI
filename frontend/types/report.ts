export interface DailyReportData {
  reportType: string;
  generatedAt: string;
  scope: string;
  facilityScopeId: string | null;
  summary: {
    totalFacilitiesMonitored: number;
    activeFacilitiesCount: number;
    totalInventoryItems: number;
    stockStatus: {
      critical: number;
      highRisk: number;
      mediumRisk: number;
      stable: number;
    };
    alerts: {
      totalOpen: number;
      criticalSeverity: number;
      warningSeverity: number;
      infoSeverity: number;
    };
    transfers: {
      pendingRequests: number;
      approvedOrPacked: number;
      inTransit: number;
      deliveredTotal: number;
    };
  };
  topRiskPredictions: Array<{
    facilityId: string;
    facilityName: string;
    resourceName: string;
    riskLevel: string;
    predictedDailyDemand: number;
    stockoutDate: string | null;
  }>;
}

export interface WeeklyReportData extends DailyReportData {
  timeframe: string;
  trendAnalysis: {
    reallocationEfficiencyRate: string;
    stockoutPreventionEvents: number;
    averageTransferCompletionHours: number;
  };
}
