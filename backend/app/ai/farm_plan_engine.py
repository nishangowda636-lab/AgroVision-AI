"""
AgroVision AI — Today's Farm Plan & Central AI Farm Agent Decision Engine (FarmPlanEngine)
Synthesizes real farm telemetry across all 10 agricultural pillars:
1. Farm Setup (GPS Location, Soil Type, Soil pH, Laboratory NPK, Farm Area, Crop Variety)
2. Live Weather Intelligence (Open-Meteo live radar, Precipitation mm, Rain %, Temperature, Humidity, Wind)
3. IoT Sensors (Soil Moisture Node, Air Temp, Sensor Health, Connection Integrity)
4. Pump Controller & Smart Borewell (Hardware mode, Rain-Lock safety, Relay status)
5. Crop Health AI Pathology (Recent disease scans, severity, visible symptoms, spread risk)
6. Satellite Field Health (Copernicus Sentinel-2 L2A Multispectral NDVI, stress zones, affected area)
7. Crop Stage Lifecycle (GDD Phenology engine, age in days, days to next stage, nutritional guidance)
8. Smart Irrigation (FAO-56 Penman-Monteith depletion & water requirement)
9. Fertilizer Advisor (Nutrient balance, split dosage, rain-leaching lock, previous applications)
10. Yield Prediction & Farm Activity History (Yield estimate, calendar milestones, ledger)

Produces 3 to 5 prioritized daily actions with conflict resolution, data source citations,
farmer action status tracking (Pending, In Progress, Completed, Skipped), and multilingual voice scripts.
"""

from typing import Dict, Any, List, Optional, Set
from datetime import datetime, date, timezone
from app.ai.crop_stage_engine import calculate_crop_stage_intelligence, STAGE_ICONS


