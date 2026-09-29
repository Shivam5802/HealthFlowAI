from datetime import datetime, timedelta
from app.schemas.stockout import StockoutPredictionRequest, StockoutPredictionResult

class StockoutPredictor:
    """
    Stockout calculation engine assessing inventory depletion curves.
    """
    def predict(self, request: StockoutPredictionRequest) -> StockoutPredictionResult:
        effective_consumption = max(0.1, request.daily_consumption * request.projected_surge_factor)
        days_remaining = request.current_stock / effective_consumption

        now = datetime.now()
        predicted_date = (now + timedelta(days=days_remaining)).strftime("%Y-%m-%d") if days_remaining < 365 else None

        # Determine risk level
        if days_remaining <= 2.0:
            risk_level = "CRITICAL"
            is_imminent = True
            recommendation = "Immediate emergency reallocation required within 24 hours."
            confidence = 0.94
        elif days_remaining <= 5.0:
            risk_level = "HIGH"
            is_imminent = True
            recommendation = "Initiate inter-facility stock transfer request from surplus hubs."
            confidence = 0.89
        elif days_remaining <= 10.0:
            risk_level = "MODERATE"
            is_imminent = False
            recommendation = "Flag for expedited procurement order in next supply cycle."
            confidence = 0.82
        else:
            risk_level = "HEALTHY"
            is_imminent = False
            recommendation = "Stock levels optimal. Maintain regular distribution schedule."
            confidence = 0.92

        return StockoutPredictionResult(
            facility_id=request.facility_id,
            resource_id=request.resource_id,
            days_to_stockout=round(days_remaining, 1),
            predicted_stockout_date=predicted_date,
            is_stockout_imminent=is_imminent,
            risk_level=risk_level,
            confidence=confidence,
            recommendation=recommendation,
        )

stockout_predictor = StockoutPredictor()
