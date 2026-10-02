"""
AgroVision AI — Central Farm Decision Engine (FarmDecisionEngine)
The intelligent brain connecting Location + Region + Crop + Age + Soil + Weather + Rain + Sensors + Disease + Market.
Generates daily prioritized, actionable farm tasks and multilingual speech scripts.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

def generate_central_farm_decisions(
    farm_details: Dict[str, Any],
    language: str = "English"
) -> Dict[str, Any]:
    """
    Synthesizes all farm parameters into a prioritized action plan.
    """
    farm_id = farm_details.get("id", 1)
    farm_name = farm_details.get("name", "My Farm")
    location = farm_details.get("location", "Karnataka")
    crop = farm_details.get("crop", "Tomato")
    crop_age = farm_details.get("crop_age_days", 45)
    soil_ph = farm_details.get("soil_ph", 6.5)
    moisture = farm_details.get("moisture", 42.0)
    rain_prob = farm_details.get("rain_prob", 15.0)
    pump_status = farm_details.get("pump_status", "OFF")
    pump_mode = farm_details.get("pump_mode", "AUTO")
    rain_lock = farm_details.get("rain_lock", False) or rain_prob > 60.0
    disease_count = farm_details.get("disease_count", 0)
    market_price = farm_details.get("market_price", 32.0)
    price_trend = farm_details.get("price_trend", "Increasing")
    temp_c = farm_details.get("temp_c", 27.5)

    actions = []

    # Priority 1: Rain & Smart Borewell Decision
    if rain_lock or rain_prob >= 60.0:
        actions.append({
            "id": "action-rain-lock",
            "priority": 1,
            "type": "irrigation",
            "title": "🌧️ Heavy Rain Expected — Borewell Lock Active",
            "summary": f"Rain probability is {int(rain_prob)}%. Borewell irrigation automatically withheld.",
            "why": f"Forecasting imminent rainfall. Holding irrigation prevents nutrient leaching, root asphyxiation, and saves ~1,250 Liters of water.",
            "action_text": "View Borewell Controller",
            "action_route": "/irrigation",
            "icon": "CloudRain",
            "severity": "warning"
        })
    elif moisture < 38.0:
        actions.append({
            "id": "action-irrigate-now",
            "priority": 1,
            "type": "irrigation",
            "title": f"💧 Soil Moisture Low ({moisture}%) — Morning Irrigation Due",
            "summary": "Run precision drip for 35 minutes before 8:30 AM.",
            "why": f"Root zone soil moisture is below the {crop} threshold (40%). Temperature will reach {temp_c}°C today.",
            "action_text": "Start Drip Irrigation",
            "action_route": "/irrigation",
            "icon": "Droplets",
            "severity": "urgent"
        })
    else:
        actions.append({
            "id": "action-moisture-good",
            "priority": 1,
            "type": "irrigation",
            "title": f"✅ Soil Moisture Optimal ({moisture}%)",
            "summary": f"Borewell is {pump_status} ({pump_mode} mode). No immediate watering required.",
            "why": f"Moisture is well within the healthy buffer range for {crop}.",
            "action_text": "Check Sensor Telemetry",
            "action_route": "/irrigation",
            "icon": "CheckCircle2",
            "severity": "normal"
        })

    # Priority 2: Crop Health & Disease Scouting
    if disease_count > 0:
        actions.append({
            "id": "action-disease-active",
            "priority": 2,
            "type": "disease",
            "title": "🔬 Follow-up Crop Health Scan Recommended",
            "summary": f"{disease_count} active scan(s) logged. Verify if treatment is controlling symptoms.",
            "why": "Continuous visual scouting prevents secondary fungal spore sporulation across healthy rows.",
            "action_text": "Scan Foliage Photo",
            "action_route": "/crop-health",
            "icon": "AlertTriangle",
            "severity": "warning"
        })
    else:
        actions.append({
            "id": "action-disease-routine",
            "priority": 2,
            "type": "disease",
            "title": f"📸 Routine {crop} Canopy Inspection (Day {crop_age})",
            "summary": "Midday leaf & shoot scouting for early sucking pests or spots.",
            "why": f"At {crop_age} days, proactive inspection stops whiteflies, leaf miners, and blight before canopy closure.",
            "action_text": "Upload Crop Photo",
            "action_route": "/crop-health",
            "icon": "Heart",
            "severity": "normal"
        })

    # Priority 3: Growth Stage & Nutrition
    if crop_age < 25:
        stage_title = f"🌱 Seedling Establishment for {crop}"
        stage_desc = "Maintain light topsoil moisture and apply Trichoderma drenching to protect young rootlets."
        stage_why = f"Your {crop} is {crop_age} days old (Nursery phase). Avoid heavy chemical fertilizer."
    elif crop_age < 55:
        stage_title = f"🌿 Vegetative Split Fertigation for {crop}"
        stage_desc = "Apply split dose of Bio-NPK and ensure stake support for vigorous lateral branching."
        stage_why = f"Crop is {crop_age} days old (Vegetative growth). Nitrogen and Potassium support canopy expansion."
    elif crop_age < 85:
        stage_title = f"🌸 Flowering & Fruit Set Nutrition for {crop}"
        stage_desc = "Apply Boron + Calcium spray to prevent blossom drop and blossom-end rot."
        stage_why = f"Your {crop} is {crop_age} days old (Flowering/Fruiting). Maintain consistent moisture."
    else:
        stage_title = f"🧺 Harvesting & Grading Window for {crop}"
        stage_desc = "Pick mature firm fruits in early morning and crate immediately for mandi transport."
        stage_why = f"Your {crop} is {crop_age} days old. Peak commercial harvesting window active."

    actions.append({
        "id": "action-stage-nutrition",
        "priority": 3,
        "type": "calendar",
        "title": stage_title,
        "summary": stage_desc,
        "why": stage_why,
        "action_text": "Open Crop Calendar",
        "action_route": "/crop-calendar",
        "icon": "Calendar",
        "severity": "normal"
    })

    # Priority 4: Market Price Intelligence
    if "increas" in price_trend.lower() or market_price >= 30.0:
        actions.append({
            "id": "action-market-surge",
            "priority": 4,
            "type": "market",
            "title": f"📈 {crop} APMC Mandi Rate Up at ₹{market_price}/kg",
            "summary": "Regional buyer demand is high with upward price momentum.",
            "why": f"Latest APMC mandi trends show a favorable trade window. If you have harvested crop, book transport.",
            "action_text": "Check Mandi Rates",
            "action_route": "/market-prices",
            "icon": "TrendingUp",
            "severity": "opportunity"
        })
    else:
        actions.append({
            "id": "action-market-steady",
            "priority": 4,
            "type": "market",
            "title": f"📊 {crop} Market Rate Stable at ₹{market_price}/kg",
            "summary": "Steady daily arrivals across district APMC mandis.",
            "why": "Track 7-day price moving averages before scheduling large harvesting pickings.",
            "action_text": "View Price Trends",
            "action_route": "/market-prices",
            "icon": "DollarSign",
            "severity": "normal"
        })

    # Priority 5: Crop Stage & Farm Ledger
    actions.append({
        "id": "action-crop-calendar",
        "priority": 5,
        "type": "calendar",
        "title": f"🗓️ {crop} Stage Care & Farm Ledger Records",
        "summary": f"Day {crop_age} milestone checklist and operational expense logging.",
        "why": "Track timely fertilization schedules and maintain accurate ledger bookkeeping.",
        "action_text": "View Crop Calendar",
        "action_route": "/crop-calendar",
        "icon": "Calendar",
        "severity": "normal"
    })

    # Multilingual Voice Script Generation
    if language == "Kannada":
        voice_script = f"ನಮಸ್ಕಾರ! ನಿಮ್ಮ {farm_name} ತೋಟದ ಇಂದಿನ ಕೃಷಿ ವರದಿ: {'ಮಳೆ ಬರುವ ಸಾಧ್ಯತೆ ಇರುವುದರಿಂದ ಬೋರ್‌ವೆಲ್ ನೀರಾವರಿ ಮಾಡಬೇಡಿ.' if (rain_lock or rain_prob >= 60.0) else f'ಮಣ್ಣಿನ ತೇವಾಂಶ {moisture}% ಇದ್ದು, ಬೆಳಿಗ್ಗೆ ಹನಿ ನೀರಾವರಿ ಸೂಕ್ತ.'} ನಿಮ್ಮ {crop} ಬೆಳೆಯು {crop_age} ದಿನದ್ದಾಗಿದ್ದು, ಎಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ. ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ {crop} ಬೆಲೆ ₹{market_price} ಆಗಿದ್ದು ವ್ಯಾಪಾರ ಉತ್ತಮವಾಗಿದೆ."
    elif language == "Hindi":
        voice_script = f"नमस्ते! आपके {farm_name} के लिए आज की मुख्य सलाह: {'बारिश की संभावना के कारण बोरवेल सिंचाई न करें।' if (rain_lock or rain_prob >= 60.0) else f'मिट्टी की नमी {moisture}% है, सुबह ड्रिप सिंचाई करें।'} आपकी {crop} फसल {crop_age} दिन की है। मंडी में {crop} का भाव ₹{market_price} प्रति किलो है।"
    elif language == "Telugu":
        voice_script = f"నమస్కారం! మీ {farm_name} పొలం నేటి నివేదిక: {'వర్షం పడే అవకాశం ఉన్నందున బోరుబావి నీటిపారుదల వాయిదా వేయండి.' if (rain_lock or rain_prob >= 60.0) else f'నేలలో తేమ {moisture}% ఉంది, డ్రిప్ ద్వారా నీరందించండి.'} మీ {crop} పంట {crop_age} రోజులది. మార్కెట్లో ధర ₹{market_price} గా ఉంది."
    elif language == "Tamil":
        voice_script = f"வணக்கம்! உங்கள் {farm_name} பண்ணையின் இன்றைய வழிகாட்டல்: {'மழை வாய்ப்பு உள்ளதால் போர்வெல் பாசனத்தை தவிர்க்கவும்.' if (rain_lock or rain_prob >= 60.0) else f'மண்ணின் ஈரப்பதம் {moisture}% ஆக உள்ளது.'} பயிர் வயது {crop_age} நாட்கள். சந்தையில் {crop} விலை ₹{market_price} ஆக உள்ளது."
    else:
        voice_script = f"Good morning! Here is Today's Farm Intelligence for {farm_name}. {'Rain is expected today, so borewell irrigation is safely held.' if (rain_lock or rain_prob >= 60.0) else f'Soil moisture is at {moisture}%, so morning drip irrigation is recommended.'} Your {crop} is {crop_age} days old. Market price is strong at ₹{market_price} per kg. Have a great farming day!"

    return {
        "farm_id": farm_id,
        "farm_name": farm_name,
        "crop": crop,
        "location": location,
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "actions": actions[:5],
        "voice_script": voice_script
    }
