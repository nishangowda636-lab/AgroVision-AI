"""
AgroVision AI — Real ML Crop Yield Prediction Router
=====================================================
Provides endpoints for precision data-driven crop yield and total harvest forecasting.
Connects Farm Context, Live Weather (Open-Meteo), Soil Nutrients, and Irrigation/Inputs
to the trained Real ML Extra Trees Regressor model.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
import requests
import logging
from datetime import datetime, timezone

from app.database.session import get_db
from app.models.models import Farm, User, Sensor
from app.utils.auth import get_current_user
from app.schemas.schemas import (
    CropYieldPredictIn,
    CropYieldResponse,
    CropYieldFactorItem
)
from app.ai.real_crop_yield_model import (
    predict_crop_yield,
    load_yield_artifacts,
    normalize_crop_name,
    normalize_season_name
)

logger = logging.getLogger(__name__)

# Primary Router: /api/yield-prediction
router = APIRouter(prefix="/api/yield-prediction", tags=["Real ML Crop Yield Prediction"])

# Legacy / Alternative Router: /api/yield
legacy_yield_router = APIRouter(prefix="/api/yield", tags=["Crop Yield Prediction"])

def fetch_live_weather_for_coords(lat: float, lon: float):
    """Fetches real-time temperature, humidity, and rainfall from Open-Meteo API."""
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
            
            temp = float(curr.get("temperature_2m", 26.5))
            humidity = float(curr.get("relative_humidity_2m", 68.0))
            rain_sums = daily.get("precipitation_sum", [])
            rain_val = float(rain_sums[0]) if (len(rain_sums) > 0 and rain_sums[0] is not None) else float(curr.get("precipitation", 0.0))
            
            effective_rainfall = max(rain_val * 15.0, 85.0) if rain_val > 0 else 95.0
            return temp, humidity, effective_rainfall, True
    except Exception as e:
        logger.warning(f"Live weather fetch failed for ({lat}, {lon}): {e}")

    return 26.5, 68.0, 95.0, False

@router.post("/predict", response_model=CropYieldResponse)
def predict_yield(
    req: CropYieldPredictIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Main Real ML Crop Yield Prediction Endpoint.
    Combines:
    - Selected Farm context (Crop, Area, Soil, Location, Sowing date)
    - Live Open-Meteo Weather or manual climate overrides
    - IoT soil moisture & irrigation method
    - Real ML Extra Trees Regressor Model
    """
    farm = None
    farm_id = req.farm_id
    farm_name = None

    crop_val = req.crop
    area_val = req.area_acres
    season_val = req.season
    crop_stage_val = req.crop_stage
    state_val = req.state
    lat = req.latitude
    lon = req.longitude
    soil_type = req.soil_type
    soil_ph = req.soil_ph
    n_val = req.nitrogen
    p_val = req.phosphorus
    k_val = req.potassium
    temp_val = req.temperature
    humidity_val = req.humidity
    rain_val = req.rainfall
    irrig_val = req.irrigation_method
    moisture_val = req.soil_moisture_pct
    sowing_date_val = req.sowing_date

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
        area_val = area_val if area_val is not None else (farm.size_acres or 1.0)
        lat = lat if lat is not None else farm.latitude
        lon = lon if lon is not None else farm.longitude
        soil_type = soil_type or farm.soil_type
        soil_ph = soil_ph if soil_ph is not None else farm.soil_ph
        n_val = n_val if n_val is not None else farm.nitrogen
        p_val = p_val if p_val is not None else farm.phosphorus
        k_val = k_val if k_val is not None else farm.potassium
        irrig_val = irrig_val or farm.irrigation_method
        sowing_date_val = sowing_date_val or farm.sowing_date
        crop_stage_val = crop_stage_val or farm.current_stage_override
        if not state_val and farm.location_name:
            state_val = farm.location_name.split(",")[-1].strip() if "," in farm.location_name else farm.location_name

        # Check connected IoT soil moisture sensor
        if moisture_val is None:
            moisture_sensor = db.query(Sensor).filter(
                Sensor.farm_id == farm.id,
                Sensor.sensor_type == "moisture"
            ).first()
            if moisture_sensor and moisture_sensor.status == "Online":
                moisture_val = float(moisture_sensor.current_value)

    target_crop = crop_val or "Tomato"
    target_area = float(area_val) if area_val is not None else 1.0
    target_lat = float(lat) if lat is not None else 12.9716
    target_lon = float(lon) if lon is not None else 77.5946

    # 2. Fetch Live Weather if not provided
    if temp_val is None or humidity_val is None or rain_val is None:
        live_temp, live_humidity, live_rain, _ = fetch_live_weather_for_coords(target_lat, target_lon)
        if temp_val is None:
            temp_val = live_temp
        if humidity_val is None:
            humidity_val = live_humidity
        if rain_val is None:
            rain_val = live_rain

    # 3. Execute Real ML Yield Prediction Engine
    res = predict_crop_yield(
        crop=target_crop,
        farm_size_acres=target_area,
        season=season_val,
        state=state_val,
        latitude=target_lat,
        longitude=target_lon,
        soil_ph=soil_ph,
        nitrogen=n_val,
        phosphorus=p_val,
        potassium=k_val,
        soil_type=soil_type,
        temperature=temp_val,
        humidity=humidity_val,
        rainfall=rain_val,
        irrigation_method=irrig_val,
        soil_moisture=moisture_val,
        sowing_date=sowing_date_val,
        crop_stage=crop_stage_val
    )

    factor_items = [
        CropYieldFactorItem(
            name=f["name"],
            value=f["value"],
            status=f["status"],
            impact=f["impact"],
            description=f["description"]
        ) for f in res["important_factors"]
    ]

    return CropYieldResponse(
        farm_id=farm.id if farm else None,
        farm_name=farm_name,
        crop=res["crop"],
        standardized_crop=res["standardized_crop"],
        farm_size_acres=res["farm_size_acres"],
        farm_size_hectares=res["farm_size_hectares"],
        predicted_yield_per_hectare=res["predicted_yield_per_hectare"],
        unit=res["unit"],
        predicted_yield_per_acre=res["predicted_yield_per_acre"],
        unit_acre=res["unit_acre"],
        estimated_total_production=res["estimated_total_production"],
        production_unit=res["production_unit"],
        prediction_range_per_hectare=res["prediction_range_per_hectare"],
        prediction_range_total=res["prediction_range_total"],
        confidence_pct=res.get("confidence_pct"),
        model_used=res["model_used"],
        model_r2_score=res["model_r2_score"],
        test_mae_tonnes_per_ha=res["test_mae_tonnes_per_ha"],
        test_rmse_tonnes_per_ha=res.get("test_rmse_tonnes_per_ha", 2.4353),
        harvest_window=res["harvest_window"],
        important_factors=factor_items,
        recommendations=res["recommendations"],
        missing_parameters=res["missing_parameters"],
        data_completeness=res["data_completeness"],
        safety_disclaimer=res["safety_disclaimer"],
        timestamp=datetime.now(timezone.utc)
    )

