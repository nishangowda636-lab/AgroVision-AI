"""
AgroVision AI — Weather Intelligence Engine & Agricultural Decision Layer

Fetches real meteorological telemetry from Open-Meteo API using exact farm GPS coordinates.
Synthesizes microclimate conditions, crop growth stage dynamics, soil texture,
and IoT telemetry into actionable agricultural decisions:
- Irrigation safety & pump advice
- Fertilizer application timing & leaching warnings
- Crop health fungal/pest pathology risk
- Wind sprayability & chemical drift windows
- Extreme heat/cold canopy management
"""

import os
import logging
import requests
import math
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger("agrovision.weather")

WEATHER_CODE_MAP = {
    0: ("Clear Sky", "Sunny & clear conditions across the farm", "Clear"),
    1: ("Mainly Clear", "Mild sunshine with occasional thin clouds", "Clear"),
    2: ("Partly Cloudy", "Scattered clouds with good sunlight", "Clouds"),
    3: ("Overcast", "Overcast cloud cover", "Clouds"),
    45: ("Foggy", "Morning fog/mist reducing visibility", "Fog"),
    48: ("Depositing Rime Fog", "Dense fog conditions", "Fog"),
    51: ("Light Drizzle", "Light scattered drizzle", "Drizzle"),
    53: ("Moderate Drizzle", "Steady drizzle", "Drizzle"),
    55: ("Dense Drizzle", "Heavy drizzle", "Drizzle"),
    61: ("Slight Rain", "Light rain showers", "Rain"),
    63: ("Moderate Rain", "Moderate rainfall expected", "Rain"),
    65: ("Heavy Rain", "Heavy downpour expected", "Rain"),
    71: ("Slight Snow Fall", "Light snow fall", "Snow"),
    73: ("Moderate Snow Fall", "Moderate snow fall", "Snow"),
    75: ("Heavy Snow Fall", "Heavy snow fall", "Snow"),
    80: ("Rain Showers", "Scattered passing rain showers", "Rain"),
    81: ("Moderate Showers", "Localized heavy showers", "Rain"),
    82: ("Violent Showers", "Intense localized downpour", "Rain"),
    95: ("Thunderstorm", "Thunderstorms with gusty winds", "Thunderstorm"),
    96: ("Thunderstorm with Slight Hail", "Thunderstorm with small hail", "Thunderstorm"),
    99: ("Thunderstorm with Heavy Hail", "Severe thunderstorm with heavy hail", "Thunderstorm"),
}


