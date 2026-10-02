"""
AgroVision AI — Centralized Machine Learning Model Status & Health Router
=========================================================================
Aggregates live diagnostic health checks, versioning metadata, and evaluation
metrics for all 5 core production ML models:
1. Crop Health & Disease Detection (MobileNetV2 Transfer Learning)
2. Crop Recommendation (Random Forest Classifier)
3. Yield Prediction (Extra Trees Regressor)
4. Smart Irrigation (Gradient Boosting + Extra Trees)
5. Fertilizer Recommendation (Gradient Boosting + Agronomic Budgeting)
"""

from fastapi import APIRouter
from datetime import datetime, timezone
import logging

from app.ai.real_disease_model import get_model_status as get_crop_health_status
from app.ai.real_crop_recommendation_model import get_model_status as get_crop_rec_status
from app.ai.real_crop_yield_model import get_model_status as get_yield_status
from app.ai.real_smart_irrigation_model import get_model_status as get_irrigation_status
from app.ai.real_fertilizer_model import get_model_status as get_fertilizer_status

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/models", tags=["ML Model Status"])

@router.get("/status")
def get_all_models_status():
    """
    Returns comprehensive real-time status of all AgroVision AI ML models.
    """
    ch_status = get_crop_health_status()
    cr_status = get_crop_rec_status()
    yp_status = get_yield_status()
    si_status = get_irrigation_status()
    fr_status = get_fertilizer_status()

    all_loaded = (
        bool(ch_status.get("loaded", False)) and
        bool(cr_status.get("loaded", False)) and
        bool(yp_status.get("loaded", False)) and
        bool(si_status.get("loaded", False)) and
        bool(fr_status.get("loaded", False))
    )

    return {
        "crop_health": ch_status,
        "crop_recommendation": cr_status,
        "yield_prediction": yp_status,
        "smart_irrigation": si_status,
        "fertilizer": fr_status,
        "all_models_operational": all_loaded,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
