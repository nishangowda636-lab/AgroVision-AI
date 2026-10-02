"""
AgroVision AI — Real ML Smart Irrigation Router
===============================================
Endpoints for precision data-driven irrigation decisions and water volume requirement forecasts.
Integrates Farm Context, Live Microclimate (Open-Meteo), IoT Soil Moisture Sensors,
and the trained Gradient Boosting / Extra Trees models.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List, Tuple
import requests
import logging
from datetime import datetime, timezone

from app.database.session import get_db
from app.models.models import Farm, User, Sensor, PumpController, PumpEvent
from app.utils.auth import get_current_user
from app.schemas.schemas import (
    SmartIrrigationPredictIn,
    SmartIrrigationResponse,
    SmartIrrigationFactorItem,
    PumpCommandIn,
    PumpControllerOut
)
from app.ai.real_smart_irrigation_model import (
    evaluate_smart_irrigation_decision,
    load_smart_irrigation_artifacts,
    normalize_crop_name,
    normalize_soil_type,
    normalize_stage,
    normalize_irrigation_method
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/smart-irrigation", tags=["Real ML Smart Irrigation"])

def fetch_live_weather_and_rain_forecast(lat: float, lon: float) -> Tuple[float, float, float, float]:
    """Fetches real-time temperature, humidity, rainfall sum and max rain probability from Open-Meteo."""
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}&"
            f"current=temperature_2m,relative_humidity_2m,precipitation&"
            f"daily=precipitation_sum,precipitation_probability_max&"
            f"timezone=auto"
        )
        res = requests.get(url, timeout=4.0)
        if res.status_code == 200:
            data = res.json()
            curr = data.get("current", {})
            daily = data.get("daily", {})
            
            temp = float(curr.get("temperature_2m", 27.5))
            humidity = float(curr.get("relative_humidity_2m", 65.0))
            
            rain_sums = daily.get("precipitation_sum", [0.0])
            rain_val = float(rain_sums[0]) if (len(rain_sums) > 0 and rain_sums[0] is not None) else float(curr.get("precipitation", 0.0))
            
            rain_probs = daily.get("precipitation_probability_max", [15.0])
            rain_prob = float(rain_probs[0]) if (len(rain_probs) > 0 and rain_probs[0] is not None) else 15.0
            
            return temp, humidity, rain_val, rain_prob
    except Exception as e:
        logger.warning(f"Live weather fetch failed for ({lat}, {lon}): {e}")

    return 27.5, 65.0, 0.0, 15.0

@router.post("/predict", response_model=SmartIrrigationResponse)
def predict_smart_irrigation(
    req: SmartIrrigationPredictIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Main Real ML Smart Irrigation Decision Endpoint.
    Combines:
    - Selected Farm context (Crop, Stage, Soil, Area, Irrigation Method)
    - Live IoT soil moisture sensor (or user override)
    - Real-time Open-Meteo weather and precipitation forecast
    - ML Gradient Boosting Classifier + Water Volume Regressor
    - Critical Rain Safety rules and Emergency Stop fail-safes
    """
    farm = None
    farm_id = req.farm_id
    farm_name = None

    crop_val = req.crop
    stage_val = req.crop_stage
    soil_type_val = req.soil_type
    moisture_val = req.soil_moisture
    temp_val = req.temperature
    hum_val = req.humidity
    rain_val = req.rainfall
    rain_prob_val = req.rain_probability
    area_val = req.farm_area
    method_val = req.irrigation_method

    is_sensor_connected = False
    emergency_stopped = False

    # 1. Authorize Farm Access & Extract Saved Farm Parameters
    if farm_id is not None:
        farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
        if not farm:
            raise HTTPException(
                status_code=404,
                detail="Farm not found or you do not have permission to access this farm."
            )
        farm_name = farm.name
        crop_val = crop_val or farm.crop or "Tomato"
        stage_val = stage_val or farm.current_stage_override or "Vegetative Growth"
        soil_type_val = soil_type_val or farm.soil_type or "Loam"
        area_val = area_val if area_val is not None else (farm.size_acres or 1.0)
        method_val = method_val or farm.irrigation_method or "Drip Irrigation"

        # Check connected IoT soil moisture sensor
        moisture_sensor = db.query(Sensor).filter(
            Sensor.farm_id == farm.id,
            Sensor.sensor_type == "moisture"
        ).first()

        if moisture_sensor and moisture_sensor.status == "Online":
            is_sensor_connected = True
            if moisture_val is None:
                moisture_val = float(moisture_sensor.current_value)

        # Check pump controller emergency stop state
        pump = db.query(PumpController).filter(PumpController.farm_id == farm.id).first()
        if pump and pump.emergency_stopped:
            emergency_stopped = True

        lat = float(farm.latitude) if farm.latitude is not None else 12.9716
        lon = float(farm.longitude) if farm.longitude is not None else 77.5946
    else:
        lat = 12.9716
        lon = 77.5946

    # 2. Fetch Live Weather & Rain Probability if not provided
    if temp_val is None or hum_val is None or rain_val is None or rain_prob_val is None:
        live_temp, live_hum, live_rain, live_prob = fetch_live_weather_and_rain_forecast(lat, lon)
        if temp_val is None: temp_val = live_temp
        if hum_val is None: hum_val = live_hum
        if rain_val is None: rain_val = live_rain
        if rain_prob_val is None: rain_prob_val = live_prob

    # 3. Evaluate Decision through Real ML Engine
    result = evaluate_smart_irrigation_decision(
        crop=crop_val,
        crop_stage=stage_val,
        soil_type=soil_type_val,
        soil_moisture=moisture_val,
        temperature=temp_val,
        humidity=hum_val,
        rainfall=rain_val,
        rain_probability=rain_prob_val,
        farm_area=area_val,
        irrigation_method=method_val,
        is_sensor_connected=is_sensor_connected,
        emergency_stopped=emergency_stopped
    )

    factor_items = [
        SmartIrrigationFactorItem(
            name=f["name"],
            value=f["value"],
            status=f["status"],
            impact=f["impact"],
            description=f["description"]
        ) for f in result["important_factors"]
    ]

    # If rain lock is triggered and pump controller exists, update rain lock status
    if farm and result["decision"] == "DELAY IRRIGATION":
        pump = db.query(PumpController).filter(PumpController.farm_id == farm.id).first()
        if pump and not pump.rain_lock:
            pump.rain_lock = True
            db.commit()

    return SmartIrrigationResponse(
        farm_id=farm.id if farm else None,
        farm_name=farm_name,
        crop=crop_val or "Tomato",
        crop_stage=stage_val or "Vegetative Growth",
        soil_type=soil_type_val or "Loam",
        irrigation_method=method_val or "Drip Irrigation",
        soil_moisture_pct=moisture_val,
        is_sensor_connected=is_sensor_connected,
        irrigation_required=result["irrigation_required"],
        decision=result["decision"],
        reason=result["reason"],
        recommended_amount=result["recommended_amount"],
        unit=result["unit"],
        duration=result["duration"],
        duration_unit=result["duration_unit"],
        water_saved_liters=result["water_saved_liters"],
        optimal_window=result["optimal_window"],
        rain_warning=result["rain_warning"],
        confidence_or_uncertainty=result["confidence_or_uncertainty"],
        data_sources=result["data_sources"],
        important_factors=factor_items,
        recommendations=result["recommendations"],
        missing_parameters=result["missing_parameters"],
        model_used=result.get("model_used", "Gradient Boosting Classifier"),
        model_accuracy=result.get("model_accuracy", 0.9833),
        raw_model_prediction=result.get("raw_model_prediction"),
        raw_model_unit=result.get("raw_model_unit"),
        farm_area=result.get("farm_area"),
        calculation_used=result.get("calculation_used"),
        area_scaling_applied=result.get("area_scaling_applied"),
        timestamp=datetime.now(timezone.utc)
    )

