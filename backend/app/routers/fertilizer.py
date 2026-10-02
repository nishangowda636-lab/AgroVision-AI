from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from app.database.session import get_db
from app.models.models import Farm, User, FertilizerApplication, CropCalendarEvent
from app.schemas.schemas import FertilizerApplicationCreate, FertilizerApplicationOut
from app.utils.auth import get_current_user
from app.ai.irrigation_fertilizer_service import calculate_fertilizer_recommendation

router = APIRouter(prefix="/api/fertilizer", tags=["Fertilizer"])

def _generate_farm_fertilizer_advice(farm: Farm, db: Session) -> dict:
    growth_stage = farm.current_stage_override or "Vegetative"
    if not farm.current_stage_override and farm.sowing_date:
        try:
            sown_dt = datetime.strptime(farm.sowing_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            days = (datetime.now(timezone.utc) - sown_dt).days
            if days <= 0:
                growth_stage = "Pre-Sowing / Field Preparation"
            elif days < 25:
                growth_stage = f"Seedling (Day {days})"
            elif days < 55:
                growth_stage = f"Vegetative (Day {days})"
            elif days < 85:
                growth_stage = f"Flowering & Fruit Setting (Day {days})"
            else:
                growth_stage = f"Maturity & Harvesting (Day {days})"
        except Exception:
            growth_stage = "Vegetative"

    # Fetch previous fertilizer applications for this farm
    recent_apps_db = db.query(FertilizerApplication).filter(
        FertilizerApplication.farm_id == farm.id
    ).order_by(FertilizerApplication.date_applied.desc()).limit(15).all()

    previous_applications = [
        {
            "id": a.id,
            "product_name": a.product_name,
            "date_applied": a.date_applied,
            "quantity": a.quantity,
            "unit": a.unit,
            "area_applied_acres": a.area_applied_acres,
            "crop": a.crop,
            "crop_stage": a.crop_stage,
            "nutrient_focus": a.nutrient_focus
        }
        for a in recent_apps_db
    ]

    advice = calculate_fertilizer_recommendation(
        crop=farm.crop or "Tomato",
        soil_ph=farm.soil_ph if farm.soil_ph is not None else 6.5,
        n=farm.nitrogen if farm.nitrogen is not None else 0.0,
        p=farm.phosphorus if farm.phosphorus is not None else 0.0,
        k=farm.potassium if farm.potassium is not None else 0.0,
        growth_stage=growth_stage,
        soil_type=farm.soil_type or "Loam",
        variety=farm.crop_variety or "Standard Variety",
        farm_size_acres=farm.size_acres or 1.0,
        sowing_date=farm.sowing_date,
        irrigation_method=farm.irrigation_method or "Drip Irrigation",
        location=farm.location_name or "Karnataka",
        previous_applications=previous_applications
    )

    return {
        "farm_id": farm.id,
        "farm_name": farm.name,
        "location": farm.location_name or "Farm Location",
        "previous_applications": previous_applications,
        **advice
    }

@router.get("/recommend")
def get_fertilizer_advice_get(
    farm_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return _generate_farm_fertilizer_advice(farm, db)

@router.post("/recommend")
def get_fertilizer_advice_post(
    farm_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return _generate_farm_fertilizer_advice(farm, db)

@router.get("/{farm_id}")
def get_fertilizer_advice_by_id(
    farm_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return _generate_farm_fertilizer_advice(farm, db)

# Fertilizer Application History Endpoints
@router.post("/applications", response_model=FertilizerApplicationOut)
def record_fertilizer_application(
    app_in: FertilizerApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(Farm.id == app_in.farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    new_app = FertilizerApplication(
        user_id=current_user.id,
        farm_id=farm.id,
        product_name=app_in.product_name,
        date_applied=app_in.date_applied,
        quantity=app_in.quantity,
        unit=app_in.unit or "kg",
        area_applied_acres=app_in.area_applied_acres or farm.size_acres or 1.0,
        crop=app_in.crop or farm.crop or "Crop",
        crop_stage=app_in.crop_stage or farm.current_stage_override or "Vegetative",
        nutrient_focus=app_in.nutrient_focus,
        application_method=app_in.application_method or "Fertigation / Drip",
        cost=app_in.cost or 0.0,
        notes=app_in.notes
    )
    db.add(new_app)

    # Automatically record in Farm Activity Timeline (CropCalendarEvent)
    calendar_event = CropCalendarEvent(
        farm_id=farm.id,
        event_type="Fertilizer",
        title=f"Applied {app_in.product_name} ({app_in.quantity} {app_in.unit or 'kg'})",
        description=f"Applied {app_in.quantity} {app_in.unit or 'kg'} of {app_in.product_name} via {app_in.application_method or 'Fertigation'} across {app_in.area_applied_acres or farm.size_acres} acres of {farm.crop}. Notes: {app_in.notes or 'Routine schedule'}",
        stage=app_in.crop_stage or farm.current_stage_override or "Vegetative",
        event_date=app_in.date_applied,
        cost=app_in.cost or 0.0
    )
    db.add(calendar_event)
    db.commit()
    db.refresh(new_app)

    return new_app

@router.get("/applications/{farm_id}", response_model=List[FertilizerApplicationOut])
def get_farm_fertilizer_applications(
    farm_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    return db.query(FertilizerApplication).filter(
        FertilizerApplication.farm_id == farm.id,
        FertilizerApplication.user_id == current_user.id
    ).order_by(FertilizerApplication.date_applied.desc()).all()

@router.delete("/applications/{app_id}")
def delete_fertilizer_application(
    app_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app_rec = db.query(FertilizerApplication).filter(
        FertilizerApplication.id == app_id,
        FertilizerApplication.user_id == current_user.id
    ).first()
    if not app_rec:
        raise HTTPException(status_code=404, detail="Application record not found")

    db.delete(app_rec)
    db.commit()
    return {"message": "Fertilizer application record deleted successfully", "id": app_id}
