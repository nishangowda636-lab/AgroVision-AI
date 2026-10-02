"""
AgroVision AI — AI Farm Agent API Router
========================================
Endpoints:
- POST /api/ai-farm-agent/chat: Contextual AI co-pilot chat for authenticated farmer
- GET /api/ai-farm-agent/today-plan/{farm_id}: Synthesizes all 10 modules into Today's Farm Plan
- POST /api/ai-farm-agent/today-plan/{farm_id}/action-status: Updates action status (Pending, In Progress, Completed, Skipped) and logs activity
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timezone

from app.database.session import get_db
from app.models.models import Farm, User, AIConversation, FarmPlanTaskRecord, CropCalendarEvent
from app.schemas.schemas import (
    AIFarmAgentTodayPlanResponse,
    AIFarmAgentChatRequest,
    AIFarmAgentChatResponse,
    AIFarmAgentActionStatusIn
)
from app.utils.auth import get_current_user
from app.ai.farm_plan_engine import generate_todays_farm_plan_intelligence
from app.ai.assistant_service import generate_ai_assistant_response
from app.routers.farms import gather_farm_context_bundle

router = APIRouter(prefix="/api/ai-farm-agent", tags=["AI Farm Agent"])


@router.get("/today-plan/{farm_id}", response_model=AIFarmAgentTodayPlanResponse)
def get_ai_farm_agent_today_plan(
    farm_id: int,
    language: str = "English",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Synthesizes live farm context across all 10 agricultural streams into a prioritized daily farm plan.
    Strictly verifies authenticated farmer owns the requested farm.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm ID {farm_id} not found or you do not have permission to access it."
        )

    lang = language or current_user.preferred_language or "English"
    bundle = gather_farm_context_bundle(farm, db, language=lang)

    plan = generate_todays_farm_plan_intelligence(
        farm_details=bundle["farm_details"],
        weather_data=bundle["weather_data"],
        sensor_data=bundle["sensor_data"],
        disease_scans=bundle["disease_scans"],
        fertilizer_status=bundle.get("fertilizer_status"),
        yield_prediction=bundle.get("yield_prediction"),
        activity_history=bundle["activity_history"],
        pump_status=bundle["pump_status"],
        satellite_data=bundle.get("satellite_data"),
        completed_task_keys=bundle.get("completed_task_keys"),
        task_status_map=bundle.get("task_status_map"),
        task_notes_map=bundle.get("task_notes_map"),
        language=bundle["language"]
    )

    return plan


@router.post("/chat", response_model=AIFarmAgentChatResponse)
def chat_with_ai_farm_agent(
    chat_req: AIFarmAgentChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Conversational AI Farm Agent with full active farm context and structured response format
    (WHAT TO DO, WHY, WHEN, DATA USED, CAUTION).
    """
    lang = chat_req.language or current_user.preferred_language or "English"
    farm = None
    bundle = None
    today_plan = None

    if chat_req.farm_id:
        farm = db.query(Farm).filter(Farm.id == chat_req.farm_id, Farm.user_id == current_user.id).first()
        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Farm ID {chat_req.farm_id} not found or you do not have permission to access it."
            )

        bundle = gather_farm_context_bundle(farm, db, language=lang)
        today_plan = generate_todays_farm_plan_intelligence(
            farm_details=bundle["farm_details"],
            weather_data=bundle["weather_data"],
            sensor_data=bundle["sensor_data"],
            disease_scans=bundle["disease_scans"],
            fertilizer_status=bundle.get("fertilizer_status"),
            yield_prediction=bundle.get("yield_prediction"),
            activity_history=bundle["activity_history"],
            pump_status=bundle["pump_status"],
            satellite_data=bundle.get("satellite_data"),
            completed_task_keys=bundle.get("completed_task_keys"),
            task_status_map=bundle.get("task_status_map"),
            task_notes_map=bundle.get("task_notes_map"),
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
        ledger_transactions=bundle.get("ledger_transactions") if bundle else None
    )

    # Record conversation history
    convo = AIConversation(
        user_id=current_user.id,
        farm_id=farm.id if farm else None,
        user_message=chat_req.message,
        ai_response=res["response"],
        language=res["language"]
    )
    db.add(convo)
    db.commit()

    return {
        "response": res["response"],
        "what_to_do": res.get("what_to_do"),
        "why": res.get("why"),
        "when_to_do": res.get("when_to_do"),
        "data_used": res.get("data_used"),
        "caution": res.get("caution"),
        "actions": today_plan.get("today_plan", []) if today_plan else [],
        "confidence": "High" if farm else "General Advisory",
        "language": res["language"],
        "source_citations": res.get("data_citations", []),
        "data_sources": today_plan.get("data_sources", {}) if today_plan else {},
        "action": res.get("action"),
        "confirmation_required": res.get("confirmation_required", False)
    }