@router.get("/model-info")
def get_yield_model_info(current_user: User = Depends(get_current_user)):
    """Returns verified yield model architecture, evaluation metrics, and feature list."""
    _, _, eval_info, features_meta = load_yield_artifacts()
    eval_info = eval_info or {}
    features_meta = features_meta or {}
    return {
        "model_name": eval_info.get("model_name", "Extra Trees Regressor"),
        "test_r2_score": eval_info.get("test_r2", 0.9505),
        "test_mae_tonnes_per_ha": eval_info.get("test_mae", 0.9301),
        "test_rmse_tonnes_per_ha": eval_info.get("test_rmse", 2.4353),
        "target": eval_info.get("target", "Yield (tonnes/hectare)"),
        "total_records": eval_info.get("total_records", 18993),
        "benchmark_comparison": eval_info.get("benchmark_comparison", {}),
        "feature_importances": eval_info.get("feature_importances", {}),
        "supported_crops": features_meta.get("supported_crops", [])
    }

# Legacy Endpoints for /api/yield
@legacy_yield_router.post("/predict")
def get_legacy_yield_forecast(
    farm_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Legacy crop yield endpoint upgraded to Real ML backend.
    """
    if farm_id is None:
        farm = db.query(Farm).filter(Farm.user_id == current_user.id).first()
    else:
        farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()

    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    lat = float(farm.latitude) if farm.latitude is not None else 12.9716
    lon = float(farm.longitude) if farm.longitude is not None else 77.5946
    live_temp, live_humidity, live_rain, _ = fetch_live_weather_for_coords(lat, lon)

    res = predict_crop_yield(
        crop=farm.crop or "Tomato",
        farm_size_acres=farm.size_acres or 1.0,
        soil_ph=farm.soil_ph if farm.soil_ph is not None else 6.5,
        nitrogen=farm.nitrogen if farm.nitrogen is not None else 80.0,
        phosphorus=farm.phosphorus if farm.phosphorus is not None else 40.0,
        potassium=farm.potassium if farm.potassium is not None else 50.0,
        temperature=live_temp,
        humidity=live_humidity,
        rainfall=live_rain,
        irrigation_method=farm.irrigation_method,
        sowing_date=farm.sowing_date
    )

    return {
        "farm_id": farm.id,
        "farm_name": farm.name,
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
        "factors": res["important_factors"],
        "recommendations": res["recommendations"],
        "safety_disclaimer": res["safety_disclaimer"]
    }
