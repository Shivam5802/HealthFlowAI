from fastapi import APIRouter
from app.schemas.common import BaseResponse
from datetime import datetime

router = APIRouter()

@router.get("/health", response_model=BaseResponse[dict])
def health_check():
    return BaseResponse(
        success=True,
        data={
            "status": "UP",
            "service": "healthflow-ml-service",
            "timestamp": datetime.utcnow().isoformat(),
            "engine": "FastAPI + NumPy / Scikit-Learn",
        },
        message="ML Service is online and operational",
    )
