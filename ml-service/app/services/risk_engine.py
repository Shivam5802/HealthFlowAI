from typing import List
from app.schemas.risk import FacilityRiskRequest, FacilityRiskResult

class RiskEngine:
    """
    Facility-wide multi-resource operational risk evaluation engine.
    """
    def evaluate(self, request: FacilityRiskRequest) -> FacilityRiskResult:
        critical_count = 0
        total_days = []

        # If individual items were provided
        if request.inventory_items:
            for item in request.inventory_items:
                daily = max(0.1, item.daily_consumption)
                days = item.quantity / daily
                total_days.append(days)
                if days <= 3.0:
                    critical_count += 1
            
            avg_days = sum(total_days) / len(total_days) if total_days else 15.0
        else:
            stock = request.current_stock or 50.0
            daily = max(0.1, request.daily_consumption or 5.0)
            avg_days = stock / daily
            if avg_days <= 3.0:
                critical_count = 1

        # Composite score from 0.0 (safest) to 1.0 (highest risk)
        if avg_days <= 2.0 or critical_count >= 3:
            risk_level = "CRITICAL"
            composite_score = 0.92
            explanation = f"Facility has {critical_count} resource(s) near immediate depletion within 48 hours."
            action = "Dispatch immediate emergency redistribution and notify district medical officer."
        elif avg_days <= 5.0 or critical_count >= 1:
            risk_level = "HIGH"
            composite_score = 0.74
            explanation = f"Facility inventory reserves are inadequate to meet projected surge demand."
            action = "Trigger high-priority stock reallocation from neighboring hospitals."
        elif avg_days <= 10.0:
            risk_level = "MODERATE"
            composite_score = 0.45
            explanation = "Buffer reserves approaching minimum safety threshold."
            action = "Monitor daily burn rate and prioritize in upcoming replenishment cycle."
        else:
            risk_level = "HEALTHY"
            composite_score = 0.12
            explanation = "Adequate inventory reserves and stable demand trajectory."
            action = "Maintain regular supply chain operations."

        return FacilityRiskResult(
            facility_id=request.facility_id,
            risk_level=risk_level,
            composite_risk_score=composite_score,
            days_of_stock_remaining=round(avg_days, 1),
            critical_resources_count=critical_count,
            explanation=explanation,
            recommended_action=action,
        )

risk_engine = RiskEngine()
