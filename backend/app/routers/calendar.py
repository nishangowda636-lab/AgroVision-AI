from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from app.database.session import get_db
from app.models.models import Farm, User, CropCalendarEvent
from app.schemas.schemas import CropCalendarEventCreate, CropCalendarEventOut, CropCalendarSummary, CropCalendarStage
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/calendar", tags=["Crop Calendar"])

CROP_STAGE_DEFINITIONS: Dict[str, List[Dict[str, Any]]] = {
    "Tomato": [
        {"stage_name": "Sowing & Nursery", "start_day": 0, "end_day": 25, "description": "Seed germination and seedling establishment in nursery bed.", "key_tasks": ["Maintain light moisture", "Apply Trichoderma drenching", "Protect from harsh sun"]},
        {"stage_name": "Vegetative Growth", "start_day": 26, "end_day": 45, "description": "Rapid canopy expansion, root establishment, and branching.", "key_tasks": ["Provide stake support", "Apply balanced NPK", "Monitor for early sucking pests"]},
        {"stage_name": "Flowering Stage", "start_day": 46, "end_day": 65, "description": "Yellow flower cluster development and initial pollination.", "key_tasks": ["Boost Phosphorus & Potassium", "Maintain consistent irrigation", "Avoid heavy pesticide during bloom"]},
        {"stage_name": "Fruit Development", "start_day": 66, "end_day": 85, "description": "Fruit sizing and color transition from green to breaker stage.", "key_tasks": ["Apply Calcium & Boron to prevent blossom-end rot", "Drip irrigation precision", "Install sticky fruit fly traps"]},
        {"stage_name": "Harvesting", "start_day": 86, "end_day": 120, "description": "Multiple picking cycles for firm, ripe fruits.", "key_tasks": ["Harvest in early morning", "Grade and crate immediately", "Monitor APMC Mandi rates"]}
    ],
    "Default": [
        {"stage_name": "Sowing & Germination", "start_day": 0, "end_day": 15, "description": "Seed germination and initial root emergence.", "key_tasks": ["Ensure moist topsoil", "Seed treatment"]},
        {"stage_name": "Vegetative Stage", "start_day": 16, "end_day": 45, "description": "Foliage and stem growth.", "key_tasks": ["Nitrogen fertilizer application", "Weeding and intercultural operations"]},
        {"stage_name": "Flowering Stage", "start_day": 46, "end_day": 70, "description": "Bloom and pollination period.", "key_tasks": ["Moisture stress avoidance", "Pest scouting"]},
        {"stage_name": "Fruit / Grain Filling", "start_day": 71, "end_day": 95, "description": "Pod, fruit, or grain development.", "key_tasks": ["Potassium supplementation", "Disease monitoring"]},
        {"stage_name": "Maturity & Harvest", "start_day": 96, "end_day": 120, "description": "Crop maturity and harvest readiness.", "key_tasks": ["Cease irrigation before harvest", "Clean storage preparation"]}
    ]
}

def calculate_crop_age(sowing_date_str: Optional[str]) -> int:
    if not sowing_date_str:
        return 45 # Default sensible age
    try:
        sowing_dt = datetime.strptime(sowing_date_str[:10], "%Y-%m-%d").date()
        today = date.today()
        diff = (today - sowing_dt).days
        return max(0, diff)
    except Exception:
        return 45

@router.get("/summary/{farm_id}", response_model=CropCalendarSummary)
def get_crop_calendar_summary(farm_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    crop = farm.crop or "Tomato"
    stages_def = CROP_STAGE_DEFINITIONS.get(crop, CROP_STAGE_DEFINITIONS["Default"])

    crop_age_days = calculate_crop_age(farm.sowing_date)
    
    current_stage_name: str = str(stages_def[-1]["stage_name"])
    computed_stages: List[CropCalendarStage] = []

    for s in stages_def:
        start_day = int(s["start_day"])
        end_day = int(s["end_day"])
        stage_name = str(s["stage_name"])
        description = str(s["description"])
        key_tasks = list(s["key_tasks"]) if isinstance(s["key_tasks"], list) else [str(s["key_tasks"])]

        is_completed = crop_age_days > end_day
        is_current = start_day <= crop_age_days <= end_day
        if is_current:
            current_stage_name = stage_name
        
        computed_stages.append(CropCalendarStage(
            stage_name=stage_name,
            start_day=start_day,
            end_day=end_day,
            is_current=is_current,
            is_completed=is_completed,
            description=description,
            key_tasks=key_tasks
        ))

    # Fetch recorded events
    events = db.query(CropCalendarEvent).filter(CropCalendarEvent.farm_id == farm.id).order_by(CropCalendarEvent.event_date.desc()).all()

    # Dynamic actionable recommendation based on age and stage
    if crop_age_days < 25:
        rec = f"Your {crop} crop is {crop_age_days} days old (Nursery & Establishment). Keep topsoil gently moist and protect young saplings."
    elif crop_age_days < 50:
        rec = f"Your {crop} crop is {crop_age_days} days old (Vegetative Growth). Regular staking and balanced NPK fertilizer application recommended."
    elif crop_age_days < 70:
        rec = f"Your {crop} crop is {crop_age_days} days old (Flowering Stage). Maintain consistent moisture to prevent blossom drop and boost Potassium."
    elif crop_age_days < 90:
        rec = f"Your {crop} crop is {crop_age_days} days old (Fruit Development). Monitor for fruit borers and blossom-end rot."
    else:
        rec = f"Your {crop} crop is {crop_age_days} days old (Harvest Window). Check APMC market prices to schedule early morning picking."

    return CropCalendarSummary(
        farm_id=farm.id,
        crop_name=crop,
        sowing_date=farm.sowing_date or "2026-06-15",
        crop_age_days=crop_age_days,
        current_stage=current_stage_name,
        stages=computed_stages,
        events=events,
        recommendation=rec
    )

@router.get("/events/{farm_id}", response_model=List[CropCalendarEventOut])
def get_farm_events(farm_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    return db.query(CropCalendarEvent).filter(CropCalendarEvent.farm_id == farm.id).order_by(CropCalendarEvent.event_date.desc()).all()

@router.post("/events", response_model=CropCalendarEventOut)
def create_farm_event(event_in: CropCalendarEventCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == event_in.farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    new_event = CropCalendarEvent(
        farm_id=farm.id,
        event_type=event_in.event_type,
        title=event_in.title,
        description=event_in.description,
        stage=event_in.stage or "Vegetative",
        event_date=event_in.event_date,
        cost=event_in.cost or 0.0
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event

@router.delete("/events/{event_id}")
def delete_farm_event(event_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    event = db.query(CropCalendarEvent).join(Farm).filter(CropCalendarEvent.id == event_id, Farm.user_id == current_user.id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    db.delete(event)
    db.commit()
    return {"message": "Calendar event deleted"}