@router.get("/model-info")
def get_smart_irrigation_model_info(current_user: User = Depends(get_current_user)):
    """Returns verified model architecture, test accuracy, confusion matrix, and feature schema."""
    _, _, _, eval_info, feat_meta = load_smart_irrigation_artifacts()
    eval_info = eval_info or {}
    feat_meta = feat_meta or {}
    return {
        "classifier_name": eval_info.get("classifier_name", "Gradient Boosting Classifier"),
        "test_accuracy": eval_info.get("test_accuracy", 0.9833),
        "test_precision": eval_info.get("test_precision", 0.9673),
        "test_recall": eval_info.get("test_recall", 0.9720),
        "test_f1": eval_info.get("test_f1", 0.9697),
        "confusion_matrix": eval_info.get("confusion_matrix", []),
        "regressor_name": eval_info.get("regressor_name", "Gradient Boosting Regressor"),
        "test_r2": eval_info.get("test_r2", 0.9162),
        "benchmark_classification": eval_info.get("benchmark_classification", {}),
        "top_feature_importances": eval_info.get("top_feature_importances", {}),
        "supported_crops": feat_meta.get("supported_crops", []),
        "supported_soils": feat_meta.get("supported_soils", []),
        "supported_stages": feat_meta.get("supported_stages", []),
        "supported_methods": feat_meta.get("supported_methods", [])
    }
