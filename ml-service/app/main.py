from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router

def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
        redoc_url=f"{settings.API_V1_STR}/redoc",
        description="HealthFlow AI Machine Learning & Prediction Service (Demand Forecasting, Surge Detection & Stockout Analytics)",
        version="1.0.0",
    )

    # Note: ML Service is internal and only communicated with via the Node.js backend gateway
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(api_router, prefix=settings.API_V1_STR)

    @application.get("/")
    def root():
        return {
            "service": settings.PROJECT_NAME,
            "status": "ONLINE",
            "tagline": "Predict. Prevent. Protect.",
            "docs": f"{settings.API_V1_STR}/docs",
        }

    return application

app = create_application()
