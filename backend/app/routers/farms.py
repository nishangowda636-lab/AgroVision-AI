from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timezone
import requests
import json

from app.database.session import get_db
from app.models.models import (
    Farm, User, Sensor, SensorReading, DiseaseDetection,
    PumpController, CropCalendarEvent, FarmPlanTaskRecord, Notification, AIConversation,
    Expense, YieldPrediction, FertilizerApplication
)
from app.schemas.schemas import (
    FarmCreate, FarmUpdate, FarmOut,
    CropStageOut, CropStageUpdateIn,
    TodayPlanResponse, TodayPlanCompleteIn,
    CropCalendarEventOut,
    AIChatRequest, AIChatResponse
)
from app.utils.auth import get_current_user
from app.ai.crop_stage_engine import calculate_crop_stage_intelligence
from app.ai.farm_plan_engine import generate_todays_farm_plan_intelligence
from app.ai.assistant_service import generate_ai_assistant_response

router = APIRouter(prefix="/api/farms", tags=["Farms"])


def fetch_farm_weather_telemetry(lat: float, lon: float) -> dict:
    """Fetches live meteorological telemetry from Open-Meteo for farm GPS coordinates."""
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}&"
            f"current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&"
            f"daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&"
            f"timezone=auto"
        )
        res = requests.get(url, timeout=3.5)
        if res.status_code == 200:
            data = res.json()
            curr = data.get("current", {})
            daily = data.get("daily", {})
            rain_probs = daily.get("precipitation_probability_max", [15])
            today_rain = rain_probs[0] if len(rain_probs) > 0 and rain_probs[0] is not None else 15.0
            rain_sums = daily.get("precipitation_sum", [0.0])
            today_rain_mm = rain_sums[0] if len(rain_sums) > 0 and rain_sums[0] is not None else 0.0

            return {
                "temperature": round(float(curr.get("temperature_2m", 27.5)), 1),
                "humidity": int(curr.get("relative_humidity_2m", 65)),
                "wind_speed": round(float(curr.get("wind_speed_10m", 10.0)), 1),
                "rain_prob": float(today_rain),
                "precipitation_mm": float(today_rain_mm),
                "condition": "Clear Sky" if int(curr.get("weather_code", 1)) == 0 else "Partly Cloudy",
                "is_live": True
            }
    except Exception:
        pass

    return {
        "temperature": 27.5,
        "humidity": 65,
        "wind_speed": 10.0,
        "rain_prob": 15.0,
        "precipitation_mm": 0.0,
        "condition": "Partly Cloudy",
        "is_live": False
    }


