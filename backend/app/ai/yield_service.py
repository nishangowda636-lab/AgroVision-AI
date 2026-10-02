"""
AgroVision AI — Crop Yield Service
===================================
Delegates directly to the Real ML Extra Trees Regressor and agronomy pipeline.
"""

from typing import Dict, Any, List, Optional
from app.ai.real_crop_yield_model import predict_crop_yield as predict_real_yield

def predict_crop_yield(
    crop: str,
    farm_size_acres: float = 1.0,
    soil_ph: float = 6.5,
    n: float = 80.0,
    p: float = 40.0,
    k: float = 50.0,
    moisture_pct: float = 45.0,
    season: Optional[str] = None,
    state: Optional[str] = None,
    temperature: Optional[float] = 26.5,
    rainfall: Optional[float] = 95.0,
    irrigation_method: Optional[str] = "Drip Irrigation",
    sowing_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Ranks and estimates expected harvest yield using the trained Real ML regression model.
    Maintains compatibility with existing AgroVision AI endpoints while
    providing 100% data-driven real ML predictions.
    """
    res = predict_real_yield(
        crop=crop,
        farm_size_acres=farm_size_acres,
        season=season,
        state=state,
        soil_ph=soil_ph,
        nitrogen=n,
        phosphorus=p,
        potassium=k,
        temperature=temperature,
        rainfall=rainfall,
        irrigation_method=irrigation_method,
        soil_moisture=moisture_pct,
        sowing_date=sowing_date
    )

    # Legacy-compatible mapping while exposing all rich ML fields
    return {
        "crop": res["crop"],
        "farm_size_acres": res["farm_size_acres"],
        "expected_yield_tons": res["estimated_total_production"],
        "expected_yield_per_hectare": res["predicted_yield_per_hectare"],
        "expected_yield_per_acre": res["predicted_yield_per_acre"],
        "prediction_range": res["prediction_range_per_hectare"],
        "prediction_range_total": res["prediction_range_total"],
        "confidence_pct": res["confidence_pct"],
        "harvest_window": res["harvest_window"],
        "model_used": res["model_used"],
        "model_r2_score": res["model_r2_score"],
        "factors": res["important_factors"],
        "recommendations": res["recommendations"],
        "safety_disclaimer": res["safety_disclaimer"]
    }
