from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid
import json
import requests
from app.database.session import get_db
from app.models.models import DiseaseDetection, User, Farm
from app.schemas.schemas import DiseaseDetectionOut, ModelStatusOut
from app.utils.auth import get_current_user
from app.ai.disease_service import analyze_plant_image, analyze_multi_plant_images
from app.ai.real_disease_model import get_model_status
from app.utils.storage import UPLOAD_DIR

router = APIRouter(prefix="/api/disease", tags=["Disease Detection"])
crop_health_router = APIRouter(prefix="/api/crop-health", tags=["Crop Health AI"])

def _get_farm_weather_quick(lat: float, lon: float) -> dict:
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}&"
            f"current=temperature_2m,relative_humidity_2m,precipitation&"
            f"daily=precipitation_probability_max&"
            f"timezone=auto"
        )
        res = requests.get(url, timeout=3.5)
        if res.status_code == 200:
            data = res.json()
            curr = data.get("current", {})
            daily = data.get("daily", {})
            rain_probs = daily.get("precipitation_probability_max", [15])
            return {
                "temperature": float(curr.get("temperature_2m", 27.5)),
                "humidity": int(curr.get("relative_humidity_2m", 65)),
                "rain_prob": float(rain_probs[0]) if len(rain_probs) > 0 and rain_probs[0] is not None else 15.0
            }
    except Exception:
        pass
    return {"temperature": 27.5, "humidity": 65, "rain_prob": 15.0}


@router.get("/model-status", response_model=ModelStatusOut)
@crop_health_router.get("/model-status", response_model=ModelStatusOut)
def check_crop_health_model_status():
    """
    Returns the real-time health and configuration status of the PyTorch MobileNetV2 Model
    and Multimodal AI Vision service.
    """
    return get_model_status()