def gather_farm_context_bundle(farm: Farm, db: Session, language: str = "English") -> dict:
    """Assembles all real farm data points across all 10 agricultural modules."""
    # 1. Live Weather
    lat = farm.latitude if farm.latitude is not None else 12.9716
    lon = farm.longitude if farm.longitude is not None else 77.5946
    weather_data = fetch_farm_weather_telemetry(lat, lon)

    # 2. Real IoT Sensors
    moisture_sensor = db.query(Sensor).filter(
        Sensor.farm_id == farm.id,
        Sensor.sensor_type == "moisture"
    ).first()

    temp_sensor = db.query(Sensor).filter(
        Sensor.farm_id == farm.id,
        Sensor.sensor_type == "temp"
    ).first()

    sensor_connected = moisture_sensor is not None and moisture_sensor.status == "Online"
    moisture_val = float(moisture_sensor.current_value) if (moisture_sensor is not None and sensor_connected) else None
    temp_sensor_val = float(temp_sensor.current_value) if (temp_sensor is not None and temp_sensor.status == "Online") else None

    sensor_data = {
        "sensor_connected": sensor_connected,
        "moisture": moisture_val,
        "sensor_temp": temp_sensor_val
    }

    # 3. Pump Controller Status
    pump = db.query(PumpController).filter(PumpController.farm_id == farm.id).first()
    pump_status = {
        "status": pump.status if pump else "OFF",
        "mode": pump.mode if pump else "AUTO",
        "rain_lock": pump.rain_lock if pump else False
    }

    # 4. Crop Health AI Pathology Scans
    scans_query = db.query(DiseaseDetection).filter(
        DiseaseDetection.farm_id == farm.id
    ).order_by(DiseaseDetection.created_at.desc()).limit(5).all()

    disease_scans = [
        {
            "id": s.id,
            "detected_problem": s.detected_problem,
            "detected_crop": s.detected_crop,
            "severity": s.severity,
            "confidence": s.confidence,
            "explanation": s.explanation,
            "visible_symptoms": s.visible_symptoms,
            "trend_status": s.trend_status,
            "created_at": s.created_at.strftime("%Y-%m-%d") if s.created_at else ""
        }
        for s in scans_query
    ]

    # 5. Crop Calendar & Activity History
    activities_query = db.query(CropCalendarEvent).filter(
        CropCalendarEvent.farm_id == farm.id
    ).order_by(CropCalendarEvent.event_date.desc()).limit(15).all()

    activity_history = [
        {
            "id": a.id,
            "event_type": a.event_type,
            "title": a.title,
            "description": a.description,
            "stage": a.stage,
            "event_date": a.event_date,
            "cost": a.cost
        }
        for a in activities_query
    ]

    # 6. Farm Ledger Transactions
    ledger_txs_query = db.query(Expense).filter(
        Expense.farm_id == farm.id
    ).order_by(Expense.date.desc()).limit(20).all()

    ledger_transactions = [
        {
            "id": t.id,
            "type": t.type or "expense",
            "category": t.category,
            "crop": t.crop or farm.crop,
            "item_name": t.item_name,
            "cost": t.cost,
            "date": t.date,
            "stage": t.stage
        }
        for t in ledger_txs_query
    ]

    # 7. Fertilizer Applications
    latest_fertilizer = db.query(FertilizerApplication).filter(
        FertilizerApplication.farm_id == farm.id
    ).order_by(FertilizerApplication.date_applied.desc()).first()
    fertilizer_status = {
        "last_product": latest_fertilizer.product_name if latest_fertilizer else None,
        "last_date": latest_fertilizer.date_applied if latest_fertilizer else None,
        "last_quantity": latest_fertilizer.quantity if latest_fertilizer else None,
        "last_unit": latest_fertilizer.unit if latest_fertilizer else "kg"
    }

    # 9. Yield Prediction
    latest_yield = db.query(YieldPrediction).filter(
        YieldPrediction.farm_id == farm.id
    ).order_by(YieldPrediction.created_at.desc()).first()
    yield_prediction = {
        "expected_yield_tons": latest_yield.expected_yield_tons if latest_yield else None,
        "confidence": latest_yield.confidence if latest_yield else None,
        "harvest_date": latest_yield.harvest_date if latest_yield else farm.expected_harvest
    }

    farm_details = {
        "id": farm.id,
        "name": farm.name,
        "size_acres": farm.size_acres,
        "location_name": farm.location_name,
        "location": farm.location_name,
        "latitude": farm.latitude,
        "longitude": farm.longitude,
        "soil_type": farm.soil_type,
        "soil_ph": farm.soil_ph,
        "nitrogen": farm.nitrogen,
        "phosphorus": farm.phosphorus,
        "potassium": farm.potassium,
        "water_source": farm.water_source,
        "irrigation_method": farm.irrigation_method,
        "crop": farm.crop,
        "crop_variety": farm.crop_variety,
        "sowing_date": farm.sowing_date,
        "expected_harvest": farm.expected_harvest,
        "current_stage_override": farm.current_stage_override
    }

    today_str = date.today().isoformat()
    all_today_task_records = db.query(FarmPlanTaskRecord).filter(
        FarmPlanTaskRecord.farm_id == farm.id,
        FarmPlanTaskRecord.plan_date == today_str
    ).all()
    completed_task_keys = [r.task_key for r in all_today_task_records if r.is_completed]
    task_status_map = {r.task_key: r.status for r in all_today_task_records}
    task_notes_map = {r.task_key: r.farmer_note for r in all_today_task_records if r.farmer_note}

    return {
        "farm_details": farm_details,
        "weather_data": weather_data,
        "sensor_data": sensor_data,
        "pump_status": pump_status,
        "disease_scans": disease_scans,
        "fertilizer_status": fertilizer_status,
        "yield_prediction": yield_prediction,
        "activity_history": activity_history,
        "ledger_transactions": ledger_transactions,
        "completed_task_keys": completed_task_keys,
        "task_status_map": task_status_map,
        "task_notes_map": task_notes_map,
        "language": language
    }


