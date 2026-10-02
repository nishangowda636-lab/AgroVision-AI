from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import json

from app.database.session import get_db
from app.models.models import Farm, User, Sensor, SatelliteObservation
from app.schemas.schemas import (
    SatelliteFieldHealthOut,
    SatelliteObservationOut,
    FieldBoundaryUpdateIn
)
from app.utils.auth import get_current_user
from app.routers.farms import fetch_farm_weather_telemetry
from app.ai.satellite_engine import compute_sentinel2_field_health

router = APIRouter(prefix="/api/satellite", tags=["Satellite Field Health & Remote Sensing"])

@router.get("/field-health/{farm_id}", response_model=SatelliteFieldHealthOut)
def get_satellite_field_health(
    farm_id: int,
    refresh: bool = Query(False, description="Force re-query of remote Sentinel-2 STAC provider"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves legitimate Sentinel-2 earth observation telemetry for the selected farm's GPS coordinates.
    Computes NDVI canopy vigor, spatial quadrant health zones, 'What Changed?' delta, and
    cross-correlates remote sensing data with IoT soil moisture and Open-Meteo precipitation models.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found or unauthorized access")

    if farm.latitude is None or farm.longitude is None or (farm.latitude == 0.0 and farm.longitude == 0.0):
        raise HTTPException(
            status_code=400,
            detail="Farm GPS coordinates not configured. Please edit farm in Farm Setup and select location on map."
        )

    # Fetch live weather
    weather_data = fetch_farm_weather_telemetry(farm.latitude, farm.longitude)

    # Fetch real IoT soil moisture
    moisture_sensor = db.query(Sensor).filter(
        Sensor.farm_id == farm.id,
        Sensor.sensor_type == "moisture"
    ).first()
    
    sensor_connected = moisture_sensor is not None and moisture_sensor.status == "Online"
    soil_moist_val = float(moisture_sensor.current_value) if (moisture_sensor is not None and sensor_connected) else None

    # Parse saved custom boundary
    custom_boundary: Optional[Dict[str, Any]] = None
    if farm.boundary_geojson:
        try:
            parsed = json.loads(farm.boundary_geojson) if isinstance(farm.boundary_geojson, str) else farm.boundary_geojson
            if isinstance(parsed, dict):
                custom_boundary = parsed
        except Exception:
            custom_boundary = None

    # Fetch prior observation from DB for delta comparison
    prior_obs = db.query(SatelliteObservation).filter(
        SatelliteObservation.farm_id == farm.id
    ).order_by(SatelliteObservation.observation_date.desc()).first()

    prior_obs_dict = None
    if prior_obs:
        prior_obs_dict = {
            "observation_date": prior_obs.observation_date,
            "mean_ndvi": float(prior_obs.mean_ndvi)
        }

    # Compute Sentinel-2 Field Health
    stage_str = farm.current_stage_override or "Vegetative Growth"
    result = compute_sentinel2_field_health(
        lat=float(farm.latitude),
        lon=float(farm.longitude),
        size_acres=float(farm.size_acres or 1.0),
        crop=farm.crop or "Tomato",
        crop_stage=stage_str,
        live_weather=weather_data,
        soil_moisture_pct=soil_moist_val,
        custom_boundary=custom_boundary,
        previous_observation=prior_obs_dict,
        force_refresh=refresh
    )

    result["farm_id"] = farm.id
    result["farm_name"] = farm.name

    # Persist or update latest observation in database
    try:
        latest_obs = db.query(SatelliteObservation).filter(
            SatelliteObservation.farm_id == farm.id,
            SatelliteObservation.observation_date == result["observation_date"]
        ).first()

        if not latest_obs:
            latest_obs = SatelliteObservation(
                farm_id=farm.id,
                observation_date=result["observation_date"],
                satellite_provider=result["satellite_provider"],
                resolution_meters=result["resolution_meters"],
                cloud_cover_pct=result["cloud_cover_pct"],
                mean_ndvi=result["mean_ndvi"],
                previous_ndvi=result["what_changed"]["previous_ndvi"],
                ndvi_change_pct=result["what_changed"]["ndvi_change_pct"],
                health_status=result["health_status"],
                affected_area_acres=result["affected_area_acres"],
                health_zones_json=json.dumps(result["zones"]),
                what_changed_summary=result["what_changed"]["summary"],
                possible_reasons_json=json.dumps(result["what_changed"]["possible_reasons"]),
                recommended_action=result["what_changed"]["recommended_action"],
                iot_cross_analysis=json.dumps(result["cross_analysis"]),
                created_at=datetime.now(timezone.utc)
            )
            db.add(latest_obs)
            db.commit()
        else:
            latest_obs.mean_ndvi = result["mean_ndvi"]
            latest_obs.cloud_cover_pct = result["cloud_cover_pct"]
            latest_obs.health_status = result["health_status"]
            latest_obs.affected_area_acres = result["affected_area_acres"]
            latest_obs.health_zones_json = json.dumps(result["zones"])
            latest_obs.what_changed_summary = result["what_changed"]["summary"]
            latest_obs.possible_reasons_json = json.dumps(result["what_changed"]["possible_reasons"])
            latest_obs.recommended_action = result["what_changed"]["recommended_action"]
            latest_obs.iot_cross_analysis = json.dumps(result["cross_analysis"])
            db.commit()
    except Exception as e:
        print(f"Observation persistence note: {e}")

    return result

@router.post("/refresh/{farm_id}", response_model=SatelliteFieldHealthOut)
def refresh_satellite_field_health(
    farm_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Forces immediate re-synchronization with remote Sentinel-2 STAC provider.
    """
    return get_satellite_field_health(farm_id=farm_id, refresh=True, current_user=current_user, db=db)

@router.get("/history/{farm_id}", response_model=List[SatelliteObservationOut])
def get_satellite_history(
    farm_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns historical Sentinel-2 observations timeline for the selected farm.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    observations = db.query(SatelliteObservation).filter(
        SatelliteObservation.farm_id == farm.id
    ).order_by(SatelliteObservation.observation_date.desc()).limit(15).all()

    return observations

@router.post("/boundary/{farm_id}")
def update_farm_boundary(
    farm_id: int,
    payload: FieldBoundaryUpdateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Saves or updates custom GeoJSON polygon boundary for the farm field.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    farm.boundary_geojson = json.dumps(payload.boundary_geojson)
    db.commit()
    return {"status": "success", "message": "Field boundary updated successfully", "boundary_geojson": payload.boundary_geojson}
