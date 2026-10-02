import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.database.session import get_db
from app.models.models import PumpController, PumpEvent, Farm, Sensor, User, Notification
from app.schemas.schemas import (
    PumpControllerOut,
    PumpCommandIn,
    PumpEventOut,
    IoTAutomationStatusOut
)
from app.utils.auth import get_current_user
from app.routers.farms import fetch_farm_weather_telemetry
from app.ai.iot_automation_engine import evaluate_iot_automation_decision, CROP_MOISTURE_PROFILES

router = APIRouter(prefix="/api/pumps", tags=["Smart Borewell & Irrigation Controller"])

def get_or_create_pump_controller(farm: Farm, db: Session) -> PumpController:
    controller = db.query(PumpController).filter(PumpController.farm_id == farm.id).first()
    if not controller:
        crop_key = farm.crop or "Default"
        low_t, high_t = CROP_MOISTURE_PROFILES.get(crop_key, CROP_MOISTURE_PROFILES["Default"])
        now = datetime.now(timezone.utc)
        controller = PumpController(
            farm_id=farm.id,
            name=f"{farm.name} Borewell Node",
            device_id=f"ESP32-PUMP-{farm.id:04d}",
            status="OFF",
            mode="AUTO",
            is_simulated=True,
            hardware_connected=False,
            emergency_stopped=False,
            rain_lock=False,
            moisture_low_threshold=low_t,
            moisture_high_threshold=high_t,
            target_duration_mins=35,
            last_command="INIT",
            last_command_time=now,
            last_updated=now
        )
        db.add(controller)
        db.commit()
        db.refresh(controller)
    return controller

