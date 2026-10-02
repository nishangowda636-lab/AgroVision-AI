from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from app.database.session import get_db
from app.models.models import Sensor, SensorReading, Farm, User
from app.schemas.schemas import SensorOut, SensorReadingCreate
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/sensors", tags=["Sensors"])

@router.get("/{farm_id}", response_model=List[SensorOut])
def get_farm_sensors(farm_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    sensors = db.query(Sensor).filter(Sensor.farm_id == farm.id).all()
    
    if not sensors:
        # Auto initialize sensors if none exist
        sensors_to_create = [
            ("Soil Moisture Node", "moisture", "%", 42.0, "Online"),
            ("Air Temperature Node", "temp", "°C", 27.5, "Online"),
            ("Air Humidity Node", "humidity", "%", 68.0, "Online"),
            ("Soil pH Probe", "ph", "pH", farm.soil_ph or 6.5, "Online"),
            ("Soil NPK Sensor", "npk", "mg/kg", farm.nitrogen or 140.0, "Online"),
            ("Water Tank Level", "tank", "%", 85.0, "Online")
        ]
        for s_name, s_type, s_unit, s_val, s_status in sensors_to_create:
            sensor_obj = Sensor(
                farm_id=farm.id,
                name=s_name,
                sensor_type=s_type,
                unit=s_unit,
                current_value=s_val,
                status=s_status
            )
            db.add(sensor_obj)
        db.commit()
        sensors = db.query(Sensor).filter(Sensor.farm_id == farm.id).all()

    # Return genuine persisted telemetry without fake random mutation
    return sensors

@router.post("/readings")
def receive_hardware_sensor_reading(reading_in: SensorReadingCreate, db: Session = Depends(get_db)):
    """
    Endpoint for physical ESP32 / Arduino / LoRaWAN gateways to post telemetry data.
    """
    sensor = db.query(Sensor).filter(Sensor.id == reading_in.sensor_id).first()
    if not sensor:
        raise HTTPException(status_code=404, detail="Sensor device not found")

    sensor.current_value = reading_in.value
    sensor.last_updated = datetime.now(timezone.utc)
    sensor.status = "Online"

    new_reading = SensorReading(
        sensor_id=sensor.id,
        farm_id=reading_in.farm_id,
        reading_type=reading_in.reading_type,
        value=reading_in.value,
        unit=reading_in.unit
    )
    db.add(new_reading)
    db.commit()

    return {"status": "success", "sensor_id": sensor.id, "current_value": sensor.current_value}