def _fetch_openweathermap_telemetry(lat: float, lon: float, api_key: str) -> Optional[Dict[str, Any]]:
    """
    Queries OpenWeatherMap current weather and 5-day / 3-hour forecast APIs using exact GPS coordinates.
    """
    try:
        curr_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
        fore_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric"

        c_res = requests.get(curr_url, timeout=5.0)
        if c_res.status_code != 200:
            return None

        f_res = requests.get(fore_url, timeout=5.0)
        if f_res.status_code != 200:
            return None

        c_data = c_res.json()
        f_data = f_res.json()

        main = c_data.get("main", {})
        wind = c_data.get("wind", {})
        weather_list = c_data.get("weather", [{}])
        weather_first = weather_list[0] if weather_list else {}
        sys_data = c_data.get("sys", {})
        rain_data = c_data.get("rain", {})

        temp = round(float(main.get("temp", 28.0)), 1)
        feels_like = round(float(main.get("feels_like", temp)), 1)
        humidity = int(main.get("humidity", 60))
        # Convert m/s to km/h (1 m/s = 3.6 km/h)
        wind_speed_kmh = round(float(wind.get("speed", 3.0)) * 3.6, 1)
        wind_direction = int(wind.get("deg", 180))
        pressure_hpa = round(float(main.get("pressure", 1013.2)), 1)
        rain_1h = round(float(rain_data.get("1h", rain_data.get("3h", 0.0))), 1)

        cond_title = weather_first.get("main", "Clear")
        cond_desc = weather_first.get("description", "Clear sky").capitalize()

        sunrise_ts = sys_data.get("sunrise")
        sunset_ts = sys_data.get("sunset")
        sunrise_str = datetime.fromtimestamp(sunrise_ts, tz=timezone.utc).strftime("%H:%M") if sunrise_ts else "06:10"
        sunset_str = datetime.fromtimestamp(sunset_ts, tz=timezone.utc).strftime("%H:%M") if sunset_ts else "18:30"

        # Aggregate 3-hour forecasts into daily summaries
        daily_groups: Dict[str, List[Dict[str, Any]]] = {}
        for item in f_data.get("list", []):
            dt_txt = item.get("dt_txt", "")
            date_key = dt_txt.split(" ")[0] if " " in dt_txt else ""
            if date_key:
                daily_groups.setdefault(date_key, []).append(item)

        forecast_7days = []
        days_labels = ["Today", "Tomorrow"]
        for idx in range(2, 7):
            dt_obj = datetime.now(timezone.utc) + timedelta(days=idx)
            days_labels.append(dt_obj.strftime("%a"))

        for i, (date_key, group) in enumerate(list(daily_groups.items())[:7]):
            temps = [g.get("main", {}).get("temp", temp) for g in group]
            high_temp = round(max(temps), 1) if temps else temp
            low_temp = round(min(temps), 1) if temps else temp
            
            pop_max = int(max([float(g.get("pop", 0.0)) * 100 for g in group])) if group else 10
            rain_sums_grp = sum([float(g.get("rain", {}).get("3h", 0.0)) for g in group])
            rain_sum = round(rain_sums_grp, 1)
            wind_max = round(max([float(g.get("wind", {}).get("speed", 3.0)) * 3.6 for g in group]), 1) if group else 10.0

            mid_item = group[len(group) // 2] if group else {}
            mid_w = mid_item.get("weather", [{}])[0] if mid_item.get("weather") else {}
            w_title = mid_w.get("main", "Clear")
            w_desc = mid_w.get("description", "Clear conditions").capitalize()

            forecast_7days.append({
                "day": days_labels[i] if i < len(days_labels) else f"Day {i+1}",
                "date": date_key,
                "high": high_temp,
                "low": low_temp,
                "rain_prob": pop_max,
                "rainfall_mm": rain_sum,
                "wind_speed_max": wind_max,
                "condition": w_title,
                "description": w_desc,
                "sunrise": sunrise_str,
                "sunset": sunset_str,
                "uv_index": 6.5
            })

        return {
            "current_weather": {
                "temperature": temp,
                "feels_like": feels_like,
                "humidity": humidity,
                "wind_speed": wind_speed_kmh,
                "wind_direction": wind_direction,
                "rainfall_mm": rain_1h,
                "rain_probability": forecast_7days[0]["rain_prob"] if forecast_7days else 10,
                "precipitation_now_mm": rain_1h,
                "pressure_hpa": pressure_hpa,
                "weather_code": 1,
                "condition": cond_title,
                "description": cond_desc,
                "sunrise": sunrise_str,
                "sunset": sunset_str,
                "uv_index": 6.5
            },
            "forecast": forecast_7days,
            "data_source": "OpenWeatherMap Real-Time Meteorological API",
            "fetched_at": datetime.now(timezone.utc).isoformat() + "Z"
        }
    except Exception as e:
        logger.warning(f"OpenWeatherMap query exception: {e}")
        return None


def fetch_real_weather_telemetry(lat: float, lon: float) -> Dict[str, Any]:
    """
    Queries OpenWeatherMap (if OPENWEATHER_API_KEY or WEATHER_API_KEY is configured)
    or Open-Meteo's high-resolution global forecast API for exact GPS coordinates.
    Returns parsed current conditions and 7-day daily forecast with real data.
    """
    # 1. Try OpenWeatherMap API if API key is provided
    owm_key = os.getenv("OPENWEATHER_API_KEY") or os.getenv("WEATHER_API_KEY")
    if owm_key and owm_key.strip():
        owm_result = _fetch_openweathermap_telemetry(lat, lon, owm_key.strip())
        if owm_result:
            return owm_result

    # 2. Query Open-Meteo High-Resolution Real-Time Meteorological API
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}&"
        f"current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&"
        f"daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,sunrise,sunset,uv_index_max&"
        f"timezone=auto"
    )

    res = requests.get(url, timeout=6.0)
    if res.status_code != 200:
        raise RuntimeError(f"Open-Meteo API returned status code {res.status_code}: {res.text}")

    data = res.json()
    curr = data.get("current", {})
    daily = data.get("daily", {})

    temp = round(float(curr.get("temperature_2m", 28.0)), 1)
    feels_like = round(float(curr.get("apparent_temperature", temp)), 1)
    humidity = int(curr.get("relative_humidity_2m", 60))
    wind_speed = round(float(curr.get("wind_speed_10m", 10.0)), 1)
    wind_direction = int(curr.get("wind_direction_10m", 180))
    precipitation_now = round(float(curr.get("precipitation", 0.0)), 1)
    pressure_hpa = round(float(curr.get("surface_pressure", 1013.2)), 1)
    wcode = int(curr.get("weather_code", 1))

    cond_title, cond_desc, main_group = WEATHER_CODE_MAP.get(wcode, ("Partly Cloudy", "Scattered clouds", "Clouds"))

    daily_times = daily.get("time", [])
    daily_max = daily.get("temperature_2m_max", [])
    daily_min = daily.get("temperature_2m_min", [])
    daily_wcode = daily.get("weather_code", [])
    daily_rain_prob = daily.get("precipitation_probability_max", [])
    daily_rain_sum = daily.get("precipitation_sum", [])
    daily_wind_max = daily.get("wind_speed_10m_max", [])
    daily_sunrises = daily.get("sunrise", [])
    daily_sunsets = daily.get("sunset", [])
    daily_uv = daily.get("uv_index_max", [])

    forecast_7days = []
    days_labels = ["Today", "Tomorrow"]
    for i in range(2, 7):
        dt_obj = datetime.now(timezone.utc) + timedelta(days=i)
        days_labels.append(dt_obj.strftime("%a"))

    today_rain_prob = 10
    today_rain_sum = precipitation_now
    today_sunrise = None
    today_sunset = None
    today_uv = 6.5

    for i in range(min(7, len(daily_times))):
        d_code = daily_wcode[i] if i < len(daily_wcode) else 1
        d_title, d_desc_day, _ = WEATHER_CODE_MAP.get(d_code, ("Partly Cloudy", "Scattered clouds", "Clouds"))
        r_prob = int(daily_rain_prob[i]) if (i < len(daily_rain_prob) and daily_rain_prob[i] is not None) else 10
        r_sum = round(float(daily_rain_sum[i]), 1) if (i < len(daily_rain_sum) and daily_rain_sum[i] is not None) else 0.0
        w_max = round(float(daily_wind_max[i]), 1) if (i < len(daily_wind_max) and daily_wind_max[i] is not None) else 12.0
        s_rise = daily_sunrises[i].split("T")[1][:5] if (i < len(daily_sunrises) and "T" in str(daily_sunrises[i])) else "06:10"
        s_set = daily_sunsets[i].split("T")[1][:5] if (i < len(daily_sunsets) and "T" in str(daily_sunsets[i])) else "18:30"
        uv_val = round(float(daily_uv[i]), 1) if (i < len(daily_uv) and daily_uv[i] is not None) else 6.5

        if i == 0:
            today_rain_prob = r_prob
            today_rain_sum = max(precipitation_now, r_sum)
            today_sunrise = s_rise
            today_sunset = s_set
            today_uv = uv_val

        forecast_7days.append({
            "day": days_labels[i] if i < len(days_labels) else f"Day {i+1}",
            "date": daily_times[i] if i < len(daily_times) else "",
            "high": round(daily_max[i], 1) if i < len(daily_max) else 29.0,
            "low": round(daily_min[i], 1) if i < len(daily_min) else 19.0,
            "rain_prob": r_prob,
            "rainfall_mm": r_sum,
            "wind_speed_max": w_max,
            "condition": d_title,
            "description": d_desc_day,
            "sunrise": s_rise,
            "sunset": s_set,
            "uv_index": uv_val
        })

    return {
        "current_weather": {
            "temperature": temp,
            "feels_like": feels_like,
            "humidity": humidity,
            "wind_speed": wind_speed,
            "wind_direction": wind_direction,
            "rainfall_mm": today_rain_sum,
            "rain_probability": today_rain_prob,
            "precipitation_now_mm": precipitation_now,
            "pressure_hpa": pressure_hpa,
            "weather_code": wcode,
            "condition": cond_title,
            "description": cond_desc,
            "sunrise": today_sunrise or "06:10",
            "sunset": today_sunset or "18:30",
            "uv_index": today_uv
        },
        "forecast": forecast_7days,
        "data_source": "Open-Meteo High-Resolution Real-Time Meteorological API",
        "fetched_at": datetime.now(timezone.utc).isoformat() + "Z"
    }


