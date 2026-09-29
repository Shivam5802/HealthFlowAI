import { inventoryRepository } from '../repositories/inventory.repository.js';
import { riskEngineService } from './riskEngine.service.js';

export interface RedistributionRecommendation {
  sourceFacilityId: string;
  sourceFacilityName: string;
  sourceDistrict: string;
  sourceCurrentStock: number;
  destinationFacilityId: string;
  destinationFacilityName: string;
  destinationDistrict: string;
  destinationCurrentStock: number;
  resourceId: string;
  resourceName: string;
  resourceCategory: string;
  recommendedQuantity: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
  destinationDaysRemaining: number;
  postTransferSourceDaysRemaining: number;
}

export class RecommendationService {
  /**
   * Generates dynamic redistribution recommendations pairing facilities with critical shortages
   * with facilities holding verified operational surplus of the identical resource.
   */
  async getRedistributionRecommendations(): Promise<RedistributionRecommendation[]> {
    const allInventories = await inventoryRepository.findAll();

    // 1. Identify destination candidates (HIGH or CRITICAL risk)
    const atRiskInventories = allInventories
      .map((inv) => {
        const risk = riskEngineService.calculateRisk(
          inv.quantity,
          inv.dailyConsumption,
          inv.safetyStock
        );
        return { inv, risk };
      })
      .filter(({ risk }) => risk.riskLevel === 'HIGH' || risk.riskLevel === 'CRITICAL');

    const recommendations: RedistributionRecommendation[] = [];

    // 2. For each at-risk inventory, search for an optimal surplus donor
    for (const { inv: destInv, risk: destRisk } of atRiskInventories) {
      // Find candidate sources with the same resource in different facilities
      const candidateSources = allInventories.filter(
        (src) =>
          src.resourceId === destInv.resourceId &&
          src.facilityId !== destInv.facilityId &&
          src.quantity > src.safetyStock * 2 &&
          (src.dailyConsumption <= 0 || src.quantity / src.dailyConsumption > 15)
      );

      if (candidateSources.length === 0) continue;

      // Select source: prioritize same administrative district first (faster transit), then greatest surplus
      candidateSources.sort((a, b) => {
        const aSameDistrict = a.facility?.district === destInv.facility?.district ? 1 : 0;
        const bSameDistrict = b.facility?.district === destInv.facility?.district ? 1 : 0;
        if (aSameDistrict !== bSameDistrict) {
          return bSameDistrict - aSameDistrict;
        }
        return b.quantity - a.quantity;
      });
      const sourceInv = candidateSources[0];

      // Target buffer: restore destination to ~14 days of supply or at least safety stock + 7 days
      const targetDays = 14;
      const targetQuantity = Math.max(
        destInv.safetyStock * 2,
        Math.round(destInv.dailyConsumption * targetDays)
      );
      const deficit = Math.max(20, targetQuantity - destInv.quantity);

      // Max source can safely transfer without dropping below 10 days of source supply
      const sourceReserved = Math.max(
        sourceInv.safetyStock * 1.5,
        Math.round(sourceInv.dailyConsumption * 10)
      );
      const sourceAvailable = Math.max(0, sourceInv.quantity - sourceReserved);

      if (sourceAvailable < 15) continue; // Not enough surplus to warrant logistics overhead

      const recommendedQuantity = Math.min(deficit, sourceAvailable);

      const sourceDaysAfter =
        sourceInv.dailyConsumption > 0
          ? Math.round(((sourceInv.quantity - recommendedQuantity) / sourceInv.dailyConsumption) * 10) / 10
          : 999;

      const priority = destRisk.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH';

      recommendations.push({
        sourceFacilityId: sourceInv.facilityId,
        sourceFacilityName: sourceInv.facility?.name || 'Central Supply Hub',
        sourceDistrict: (sourceInv.facility as any)?.district || 'Central',
        sourceCurrentStock: sourceInv.quantity,
        destinationFacilityId: destInv.facilityId,
        destinationFacilityName: destInv.facility?.name || 'Destination Centre',
        destinationDistrict: (destInv.facility as any)?.district || 'District',
        destinationCurrentStock: destInv.quantity,
        resourceId: destInv.resourceId,
        resourceName: destInv.resource?.name || 'Medical Resource',
        resourceCategory: destInv.resource?.category || 'MEDICINE',
        recommendedQuantity,
        priority,
        explanation: `${destInv.facility?.name || 'Destination'} is at ${destRisk.riskLevel} risk with ${destRisk.daysRemaining} days remaining (${destInv.quantity} units on hand). ${sourceInv.facility?.name || 'Source'} holds ${sourceInv.quantity} units (${sourceAvailable} units above required reserve). Reallocating ${recommendedQuantity} units stabilizes destination while maintaining ${sourceDaysAfter} days reserve at source.`,
        destinationDaysRemaining: destRisk.daysRemaining,
        postTransferSourceDaysRemaining: sourceDaysAfter,
      });
    }

    return recommendations;
  }
}

export const recommendationService = new RecommendationService();
