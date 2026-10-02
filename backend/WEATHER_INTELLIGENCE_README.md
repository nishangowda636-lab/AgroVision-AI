# AgroVision AI — Real Weather Intelligence & Agricultural Decision Engine

## 1. Overview
The **AgroVision AI Weather Intelligence System** transforms real-time meteorological satellite telemetry from the Open-Meteo High-Resolution API into actionable farming decisions. It correlates microclimate parameters (temperature, humidity, rainfall, rain probability, wind velocity, UV index, and sunrise/sunset) with the farmer's crop variety, phenological growth stage, soil texture, and IoT sensor telemetry.

---

## 2. Telemetry & Data Sources

### 2.1 Live Data Provider
- **Provider**: Open-Meteo High-Resolution Global Forecast Model (Real GPS telemetry).
- **Update Frequency**: Real-time on demand with offline local cache synchronization.
- **Location Resolution**: Exact latitude and longitude configured in **Farm Setup** or acquired via device GPS.

### 2.2 Parameters Fetched
1. **Current Microclimate**:
   - Temperature (°C) & Apparent / Feels Like Temperature (°C)
   - Relative Humidity (% RH)
   - Wind Velocity (km/h) & Wind Direction (0–360°)
   - Precipitation Rate (mm) & Cumulative Daily Rainfall (mm)
   - Rain Probability (% chance within 24h)
   - Surface Atmospheric Pressure (hPa)
   - Sunrise & Sunset Times (Local Standard Time)
   - UV Solar Radiation Index
2. **7-Day Agricultural Outlook**:
   - Daily High / Low Temperatures (°C)
   - Maximum Precipitation Probability (%)
   - Expected Rainfall Volume (mm)
   - Peak Wind Gusts (km/h)
   - Phenological Weather Condition

---

## 3. Agricultural Decision Logic & Weather Interlocks

