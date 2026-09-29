from fastapi import APIRouter
from app.schemas.common import BaseResponse
from app.schemas.demand import DemandForecastRequest, DemandForecastResult
from app.services.demand_forecaster import demand_forecaster

router = APIRouter()

@router.post("/demand", response_model=BaseResponse[DemandForecastResult])
def forecast_demand(payload: DemandForecastRequest):
    result = demand_forecaster.forecast(payload)
    return BaseResponse(
        success=True,
        data=result,
        message="Demand forecast calculated successfully",
    )