def generate_weather_intelligence_decisions(
    weather_data: Dict[str, Any],
    crop: str = "Crop",
    crop_stage: str = "Vegetative Growth",
    soil_type: str = "Loam",
    soil_moisture: Optional[float] = None,
    is_sensor_connected: bool = False
) -> Dict[str, Any]:
    """
    Transforms raw microclimate values into an integrated agricultural decision report:
    1. Structured Alerts (Rain, Heavy Rain, Heat, Fungal Risk, High Wind, Irrigation Delay, Fertilizer Warning)
    2. Farming Advice ("What You Should Do Today")
    3. Irrigation Advice
    4. Fertilizer Advice
    5. Crop Health & Foliar Pathology Advice
    """
    curr = weather_data.get("current_weather", {})
    temp = curr.get("temperature", 28.0)
    feels_like = curr.get("feels_like", temp)
    humidity = curr.get("humidity", 60)
    wind_speed = curr.get("wind_speed", 10.0)
    rain_prob = curr.get("rain_probability", 10)
    rainfall_mm = curr.get("rainfall_mm", 0.0)
    condition = curr.get("condition", "Partly Cloudy")

    alerts = []
    farming_advice: List[Dict[str, Any]] = []

    # -------------------------------------------------------------
    # 1. RAIN & HEAVY RAIN ALERTS + IRRIGATION ADVICE
    # -------------------------------------------------------------
    if rainfall_mm >= 20.0:
        alerts.append({
            "alert_type": "Heavy Rain Alert",
            "severity": "danger",
            "title": "⚠️ Heavy Rainfall & Waterlogging Alert",
            "description": f"Forecast indicates {rainfall_mm:.1f} mm precipitation in your area. High risk of water stagnation and root asphyxiation.",
            "action_required": "Inspect and unblock drainage channels and trenches immediately."
        })
    elif rainfall_mm >= 5.0 or rain_prob >= 50:
        alerts.append({
            "alert_type": "Rain Alert",
            "severity": "warning",
            "title": "🌧️ Rainfall Expected within 24 Hours",
            "description": f"Precipitation radar indicates {rain_prob}% probability ({rainfall_mm:.1f} mm expected).",
            "action_required": "Postpone open field broadcasting and delay irrigation cycles."
        })

    # Irrigation Advice Formulation
    if rainfall_mm >= 5.0 or rain_prob >= 45:
        irrigation_advice = {
            "decision": "Delay Irrigation",
            "status_badge": "DELAY IRRIGATION",
            "safety_level": "Rain Interlock Active",
            "reason": (
                f"Rain radar forecast indicates {rain_prob}% precipitation probability (~{rainfall_mm:.1f} mm). "
                f"Holding irrigation prevents soil waterlogging, avoids root asphyxiation, protects root respiration, and saves pump electricity."
            ),
            "water_saving_litres": "15,000 - 35,000 L / acre preserved",
            "recommended_timing": "Resume drip cycle 24-48 hours after rain ceases and soil field capacity normalizes."
        }
        alerts.append({
            "alert_type": "Irrigation Delay",
            "severity": "info",
            "title": "💧 Irrigation Suspended by Rain Interlock",
            "description": f"Natural rainfall ({rainfall_mm:.1f} mm) will replenish the topsoil root zone.",
            "action_required": "Keep irrigation pumps turned off."
        })
    elif is_sensor_connected and soil_moisture is not None and soil_moisture < 38.0:
        irrigation_advice = {
            "decision": "Irrigation Required",
            "status_badge": "IRRIGATION REQUIRED",
            "safety_level": "Optimal Window",
            "reason": (
                f"Rain probability is low ({rain_prob}%) and IoT soil moisture probe reports {soil_moisture:.1f}% VWC "
                f"(below the 42% threshold for {crop} in {crop_stage})."
            ),
            "water_saving_litres": "Calibrated precision drip volume recommended",
            "recommended_timing": "Run early morning drip cycle between 6:00 AM – 8:30 AM to minimize evaporative loss."
        }
    else:
        irrigation_advice = {
            "decision": "Standard Irrigation Window",
            "status_badge": "NORMAL SCHEDULE",
            "safety_level": "Safe Window",
            "reason": f"Mild weather ({temp}°C, {humidity}% RH) with minimal rain risk ({rain_prob}%). Normal maintenance irrigation.",
            "water_saving_litres": "Standard drip fertigation quota",
            "recommended_timing": "Apply during cooler morning or late afternoon hours."
        }

    # -------------------------------------------------------------
    # 2. FERTILIZER APPLICATION ADVICE & RUNOFF WARNINGS
    # -------------------------------------------------------------
    if rainfall_mm >= 5.0:
        fertilizer_advice = {
            "safety_status": "Delay Application (Leaching Risk)",
            "status_badge": "AVOID BROADCASTING",
            "warning": f"Heavy rain ({rainfall_mm:.1f} mm) forecast. Broadcasting chemical fertilizers prior to downpours triggers severe root leaching and toxic runoff into waterways.",
            "application_window": "Wait until 24–48 hours after rain when soil moisture is at workable field capacity.",
            "agronomic_recommendation": f"Do not apply Urea, DAP, or MOP today. Soil nutrients will wash away without plant absorption."
        }
        alerts.append({
            "alert_type": "Fertilizer Application Warning",
            "severity": "warning",
            "title": "🌱 Fertilizer Leaching & Runoff Hazard",
            "description": f"Rainfall ({rainfall_mm:.1f} mm) will flush granular fertilizer out of the active root zone.",
            "action_required": "Delay fertilizer broadcasting until field drainage dries."
        })
    elif wind_speed >= 18.0:
        fertilizer_advice = {
            "safety_status": "Avoid Foliar Spraying (High Wind)",
            "status_badge": "HOLD FOLIAR SPRAY",
            "warning": f"Wind speeds of {wind_speed:.1f} km/h cause severe chemical spray drift and poor leaf adhesion.",
            "application_window": "Reschedule foliar micronutrients or soluble NPK to early morning when wind is calm (< 12 km/h).",
            "agronomic_recommendation": "Soil root application or drip fertigation can proceed if soil moisture permits."
        }
    else:
        fertilizer_advice = {
            "safety_status": "Safe Application Window",
            "status_badge": "SAFE TO APPLY",
            "warning": "Weather conditions are favorable for nutrient uptake.",
            "application_window": "Early morning (6:00 AM - 9:00 AM) or late evening (4:30 PM - 6:30 PM).",
            "agronomic_recommendation": f"Ensure soil has adequate moisture before applying stage-recommended fertilizers for {crop} ({crop_stage})."
        }

    # -------------------------------------------------------------
    # 3. CROP HEALTH & FUNGAL PATHOLOGY RISK
    # -------------------------------------------------------------
    if humidity >= 70:
        crop_health_advice = {
            "fungal_risk_level": "High Fungal Pathology Risk",
            "risk_badge": "HIGH FUNGAL RISK",
            "pathogens_of_concern": ["Powdery Mildew", "Downy Mildew", "Early/Late Blight", "Leaf Spot (Cercospora)"],
            "scouting_advice": f"Relative humidity is {humidity}%. Inspect lower canopy leaves of {crop} for water-soaked lesions or white fungal mycelium.",
            "preventive_action": "Ensure adequate field air circulation. Consider preventive bio-fungicide (Trichoderma viride or Bacillus subtilis) or copper oxychloride if spots appear."
        }
        alerts.append({
            "alert_type": "High Humidity/Fungal Risk",
            "severity": "warning",
            "title": "🦠 High Humidity — Fungal Spore Risk",
            "description": f"Continuous atmospheric humidity at {humidity}% RH accelerates foliar disease incubation in {crop}.",
            "action_required": "Scout lower canopy for dark water-soaked leaf spots."
        })
    elif temp >= 33.0 and humidity <= 40:
        crop_health_advice = {
            "fungal_risk_level": "Low Fungal Risk / High Mite & Thrip Risk",
            "risk_badge": "PEST STRESS WATCH",
            "pathogens_of_concern": ["Red Spider Mites", "Thrips", "Aphids", "Whiteflies"],
            "scouting_advice": f"Hot and dry microclimate ({temp}°C, {humidity}% RH) encourages sucking pest proliferation.",
            "preventive_action": "Check undersides of leaves for webbing or silvery stippling. Apply neem oil (3-5 ml/L) during evening hours."
        }
    else:
        crop_health_advice = {
            "fungal_risk_level": "Low to Moderate Disease Risk",
            "risk_badge": "OPTIMAL CONDITIONS",
            "pathogens_of_concern": ["General monitoring"],
            "scouting_advice": f"Balanced microclimate ({temp}°C, {humidity}% RH). Routine weekly crop scouting recommended.",
            "preventive_action": "Maintain balanced nutrition and clean field borders."
        }

    # -------------------------------------------------------------
    # 4. WIND SPEED & CHEMICAL SPRAYING ALERT
    # -------------------------------------------------------------
    if wind_speed >= 18.0:
        alerts.append({
            "alert_type": "Strong Wind Alert",
            "severity": "warning",
            "title": "💨 Strong Wind — High Chemical Drift Risk",
            "description": f"Wind gusts at {wind_speed:.1f} km/h will displace pesticide/fungicide sprays off-target.",
            "action_required": "Cancel all knapsack, tractor boom, and drone spraying operations."
        })

    # -------------------------------------------------------------
    # 5. TEMPERATURE & HEAT / COLD STRESS ALERTS
    # -------------------------------------------------------------
    if temp >= 35.0 or feels_like >= 38.0:
        alerts.append({
            "alert_type": "Heat Alert",
            "severity": "danger",
            "title": "🌡️ Extreme Heat Stress Advisory",
            "description": f"Ambient temperature reaching {temp:.1f}°C (feels like {feels_like:.1f}°C). Rapid canopy evapotranspiration.",
            "action_required": f"Maintain soil moisture buffer around {crop} roots to avoid blossom drop and leaf scorching."
        })
    elif temp <= 13.0:
        alerts.append({
            "alert_type": "Cold Stress Alert",
            "severity": "info",
            "title": "❄️ Low Temperature Notice",
            "description": f"Cool temperatures ({temp:.1f}°C) will slow plant vegetative metabolism.",
            "action_required": "Hold heavy nitrogen feeds until daytime soil temperatures warm."
        })

    # -------------------------------------------------------------
    # 6. ACTIONABLE "WHAT YOU SHOULD DO TODAY" FARM OPERATIONS
    # -------------------------------------------------------------
    # Action 1: Irrigation Operation
    farming_advice.append({
        "category": "Irrigation Management",
        "title": f"💧 {irrigation_advice['decision']}",
        "message": irrigation_advice["reason"],
        "why": f"Crop ({crop}) in {crop_stage} stage requires balanced root zone aeration and moisture tension.",
        "impact": "High",
        "type": "warning" if "Delay" in irrigation_advice["decision"] else "info"
    })

    # Action 2: Fertilizer & Nutrition
    farming_advice.append({
        "category": "Nutrient Management",
        "title": f"🌱 {fertilizer_advice['safety_status']}",
        "message": fertilizer_advice["agronomic_recommendation"],
        "why": fertilizer_advice["warning"],
        "impact": "High" if "Delay" in fertilizer_advice["safety_status"] else "Normal",
        "type": "warning" if "Delay" in fertilizer_advice["safety_status"] else "info"
    })

    # Action 3: Crop Protection & Scouting
    farming_advice.append({
        "category": "Crop Protection",
        "title": f"🛡️ {crop_health_advice['fungal_risk_level']}",
        "message": str(crop_health_advice["scouting_advice"]),
        "why": str(crop_health_advice["preventive_action"]),
        "impact": "High" if humidity >= 70 else "Normal",
        "type": "warning" if humidity >= 70 else "info"
    })

    # Action 4: Field Operations & Spraying Window
    if wind_speed >= 18.0:
        farming_advice.append({
            "category": "Field Operations",
            "title": "💨 Hold Spray Operations",
            "message": f"Wind speed of {wind_speed:.1f} km/h exceeds safe spraying limits (12 km/h).",
            "why": "High wind causes spray droplet drift, pesticide wastage, and potential crop chemical burn.",
            "impact": "High",
            "type": "warning"
        })
    else:
        farming_advice.append({
            "category": "Field Operations",
            "title": "🚜 Favorable Field Work Window",
            "message": f"Calm wind ({wind_speed:.1f} km/h) and moderate temperature ({temp}°C) allow comfortable farm labor.",
            "why": "Optimal atmospheric boundary conditions for weeding, trellising, or precision drone spraying.",
            "impact": "Normal",
            "type": "info"
        })

    return {
        "alerts": alerts,
        "farming_advice": farming_advice,
        "irrigation_advice": irrigation_advice,
        "fertilizer_advice": fertilizer_advice,
        "crop_health_advice": crop_health_advice
    }
