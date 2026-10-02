"""
AgroVision AI — Weather Intelligence Router

Provides endpoints for real meteorological telemetry and agricultural decision intelligence:
- GET /api/weather/current
- GET /api/weather/forecast
- GET /api/weather/intelligence
- GET /api/weather/{farm_id} (Backward compatible farm weather endpoint)

All endpoints enforce farmer ownership and use real Open-Meteo GPS satellite feeds.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone

from app.database.session import get_db
from app.models.models import Farm, User, Sensor, PumpController
from app.utils.auth import get_current_user
from app.schemas.schemas import (
    WeatherIntelligenceResponse,
    CurrentWeatherOut,
    DailyForecastItem,
    WeatherAlertItem,
    FarmingAdviceItem,
    IrrigationAdviceItem,
    FertilizerAdviceItem,
    CropHealthAdviceItem
)
from app.ai.weather_intelligence_engine import (
    fetch_real_weather_telemetry,
    generate_weather_intelligence_decisions,
    WEATHER_CODE_MAP
)

router = APIRouter(prefix="/api/weather", tags=["Weather"])


class Tuple_FarmResolved:
    def __init__(self, farm: Optional[Farm], lat: Optional[float], lon: Optional[float], is_location_missing: bool):
        self.farm = farm
        self.lat = lat
        self.lon = lon
        self.is_location_missing = is_location_missing


def _resolve_farm_and_coords(
    farm_id: Optional[int],
    lat: Optional[float],
    lon: Optional[float],
    current_user: User,
    db: Session
) -> Tuple_FarmResolved:
    """Helper to authenticate farmer ownership and extract lat/lon coordinates."""
    farm = None
    if farm_id is not None:
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if not farm:
            raise HTTPException(status_code=404, detail=f"Farm with ID {farm_id} not found.")
        if farm.user_id != current_user.id and current_user.role != "admin":
            raise HTTPException(status_code=404, detail="You do not have permission to access this farm's weather data.")

    # Determine coordinates
    resolved_lat: Optional[float] = float(lat) if lat is not None else (float(farm.latitude) if farm and farm.latitude is not None else None)
    resolved_lon: Optional[float] = float(lon) if lon is not None else (float(farm.longitude) if farm and farm.longitude is not None else None)

    is_location_missing = (resolved_lat is None or resolved_lon is None or (resolved_lat == 0.0 and resolved_lon == 0.0))

    return Tuple_FarmResolved(
        farm=farm,
        lat=resolved_lat,
        lon=resolved_lon,
        is_location_missing=is_location_missing
    )


@router.get("/current")
def get_current_weather(
    farm_id: Optional[int] = Query(None, description="Farm ID owned by authenticated farmer"),
    lat: Optional[float] = Query(None, description="Optional override latitude"),
    lon: Optional[float] = Query(None, description="Optional override longitude"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns real-time current microclimate weather for the farmer's selected farm location.
    """
    resolved = _resolve_farm_and_coords(farm_id, lat, lon, current_user, db)

    if resolved.is_location_missing or resolved.lat is None or resolved.lon is None:
        return {
            "farm_id": resolved.farm.id if resolved.farm else None,
            "farm_name": resolved.farm.name if resolved.farm else None,
            "is_location_missing": True,
            "location_prompt": "Farm GPS location is missing. Please update your farm location in Farm Setup or provide coordinates.",
            "current_weather": None,
            "data_source": "None (Location Missing)",
            "fetched_at": datetime.now(timezone.utc).isoformat()
        }

    try:
        raw_telemetry = fetch_real_weather_telemetry(resolved.lat, resolved.lon)
        curr = raw_telemetry["current_weather"]
        return {
            "farm_id": resolved.farm.id if resolved.farm else None,
            "farm_name": resolved.farm.name if resolved.farm else None,
            "location_name": resolved.farm.location_name if resolved.farm else f"{resolved.lat:.4f}°N, {resolved.lon:.4f}°E",
            "latitude": resolved.lat,
            "longitude": resolved.lon,
            "is_location_missing": False,
            "current_weather": curr,
            "data_source": raw_telemetry["data_source"],
            "fetched_at": raw_telemetry["fetched_at"]
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Unable to fetch live weather data from provider: {str(e)}")


@router.get("/forecast")
def get_weather_forecast(
    farm_id: Optional[int] = Query(None, description="Farm ID owned by authenticated farmer"),
    lat: Optional[float] = Query(None, description="Optional override latitude"),
    lon: Optional[float] = Query(None, description="Optional override longitude"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns 5–7 day agricultural microclimate forecast for the farmer's selected farm.
    """
    resolved = _resolve_farm_and_coords(farm_id, lat, lon, current_user, db)

    if resolved.is_location_missing or resolved.lat is None or resolved.lon is None:
        return {
            "farm_id": resolved.farm.id if resolved.farm else None,
            "farm_name": resolved.farm.name if resolved.farm else None,
            "is_location_missing": True,
            "location_prompt": "Farm GPS location is missing. Please set farm latitude and longitude in Farm Setup.",
            "forecast": [],
            "data_source": "None (Location Missing)",
            "fetched_at": datetime.now(timezone.utc).isoformat()
        }

    try:
        raw_telemetry = fetch_real_weather_telemetry(resolved.lat, resolved.lon)
        return {
            "farm_id": resolved.farm.id if resolved.farm else None,
            "farm_name": resolved.farm.name if resolved.farm else None,
            "location_name": resolved.farm.location_name if resolved.farm else f"{resolved.lat:.4f}°N, {resolved.lon:.4f}°E",
            "latitude": resolved.lat,
            "longitude": resolved.lon,
            "is_location_missing": False,
            "forecast": raw_telemetry["forecast"],
            "data_source": raw_telemetry["data_source"],
            "fetched_at": raw_telemetry["fetched_at"]
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Unable to fetch weather forecast from provider: {str(e)}")


@router.get("/intelligence", response_model=WeatherIntelligenceResponse)
def get_weather_intelligence(
    farm_id: Optional[int] = Query(None, description="Farm ID owned by authenticated farmer"),
    lat: Optional[float] = Query(None, description="Optional override latitude"),
    lon: Optional[float] = Query(None, description="Optional override longitude"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Synthesizes real meteorological telemetry with crop phenology, soil chemistry,
    and IoT status into structured agricultural intelligence (Irrigation, Fertilizer, Crop Health, Operations).
    """
    resolved = _resolve_farm_and_coords(farm_id, lat, lon, current_user, db)

    if resolved.is_location_missing or resolved.lat is None or resolved.lon is None:
        return WeatherIntelligenceResponse(
            farm_id=resolved.farm.id if resolved.farm else None,
            farm_name=resolved.farm.name if resolved.farm else None,
            is_location_missing=True,
            location_prompt="Farm GPS location is missing. Please configure your farm location in Farm Setup.",
            current_weather=None,
            forecast=[],
            alerts=[],
            farming_advice=[],
            irrigation_advice=None,
            fertilizer_advice=None,
            crop_health_advice=None,
            data_source="None (Location Missing)",
            fetched_at=datetime.now(timezone.utc).isoformat()
        )

    crop = resolved.farm.crop if resolved.farm and resolved.farm.crop else "General Crops"
    crop_stage = resolved.farm.current_stage_override if resolved.farm and resolved.farm.current_stage_override else "Vegetative Growth"
    soil_type = resolved.farm.soil_type if resolved.farm and resolved.farm.soil_type else "Loam"

    # Check connected IoT moisture sensor
    soil_moisture_val = None
    is_sensor_connected = False
    if resolved.farm:
        moisture_sensor = db.query(Sensor).filter(
            Sensor.farm_id == resolved.farm.id,
            Sensor.sensor_type == "moisture"
        ).first()
        if moisture_sensor and moisture_sensor.status == "Online":
            is_sensor_connected = True
            soil_moisture_val = moisture_sensor.current_value

    try:
        raw_telemetry = fetch_real_weather_telemetry(resolved.lat, resolved.lon)
        decisions = generate_weather_intelligence_decisions(
            weather_data=raw_telemetry,
            crop=crop,
            crop_stage=crop_stage,
            soil_type=soil_type,
            soil_moisture=soil_moisture_val,
            is_sensor_connected=is_sensor_connected
        )

        return WeatherIntelligenceResponse(
            farm_id=resolved.farm.id if resolved.farm else None,
            farm_name=resolved.farm.name if resolved.farm else None,
            location_name=resolved.farm.location_name if resolved.farm else f"{resolved.lat:.4f}°N, {resolved.lon:.4f}°E",
            latitude=resolved.lat,
            longitude=resolved.lon,
            is_location_missing=False,
            crop=crop,
            crop_stage=crop_stage,
            soil_type=soil_type,
            current_weather=raw_telemetry["current_weather"],
            forecast=raw_telemetry["forecast"],
            alerts=decisions["alerts"],
            farming_advice=decisions["farming_advice"],
            irrigation_advice=decisions["irrigation_advice"],
            fertilizer_advice=decisions["fertilizer_advice"],
            crop_health_advice=decisions["crop_health_advice"],
            data_source=raw_telemetry["data_source"],
            fetched_at=raw_telemetry["fetched_at"]
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Weather Intelligence fetch error: {str(e)}")


@router.get("/{farm_id}")
def get_farm_weather_legacy(
    farm_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unified legacy endpoint supporting existing frontend components while returning
    complete real-time Open-Meteo intelligence.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    if farm.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=404, detail="You do not have permission to access this farm's weather data.")

    lat = farm.latitude if farm.latitude is not None else 12.9716
    lon = farm.longitude if farm.longitude is not None else 77.5946
    location_label = farm.location_name or "Farm Location"
    crop_name = farm.crop or "Crops"
    crop_stage = farm.current_stage_override or "Vegetative Growth"
    soil_type = farm.soil_type or "Loam"

    # Check connected IoT sensors
    moisture_sensor = db.query(Sensor).filter(
        Sensor.farm_id == farm.id,
        Sensor.sensor_type == "moisture"
    ).first()
    is_sensor_connected = moisture_sensor is not None and moisture_sensor.status == "Online"
    soil_moisture_val = float(moisture_sensor.current_value) if (moisture_sensor is not None and is_sensor_connected) else None

    # Check pump controller status
    pump = db.query(PumpController).filter(PumpController.farm_id == farm.id).first()
    pump_connected = pump.hardware_connected if pump else False
    pump_status = pump.status if pump else "OFF"
    pump_mode = pump.mode if pump else "AUTO"

    try:
        raw_telemetry = fetch_real_weather_telemetry(lat, lon)
        curr = raw_telemetry["current_weather"]
        decisions = generate_weather_intelligence_decisions(
            weather_data=raw_telemetry,
            crop=crop_name,
            crop_stage=crop_stage,
            soil_type=soil_type,
            soil_moisture=soil_moisture_val,
            is_sensor_connected=is_sensor_connected
        )

        legacy_irrigation_decision = {
            "decision": decisions["irrigation_advice"]["decision"],
            "reason": decisions["irrigation_advice"]["reason"],
            "soil_moisture": soil_moisture_val,
            "is_sensor_connected": is_sensor_connected,
            "pump_status": pump_status,
            "pump_mode": pump_mode,
            "hardware_connected": pump_connected,
            "manual_override_available": True
        }

        # Convert farming_advice to legacy action format
        legacy_actions = []
        for adv in decisions["farming_advice"]:
            legacy_actions.append({
                "type": adv["type"],
                "title": adv["title"],
                "message": adv["message"],
                "why": adv["why"],
                "impact": adv["impact"],
                "category": adv["category"]
            })

        return {
            "farm_id": farm.id,
            "farm_name": farm.name,
            "location": location_label,
            "latitude": lat,
            "longitude": lon,
            "crop": crop_name,
            "crop_stage": crop_stage,
            "temperature": curr["temperature"],
            "feels_like": curr["feels_like"],
            "humidity": curr["humidity"],
            "wind_speed_kmh": curr["wind_speed"],
            "precipitation_now_mm": curr["precipitation_now_mm"],
            "rainfall_prob_pct": curr["rain_probability"],
            "rainfall_mm": curr["rainfall_mm"],
            "condition": curr["condition"],
            "description": curr["description"],
            "sunrise": curr.get("sunrise", "06:10"),
            "sunset": curr.get("sunset", "18:30"),
            "uv_index": curr.get("uv_index", 6.5),
            "forecast_7days": raw_telemetry["forecast"],
            "farming_actions": legacy_actions,
            "alerts": decisions["alerts"],
            "irrigation_decision": legacy_irrigation_decision,
            "irrigation_advice": decisions["irrigation_advice"],
            "fertilizer_advice": decisions["fertilizer_advice"],
            "crop_health_advice": decisions["crop_health_advice"],
            "data_provenance": "REAL_METEOROLOGICAL_FEED",
            "is_simulated": False
        }
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Unable to fetch live meteorological data from provider: {str(e)}")
