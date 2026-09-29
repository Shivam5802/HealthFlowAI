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
