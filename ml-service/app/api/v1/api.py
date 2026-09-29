from fastapi import APIRouter
from app.api.v1.endpoints import demand, stockout, risk, health

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(demand.router, prefix="/predict", tags=["Forecasting"])
api_router.include_router(stockout.router, prefix="/predict", tags=["Stockout"])
api_router.include_router(risk.router, prefix="/predict", tags=["Risk Analysis"])
