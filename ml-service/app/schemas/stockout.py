from typing import Optional
from datetime import datetime, date
from pydantic import BaseModel, Field

class StockoutPredictionRequest(BaseModel):
    facility_id: str = Field(..., alias="facilityId")
    resource_id: str = Field(..., alias="resourceId")
    current_stock: float = Field(..., alias="currentStock")
    safety_stock: float = Field(default=10.0, alias="safetyStock")
    daily_consumption: float = Field(..., alias="dailyConsumption")
    projected_surge_factor: float = Field(default=1.0, alias="projectedSurgeFactor")

    class Config:
        populate_by_name = True

class StockoutPredictionResult(BaseModel):
    facility_id: str
    resource_id: str
    days_to_stockout: float
    predicted_stockout_date: Optional[str]
    is_stockout_imminent: bool
    risk_level: str
    confidence: float
    recommendation: str