@router.get("/{farm_id}", response_model=PumpControllerOut)
def get_pump_status(farm_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns live borewell controller state, rain lock status, and safety mode.
    Auto-evaluates rain forecast and soil moisture thresholds using IoT automation engine.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    controller = get_or_create_pump_controller(farm, db)

    # Check soil moisture sensor
    moisture_sensor = db.query(Sensor).filter(
        Sensor.farm_id == farm.id,
        Sensor.sensor_type == "moisture"
    ).first()
    
    sensor_connected = moisture_sensor is not None and moisture_sensor.status == "Online"
    current_moisture = float(moisture_sensor.current_value) if (moisture_sensor is not None and sensor_connected) else None

    # Fetch live weather for farm GPS coordinates
    lat = farm.latitude if farm.latitude is not None else 12.9716
    lon = farm.longitude if farm.longitude is not None else 77.5946
    weather_data = fetch_farm_weather_telemetry(lat, lon)
    rain_prob = float(weather_data.get("rain_prob", 15.0) or 15.0)

    # Evaluate decision through IoT Automation Engine
    stage_str = farm.current_stage_override or "Vegetative Growth"
    decision = evaluate_iot_automation_decision(
        farm_name=farm.name,
        crop=farm.crop or "Tomato",
        crop_stage=stage_str,
        soil_moisture_pct=current_moisture,
        sensor_connected=sensor_connected,
        pump_status=controller.status,
        pump_mode=controller.mode,
        rain_lock=controller.rain_lock,
        emergency_stopped=controller.emergency_stopped,
        hardware_connected=controller.hardware_connected,
        rain_prob_next_24h=rain_prob,
        moisture_low_threshold=controller.moisture_low_threshold,
        moisture_high_threshold=controller.moisture_high_threshold,
        target_duration_mins=controller.target_duration_mins
    )

    # Update rain lock state if changed by engine
    if decision.get("rain_lock_state") != controller.rain_lock:
        controller.rain_lock = decision.get("rain_lock_state", False)

    # If decision recommends status change and we are in AUTO mode
    if controller.mode == "AUTO" and decision.get("should_change_status") and decision.get("target_status") != controller.status:
        now = datetime.now(timezone.utc)
        controller.status = decision["target_status"]
        controller.manual_override = False
        controller.last_command = decision["action_type"]
        controller.last_command_time = now
        
        details = {
            "farm_id": farm.id,
            "device_id": controller.device_id,
            "requested_command": decision["action_type"],
            "result": "EXECUTED",
            "reason": decision["reason"],
            "timestamp": now.isoformat(),
            "resulting_pump_status": controller.status,
            "rain_lock": controller.rain_lock
        }
        event = PumpEvent(
            farm_id=farm.id,
            event_type=decision["action_type"],
            trigger_reason=decision["reason"],
            device_id=controller.device_id,
            requested_command=decision["action_type"],
            result="EXECUTED",
            reason=decision["reason"],
            resulting_pump_status=controller.status,
            rain_lock=controller.rain_lock,
            details_json=json.dumps(details),
            timestamp=now
        )
        db.add(event)

    controller.last_updated = datetime.now(timezone.utc)
    db.commit()
    db.refresh(controller)

    return controller

@router.get("/automation-status/{farm_id}", response_model=IoTAutomationStatusOut)
def get_iot_automation_status(
    farm_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Consolidated IoT automation dashboard telemetry endpoint.
    Provides connection status, sensor values, live recommendations with agronomic reasons,
    and audit trail of recent automated decisions.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    controller = get_or_create_pump_controller(farm, db)

    moisture_sensor = db.query(Sensor).filter(
        Sensor.farm_id == farm.id,
        Sensor.sensor_type == "moisture"
    ).first()
    
    sensor_connected = moisture_sensor is not None and moisture_sensor.status == "Online"
    current_moisture = float(moisture_sensor.current_value) if (moisture_sensor is not None and sensor_connected) else None

    # Fetch live weather
    lat = farm.latitude if farm.latitude is not None else 12.9716
    lon = farm.longitude if farm.longitude is not None else 77.5946
    weather_data = fetch_farm_weather_telemetry(lat, lon)
    rain_prob = float(weather_data.get("rain_prob", 15.0) or 15.0)

    stage_str = farm.current_stage_override or "Vegetative Growth"
    decision = evaluate_iot_automation_decision(
        farm_name=farm.name,
        crop=farm.crop or "Tomato",
        crop_stage=stage_str,
        soil_moisture_pct=current_moisture,
        sensor_connected=sensor_connected,
        pump_status=controller.status,
        pump_mode=controller.mode,
        rain_lock=controller.rain_lock,
        emergency_stopped=controller.emergency_stopped,
        hardware_connected=controller.hardware_connected,
        rain_prob_next_24h=rain_prob,
        moisture_low_threshold=controller.moisture_low_threshold,
        moisture_high_threshold=controller.moisture_high_threshold,
        target_duration_mins=controller.target_duration_mins
    )

    # Determine moisture status band
    if current_moisture is None:
        moist_status = "UNKNOWN"
    elif current_moisture < controller.moisture_low_threshold:
        moist_status = "LOW"
    elif current_moisture > controller.moisture_high_threshold:
        moist_status = "HIGH"
    else:
        moist_status = "OPTIMAL"

    # Get last event
    last_event = db.query(PumpEvent).filter(
        PumpEvent.farm_id == farm.id
    ).order_by(PumpEvent.timestamp.desc()).first()

    return IoTAutomationStatusOut(
        farm_id=farm.id,
        farm_name=farm.name,
        crop=farm.crop or "Tomato",
        soil_moisture_pct=current_moisture,
        moisture_status=moist_status,
        moisture_low_threshold=controller.moisture_low_threshold,
        moisture_high_threshold=controller.moisture_high_threshold,
        sensor_connected=sensor_connected,
        hardware_connected=controller.hardware_connected,
        is_simulated=controller.is_simulated,
        pump_status=controller.status,
        pump_mode=controller.mode,
        rain_lock=controller.rain_lock,
        manual_override=getattr(controller, "manual_override", False),
        emergency_stopped=controller.emergency_stopped,
        rain_prob_next_24h=rain_prob,
        weather_condition=weather_data.get("condition", "Partly Cloudy"),
        current_recommendation=decision["recommendation"],
        recommendation_reason=decision["reason"],
        last_action_type=last_event.event_type if last_event else controller.last_command,
        last_action_reason=last_event.trigger_reason if last_event else "Initial controller state",
        last_action_time=last_event.timestamp if last_event else controller.last_command_time,
        safety_status=decision["safety_status"]
    )

@router.post("/{farm_id}/command", response_model=PumpControllerOut)
def send_pump_command(
    farm_id: int,
    cmd: PumpCommandIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Executes manual or auto control commands on the smart borewell controller.
    Supports Manual ON/OFF, AUTO/MANUAL toggle, Rain Lock toggle, Emergency Stop and Reset.
    Always logs every command attempt, including BLOCKED events with reasons and states.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    controller = get_or_create_pump_controller(farm, db)
    now = datetime.now(timezone.utc)
    action = (getattr(cmd, "command", None) or getattr(cmd, "action", "")).upper()
    cmd_reason = getattr(cmd, "reason", None)

    # Manual Start / PUMP_ON
    if action in ["START", "PUMP_ON", "ON"]:
        # Emergency Stop is strictly non-bypassable in ALL modes
        if controller.emergency_stopped:
            reason_msg = "Cannot start: Emergency Stop lock is active. Please clear emergency switch first."
            details = {
                "farm_id": farm.id,
                "pump_id": controller.device_id,
                "device_id": controller.device_id,
                "requested_command": action,
                "result": "BLOCKED",
                "reason": "EMERGENCY_STOP_ACTIVE",
                "trigger_reason": reason_msg,
                "timestamp": now.isoformat(),
                "resulting_status": "OFF",
                "resulting_pump_status": "OFF",
                "rain_lock": controller.rain_lock,
                "emergency_stopped": controller.emergency_stopped
            }
            event = PumpEvent(
                farm_id=farm.id,
                event_type="BLOCKED_EMERGENCY",
                trigger_reason=reason_msg,
                pump_id=controller.device_id,
                device_id=controller.device_id,
                requested_command=action,
                result="BLOCKED",
                reason="EMERGENCY_STOP_ACTIVE",
                resulting_status="OFF",
                resulting_pump_status="OFF",
                rain_lock=controller.rain_lock,
                details_json=json.dumps(details),
                timestamp=now
            )
            db.add(event)
            controller.last_command = f"BLOCKED: {action} (Emergency Stop)"
            controller.last_command_time = now
            controller.last_updated = now
            db.commit()
            raise HTTPException(status_code=400, detail=reason_msg)

        # In AUTO mode: Rain Lock strictly blocks starting the pump
        if controller.mode == "AUTO" and controller.rain_lock:
            reason_msg = "Cannot start borewell: Rain Lock is currently active to prevent waterlogging in AUTO mode."
            details = {
                "farm_id": farm.id,
                "pump_id": controller.device_id,
                "device_id": controller.device_id,
                "requested_command": action,
                "result": "BLOCKED",
                "reason": "RAIN_LOCK_ACTIVE",
                "trigger_reason": reason_msg,
                "timestamp": now.isoformat(),
                "resulting_status": "OFF",
                "resulting_pump_status": "OFF",
                "rain_lock": True,
                "emergency_stopped": controller.emergency_stopped
            }
            event = PumpEvent(
                farm_id=farm.id,
                event_type="BLOCKED_RAIN_LOCK",
                trigger_reason=reason_msg,
                pump_id=controller.device_id,
                device_id=controller.device_id,
                requested_command=action,
                result="BLOCKED",
                reason="RAIN_LOCK_ACTIVE",
                resulting_status="OFF",
                resulting_pump_status="OFF",
                rain_lock=True,
                details_json=json.dumps(details),
                timestamp=now
            )
            db.add(event)
            controller.last_command = f"BLOCKED: {action} (Rain Lock)"
            controller.last_command_time = now
            controller.last_updated = now
            db.commit()
            raise HTTPException(status_code=400, detail=reason_msg)
        
        # In MANUAL mode (or AUTO mode with Rain Lock inactive): Execute command
        duration = getattr(cmd, "duration_mins", None) or getattr(cmd, "duration_minutes", None) or controller.target_duration_mins
        is_manual_override = controller.rain_lock and controller.mode == "MANUAL"
        
        controller.status = "ON"
        controller.manual_override = is_manual_override
        
        if is_manual_override:
            controller.last_command = f"MANUAL_OVERRIDE_START ({duration}m)"
            reason_msg = cmd_reason or f"Manual operator override: Pump ON executed for {duration} minutes while Rain Lock is active."
            event_type = "MANUAL_OVERRIDE_START"
            event_reason = "MANUAL_RAIN_LOCK_OVERRIDE"
        else:
            controller.last_command = f"MANUAL_START ({duration}m)"
            reason_msg = cmd_reason or f"Manual operator start command for {duration} minutes."
            event_type = "MANUAL_START"
            event_reason = reason_msg

        controller.last_command_time = now
        details = {
            "farm_id": farm.id,
            "pump_id": controller.device_id,
            "device_id": controller.device_id,
            "requested_command": action,
            "result": "EXECUTED",
            "reason": event_reason,
            "trigger_reason": reason_msg,
            "manual_override": is_manual_override,
            "timestamp": now.isoformat(),
            "resulting_status": "ON",
            "resulting_pump_status": "ON",
            "rain_lock": controller.rain_lock,
            "hardware_connected": controller.hardware_connected,
            "is_simulated": controller.is_simulated
        }
        event = PumpEvent(
            farm_id=farm.id,
            event_type=event_type,
            trigger_reason=reason_msg,
            pump_id=controller.device_id,
            device_id=controller.device_id,
            requested_command=action,
            result="EXECUTED",
            reason=event_reason,
            resulting_status="ON",
            resulting_pump_status="ON",
            rain_lock=controller.rain_lock,
            details_json=json.dumps(details),
            timestamp=now
        )
        db.add(event)

    # Manual Stop / PUMP_OFF
    elif action in ["STOP", "PUMP_OFF", "OFF"]:
        controller.status = "OFF"
        controller.manual_override = False
        controller.last_command = "MANUAL_STOP"
        controller.last_command_time = now
        reason_msg = cmd_reason or "Manual operator stop command."
        details = {
            "farm_id": farm.id,
            "pump_id": controller.device_id,
            "device_id": controller.device_id,
            "requested_command": action,
            "result": "EXECUTED",
            "reason": reason_msg,
            "trigger_reason": reason_msg,
            "manual_override": False,
            "timestamp": now.isoformat(),
            "resulting_status": "OFF",
            "resulting_pump_status": "OFF",
            "rain_lock": controller.rain_lock,
            "hardware_connected": controller.hardware_connected,
            "is_simulated": controller.is_simulated
        }
        event = PumpEvent(
            farm_id=farm.id,
            event_type="MANUAL_STOP",
            trigger_reason=reason_msg,
            pump_id=controller.device_id,
            device_id=controller.device_id,
            requested_command=action,
            result="EXECUTED",
            reason=reason_msg,
            resulting_status="OFF",
            resulting_pump_status="OFF",
            rain_lock=controller.rain_lock,
            details_json=json.dumps(details),
            timestamp=now
        )
        db.add(event)

    # Switch Mode (AUTO / MANUAL)
    elif action in ["SET_MODE", "SET_MODE_AUTO", "SET_MODE_MANUAL"]:
        new_mode = "AUTO" if action == "SET_MODE_AUTO" else ("MANUAL" if action == "SET_MODE_MANUAL" else getattr(cmd, "mode", "AUTO"))
        controller.mode = new_mode
        if new_mode == "AUTO":
            controller.manual_override = False
        controller.last_command = f"SET_MODE_{new_mode}"
        controller.last_command_time = now
        reason_msg = f"Operating mode set to {new_mode}."
        details = {
            "farm_id": farm.id,
            "pump_id": controller.device_id,
            "device_id": controller.device_id,
            "requested_command": action,
            "result": "EXECUTED",
            "reason": reason_msg,
            "trigger_reason": reason_msg,
            "manual_override": controller.manual_override,
            "timestamp": now.isoformat(),
            "resulting_status": controller.status,
            "resulting_pump_status": controller.status,
            "rain_lock": controller.rain_lock,
            "hardware_connected": controller.hardware_connected,
            "is_simulated": controller.is_simulated
        }
        event = PumpEvent(
            farm_id=farm.id,
            event_type=f"MODE_CHANGE_{new_mode}",
            trigger_reason=reason_msg,
            pump_id=controller.device_id,
            device_id=controller.device_id,
            requested_command=action,
            result="EXECUTED",
            reason=reason_msg,
            resulting_status=controller.status,
            resulting_pump_status=controller.status,
            rain_lock=controller.rain_lock,
            details_json=json.dumps(details),
            timestamp=now
        )
        db.add(event)

    # Emergency Kill Switch
    elif action == "EMERGENCY_STOP":
        controller.status = "OFF"
        controller.emergency_stopped = True
        controller.mode = "MANUAL"
        controller.last_command = "EMERGENCY_STOP"
        controller.last_command_time = now
        reason_msg = cmd_reason or "EMERGENCY SHUTDOWN: Immediate stop initiated by farmer."
        details = {
            "farm_id": farm.id,
            "device_id": controller.device_id,
            "requested_command": action,
            "result": "EXECUTED",
            "reason": reason_msg,
            "timestamp": now.isoformat(),
            "resulting_pump_status": "OFF",
            "rain_lock": controller.rain_lock
        }
        event = PumpEvent(
            farm_id=farm.id,
            event_type="EMERGENCY_STOP",
            trigger_reason=reason_msg,
            device_id=controller.device_id,
            requested_command=action,
            result="EXECUTED",
            reason=reason_msg,
            resulting_pump_status="OFF",
            rain_lock=controller.rain_lock,
            details_json=json.dumps(details),
            timestamp=now
        )
        db.add(event)

    # Emergency Reset
    elif action == "RESET_EMERGENCY":
        controller.emergency_stopped = False
        controller.last_command = "RESET_EMERGENCY"
        controller.last_command_time = now
        reason_msg = "Emergency lock cleared by operator."
        details = {
            "farm_id": farm.id,
            "device_id": controller.device_id,
            "requested_command": action,
            "result": "EXECUTED",
            "reason": reason_msg,
            "timestamp": now.isoformat(),
            "resulting_pump_status": controller.status,
            "rain_lock": controller.rain_lock
        }
        event = PumpEvent(
            farm_id=farm.id,
            event_type="RESET_EMERGENCY",
            trigger_reason=reason_msg,
            device_id=controller.device_id,
            requested_command=action,
            result="EXECUTED",
            reason=reason_msg,
            resulting_pump_status=controller.status,
            rain_lock=controller.rain_lock,
            details_json=json.dumps(details),
            timestamp=now
        )
        db.add(event)

    # Set Rain Lock Override
    elif action == "TOGGLE_RAIN_LOCK":
        controller.rain_lock = not controller.rain_lock
        controller.last_command = f"RAIN_LOCK_{'ON' if controller.rain_lock else 'OFF'}"
        controller.last_command_time = now
        reason_msg = f"Rain lock set to {controller.rain_lock}."
        details = {
            "farm_id": farm.id,
            "device_id": controller.device_id,
            "requested_command": action,
            "result": "EXECUTED",
            "reason": reason_msg,
            "timestamp": now.isoformat(),
            "resulting_pump_status": controller.status,
            "rain_lock": controller.rain_lock
        }
        event = PumpEvent(
            farm_id=farm.id,
            event_type="RAIN_LOCK_TOGGLE",
            trigger_reason=reason_msg,
            device_id=controller.device_id,
            requested_command=action,
            result="EXECUTED",
            reason=reason_msg,
            resulting_pump_status=controller.status,
            rain_lock=controller.rain_lock,
            details_json=json.dumps(details),
            timestamp=now
        )
        db.add(event)

    elif action == "SET_THRESHOLDS":
        if getattr(cmd, "moisture_low", None) is not None and cmd.moisture_low is not None:
            controller.moisture_low_threshold = float(cmd.moisture_low)
        if getattr(cmd, "moisture_high", None) is not None and cmd.moisture_high is not None:
            controller.moisture_high_threshold = float(cmd.moisture_high)
        if getattr(cmd, "duration_mins", None) is not None and cmd.duration_mins is not None:
            controller.target_duration_mins = cmd.duration_mins
        controller.last_command = "SET_THRESHOLDS"
        controller.last_command_time = now
        reason_msg = f"Thresholds updated: low={controller.moisture_low_threshold}%, high={controller.moisture_high_threshold}%, duration={controller.target_duration_mins}m."
        details = {
            "farm_id": farm.id,
            "device_id": controller.device_id,
            "requested_command": action,
            "result": "EXECUTED",
            "reason": reason_msg,
            "timestamp": now.isoformat(),
            "resulting_pump_status": controller.status,
            "rain_lock": controller.rain_lock
        }
        event = PumpEvent(
            farm_id=farm.id,
            event_type="SET_THRESHOLDS",
            trigger_reason=reason_msg,
            device_id=controller.device_id,
            requested_command=action,
            result="EXECUTED",
            reason=reason_msg,
            resulting_pump_status=controller.status,
            rain_lock=controller.rain_lock,
            details_json=json.dumps(details),
            timestamp=now
        )
        db.add(event)

    else:
        reason_msg = f"Unrecognized pump command: {action}"
        details = {
            "farm_id": farm.id,
            "device_id": controller.device_id,
            "requested_command": action,
            "result": "BLOCKED",
            "reason": reason_msg,
            "timestamp": now.isoformat(),
            "resulting_pump_status": controller.status,
            "rain_lock": controller.rain_lock
        }
        event = PumpEvent(
            farm_id=farm.id,
            event_type="BLOCKED_UNKNOWN_CMD",
            trigger_reason=reason_msg,
            device_id=controller.device_id,
            requested_command=action,
            result="BLOCKED",
            reason=reason_msg,
            resulting_pump_status=controller.status,
            rain_lock=controller.rain_lock,
            details_json=json.dumps(details),
            timestamp=now
        )
        db.add(event)
        controller.last_command = f"BLOCKED: {action}"
        controller.last_command_time = now
        controller.last_updated = now
        db.commit()
        raise HTTPException(status_code=400, detail=reason_msg)

    controller.last_updated = now
    db.commit()
    db.refresh(controller)

    return controller

@router.get("/{farm_id}/events", response_model=List[PumpEventOut])
def get_pump_event_logs(farm_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Returns audit trail of automatic and manual borewell actions.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    events = db.query(PumpEvent).filter(PumpEvent.farm_id == farm.id).order_by(PumpEvent.timestamp.desc()).limit(50).all()
    for evt in events:
        dev_id = evt.device_id or evt.pump_id or (farm.pump_controller.device_id if hasattr(farm, "pump_controller") and farm.pump_controller else f"ESP32-PUMP-{farm.id:04d}")
        if not evt.device_id:
            evt.device_id = dev_id
        if not evt.pump_id:
            evt.pump_id = dev_id
        if not evt.requested_command:
            evt.requested_command = evt.event_type
        if not evt.result:
            evt.result = "BLOCKED" if "BLOCKED" in (evt.event_type or "") else "EXECUTED"
        if not evt.reason:
            evt.reason = "RAIN_LOCK_ACTIVE" if "RAIN" in (evt.event_type or "") and evt.result == "BLOCKED" else evt.trigger_reason
        if not evt.resulting_status:
            evt.resulting_status = "OFF" if any(x in (evt.event_type or "") for x in ["STOP", "OFF", "BLOCKED", "EMERGENCY"]) else "ON"
        if not evt.resulting_pump_status:
            evt.resulting_pump_status = evt.resulting_status
        if getattr(evt, "rain_lock", None) is None:
            evt.rain_lock = "RAIN" in (evt.event_type or "")
    return events
