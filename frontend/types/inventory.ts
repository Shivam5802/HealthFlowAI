export type ResourceCategory = 'MEDICINE' | 'MEDICAL_SUPPLY' | 'EQUIPMENT' | 'BED' | 'OTHER';

export interface Resource {
  id: string;
  name: string;
  category: ResourceCategory;
  unit: string;
  description?: string | null;
}

export interface InventoryItem {
  id: string;
  facilityId: string;
  resourceId: string;
  quantity: number;
  dailyConsumption: number;
  safetyStock: number;
  lastUpdated: string;
  resource?: Resource;
  facility?: {
    id: string;
    name: string;
  };
}
