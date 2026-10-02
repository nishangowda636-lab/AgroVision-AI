from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Tuple, Optional

# Crop-specific moisture profiles (low threshold, optimal high threshold)
CROP_MOISTURE_PROFILES = {
    "Tomato": (40.0, 60.0),
    "Rice": (65.0, 85.0),
    "Maize": (38.0, 58.0),
    "Wheat": (35.0, 55.0),
    "Sugarcane": (50.0, 75.0),
    "Chilli": (38.0, 58.0),
    "Cotton": (35.0, 52.0),
    "Groundnut": (32.0, 50.0),
    "Banana": (55.0, 75.0),
    "Potato": (45.0, 65.0),
    "Default": (40.0, 60.0)
}

def evaluate_iot_automation_decision(
    farm_name: str,
    crop: str,
    crop_stage: str,
    soil_moisture_pct: Optional[float],
    sensor_connected: bool,
    pump_status: str, # ON, OFF
    pump_mode: str, # AUTO, MANUAL
    rain_lock: bool,
    emergency_stopped: bool,
    hardware_connected: bool,
    rain_prob_next_24h: float,
    moisture_low_threshold: float,
    moisture_high_threshold: float,
    target_duration_mins: int = 35
) -> Dict[str, Any]:
    """
    Evaluates IoT sensor data, weather forecast, crop stage, and pump state
    to produce safe, transparent, explainable automation decisions.
    """
    now = datetime.now(timezone.utc)
    
    # Check Emergency Stop Condition
    if emergency_stopped:
        return {
            "should_change_status": pump_status == "ON",
            "target_status": "OFF",
            "action_type": "EMERGENCY_LOCK",
            "reason": "EMERGENCY STOP ACTIVE: Automation is disabled and hardware pump locked in OFF state by farmer safety override.",
            "recommendation": "Clear Emergency Stop switch when field is safe to resume automation.",
            "rain_lock_state": rain_lock,
            "safety_status": "EMERGENCY_LOCKED"
        }

    # Fail-Safe check: Sensor disconnected or failed
    effective_moisture = soil_moisture_pct if (sensor_connected and soil_moisture_pct is not None) else None
    
    # Rain Lock Rule: If rain expected (>= 40% probability) or Rain Lock active
    is_heavy_rain_likely = rain_prob_next_24h >= 40.0
    rain_lock_active = is_heavy_rain_likely or rain_lock
    
    # Manual Mode Handling
    if pump_mode == "MANUAL":
        if rain_lock_active and pump_status == "ON":
            return {
                "should_change_status": False,
                "target_status": "ON",
                "action_type": "MANUAL_OVERRIDE_HOLD",
                "reason": f"System is in MANUAL mode with manual override active. Pump is ON despite rain forecast ({rain_prob_next_24h}% chance in next 24h).",
                "recommendation": "Manual override active. Rain Lock is engaged. Monitor soil moisture to prevent waterlogging.",
                "rain_lock_state": True,
                "safety_status": "RAIN_LOCKED"
            }
        elif rain_lock_active and pump_status == "OFF":
            return {
                "should_change_status": False,
                "target_status": "OFF",
                "action_type": "MANUAL_MODE_HOLD",
                "reason": f"System is in MANUAL mode. Pump is currently OFF. Rain Lock is active ({rain_prob_next_24h}% rain probability).",
                "recommendation": "Manual mode active. Rain Lock is active. Explicit manual override will allow pump start if required.",
                "rain_lock_state": True,
                "safety_status": "RAIN_LOCKED"
            }
        else:
            return {
                "should_change_status": False,
                "target_status": pump_status,
                "action_type": "MANUAL_MODE_HOLD",
                "reason": f"System is in MANUAL mode. Pump is currently {pump_status}. Automatic start/stop triggers are bypassed.",
                "recommendation": "Switch to AUTO mode if you want AgroVision IoT to regulate soil moisture automatically.",
                "rain_lock_state": False,
                "safety_status": "NORMAL"
            }

    # AUTO MODE RAIN LOCK RULE
    if rain_lock_active:
        if pump_status == "ON":
            return {
                "should_change_status": True,
                "target_status": "OFF",
                "action_type": "AUTO_STOP_RAIN",
                "reason": f"Rain expected / Rain Lock active ({rain_prob_next_24h}% chance in next 24h). Suspended irrigation to prevent waterlogging and fertilizer leaching in AUTO mode.",
                "recommendation": f"Rain Lock active in AUTO mode. Soil will receive natural precipitation. Irrigation blocked.",
                "rain_lock_state": True,
                "safety_status": "RAIN_LOCKED"
            }
        elif pump_status == "OFF":
            return {
                "should_change_status": False,
                "target_status": "OFF",
                "action_type": "RAIN_LOCK_HOLD",
                "reason": f"Rain Lock active ({rain_prob_next_24h}% rain probability). Automatic pump start blocked to conserve borewell groundwater and power.",
                "recommendation": f"Rain Lock engaged ({rain_prob_next_24h}% rain forecast). Automatic start blocked.",
                "rain_lock_state": True,
                "safety_status": "RAIN_LOCKED"
            }

    # AUTO MODE DECISION MATRIX
    # If no sensor is connected, use agronomic recommendation mode without hardware auto-trigger
    if effective_moisture is None:
        return {
            "should_change_status": False,
            "target_status": pump_status,
            "action_type": "SENSOR_OFFLINE_RECOMMENDATION",
            "reason": "IoT Soil moisture sensor is offline or unlinked. Operating in Simulation / Agronomic Recommendation Mode.",
            "recommendation": f"For {crop} ({crop_stage}), deliver scheduled drip irrigation of ~{target_duration_mins} mins every 2 days.",
            "rain_lock_state": False,
            "safety_status": "SENSOR_TIMEOUT"
        }

    # Rule 1: Soil moisture low (< threshold) + No significant rain -> AUTO START
    if effective_moisture < moisture_low_threshold and pump_status == "OFF":
        return {
            "should_change_status": True,
            "target_status": "ON",
            "action_type": "AUTO_START",
            "reason": f"Soil moisture ({effective_moisture}%) dropped below target threshold ({moisture_low_threshold}%). No rain expected ({rain_prob_next_24h}%). Starting drip irrigation cycle for {target_duration_mins} mins.",
            "recommendation": f"Irrigating {crop} in {crop_stage} stage to restore rootzone hydration.",
            "rain_lock_state": False,
            "safety_status": "NORMAL"
        }

    # Rule 2: Soil moisture sufficient/optimal (>= high threshold) + Pump is running -> AUTO STOP
    if effective_moisture >= moisture_high_threshold and pump_status == "ON":
        return {
            "should_change_status": True,
            "target_status": "OFF",
            "action_type": "AUTO_STOP_MOISTURE",
            "reason": f"Optimal soil moisture ({effective_moisture}%) achieved (high threshold: {moisture_high_threshold}%). Shutting off pump to avoid root saturation.",
            "recommendation": f"Soil moisture is optimal at {effective_moisture}%. Pump shut down successfully.",
            "rain_lock_state": False,
            "safety_status": "NORMAL"
        }

    # Rule 3: Soil moisture within acceptable band
    if pump_status == "OFF":
        moist_status_txt = "Optimal" if effective_moisture >= moisture_low_threshold else "Low"
        return {
            "should_change_status": False,
            "target_status": "OFF",
            "action_type": "STANDBY_OPTIMAL",
            "reason": f"Soil moisture is balanced at {effective_moisture}% (target range: {moisture_low_threshold}% - {moisture_high_threshold}%).",
            "recommendation": f"Rootzone moisture is sufficient ({effective_moisture}%). Borewell controller in standby.",
            "rain_lock_state": False,
            "safety_status": "NORMAL"
        }

    # Rule 4: Pump is currently running within active cycle
    return {
        "should_change_status": False,
        "target_status": "ON",
        "action_type": "RUNNING_ACTIVE_CYCLE",
        "reason": f"Irrigation in progress. Current moisture: {effective_moisture}% (target: {moisture_high_threshold}%).",
        "recommendation": "Active irrigation cycle in progress.",
        "rain_lock_state": False,
        "safety_status": "NORMAL"
    }