@router.post("/today-plan/{farm_id}/action-status", response_model=AIFarmAgentTodayPlanResponse)
@router.post("/action-status/{farm_id}", response_model=AIFarmAgentTodayPlanResponse)
def update_action_status(
    farm_id: int,
    status_in: AIFarmAgentActionStatusIn,
    language: str = "English",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates the execution status of a prioritized Today's Farm Plan action (PENDING, IN_PROGRESS, COMPLETED, SKIPPED).
    If marked COMPLETED, automatically records an activity entry in CropCalendarEvent for farm history.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found or unauthorized access."
        )

    today_str = date.today().strftime("%Y-%m-%d")
    normalized_status = status_in.status.upper()
    if normalized_status not in ["PENDING", "IN_PROGRESS", "COMPLETED", "SKIPPED"]:
        normalized_status = "PENDING"

    is_completed = (normalized_status == "COMPLETED")

    # Find or create task record
    record = db.query(FarmPlanTaskRecord).filter(
        FarmPlanTaskRecord.farm_id == farm.id,
        FarmPlanTaskRecord.task_key == status_in.action_id,
        FarmPlanTaskRecord.plan_date == today_str
    ).first()

    action_type = "field_operation"
    if "irrigation" in status_in.action_id.lower():
        action_type = "irrigation"
    elif "fertilizer" in status_in.action_id.lower() or "stage" in status_in.action_id.lower():
        action_type = "fertilizer"
    elif "health" in status_in.action_id.lower() or "disease" in status_in.action_id.lower():
        action_type = "crop_health"
    elif "satellite" in status_in.action_id.lower():
        action_type = "satellite"

    if not record:
        record = FarmPlanTaskRecord(
            farm_id=farm.id,
            task_key=status_in.action_id,
            plan_date=today_str,
            title=f"Farm Task ({action_type.title()})",
            action_type=action_type,
            status=normalized_status,
            is_completed=is_completed,
            farmer_note=status_in.note,
            completed_at=datetime.now(timezone.utc) if is_completed else None
        )
        db.add(record)
    else:
        record.status = normalized_status
        record.is_completed = is_completed
        if status_in.note:
            record.farmer_note = status_in.note
        if is_completed:
            record.completed_at = datetime.now(timezone.utc)
        else:
            record.completed_at = None

    # When marked completed, also add to Crop Calendar / Activity History
    if is_completed:
        activity_event = CropCalendarEvent(
            farm_id=farm.id,
            event_type="Irrigation" if action_type == "irrigation" else (
                "Fertilizer" if action_type == "fertilizer" else "Scouting"
            ),
            title=f"Completed {action_type.replace('_', ' ').title()} Action",
            description=status_in.note or f"Completed via AI Farm Agent Daily Plan on {farm.name}",
            stage=farm.current_stage_override or "Vegetative Growth",
            event_date=today_str,
            cost=0.0
        )
        db.add(activity_event)

    db.commit()

    # Return refreshed plan
    lang = language or current_user.preferred_language or "English"
    bundle = gather_farm_context_bundle(farm, db, language=lang)
    plan = generate_todays_farm_plan_intelligence(
        farm_details=bundle["farm_details"],
        weather_data=bundle["weather_data"],
        sensor_data=bundle["sensor_data"],
        disease_scans=bundle["disease_scans"],
        fertilizer_status=bundle.get("fertilizer_status"),
        yield_prediction=bundle.get("yield_prediction"),
        activity_history=bundle["activity_history"],
        pump_status=bundle["pump_status"],
        satellite_data=bundle.get("satellite_data"),
        completed_task_keys=bundle.get("completed_task_keys"),
        task_status_map=bundle.get("task_status_map"),
        task_notes_map=bundle.get("task_notes_map"),
        language=bundle["language"]
    )
    return plan
