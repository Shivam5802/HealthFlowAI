from typing import List
import numpy as np
from app.schemas.demand import DemandForecastRequest, DemandForecastResult

class DemandForecaster:
    """
    Time-series forecasting engine with trend extrapolation and moving window smoothing.
    """
    def forecast(self, request: DemandForecastRequest) -> DemandForecastResult:
        data = request.historical_demand
        if not data:
            # Fallback for empty history
            baseline = 10.0
            trajectory = [baseline] * request.horizon_days
            return DemandForecastResult(
                facility_id=request.facility_id,
                resource_id=request.resource_id,
                predicted_daily_demand=baseline,
                forecast_trajectory=trajectory,
                trend_factor=1.0,
                confidence=0.5,
                model_version="baseline_default_v1",
            )

        arr = np.array(data, dtype=float)
        n = len(arr)

        # 7-day weighted moving average if sufficient data
        weights = np.linspace(0.5, 1.0, min(n, 7))
        weights /= weights.sum()
        recent_window = arr[-len(weights):]
        wma = float(np.dot(recent_window, weights))

        # Linear trend approximation
        if n >= 3:
            x = np.arange(n)
            slope, _ = np.polyfit(x, arr, 1)
            trend_factor = float(1.0 + (slope / (np.mean(arr) + 1e-5)))
        else:
            trend_factor = 1.0

        daily_demand = max(0.0, wma * trend_factor)

        # Generate future horizon steps
        future_steps = []
        for i in range(1, request.horizon_days + 1):
            projected = max(0.0, daily_demand + (trend_factor - 1.0) * i * 0.2)
            future_steps.append(round(projected, 2))

        confidence = min(0.95, max(0.65, 0.70 + (n * 0.02)))

        return DemandForecastResult(
            facility_id=request.facility_id,
            resource_id=request.resource_id,
            predicted_daily_demand=round(daily_demand, 2),
            forecast_trajectory=future_steps,
            trend_factor=round(trend_factor, 3),
            confidence=round(confidence, 2),
            model_version="wma_trend_extrapolator_v1.0",
        )

demand_forecaster = DemandForecaster()
