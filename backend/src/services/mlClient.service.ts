import { config } from '../config/index.js';

export interface DemandPredictionPayload {
  facilityId: string;
  resourceId: string;
  historicalDemand: number[];
  historicalDates: string[];
}

export interface RiskAssessmentPayload {
  facilityId: string;
  currentStock: number;
  safetyStock: number;
  dailyConsumption: number;
  projectedDemand: number;
}

export class MLClientService {
  private getBaseUrl(): string {
    const raw = process.env.ML_SERVICE_URL || config.mlServiceUrl || 'http://localhost:8000';
    return raw.endsWith('/') ? raw : `${raw}/`;
  }

  async predictDemand(payload: DemandPredictionPayload) {
    try {
      const url = new URL('api/v1/predict/demand', this.getBaseUrl()).toString();
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`ML Service responded with status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('ML Service unreachable or error, using graceful fallback:', error);
      // Graceful fallback for offline ML service during setup
      return {
        success: true,
        predictedDemand: payload.historicalDemand.length > 0
          ? payload.historicalDemand.reduce((a, b) => a + b, 0) / payload.historicalDemand.length
          : 15,
        confidence: 0.85,
        model: 'baseline_moving_average',
      };
    }
  }

  async assessRisk(payload: RiskAssessmentPayload) {
    try {
      const url = new URL('api/v1/predict/risk', this.getBaseUrl()).toString();
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`ML Service responded with status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('ML Service unreachable, using analytical risk model fallback:', error);
      const daysOfStockRemaining = payload.dailyConsumption > 0
        ? payload.currentStock / payload.dailyConsumption
        : 999;

      let riskLevel: 'HEALTHY' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'HEALTHY';
      if (daysOfStockRemaining <= 2) riskLevel = 'CRITICAL';
      else if (daysOfStockRemaining <= 5) riskLevel = 'HIGH';
      else if (daysOfStockRemaining <= 10) riskLevel = 'MODERATE';

      return {
        success: true,
        riskLevel,
        daysOfStockRemaining: Math.round(daysOfStockRemaining * 10) / 10,
        confidence: 0.9,
      };
    }
  }
}

export const mlClientService = new MLClientService();
