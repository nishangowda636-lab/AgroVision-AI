"""
AgroVision AI — Crop Recommendation Service
============================================
Delegates directly to the Real ML Random Forest model pipeline
trained on verified agricultural data.
"""

from typing import List, Dict, Any, Optional
from app.ai.real_crop_recommendation_model import predict_crop_recommendations, CROP_AGRONOMY_REGISTRY

def recommend_crops(
    n: float,
    p: float,
    k: float,
    ph: float,
    temp: float = 25.0,
    humidity: float = 65.0,
    rainfall: float = 120.0,
    season: Optional[str] = None,
    top_k: int = 5
) -> List[Dict[str, Any]]:
    """
    Ranks crops using the trained Real ML Random Forest Classifier.
    Maintains compatibility with existing AgroVision AI endpoints while
    providing 100% data-driven real ML predictions.
    """
    result = predict_crop_recommendations(
        nitrogen=n,
        phosphorus=p,
        potassium=k,
        ph=ph,
        temperature=temp,
        humidity=humidity,
        rainfall=rainfall,
        season=season,
        top_k=top_k
    )

    scored = []
    for item in result["recommendations"]:
        scored.append({
            "crop": item["display_name"],
            "raw_label": item["crop"],
            "suitability": item["suitability_pct"],
            "confidence": item["confidence"],
            "category": item["category"],
            "why_recommended": item["why_recommended"],
            "soil_suitability": item["soil_suitability"],
            "climate_suitability": item["climate_suitability"],
            "water_req": item["water_requirement"],
            "water_req_category": item["water_requirement_category"],
            "duration": item["duration_days"],
            "expected_yield": item["expected_yield"],
            "important_considerations": item["important_considerations"],
            "recommended_varieties": item["recommended_varieties"],
            "market_demand": item["market_demand"]
        })

    return scored