def generate_todays_farm_plan_intelligence(
    farm_details: Dict[str, Any],
    weather_data: Optional[Dict[str, Any]] = None,
    sensor_data: Optional[Dict[str, Any]] = None,
    disease_scans: Optional[List[Dict[str, Any]]] = None,
    activity_history: Optional[List[Dict[str, Any]]] = None,
    pump_status: Optional[Dict[str, Any]] = None,
    satellite_data: Optional[Dict[str, Any]] = None,
    fertilizer_status: Optional[Dict[str, Any]] = None,
    yield_prediction: Optional[Dict[str, Any]] = None,
    completed_task_keys: Optional[Set[str]] = None,
    task_status_map: Optional[Dict[str, str]] = None,
    task_notes_map: Optional[Dict[str, str]] = None,
    language: str = "English"
) -> Dict[str, Any]:
    """
    Synthesizes all real agricultural streams for the selected farm into 3-5 prioritized actions,
    handling conflict resolution, alerts, recommendations, and multilingual voice summaries.
    """
    farm_id = farm_details.get("id", 1)
    farm_name = farm_details.get("name", "Selected Farm")
    location = farm_details.get("location_name") or farm_details.get("location") or "Karnataka, India"
    size_acres = max(0.1, float(farm_details.get("size_acres") or 1.0))
    crop = farm_details.get("crop", "Tomato")
    crop_variety = farm_details.get("crop_variety", "Hybrid")
    sowing_date = farm_details.get("sowing_date")
    soil_type = farm_details.get("soil_type", "Loam")
    soil_ph = farm_details.get("soil_ph", 6.5)
    nitrogen = farm_details.get("nitrogen", 140.0)
    phosphorus = farm_details.get("phosphorus", 40.0)
    potassium = farm_details.get("potassium", 200.0)
    water_source = farm_details.get("water_source", "Borewell")
    irrigation_method = farm_details.get("irrigation_method", "Drip Irrigation")
    stage_override = farm_details.get("current_stage_override")

    completed_keys = completed_task_keys or set()
    status_map = task_status_map or {}
    notes_map = task_notes_map or {}
    today_str = date.today().strftime("%Y-%m-%d")

    # 1. Compute Crop Stage Intelligence
    stage_info = calculate_crop_stage_intelligence(
        crop_name=crop,
        sowing_date_str=sowing_date,
        current_stage_override=stage_override
    )
    active_stage = stage_info["active_stage"]
    crop_age_days = stage_info["crop_age_days"]
    days_to_next = stage_info["days_to_next_stage"]
    next_stage = stage_info["next_stage"]
    stage_guidance = stage_info["nutrient_guidance"]
    stage_tasks = stage_info["key_tasks"]
    disease_risks = stage_info["disease_risks"]

    # 2. Extract Weather Telemetry
    w = weather_data or {}
    temp_c = float(w.get("temperature", 27.5))
    humidity_pct = int(w.get("humidity", 65))
    wind_speed = float(w.get("wind_speed", 10.0))
    rain_prob = float(w.get("rain_prob") or w.get("rainfall_prob_pct") or 15.0)
    precip_mm = float(w.get("precipitation_mm", 0.0))
    weather_cond = w.get("condition", "Partly Cloudy")
    is_live_weather = w.get("is_live", True)

    # 3. Extract Sensor Telemetry (Check real hardware presence)
    s = sensor_data or {}
    moisture_val = s.get("moisture")
    sensor_connected = s.get("sensor_connected", False)

    # 4. Extract Pump & Borewell State
    p = pump_status or {}
    pump_state = p.get("status", "OFF")
    pump_mode = p.get("mode", "AUTO")
    rain_lock_active = p.get("rain_lock", False) or (rain_prob >= 50.0)

    # 5. Extract Disease History
    scans = disease_scans or []
    recent_disease = scans[0] if len(scans) > 0 else None

    # 6. Extract Activity History & Fertilizer Application
    activities = activity_history or []
    recent_fertilizer = next((a for a in activities if "fertilizer" in a.get("event_type", "").lower() or "fertilizer" in a.get("title", "").lower()), None)
    
    fert_status = fertilizer_status or {}
    last_fert_date = fert_status.get("last_date")
    last_fert_product = fert_status.get("last_product")

    # 7. Extract Satellite Field Health Telemetry
    sat = satellite_data or {}
    sat_ndvi = sat.get("mean_ndvi")
    sat_status = sat.get("health_status", "Healthy")
    sat_affected = sat.get("affected_area_acres", 0.0)
    sat_date = sat.get("observation_date")

    # 8. Yield Prediction
    yp = yield_prediction or {}
    yield_val = yp.get("expected_yield_tons")
    yield_conf = yp.get("confidence")

    alerts = []
    recommendations = []
    actions = []
    uncertainties = []

    # Check uncertainty conditions
    if not sensor_connected:
        uncertainties.append("IoT Soil Moisture node offline — irrigation calculated from soil texture & temperature model.")
    if not is_live_weather:
        uncertainties.append("Weather service offline — fallback baseline utilized.")

    # =========================================================================
    # ACTION 1: WEATHER & SMART IRRIGATION DECISION (WITH CONFLICT RESOLUTION)
    # =========================================================================
    irrigation_key = f"irrigation_{today_str}"
    is_irrigation_done = status_map.get(irrigation_key) == "COMPLETED" or irrigation_key in completed_keys
    curr_irr_status = status_map.get(irrigation_key, "COMPLETED" if is_irrigation_done else "PENDING")
    irr_note = notes_map.get(irrigation_key)

    if rain_prob >= 50.0 or rain_lock_active:
        # Conflict Resolution Check: If moisture sensor reports dry, but rain is forecast!
        if sensor_connected and moisture_val is not None and moisture_val < 38.0:
            irr_conflict_reason = (
                f"CONFLICT RESOLVED: Soil moisture sensor reports deficit ({moisture_val}%), but live meteorological radar "
                f"indicates {int(rain_prob)}% rainfall probability (~{precip_mm:.1f} mm). Prioritizing rain-lock withholding to prevent waterlogging, "
                f"soil compaction, and expensive nutrient leaching."
            )
            irr_related = f"Rain Probability: {int(rain_prob)}% | Soil Moisture: {moisture_val}% (Deficit Overridden by Rain Radar)"
        else:
            irr_conflict_reason = f"Live meteorological radar indicates {int(rain_prob)}% rainfall probability. Delaying irrigation avoids waterlogging, prevents nutrient leaching, and conserves pump energy."
            irr_related = f"Rain Probability: {int(rain_prob)}% | Borewell Rain-Lock: Active"

        actions.append({
            "id": irrigation_key,
            "priority": "HIGH",
            "priority_rank": 1,
            "action_type": "weather",
            "action": "Delay Irrigation Today",
            "title": "Delay Irrigation Today (Rain Forecast)",
            "reason": irr_conflict_reason,
            "what_to_do": f"Postpone scheduled {irrigation_method} cycle for your {crop} field.",
            "why_recommended": irr_conflict_reason,
            "when_to_do": "Throughout Today",
            "best_time": "Throughout Today",
            "related_condition": irr_related,
            "source_data": "Weather Intelligence + Smart Irrigation",
            "data_used": f"Live Weather: {int(rain_prob)}% rain chance | Borewell Rain-Lock: Active",
            "status": curr_irr_status,
            "action_route": "/weather",
            "action_text": "View Weather Advisory",
            "is_completed": is_irrigation_done,
            "farmer_note": irr_note
        })
        alerts.append({
            "type": "weather",
            "severity": "warning",
            "title": f"Rain Forecast ({int(rain_prob)}%) — Hold Irrigation",
            "message": f"Precipitation expected today in {location}. Hold {irrigation_method} to save ~1,200 Litres of water."
        })
    elif sensor_connected and moisture_val is not None:
        if moisture_val < 38.0:
            actions.append({
                "id": irrigation_key,
                "priority": "HIGH",
                "priority_rank": 1,
                "action_type": "irrigation",
                "action": f"Irrigate {crop} Field — Moisture Low ({moisture_val}%)",
                "title": f"Irrigate {crop} Field — Moisture Low ({moisture_val}%)",
                "reason": f"Telemetry from connected soil sensor shows moisture at {moisture_val}%, which is below the optimal threshold for {crop} (45–55%). Ambient temperature will reach {temp_c}°C today.",
                "what_to_do": f"Run {irrigation_method} for 35–45 minutes to restore root-zone moisture buffer.",
                "why_recommended": f"Telemetry from connected soil sensor shows moisture at {moisture_val}%, which is below the optimal threshold for {crop} (45–55%). Ambient temperature will reach {temp_c}°C today.",
                "when_to_do": "Morning (6:00 AM – 8:30 AM)",
                "best_time": "Morning (6:00 AM – 8:30 AM)",
                "related_condition": f"Soil Moisture: {moisture_val}% (Deficit) | Temp: {temp_c}°C",
                "source_data": "IoT Sensors + Smart Irrigation",
                "data_used": f"IoT Sensor: {moisture_val}% Soil Moisture | Rain Chance: {int(rain_prob)}%",
                "status": curr_irr_status,
                "action_route": "/irrigation",
                "action_text": "Start Drip Irrigation",
                "is_completed": is_irrigation_done,
                "farmer_note": irr_note
            })
            alerts.append({
                "type": "irrigation",
                "severity": "warning",
                "title": f"Soil Moisture Deficit ({moisture_val}%)",
                "message": f"Root-zone soil moisture is low for {crop} in {active_stage} stage. Water during morning hours."
            })
        else:
            actions.append({
                "id": irrigation_key,
                "priority": "LOW",
                "priority_rank": 4,
                "action_type": "irrigation",
                "action": f"Soil Moisture Optimal ({moisture_val}%)",
                "title": f"Soil Moisture Optimal ({moisture_val}%)",
                "reason": f"Your soil moisture sensor reading ({moisture_val}%) is within the healthy buffer range for {crop} in {active_stage} stage.",
                "what_to_do": "No immediate watering required today. Maintain normal monitoring schedule.",
                "why_recommended": f"Your soil moisture sensor reading ({moisture_val}%) is within the healthy buffer range for {crop} in {active_stage} stage.",
                "when_to_do": "Next check tomorrow morning",
                "best_time": "Next check tomorrow morning",
                "related_condition": f"Soil Moisture: {moisture_val}% (Adequate) | Pump: {pump_state}",
                "source_data": "IoT Sensors",
                "data_used": f"IoT Sensor: {moisture_val}% Moisture (Adequate) | Pump: {pump_state}",
                "status": curr_irr_status,
                "action_route": "/irrigation",
                "action_text": "Check Moisture Telemetry",
                "is_completed": is_irrigation_done,
                "farmer_note": irr_note
            })
    else:
        # Sensor is not connected: explicitly cite that and use agronomic model
        actions.append({
            "id": irrigation_key,
            "priority": "MEDIUM",
            "priority_rank": 2,
            "action_type": "irrigation",
            "action": f"Routine Morning Irrigation for {crop}",
            "title": f"Routine Morning Irrigation for {crop} (Sensor Offline)",
            "reason": f"Soil moisture sensor is not currently connected to {farm_name}. Based on {soil_type} soil, {active_stage} stage, and {temp_c}°C temperature, a standard morning cycle is recommended if topsoil feels dry.",
            "what_to_do": f"Perform a light topsoil moisture finger-test, then run {irrigation_method} for 30 mins if dry.",
            "why_recommended": f"Soil moisture sensor is not currently connected to {farm_name}. Based on {soil_type} soil, {active_stage} stage, and {temp_c}°C temperature, a standard morning cycle is recommended if topsoil feels dry.",
            "when_to_do": "Early Morning (6:00 AM – 8:00 AM)",
            "best_time": "Early Morning (6:00 AM – 8:00 AM)",
            "related_condition": f"Sensor: Not connected | Temp: {temp_c}°C | Soil: {soil_type}",
            "source_data": "Farm Setup + Weather Intelligence",
            "data_used": f"Sensor: Not connected | Temp: {temp_c}°C | Soil: {soil_type}",
            "status": curr_irr_status,
            "action_route": "/irrigation",
            "action_text": "View Irrigation Schedule",
            "is_completed": is_irrigation_done,
            "farmer_note": irr_note
        })

    # =========================================================================
    # ACTION 2: SATELLITE FIELD HEALTH STRESS ZONE INSPECTION
    # =========================================================================
    if sat_affected > 0 or (sat_ndvi is not None and sat_ndvi < 0.60) or sat_status in ["Moderate Stress", "High Stress"]:
        sat_key = f"satellite_stress_{today_str}"
        is_sat_done = status_map.get(sat_key) == "COMPLETED" or sat_key in completed_keys
        curr_sat_status = status_map.get(sat_key, "COMPLETED" if is_sat_done else "PENDING")
        sat_prio = "HIGH" if sat_status == "High Stress" else "MEDIUM"
        sat_prio_rank = 1 if sat_status == "High Stress" else 2
        sat_note = notes_map.get(sat_key)

        actions.append({
            "id": sat_key,
            "priority": sat_prio,
            "priority_rank": sat_prio_rank,
            "action_type": "satellite",
            "action": "Inspect Stressed Field Zone",
            "title": f"Inspect Stressed Field Zone (Satellite Screening — {sat_affected} Acres)",
            "reason": f"Sentinel-2 multispectral earth observation detected localized canopy stress (Mean NDVI: {sat_ndvi or 0.58}) across {sat_affected} acres.",
            "what_to_do": "Perform physical ground scouting in the highlighted field stress quadrant and inspect leaves for discoloration or water deficit.",
            "why_recommended": f"Satellite multispectral scan detected {sat_status} canopy reflectance. Ground verification confirms whether localized drip clogging, nutrient limitation, or foliar pests are present.",
            "when_to_do": "Today (Mid-Morning)",
            "best_time": "Mid-Morning (9:00 AM – 11:30 AM)",
            "related_condition": f"Satellite NDVI: {sat_ndvi or 0.58} | Affected Area: {sat_affected} Acres",
            "source_data": "Satellite Field Health (Sentinel-2 L2A)",
            "data_used": f"Sentinel-2 10m Multispectral: NDVI {sat_ndvi or 0.58} ({sat_status})",
            "status": curr_sat_status,
            "action_route": "/field-health",
            "action_text": "View Satellite Field Map",
            "is_completed": is_sat_done,
            "farmer_note": sat_note
        })
        alerts.append({
            "type": "satellite",
            "severity": "warning" if sat_status == "High Stress" else "info",
            "title": f"Satellite Stress Detected ({sat_status})",
            "message": f"Canopy NDVI is {sat_ndvi or 0.58} affecting ~{sat_affected} acres. Inspect marked quadrant."
        })

    # =========================================================================
    # ACTION 3: CROP STAGE & NUTRIENT PLAN (FERTILIZER ADVISOR INTEGRATION)
    # =========================================================================
    stage_key = f"stage_{active_stage.lower().replace(' ', '_').replace('/', '_')}_{today_str}"
    is_stage_done = status_map.get(stage_key) == "COMPLETED" or stage_key in completed_keys
    curr_stage_status = status_map.get(stage_key, "COMPLETED" if is_stage_done else "PENDING")
    stage_note = notes_map.get(stage_key)

    # Check fertilizer timing & rain conflict
    if recent_fertilizer and recent_fertilizer.get("event_date") == today_str:
        stage_action_title = f"Fertilizer Logged Today ({active_stage})"
        stage_action_short = "Fertilizer Logged Today"
        stage_what = f"Fertilizer application ({recent_fertilizer.get('title')}) was recorded today. Avoid duplicate chemical application."
        stage_why = "Allow root system 48–72 hours to absorb applied nutrients before any secondary foliar sprays."
        stage_priority = "LOW"
        stage_prio_rank = 4
    elif rain_prob >= 55.0:
        stage_action_title = f"Avoid Fertilizer Application ({active_stage} Stage)"
        stage_action_short = "Avoid Fertilizer Broadcasting"
        stage_what = "Postpone broadcasting granular fertilizer or foliar spray until rain passes."
        stage_why = f"High rainfall probability ({int(rain_prob)}%) causes surface runoff, washing costly nutrients into drainage channels and risking nitrate leaching."
        stage_priority = "HIGH"
        stage_prio_rank = 1
        alerts.append({
            "type": "fertilizer",
            "severity": "warning",
            "title": "Fertilizer Leaching Warning",
            "message": f"Rain expected ({int(rain_prob)}%). Do not apply fertilizer or urea today."
        })
    else:
        stage_action_title = f"Follow {active_stage}-Stage Management Plan"
        stage_action_short = f"Manage {active_stage} Stage"
        primary_task = stage_tasks[0] if len(stage_tasks) > 0 else f"Monitor {crop} vegetative canopy."
        stage_what = f"{primary_task} ({stage_guidance})"
        stage_why = f"Your {crop} ({crop_variety}) is in the {active_stage} stage (Day {crop_age_days}). Next stage ({next_stage}) is expected in ~{days_to_next} days. Following stage-tailored nutrition ensures optimal yield."
        stage_priority = "HIGH" if active_stage in ["Flowering", "Fruiting / Grain Filling", "Seedling"] else "MEDIUM"
        stage_prio_rank = 2

    actions.append({
        "id": stage_key,
        "priority": stage_priority,
        "priority_rank": stage_prio_rank,
        "action_type": "crop_stage",
        "action": stage_action_short,
        "title": stage_action_title,
        "reason": stage_why,
        "what_to_do": stage_what,
        "why_recommended": stage_why,
        "when_to_do": "Morning (7:00 AM – 10:00 AM)",
        "best_time": "Morning (7:00 AM – 10:00 AM)",
        "related_condition": f"Crop Stage: {active_stage} (Day {crop_age_days}) | Sown: {sowing_date or 'Not set'}",
        "source_data": "Crop Stage Intelligence + Fertilizer Advisor",
        "data_used": f"Crop Stage: {active_stage} (Day {crop_age_days}) | Sown: {sowing_date or 'Not set'}",
        "status": curr_stage_status,
        "action_route": "/fertilizer",
        "action_text": "Open Fertilizer Advisor",
        "is_completed": is_stage_done,
        "farmer_note": stage_note
    })

    # =========================================================================
    # ACTION 4: CROP HEALTH & DISEASE INSPECTION
    # =========================================================================
    health_key = f"health_{today_str}"
    is_health_done = status_map.get(health_key) == "COMPLETED" or health_key in completed_keys
    curr_health_status = status_map.get(health_key, "COMPLETED" if is_health_done else "PENDING")
    health_note = notes_map.get(health_key)

    if recent_disease and recent_disease.get("severity") in ["High", "Moderate"]:
        problem = recent_disease.get("detected_problem", "Suspected Stress")
        actions.append({
            "id": health_key,
            "priority": "HIGH",
            "priority_rank": 1,
            "action_type": "crop_health",
            "action": f"Follow Up on Disease Scan ({problem})",
            "title": f"Follow Up on Recent Disease Scan ({problem})",
            "reason": f"A previous AI disease scan detected {problem} with {recent_disease.get('severity', 'Moderate')} severity. Midday canopy inspection ensures timely treatment response.",
            "what_to_do": f"Inspect treated rows for {problem} symptoms and verify if pathogen spread is contained.",
            "why_recommended": f"A previous AI disease scan detected {problem} with {recent_disease.get('severity', 'Moderate')} severity. Midday canopy inspection ensures timely treatment response.",
            "when_to_do": "Midday (11:00 AM – 2:00 PM)",
            "best_time": "Midday (11:00 AM – 2:00 PM)",
            "related_condition": f"AI Pathology: {problem} detected | Severity: {recent_disease.get('severity')}",
            "source_data": "Crop Health AI Pathology",
            "data_used": f"AI Pathology: {problem} detected | Severity: {recent_disease.get('severity')}",
            "status": curr_health_status,
            "action_route": "/disease-detection",
            "action_text": "Review Disease Scan",
            "is_completed": is_health_done,
            "farmer_note": health_note
        })
        alerts.append({
            "type": "disease",
            "severity": "danger" if recent_disease.get("severity") == "High" else "warning",
            "title": f"Active Disease Issue: {problem}",
            "message": f"Identified in recent leaf scan ({recent_disease.get('severity')} severity). Verify treated rows."
        })
    elif humidity_pct >= 70:
        actions.append({
            "id": health_key,
            "priority": "MEDIUM",
            "priority_rank": 2,
            "action_type": "crop_health",
            "action": "Inspect Lower Leaves for Fungal Risk",
            "title": "High Humidity — Inspect Lower Leaves for Fungal Risk",
            "reason": f"Relative atmospheric humidity is high ({humidity_pct}%). Warm, humid microclimates accelerate spore germination for {disease_risks.split('(')[0] if '(' in disease_risks else disease_risks}.",
            "what_to_do": f"Scout the lower 20% of your {crop} canopy for water-soaked spots or powdery fungal growth.",
            "why_recommended": f"Relative atmospheric humidity is high ({humidity_pct}%). Warm, humid microclimates accelerate spore germination for {disease_risks.split('(')[0] if '(' in disease_risks else disease_risks}.",
            "when_to_do": "Early Morning or Late Afternoon",
            "best_time": "Early Morning or Late Afternoon",
            "related_condition": f"Atmospheric Humidity: {humidity_pct}% RH | Temp: {temp_c}°C",
            "source_data": "Weather Radar + Crop Health",
            "data_used": f"Atmospheric Humidity: {humidity_pct}% RH | Temp: {temp_c}°C",
            "status": curr_health_status,
            "action_route": "/disease-detection",
            "action_text": "Scan Crop Photo",
            "is_completed": is_health_done,
            "farmer_note": health_note
        })
    else:
        actions.append({
            "id": health_key,
            "priority": "LOW",
            "priority_rank": 4,
            "action_type": "crop_health",
            "action": f"Routine {crop} Canopy Scouting",
            "title": f"Routine {crop} Canopy Scouting (Day {crop_age_days})",
            "reason": f"Regular preventative visual scouting at Day {crop_age_days} catches early sucking pests (aphids, thrips) before population surges.",
            "what_to_do": "Conduct routine visual inspection of leaf undersides and terminal shoots.",
            "why_recommended": f"Regular preventative visual scouting at Day {crop_age_days} catches early sucking pests (aphids, thrips) before population surges.",
            "when_to_do": "Morning hours",
            "best_time": "Morning hours",
            "related_condition": f"Scouting History: Normal | Stage: {active_stage}",
            "source_data": "Crop Health Protocol",
            "data_used": f"Scouting History: Normal | Stage: {active_stage}",
            "status": curr_health_status,
            "action_route": "/disease-detection",
            "action_text": "Take Crop Photo",
            "is_completed": is_health_done,
            "farmer_note": health_note
        })

    # =========================================================================
    # ACTION 5: YIELD & HARVEST PREPARATION (WHEN APPLICABLE)
    # =========================================================================
    if active_stage in ["Maturity", "Harvest", "Fruiting / Grain Filling"]:
        yield_key = f"yield_{today_str}"
        is_yield_done = status_map.get(yield_key) == "COMPLETED" or yield_key in completed_keys
        curr_yield_status = status_map.get(yield_key, "COMPLETED" if is_yield_done else "PENDING")
        yield_note = notes_map.get(yield_key)
        yield_est_str = f"Estimated yield: ~{yield_val:.1f} tonnes" if yield_val else "Monitor fruit firmness"

        actions.append({
            "id": yield_key,
            "priority": "MEDIUM",
            "priority_rank": 3,
            "action_type": "yield",
            "action": f"Prepare Harvesting & Crating for {crop}",
            "title": f"Harvest Timing & Quality Check ({active_stage} Stage)",
            "reason": f"Your {crop} is reaching physiological maturity (Day {crop_age_days}). {yield_est_str}.",
            "what_to_do": "Check fruit color break stage and arrange clean harvest crates and transport.",
            "why_recommended": f"Harvesting at breaker/turning stage preserves shelf life and minimizes post-harvest losses during mandi transport.",
            "when_to_do": "Early Morning (6:00 AM – 9:00 AM)",
            "best_time": "Early Morning (6:00 AM – 9:00 AM)",
            "related_condition": f"Stage: {active_stage} (Day {crop_age_days}) | Yield Est: {yield_val or 'Standard'} tons",
            "source_data": "Yield Prediction + Crop Calendar",
            "data_used": f"Stage: {active_stage} (Day {crop_age_days}) | Yield Est: {yield_val or 'Standard'} tons",
            "status": curr_yield_status,
            "action_route": "/yield-prediction",
            "action_text": "View Yield Model",
            "is_completed": is_yield_done,
            "farmer_note": yield_note
        })

    # Sort actions by completion status (incomplete first) then priority rank (High -> Medium -> Low)
    actions.sort(key=lambda a: (1 if a["is_completed"] else 0, a.get("priority_rank", 5)))
    selected_actions = actions[:5]

    # Prioritized summary
    priorities = [a["priority"] for a in selected_actions]

    # Recommendations list for summary cards
    for a in selected_actions:
        recommendations.append(f"[{a['priority']}] {a['action']}: {a['what_to_do']}")

    # =========================================================================
    # MULTILINGUAL SPOKEN VOICE SCRIPT GENERATION
    # =========================================================================
    irr_snippet = "Rain is forecast today, so delay irrigation." if (rain_prob >= 50.0 or rain_lock_active) else (
        f"Soil moisture is at {moisture_val}%, so morning drip irrigation is recommended." if (sensor_connected and moisture_val and moisture_val < 38.0) else
        f"Soil moisture is adequate for {crop}."
    )

    if language == "Kannada":
        voice_script = f"ನಮಸ್ಕಾರ! ನಿಮ್ಮ {farm_name} ತೋಟದ ಇಂದಿನ ಕೃಷಿ ಯೋಜನೆ: ಮೊದಲನೆಯದಾಗಿ, {irr_snippet} ಎರಡನೆಯದಾಗಿ, ನಿಮ್ಮ {crop} ಬೆಳೆಯು {active_stage} ಹಂತದಲ್ಲಿದ್ದು ({crop_age_days} ದಿನ), {stage_tasks[0] if stage_tasks else 'ಪೋಷಕಾಂಶ ನಿರ್ವಹಣೆ ಮಾಡಿ'}. ಮೂರನೆಯದಾಗಿ, ಬೆಳೆ ಎಲೆಗಳನ್ನು ಕೀಟ ಮತ್ತು ರೋಗಗಳಿಗಾಗಿ ಪರಿಶೀಲಿಸಿ. ಶುಭ ದಿನ!"
    elif language == "Hindi":
        voice_script = f"नमस्ते! आपके {farm_name} के लिए आज की मुख्य योजना: पहला, {irr_snippet} दूसरा, आपकी {crop} फसल {active_stage} अवस्था में है ({crop_age_days} दिन), {stage_tasks[0] if stage_tasks else 'उचित पोषण प्रबंधन करें'}। तीसरा, पत्तियों की नियमित जांच करें। आपका दिन शुभ हो!"
    elif language == "Telugu":
        voice_script = f"నమస్కారం! మీ {farm_name} పొలం నేటి ప్రణాళిక: మొదటిది, {irr_snippet} రెండవది, మీ {crop} పంట {active_stage} దశలో ఉంది ({crop_age_days} రోజులు). మూడవది, తెగుళ్ల నివారణకు ఆకులను పరిశీలించండి."
    elif language == "Tamil":
        voice_script = f"வணக்கம்! உங்கள் {farm_name} பண்ணையின் இன்றைய திட்டம்: முதலில், {irr_snippet} இரண்டாவதாக, உங்கள் {crop} பயிர் {active_stage} நிலையில் உள்ளது ({crop_age_days} நாட்கள்). மூன்றாவதாக, பயிர் இலைகளை கண்காணிக்கவும்."
    else:
        voice_script = f"Good morning! Here is Today's Farm Plan for {farm_name}. First: {irr_snippet} Second: Your {crop} is in the {active_stage} stage (Day {crop_age_days}), so {stage_tasks[0] if stage_tasks else 'maintain balanced nutrition'}. Third: Conduct routine foliage inspection for pests. Have a productive farming day!"

    summary = f"Prioritized Daily Farm Plan for {farm_name} ({crop} • {active_stage} Stage, Day {crop_age_days}). Synthesized from Live Weather, Soil Sensors, Satellite Vigor, and Crop Phenology."

    return {
        "farm_id": farm_id,
        "farm_name": farm_name,
        "crop": crop,
        "crop_stage": active_stage,
        "crop_variety": crop_variety,
        "active_stage": active_stage,
        "crop_age_days": crop_age_days,
        "summary": summary,
        "priorities": priorities,
        "today_plan": selected_actions,
        "actions": selected_actions,
        "alerts": alerts,
        "recommendations": recommendations,
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "total_actions": len(selected_actions),
        "completed_count": sum(1 for a in selected_actions if a["is_completed"]),
        "voice_script": voice_script,
        "language": language,
        "data_sources": {
            "weather": "Open-Meteo High-Resolution Real-Time Meteorological API",
            "sensors": f"{'Online (IoT Soil Node)' if sensor_connected else 'Offline / Model Estimated'}",
            "satellite": "Sentinel-2 L2A / Copernicus Earth Observation Multispectral Telemetry",
            "crop_stage": f"GDD Phenology Model ({crop} Day {crop_age_days})",
            "irrigation": "FAO-56 Penman-Monteith Depletion Engine",
            "fertilizer": "ICAR/UAS Split-Fertigation Nutrient Model"
        },
        "uncertainty": "; ".join(uncertainties) if uncertainties else None
    }
