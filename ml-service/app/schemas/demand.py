from typing import List, Optional
from pydantic import BaseModel, Field

class DemandForecastRequest(BaseModel):
    facility_id: str = Field(..., alias="facilityId")
    resource_id: str = Field(..., alias="resourceId")
    historical_demand: List[float] = Field(..., alias="historicalDemand")
    historical_dates: Optional[List[str]] = Field(default=[], alias="historicalDates")
    horizon_days: int = Field(default=7, alias="horizonDays")

    class Config:
        populate_by_name = True

class DemandForecastResult(BaseModel):
    facility_id: str
    resource_id: str
    predicted_daily_demand: float
    forecast_trajectory: List[float]
    trend_factor: float
    confidence: float
    model_version: str