| Hazard / Parameter | Threshold / Condition | Agricultural Intelligence Decision | Target Feature Interlock |
|---|---|---|---|
| **Rain Forecast** | Rain prob $\ge 45\%$ or Rain $\ge 2.0\text{ mm}$ | **`DELAY IRRIGATION`**: Hold pump cycles to prevent root waterlogging, root asphyxiation, and power waste. | [Smart Irrigation](file:///e:/AGRO-VISION%20AI/AgroVision-AI%20new/backend/app/routers/smart_irrigation.py) |
| **Heavy Rainfall** | Rainfall $\ge 20.0\text{ mm}$ | **`HEAVY RAIN ALERT`**: Inspect and clear farm drainage furrows to prevent root rot and ponding. | [Farm Plan / Alerts](file:///e:/AGRO-VISION%20AI/AgroVision-AI%20new/backend/app/routers/farms.py) |
| **Fertilizer Runoff** | Rainfall $\ge 5.0\text{ mm}$ | **`AVOID BROADCASTING`**: Delay chemical fertilizer broadcasting to prevent chemical leaching into subsoil and waterways. | [Fertilizer Advisor](file:///e:/AGRO-VISION%20AI/AgroVision-AI%20new/backend/app/routers/fertilizer_recommendation.py) |
| **High Humidity / Fungal** | Humidity $\ge 70\%\text{ RH}$ | **`HIGH FUNGAL RISK`**: Scout lower canopy for powdery mildew, early/late blight, and leaf spots. | [Crop Health](file:///e:/AGRO-VISION%20AI/AgroVision-AI%20new/backend/app/routers/disease.py) |
| **Thermal Heat Stress** | Temp $\ge 35^\circ\text{C}$ or Feels Like $\ge 38^\circ\text{C}$ | **`HEATWAVE ALERT`**: Maintain soil moisture buffer and protect flowering/fruit set from blossom drop. | [Crop Calendar](file:///e:/AGRO-VISION%20AI/AgroVision-AI%20new/backend/app/routers/calendar.py) |
| **Strong Wind / Spray Drift** | Wind $\ge 18.0\text{ km/h}$ | **`HOLD FOLIAR SPRAY`**: High drift risk; cancel all tractor boom, knapsack, and drone spraying operations. | [Farm Operations](file:///e:/AGRO-VISION%20AI/AgroVision-AI%20new/backend/app/routers/weather.py) |
| **Safe Operating Window** | Wind $< 15\text{ km/h}$, Rain $< 2\text{ mm}$ | **`OPTIMAL SPRAY & FIELD WINDOW`**: Safe for pesticide application, fertigation, and field labor. | [AI Assistant](file:///e:/AGRO-VISION%20AI/AgroVision-AI%20new/backend/app/routers/assistant.py) |

---

## 4. API Endpoints

### 4.1 Current Weather Telemetry
- **Endpoint**: `GET /api/weather/current?farm_id={farm_id}&lat={lat}&lon={lon}`
- **Authentication**: Bearer Token (Farmer role)
- **Response**: Current temperature, humidity, wind, rainfall, sunrise, sunset, UV index, and location metadata.

### 4.2 7-Day Forecast
- **Endpoint**: `GET /api/weather/forecast?farm_id={farm_id}&lat={lat}&lon={lon}`
- **Response**: 7-day daily highs, lows, precipitation probabilities, expected rainfall volume, wind speeds, and sunrise/sunset.

### 4.3 Weather Intelligence & Agricultural Decisions
- **Endpoint**: `GET /api/weather/intelligence?farm_id={farm_id}&lat={lat}&lon={lon}`
- **Response**:
```json
{
  "farm_id": 1,
  "farm_name": "Mandya Sugarcane Plot",
  "location_name": "Mandya, Karnataka",
  "latitude": 12.52,
  "longitude": 76.9,
  "is_location_missing": false,
  "crop": "Sugarcane",
  "crop_stage": "Vegetative Growth",
  "soil_type": "Alluvial",
  "current_weather": {
    "temperature": 27.5,
    "feels_like": 28.2,
    "humidity": 55,
    "wind_speed": 10.2,
    "wind_direction": 180,
    "rainfall_mm": 0.0,
    "rain_probability": 10,
    "condition": "Clear Sky",
    "description": "Sunny & clear conditions across the farm",
    "sunrise": "06:10",
    "sunset": "18:30",
    "uv_index": 6.5
  },
  "forecast": [...],
  "alerts": [],
  "farming_advice": [
    {
      "category": "Irrigation Management",
      "title": "💧 Standard Irrigation Window",
      "message": "Mild weather with minimal rain risk. Normal maintenance irrigation.",
      "why": "Crop (Sugarcane) in Vegetative Growth stage requires steady transpiration buffer.",
      "impact": "Normal",
      "type": "info"
    }
  ],
  "irrigation_advice": {
    "decision": "Standard Irrigation Window",
    "status_badge": "NORMAL SCHEDULE",
    "safety_level": "Safe Window",
    "reason": "Mild weather with minimal rain risk.",
    "water_saving_litres": "Standard drip fertigation quota",
    "recommended_timing": "Apply during cooler morning or late afternoon hours."
  },
  "fertilizer_advice": {
    "safety_status": "Safe Application Window",
    "status_badge": "SAFE TO APPLY",
    "warning": "Weather conditions are favorable for nutrient uptake.",
    "application_window": "Early morning (6:00 AM - 9:00 AM) or late evening (4:30 PM - 6:30 PM).",
    "agronomic_recommendation": "Ensure soil has adequate moisture before applying stage-recommended fertilizers."
  },
  "crop_health_advice": {
    "fungal_risk_level": "Low to Moderate Disease Risk",
    "risk_badge": "OPTIMAL CONDITIONS",
    "pathogens_of_concern": ["General monitoring"],
    "scouting_advice": "Balanced microclimate. Routine weekly crop scouting recommended.",
    "preventive_action": "Maintain balanced nutrition and clean field borders."
  },
  "data_source": "Open-Meteo High-Resolution Real-Time Meteorological API",
  "fetched_at": "2026-09-17T16:25:00Z"
}
```

---

## 5. Automated Test Suite

Run the full 12-test automated verification suite:
```powershell
cd backend
python test_real_weather_intelligence.py
```
