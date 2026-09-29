export type RiskLevel = 'HEALTHY' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface PredictionItem {
  id: string;
  facilityId: string;
  resourceId: string;
  predictedDailyDemand: number;
  predictedStockoutDate: string | null;
  riskLevel: RiskLevel;
  confidence: number;
  explanation: string;
  predictionDate: string;
  resource?: {
    id: string;
    name: string;
    unit: string;
    category: string;
  };
  facility?: {
    id: string;
    name: string;
    district: string;
  };
}