# =============================================================================
# 1. CORE FARMS CRUD
# =============================================================================

@router.get("", response_model=List[FarmOut])
def get_farms(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Farm).filter(Farm.user_id == current_user.id).all()


@router.post("", response_model=FarmOut)
def create_farm(farm_in: FarmCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_farm = Farm(
        user_id=current_user.id,
        **farm_in.model_dump()
    )
    db.add(new_farm)
    db.commit()
    db.refresh(new_farm)

    # Initialize IoT Sensors for the new farm
    sensors_to_create = [
        ("Soil Moisture Node", "moisture", "%", 42.0, "Online"),
        ("Air Temperature Node", "temp", "°C", 27.5, "Online"),
        ("Air Humidity Node", "humidity", "%", 68.0, "Online"),
        ("Soil pH Probe", "ph", "pH", farm_in.soil_ph or 6.5, "Online"),
        ("Soil NPK Sensor", "npk", "mg/kg", farm_in.nitrogen or 140.0, "Online"),
        ("Water Tank Level", "tank", "%", 85.0, "Online")
    ]
    for s_name, s_type, s_unit, s_val, s_status in sensors_to_create:
        sensor_obj = Sensor(
            farm_id=new_farm.id,
            name=s_name,
            sensor_type=s_type,
            unit=s_unit,
            current_value=s_val,
            status=s_status
        )
        db.add(sensor_obj)
    db.commit()

    return new_farm


@router.get("/{farm_id}", response_model=FarmOut)
def get_farm(farm_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return farm


@router.put("/{farm_id}", response_model=FarmOut)
def update_farm(farm_id: int, farm_in: FarmUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    for key, val in farm_in.model_dump(exclude_unset=True).items():
        if val is not None:
            setattr(farm, key, val)

    db.commit()
    db.refresh(farm)
    return farm


@router.delete("/{farm_id}")
def delete_farm(farm_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    try:
        sensor_ids = [s.id for s in db.query(Sensor).filter(Sensor.farm_id == farm_id).all()]
        if sensor_ids:
            db.query(SensorReading).filter(SensorReading.sensor_id.in_(sensor_ids)).delete(synchronize_session=False)
        db.query(SensorReading).filter(SensorReading.farm_id == farm_id).delete(synchronize_session=False)
    except Exception:
        pass

    db.delete(farm)
    db.commit()
    return {"message": "Farm deleted successfully", "deleted_farm_id": farm_id}


# =============================================================================
# 2. CROP STAGE INTELLIGENCE ENDPOINTS
# =============================================================================

@router.get("/{farm_id}/crop-stage", response_model=CropStageOut)
def get_farm_crop_stage(
    farm_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    stage_res = calculate_crop_stage_intelligence(
        crop_name=farm.crop,
        sowing_date_str=farm.sowing_date,
        current_stage_override=farm.current_stage_override
    )
    return stage_res


@router.put("/{farm_id}/crop-stage", response_model=CropStageOut)
def update_farm_crop_stage(
    farm_id: int,
    stage_in: CropStageUpdateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    if stage_in.sowing_date is not None:
        farm.sowing_date = stage_in.sowing_date
    if stage_in.crop is not None:
        farm.crop = stage_in.crop
    if stage_in.crop_variety is not None:
        farm.crop_variety = stage_in.crop_variety
    if stage_in.current_stage_override is not None:
        farm.current_stage_override = stage_in.current_stage_override if stage_in.current_stage_override != "" else None

    db.commit()
    db.refresh(farm)

    stage_res = calculate_crop_stage_intelligence(
        crop_name=farm.crop,
        sowing_date_str=farm.sowing_date,
        current_stage_override=farm.current_stage_override
    )
    return stage_res


# =============================================================================
# 3. TODAY'S FARM PLAN ENDPOINTS
# =============================================================================

@router.get("/{farm_id}/today-plan", response_model=TodayPlanResponse)
def get_farm_today_plan(
    farm_id: int,
    language: str = "English",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    lang = language or current_user.preferred_language or "English"
    bundle = gather_farm_context_bundle(farm, db, language=lang)

    plan = generate_todays_farm_plan_intelligence(
        farm_details=bundle["farm_details"],
        weather_data=bundle["weather_data"],
        sensor_data=bundle["sensor_data"],
        disease_scans=bundle["disease_scans"],
        activity_history=bundle["activity_history"],
        pump_status=bundle["pump_status"],
        completed_task_keys=bundle["completed_task_keys"],
        language=bundle["language"]
    )

    return plan


@router.post("/{farm_id}/today-plan/{task_id}/complete", response_model=TodayPlanResponse)
def complete_today_plan_task(
    farm_id: int,
    task_id: str,
    complete_in: Optional[TodayPlanCompleteIn] = None,
    language: str = "English",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    today_str = date.today().strftime("%Y-%m-%d")

    # Check if already recorded
    existing_record = db.query(FarmPlanTaskRecord).filter(
        FarmPlanTaskRecord.farm_id == farm.id,
        FarmPlanTaskRecord.task_key == task_id,
        FarmPlanTaskRecord.plan_date == today_str
    ).first()

    if not existing_record:
        # Determine task type
        action_type = "field_operation"
        title = "Completed Farm Task"
        if "irrigation" in task_id:
            action_type = "irrigation"
            title = f"Completed Scheduled Irrigation ({farm.crop})"
        elif "stage" in task_id:
            action_type = "fertilizer"
            title = f"Applied Growth Stage Nutrition ({farm.crop})"
        elif "health" in task_id:
            action_type = "crop_health"
            title = f"Completed Crop Foliage Inspection ({farm.crop})"
        elif "operation" in task_id or "spray" in task_id:
            action_type = "field_operation"
            title = f"Field Operation / Spraying Completed ({farm.crop})"

        task_record = FarmPlanTaskRecord(
            farm_id=farm.id,
            task_key=task_id,
            plan_date=today_str,
            title=title,
            action_type=action_type,
            is_completed=True,
            completed_at=datetime.now(timezone.utc)
        )
        db.add(task_record)

        # Also automatically log to Crop Calendar Events / Activity History
        activity_event = CropCalendarEvent(
            farm_id=farm.id,
            event_type="Irrigation" if action_type == "irrigation" else (
                "Fertilizer" if action_type == "fertilizer" else "Scouting"
            ),
            title=title,
            description=complete_in.notes if complete_in and complete_in.notes else f"Completed via Today's Farm Plan on {farm.name}",
            stage=farm.current_stage_override or "Vegetative Growth",
            event_date=today_str,
            cost=0.0
        )
        db.add(activity_event)
        db.commit()
    else:
        existing_record.is_completed = True
        existing_record.completed_at = datetime.now(timezone.utc)
        db.commit()

    # Return refreshed today's plan
    lang = language or current_user.preferred_language or "English"
    bundle = gather_farm_context_bundle(farm, db, language=lang)
    plan = generate_todays_farm_plan_intelligence(
        farm_details=bundle["farm_details"],
        weather_data=bundle["weather_data"],
        sensor_data=bundle["sensor_data"],
        disease_scans=bundle["disease_scans"],
        activity_history=bundle["activity_history"],
        pump_status=bundle["pump_status"],
        completed_task_keys=bundle["completed_task_keys"],
        language=bundle["language"]
    )
    return plan


@router.post("/{farm_id}/today-plan/{task_id}/remind")
def create_today_plan_reminder(
    farm_id: int,
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    today_str = date.today().strftime("%Y-%m-%d")

    # Record reminder in FarmPlanTaskRecord
    task_rec = db.query(FarmPlanTaskRecord).filter(
        FarmPlanTaskRecord.farm_id == farm.id,
        FarmPlanTaskRecord.task_key == task_id,
        FarmPlanTaskRecord.plan_date == today_str
    ).first()

    if not task_rec:
        task_rec = FarmPlanTaskRecord(
            farm_id=farm.id,
            task_key=task_id,
            plan_date=today_str,
            title="Farm Reminder Task",
            action_type="reminder",
            is_completed=False,
            reminded_at=datetime.now(timezone.utc)
        )
        db.add(task_rec)
    else:
        task_rec.reminded_at = datetime.now(timezone.utc)

    # Create Notification in database
    reminder_notification = Notification(
        user_id=current_user.id,
        title=f"⏰ Farm Reminder: {farm.name}",
        message=f"Reminder for {farm.name} ({farm.crop}): Complete today's scheduled action item.",
        type="weather" if "weather" in task_id else "irrigation",
        action_link="/dashboard",
        is_read=False
    )
    db.add(reminder_notification)
    db.commit()

    return {
        "success": True,
        "message": f"Reminder created for task {task_id} on {farm.name}",
        "reminded_at": datetime.now(timezone.utc).isoformat()
    }


# =============================================================================
# 4. AI FARM AGENT ENDPOINT
# =============================================================================

@router.post("/{farm_id}/ai-agent", response_model=AIChatResponse)
def chat_with_farm_ai_agent(
    farm_id: int,
    chat_req: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    lang = chat_req.language or current_user.preferred_language or "English"
    bundle = gather_farm_context_bundle(farm, db, language=lang)

    # Pre-generate today's plan to give AI agent complete context
    today_plan = generate_todays_farm_plan_intelligence(
        farm_details=bundle["farm_details"],
        weather_data=bundle["weather_data"],
        sensor_data=bundle["sensor_data"],
        disease_scans=bundle["disease_scans"],
        activity_history=bundle["activity_history"],
        pump_status=bundle["pump_status"],
        completed_task_keys=bundle["completed_task_keys"],
        language=bundle["language"]
    )

    res = generate_ai_assistant_response(
        query=chat_req.message,
        farm_details=bundle["farm_details"],
        language=lang,
        page_context=chat_req.page_context,
        weather_data=bundle["weather_data"],
        sensor_data=bundle["sensor_data"],
        disease_scans=bundle["disease_scans"],
        activity_history=bundle["activity_history"],
        today_plan=today_plan,
        ledger_transactions=bundle.get("ledger_transactions")
    )

    # Save to AI Conversation history
    convo = AIConversation(
        user_id=current_user.id,
        farm_id=farm.id,
        user_message=chat_req.message,
        ai_response=res["response"],
        language=res["language"]
    )
    db.add(convo)
    db.commit()

    return res


# =============================================================================
# 5. FARM ACTIVITIES ENDPOINT
# =============================================================================

@router.get("/{farm_id}/activities", response_model=List[CropCalendarEventOut])
def get_farm_activities(
    farm_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    return db.query(CropCalendarEvent).filter(
        CropCalendarEvent.farm_id == farm.id
    ).order_by(CropCalendarEvent.event_date.desc()).all()
