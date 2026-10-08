from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Farm, User, AIConversation
from app.schemas.schemas import AIChatRequest, AIChatResponse, FarmPlanResponse
from app.utils.auth import get_current_user
from app.ai.assistant_service import generate_ai_assistant_response
from app.ai.farm_plan_engine import generate_todays_farm_plan_intelligence
from app.routers.farms import gather_farm_context_bundle

router = APIRouter(prefix="/api/assistant", tags=["AI Assistant"])

@router.post("/chat", response_model=AIChatResponse)
def chat_with_agrovision_ai(
    chat_req: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lang = chat_req.language or current_user.preferred_language or "English"
    farm = None
    bundle = None
    today_plan = None

    if chat_req.farm_id:
        farm = db.query(Farm).filter(Farm.id == chat_req.farm_id, Farm.user_id == current_user.id).first()
        if farm:
            bundle = gather_farm_context_bundle(farm, db, language=lang)
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
        farm_details=bundle["farm_details"] if bundle else None,
        language=lang,
        page_context=chat_req.page_context,
        weather_data=bundle["weather_data"] if bundle else None,
        sensor_data=bundle["sensor_data"] if bundle else None,
        disease_scans=bundle["disease_scans"] if bundle else None,
        activity_history=bundle["activity_history"] if bundle else None,
        today_plan=today_plan,
        ledger_transactions=bundle.get("ledger_transactions") if bundle else None,
        fertilizer_status=bundle.get("fertilizer_status") if bundle else None,
        yield_prediction=bundle.get("yield_prediction") if bundle else None,
        pump_status=bundle.get("pump_status") if bundle else None
    )

    # Record conversation history
    convo = AIConversation(
        user_id=current_user.id,
        farm_id=chat_req.farm_id if farm else None,
        user_message=chat_req.message,
        ai_response=res["response"],
        language=res["language"]
    )
    db.add(convo)
    db.commit()

    return res


@router.get("/farm-plan/{farm_id}", response_model=FarmPlanResponse)
def get_farm_plan(
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

    # Map to FarmPlanResponse backward-compatible schema
    legacy_actions = []
    for a in plan["actions"]:
        legacy_actions.append({
            "id": a["id"],
            "priority": 1 if a["priority"] == "High" else (2 if a["priority"] == "Medium" else 3),
            "type": a["action_type"],
            "title": a["title"],
            "summary": a["what_to_do"],
            "why": a["why_recommended"],
            "action_text": a["action_text"],
            "action_route": a["action_route"],
            "icon": "CloudRain" if a["action_type"] == "weather" else ("Droplets" if a["action_type"] == "irrigation" else "Sparkles"),
            "severity": "urgent" if a["priority"] == "High" else ("warning" if a["priority"] == "Medium" else "normal")
        })

    return {
        "farm_id": farm.id,
        "farm_name": farm.name,
        "crop": farm.crop,
        "generated_at": plan["generated_at"],
        "actions": legacy_actions,
        "voice_script": plan["voice_script"]
    }
