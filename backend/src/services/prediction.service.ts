import { predictionRepository } from '../repositories/prediction.repository.js';
import { inventoryRepository } from '../repositories/inventory.repository.js';
import { patientRepository } from '../repositories/patient.repository.js';
import { riskEngineService } from './riskEngine.service.js';
import { mlClientService } from './mlClient.service.js';
import { AuthenticatedUser } from '../types/index.js';
import { AppError } from '../utils/response.js';
import { RiskLevel } from '@prisma/client';

export class PredictionService {
  async getPredictions(facilityId: string | undefined, currentUser: AuthenticatedUser) {
    if (currentUser.role === 'SUPPLY_MANAGER') {
      throw new AppError(
        'Access forbidden: Unrestricted clinical demand predictions are reserved for Administrators and Facility Managers',
        403,
        'FORBIDDEN'
      );
    }

    const targetFacilityId = currentUser.role === 'HOSPITAL_MANAGER' ? currentUser.facilityId : facilityId;

    if (currentUser.role === 'HOSPITAL_MANAGER') {
      if (!currentUser.facilityId) {
        throw new AppError('Manager is not assigned to any facility', 400, 'NO_FACILITY_ASSIGNED');
      }
      if (facilityId && facilityId !== currentUser.facilityId) {
        throw new AppError('Access forbidden: Cannot access another facility predictions', 403, 'FACILITY_ACCESS_DENIED');
      }
    }

    if (targetFacilityId) {
      return predictionRepository.findLatestByFacility(targetFacilityId);
    }

    return predictionRepository.findAll({ limit: 100 });
  }

  async getPredictionsByFacility(facilityId: string, currentUser: AuthenticatedUser) {
    if (currentUser.role === 'SUPPLY_MANAGER') {
      throw new AppError(
        'Access forbidden: Clinical demand predictions are restricted for Supply Managers',
        403,
        'FORBIDDEN'
      );
    }

    if (currentUser.role === 'HOSPITAL_MANAGER' && currentUser.facilityId !== facilityId) {
      throw new AppError('Access forbidden: You can only view predictions for your assigned facility', 403, 'FACILITY_ACCESS_DENIED');
    }

    return predictionRepository.findLatestByFacility(facilityId);
  }

  async getCriticalRisks(currentUser: AuthenticatedUser) {
    if (currentUser.role === 'SUPPLY_MANAGER') {
      throw new AppError('Access forbidden: Network clinical risk overviews are restricted to Administrators', 403, 'FORBIDDEN');
    }

    if (currentUser.role === 'HOSPITAL_MANAGER' && currentUser.facilityId) {
      const preds = await predictionRepository.findLatestByFacility(currentUser.facilityId);
      return preds.filter((p) => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL');
    }

    return predictionRepository.findHighRisk(50);
  }

  /**
   * Runs the automated prediction pipeline for all inventory records in scope,
   * calculating predicted demand, stockout dates, and risk levels, and storing results in PostgreSQL.
   */
  async runPredictions(facilityId: string | undefined, currentUser: AuthenticatedUser) {
    if (currentUser.role === 'SUPPLY_MANAGER') {
      throw new AppError('Forbidden: Supply Managers cannot execute the clinical prediction pipeline', 403, 'FORBIDDEN');
    }

    const targetFacilityId = currentUser.role === 'HOSPITAL_MANAGER' ? currentUser.facilityId : facilityId;

    if (currentUser.role === 'HOSPITAL_MANAGER' && facilityId && facilityId !== currentUser.facilityId) {
      throw new AppError('Forbidden: Cannot run prediction pipeline for other facilities', 403, 'FACILITY_ACCESS_DENIED');
    }

    const inventories = targetFacilityId
      ? await inventoryRepository.findByFacility(targetFacilityId)
      : await inventoryRepository.findAll();

    const createdPredictions = [];

    for (const inv of inventories) {
      // 1. Fetch recent historical demand
      const historicalDemands = await patientRepository.findByFacility(inv.facilityId, 14);
      const demandCounts = historicalDemands.map((h) => h.patientCount);

      // Determine demand trend from historical data
      let trend: 'INCREASING' | 'STABLE' | 'DECREASING' = 'STABLE';
      if (demandCounts.length >= 6) {
        const recentAvg = (demandCounts[0] + demandCounts[1] + demandCounts[2]) / 3;
        const olderAvg = (demandCounts[3] + demandCounts[4] + demandCounts[5]) / 3;
        if (recentAvg > olderAvg * 1.15) trend = 'INCREASING';
        else if (recentAvg < olderAvg * 0.85) trend = 'DECREASING';
      }

      // 2. Calculate risk parameters
      const risk = riskEngineService.calculateRisk(
        inv.quantity,
        inv.dailyConsumption,
        inv.safetyStock,
        trend
      );

      // Estimate stockout date
      let stockoutDate: Date | null = null;
      if (risk.daysRemaining < 365 && inv.dailyConsumption > 0) {
        stockoutDate = new Date(Date.now() + risk.daysRemaining * 24 * 60 * 60 * 1000);
      }

      const predictedDaily = inv.dailyConsumption * (trend === 'INCREASING' ? 1.25 : trend === 'DECREASING' ? 0.85 : 1.0);

      const prediction = await predictionRepository.create({
        facility: { connect: { id: inv.facilityId } },
        resource: { connect: { id: inv.resourceId } },
        predictedDailyDemand: Math.round(predictedDaily * 10) / 10,
        predictedStockoutDate: stockoutDate,
        riskLevel: risk.riskLevel as RiskLevel,
        confidence: 0.88,
        explanation: risk.reasons.join(' '),
        predictionDate: new Date(),
      });

      createdPredictions.push(prediction);
    }

    return {
      evaluatedCount: createdPredictions.length,
      highRiskCount: createdPredictions.filter((p) => p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL').length,
      predictions: createdPredictions,
    };
  }
}

export const predictionService = new PredictionService();
