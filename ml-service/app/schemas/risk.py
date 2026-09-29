from typing import List, Optional
from pydantic import BaseModel, Field

class ResourceStockStatus(BaseModel):
    resource_id: str = Field(..., alias="resourceId")
    quantity: float
    safety_stock: float = Field(..., alias="safetyStock")
    daily_consumption: float = Field(..., alias="dailyConsumption")

    class Config:
        populate_by_name = True

class FacilityRiskRequest(BaseModel):
    facility_id: str = Field(..., alias="facilityId")
    inventory_items: List[ResourceStockStatus] = Field(default=[], alias="inventoryItems")
    current_stock: Optional[float] = Field(default=None, alias="currentStock")
    safety_stock: Optional[float] = Field(default=None, alias="safetyStock")
    daily_consumption: Optional[float] = Field(default=None, alias="dailyConsumption")
    projected_demand: Optional[float] = Field(default=None, alias="projectedDemand")

    class Config:
        populate_by_name = True

class FacilityRiskResult(BaseModel):
    facility_id: str
    risk_level: str
    composite_risk_score: float
    days_of_stock_remaining: float
    critical_resources_count: int
    explanation: str
    recommended_action: str