@router.post("/analyze", response_model=DiseaseDetectionOut)
@crop_health_router.post("/analyze", response_model=DiseaseDetectionOut)
async def analyze_crop_health(
    file: UploadFile = File(..., description="Primary crop leaf, foliage, fruit, or plant image to analyze"),
    farm_id: Optional[int] = Form(None),
    plant_part: Optional[str] = Form(None),
    image_type: Optional[str] = Form(None),
    plant_parts: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file or not hasattr(file, "filename") or not file.filename:
        raise HTTPException(status_code=400, detail="Please upload an image of the crop, foliage, fruit, seed, or pest.")

    ext = os.path.splitext(file.filename)[1] or ".jpg"
    unique_name = f"crop_{uuid.uuid4().hex[:10]}{ext}"
    saved_path = os.path.join(UPLOAD_DIR, unique_name)
    with open(saved_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    relative_path = f"/static/uploads/{unique_name}"

    # Determine default part tag
    effective_part = image_type or plant_part or "Auto Detect"

    # Fetch farm weather context
    weather_data = None
    farm = None
    if farm_id:
        farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
        if farm:
            lat = float(farm.latitude) if farm.latitude is not None else 12.9716
            lon = float(farm.longitude) if farm.longitude is not None else 77.5946
            weather_data = _get_farm_weather_quick(lat, lon)

    # Fetch recent scans for trend analysis
    recent_scans = []
    if farm_id:
        past_scans_db = db.query(DiseaseDetection).filter(
            DiseaseDetection.farm_id == farm_id
        ).order_by(DiseaseDetection.created_at.desc()).limit(5).all()
        recent_scans = [
            {
                "id": s.id,
                "detected_problem": s.detected_problem,
                "severity": s.severity,
                "created_at": s.created_at
            }
            for s in past_scans_db
        ]

    # Perform single-image analysis
    analysis = analyze_plant_image(
        image_path=saved_path,
        plant_part=effective_part,
        weather_data=weather_data,
        recent_farm_scans=recent_scans
    )

    # Save to Database
    res_plant_part = analysis.get("plant_part", analysis.get("image_type", effective_part if effective_part not in ["Auto", "Auto Detect"] else "Leaf"))
    res_status = analysis.get("status") or analysis.get("analysis_status") or "VALID_RESULT"
    res_conf = analysis.get("confidence")
    db_conf = float(res_conf) if res_conf is not None else 0.0

    record = DiseaseDetection(
        user_id=current_user.id,
        farm_id=farm_id,
        image_path=relative_path,
        plant_part=res_plant_part,
        detected_crop=analysis.get("crop_name", analysis.get("crop", analysis.get("identified_crop", "UNKNOWN"))),
        detected_problem=analysis.get("condition", analysis.get("disease", "Normal Condition")),
        health_status=analysis.get("health_status", "Not Supported" if res_status == "UNSUPPORTED" else ("Low Confidence" if res_status == "LOW_CONFIDENCE" else "Possible Issue")),
        confidence=db_conf,
        severity=analysis.get("severity", "Unknown" if res_status in ["UNSUPPORTED", "NOT_SUPPORTED", "LOW_CONFIDENCE"] else "Moderate"),
        explanation=analysis.get("visible_symptoms", analysis.get("explanation", "")),
        visible_symptoms=analysis.get("visible_symptoms", analysis.get("explanation", "")),
        possible_causes=" • ".join(analysis.get("possible_causes", [])) if isinstance(analysis.get("possible_causes"), list) else str(analysis.get("possible_causes", "")),
        next_steps="\n".join(analysis.get("recommended_actions", [])) if isinstance(analysis.get("recommended_actions"), list) else str(analysis.get("recommended_next_steps", "")),
        prevention=analysis.get("prevention", ""),
        multi_images_json=None,
        trend_status=analysis.get("trend_status", "Baseline"),
        weather_correlation=analysis.get("weather_correlation"),
        fertilizer_link=analysis.get("fertilizer_link", False),
        contact_expert=analysis.get("contact_expert", False)
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    # Attach dynamic schema fields for response
    setattr(record, "status", res_status)
    setattr(record, "analysis_status", res_status)
    setattr(record, "reason", analysis.get("reason"))
    setattr(record, "identified_crop", analysis.get("identified_crop", analysis.get("crop_name", "UNKNOWN")))
    setattr(record, "crop_confidence", analysis.get("crop_confidence"))
    setattr(record, "companion_crop", analysis.get("companion_crop"))
    setattr(record, "companion_observations", analysis.get("companion_observations"))
    setattr(record, "plant_part", res_plant_part)
    setattr(record, "image_type", res_plant_part)
    setattr(record, "disease", analysis.get("disease", analysis.get("disease_name", record.detected_problem)))
    setattr(record, "disease_confidence", analysis.get("disease_confidence"))
    setattr(record, "severity", analysis.get("severity", record.severity))
    setattr(record, "recommendation", analysis.get("recommendation", analysis.get("recommended_next_steps", record.next_steps)))
    setattr(record, "message", analysis.get("message", "Crop and disease analyzed successfully." if res_status == "VALID_RESULT" else "Crop could not be identified reliably."))
    setattr(record, "health_status", analysis.get("health_status", record.health_status))

    setattr(record, "crop_name", analysis.get("crop_name", record.detected_crop))
    setattr(record, "disease_name", analysis.get("disease_name", record.detected_problem))
    setattr(record, "condition", analysis.get("condition", record.detected_problem))
    setattr(record, "confidence", res_conf)
    setattr(record, "identification_confidence", analysis.get("identification_confidence", analysis.get("crop_confidence")))
    setattr(record, "condition_confidence", analysis.get("condition_confidence", analysis.get("disease_confidence")))
    setattr(record, "visual_observations", analysis.get("visual_observations", [record.visible_symptoms]))
    setattr(record, "recommended_actions", analysis.get("recommended_actions", [record.next_steps]))
    setattr(record, "recommended_next_steps", analysis.get("recommended_next_steps", record.next_steps))
    setattr(record, "warnings", analysis.get("warnings", []))
    setattr(record, "analysis_method", analysis.get("analysis_method", "Two-Stage PyTorch ML"))
    setattr(record, "model_status", analysis.get("model_status", "Online"))
    setattr(record, "needs_field_verification", analysis.get("needs_field_verification", False))
    setattr(record, "farmer_guidance", analysis.get("farmer_guidance", "Inspect crop field regularly."))
    setattr(record, "top_predictions", analysis.get("top_predictions", []))
    setattr(record, "is_unclear", analysis.get("is_unclear", False))
    setattr(record, "monitoring_plan", analysis.get("monitoring_plan", "Scout canopy weekly."))

    return record


@router.post("/detect", response_model=DiseaseDetectionOut)
@crop_health_router.post("/detect", response_model=DiseaseDetectionOut)
async def detect_crop_health(
    file: UploadFile = File(..., description="Primary crop leaf, foliage, fruit, or plant image to analyze"),
    farm_id: Optional[int] = Form(None),
    plant_part: Optional[str] = Form(None),
    image_type: Optional[str] = Form(None),
    plant_parts: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return await analyze_crop_health(
        file=file,
        farm_id=farm_id,
        plant_part=plant_part,
        image_type=image_type,
        plant_parts=plant_parts,
        current_user=current_user,
        db=db
    )


@router.get("/history", response_model=List[DiseaseDetectionOut])
@crop_health_router.get("/history", response_model=List[DiseaseDetectionOut])
def get_disease_history(
    farm_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(DiseaseDetection).filter(DiseaseDetection.user_id == current_user.id)
    if farm_id:
        query = query.filter(DiseaseDetection.farm_id == farm_id)
    return query.order_by(DiseaseDetection.created_at.desc()).all()


