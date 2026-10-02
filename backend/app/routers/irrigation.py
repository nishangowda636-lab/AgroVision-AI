from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import requests
from app.database.session import get_db
from app.models.models import Farm, Sensor, User, PumpController
from app.utils.auth import get_current_user
from app.ai.real_smart_irrigation_model import evaluate_smart_irrigation_decision

router = APIRouter(prefix="/api/irrigation", tags=["Irrigation"])

def _fetch_weather_for_irrigation(lat: float, lon: float) -> dict:
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}&"
            f"current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&"
            f"daily=precipitation_probability_max,precipitation_sum&"
            f"timezone=auto"
        )
        res = requests.get(url, timeout=4.0)
        if res.status_code == 200:
            data = res.json()
            curr = data.get("current", {})
            daily = data.get("daily", {})
            rain_probs = daily.get("precipitation_probability_max", [15])
            rain_sums = daily.get("precipitation_sum", [0.0])

            return {
                "temp_c": round(float(curr.get("temperature_2m", 27.5)), 1),
                "humidity_pct": int(curr.get("relative_humidity_2m", 65)),
                "rain_prob_pct": float(rain_probs[0]) if len(rain_probs) > 0 and rain_probs[0] is not None else 15.0,
                "rainfall_mm": float(rain_sums[0]) if len(rain_sums) > 0 and rain_sums[0] is not None else 0.0
            }
    except Exception:
        pass

    return {
        "temp_c": 27.5,
        "humidity_pct": 65.0,
        "rain_prob_pct": 15.0,
        "rainfall_mm": 0.0
    }

@router.post("/recommend")
def get_irrigation_recommendation(
    farm_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    lat = farm.latitude if farm.latitude is not None else 12.9716
    lon = farm.longitude if farm.longitude is not None else 77.5946
    weather_info = _fetch_weather_for_irrigation(lat, lon)

    moisture_sensor = db.query(Sensor).filter(
        Sensor.farm_id == farm.id,
        Sensor.sensor_type == "moisture"
    ).first()

    is_sensor_connected = (moisture_sensor is not None and moisture_sensor.status == "Online")
    moisture_val = moisture_sensor.current_value if (moisture_sensor is not None and is_sensor_connected) else None

    # Check pump controller status
    pump = db.query(PumpController).filter(PumpController.farm_id == farm.id).first()
    pump_connected = pump.hardware_connected if pump else False
    pump_status = pump.status if pump else "OFF"
    pump_mode = pump.mode if pump else "AUTO"
    emergency_stopped = pump.emergency_stopped if pump else False

    crop_stage = farm.current_stage_override or "Vegetative Growth"

    result = evaluate_smart_irrigation_decision(
        crop=farm.crop or "Tomato",
        crop_stage=crop_stage,
        soil_type=farm.soil_type or "Loam",
        soil_moisture=moisture_val,
        temperature=weather_info["temp_c"],
        humidity=weather_info["humidity_pct"],
        rainfall=weather_info["rainfall_mm"],
        rain_probability=weather_info["rain_prob_pct"],
        farm_area=farm.size_acres or 1.0,
        irrigation_method=farm.irrigation_method or "Drip Irrigation",
        is_sensor_connected=is_sensor_connected,
        emergency_stopped=emergency_stopped
    )

    return {
        "farm_id": farm.id,
        "farm_name": farm.name,
        "crop": farm.crop,
        "crop_stage": crop_stage,
        "moisture_pct": moisture_val,
        "is_sensor_connected": is_sensor_connected,
        "irrigation_method": farm.irrigation_method,
        "live_weather": {
            "temperature_c": weather_info["temp_c"],
            "humidity_pct": weather_info["humidity_pct"],
            "rain_prob_pct": weather_info["rain_prob_pct"],
            "rainfall_mm": weather_info["rainfall_mm"]
        },
        "pump_status": pump_status,
        "pump_mode": pump_mode,
        "pump_hardware_connected": pump_connected,
        "manual_override_available": True,
        "action": result["decision"],
        "priority": "High" if result["irrigation_required"] else "Low",
        "reason": result["reason"],
        "water_amount_liters": result["recommended_amount"],
        "duration_minutes": result["duration"],
        "water_saved_liters": result["water_saved_liters"],
        "best_time": result["optimal_window"],
        "rain_warning": result["rain_warning"],
        "important_factors": result["important_factors"],
        "recommendations": result["recommendations"]
    }

