from fastapi import APIRouter
from app.schemas.common import BaseResponse
from app.schemas.risk import FacilityRiskRequest, FacilityRiskResult
from app.services.risk_engine import risk_engine

router = APIRouter()

@router.post("/risk", response_model=BaseResponse[FacilityRiskResult])
def evaluate_facility_risk(payload: FacilityRiskRequest):
    result = risk_engine.evaluate(payload)
    return BaseResponse(
        success=True,
        data=result,
        message="Facility operational risk assessed successfully",
    )
