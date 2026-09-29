import { RiskLevel } from '../types/index.js';

export interface CalculatedItemRisk {
  daysRemaining: number;
  riskLevel: RiskLevel;
  reasons: string[];
  recommendedAction: string;
}

export class RiskEngineService {
  /**
   * Calculates inventory depletion timeline and operational risk level from genuine parameters.
   * Note: Thresholds are designed for intelligent decision support and are not universal medical mandates.
   */
  calculateRisk(
    quantity: number,
    dailyConsumption: number,
    safetyStock: number,
    projectedDemandTrend: 'INCREASING' | 'STABLE' | 'DECREASING' = 'STABLE'
  ): CalculatedItemRisk {
    const reasons: string[] = [];

    // Safe handling of dailyConsumption <= 0
    let daysRemaining = 999.0;
    if (dailyConsumption > 0) {
      daysRemaining = Math.round((quantity / dailyConsumption) * 10) / 10;
    }

    let riskLevel: RiskLevel = 'LOW';
    let recommendedAction = 'Stock levels optimal. Maintain regular distribution schedule.';

    // Evaluate critical conditions
    if (quantity === 0) {
      riskLevel = 'CRITICAL';
      reasons.push('Stock is completely exhausted (0 units on hand).');
      reasons.push('Immediate disruption to clinical services.');
      recommendedAction = 'Dispatch emergency resource redistribution within 12 hours.';
    } else if (daysRemaining <= 2.0) {
      riskLevel = 'CRITICAL';
      reasons.push(`Imminent depletion in ${daysRemaining} days at current burn rate of ${dailyConsumption} units/day.`);
      if (quantity < safetyStock) {
        reasons.push(`Current inventory (${quantity}) is below safety threshold (${safetyStock}).`);
      }
      recommendedAction = 'Dispatch emergency resource redistribution within 24 hours.';
    } else if (daysRemaining <= 5.0 || quantity < safetyStock) {
      riskLevel = 'HIGH';
      reasons.push(`Inventory depleted to ${daysRemaining} days of operational supply.`);
      if (quantity < safetyStock) {
        reasons.push(`Stock quantity (${quantity}) has breached minimum safety threshold (${safetyStock}).`);
      }
      if (projectedDemandTrend === 'INCREASING') {
        reasons.push('Inbound patient surge detected; demand trajectory is increasing.');
      }
      recommendedAction = 'Initiate inter-facility stock transfer request from surplus hubs.';
    } else if (daysRemaining <= 10.0 || quantity < safetyStock * 1.5) {
      riskLevel = 'MEDIUM';
      reasons.push(`Stock reserves sufficient for ${daysRemaining} days.`);
      if (quantity < safetyStock * 1.5) {
        reasons.push(`Buffer reserves approaching safety limit (${safetyStock}).`);
      }
      recommendedAction = 'Flag for expedited replenishment in the upcoming weekly procurement cycle.';
    } else {
      riskLevel = 'LOW';
      reasons.push(`Stable reserve: ${daysRemaining} days of supply remaining.`);
      reasons.push(`Current quantity (${quantity}) exceeds safety reserve (${safetyStock}).`);
    }

    return {
      daysRemaining,
      riskLevel,
      reasons,
      recommendedAction,
    };
  }
}

export const riskEngineService = new RiskEngineService();
