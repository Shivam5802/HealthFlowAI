from fastapi import APIRouter
from app.schemas.common import BaseResponse
from app.schemas.stockout import StockoutPredictionRequest, StockoutPredictionResult
from app.services.stockout_predictor import stockout_predictor

router = APIRouter()

@router.post("/stockout", response_model=BaseResponse[StockoutPredictionResult])
def predict_stockout(payload: StockoutPredictionRequest):
    result = stockout_predictor.predict(payload)
    return BaseResponse(
        success=True,
        data=result,
        message="Stockout probability assessed successfully",
    )
