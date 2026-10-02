"""
AgroVision AI — Comprehensive Weather Intelligence Test Suite

Tests:
1. Normal favorable weather -> Correct intelligence advisory
2. Rain forecast -> Triggers Rain Alert, Irrigation Delay, Fertilizer Warning
3. Heavy rain (>= 20mm) -> Triggers Heavy Rain Alert & Field Drainage Warning
4. High temperature (>= 35°C) -> Triggers Heat Alert & Evapotranspiration Warning
5. High humidity (>= 70%) -> Triggers High Humidity / Fungal Pathology Risk Alert
6. Strong wind (>= 18 km/h) -> Triggers Strong Wind Alert & Spray Drift Prevention
7. Missing farm location -> Returns is_location_missing: True with guidance
8. Live weather API endpoint (GET /api/weather/intelligence) -> Real Open-Meteo sync
9. Current & Forecast endpoints (GET /api/weather/current & /forecast)
10. Multi-farm data isolation & unauthorized farm access rejection
11. Integration with Smart Irrigation decision rules
12. Integration with Fertilizer Recommendation leaching interlock
"""

import sys
import os
import unittest
from datetime import datetime
from fastapi.testclient import TestClient

# Ensure backend root is on Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.database.session import SessionLocal, Base, engine
from app.models.models import User, Farm, Sensor
from app.utils.auth import get_password_hash, create_access_token
from app.ai.weather_intelligence_engine import (
    generate_weather_intelligence_decisions,
    fetch_real_weather_telemetry
)
from app.ai.real_fertilizer_model import calculate_real_fertilizer_recommendation
from app.ai.real_smart_irrigation_model import evaluate_smart_irrigation_decision

client = TestClient(app)

def setup_weather_test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear old test users if present
    db.query(User).filter(User.email.in_(["farmer.weather1@agrovision.ai", "farmer.weather2@agrovision.ai"])).delete(synchronize_session=False)
    db.commit()

    # Create Farmer 1 (Owner of Farm A and Farm B)
    u1 = User(
        full_name="Venkatesh Gowda",
        email="farmer.weather1@agrovision.ai",
        phone="9876543331",
        hashed_password=get_password_hash("WeatherPass123!"),
        role="farmer",
        preferred_language="Kannada"
    )
    db.add(u1)
    db.commit()
    db.refresh(u1)

    # Farm A: Normal location in Mandya (Sugarcane)
    f1 = Farm(
        user_id=u1.id,
        name="Mandya Sugarcane Plot",
        location_name="Mandya, Karnataka",
        latitude=12.520,
        longitude=76.900,
        size_acres=3.5,
        crop="Sugarcane",
        current_stage_override="Vegetative Growth",
        soil_type="Alluvial",
        nitrogen=75.0,
        phosphorus=30.0,
        potassium=45.0,
        soil_ph=6.7
    )
    # Farm B: Farm with MISSING Location
    f2 = Farm(
        user_id=u1.id,
        name="Unmapped Hill Plot",
        location_name="",
        latitude=0.0, # Unmapped GPS
        longitude=0.0,
        size_acres=2.0,
        crop="Coffee",
        current_stage_override="Flowering / Tillering",
        soil_type="Laterite"
    )
    db.add_all([f1, f2])
    db.commit()
    db.refresh(f1)
    db.refresh(f2)

    # Create Farmer 2 (Unauthorized user)
    u2 = User(
        full_name="Rajesh Kumar",
        email="farmer.weather2@agrovision.ai",
        phone="9876543332",
        hashed_password=get_password_hash("WeatherPass123!"),
        role="farmer",
        preferred_language="Hindi"
    )
    db.add(u2)
    db.commit()
    db.refresh(u2)
    u1_id = u1.id
    f1_id = f1.id
    f2_id = f2.id
    u2_id = u2.id
    db.close()
    return u1_id, f1_id, f2_id, u2_id


def test_1_normal_weather_intelligence():
    """Scenario 1: Favorable mild weather generates safe agricultural advice."""
    mock_weather = {
        "current_weather": {
            "temperature": 27.5,
            "feels_like": 28.2,
            "humidity": 55,
            "wind_speed": 9.5,
            "rainfall_mm": 0.0,
            "rain_probability": 10,
            "condition": "Clear Sky"
        }
    }
    decisions = generate_weather_intelligence_decisions(
        weather_data=mock_weather,
        crop="Tomato",
        crop_stage="Vegetative Growth",
        soil_type="Loam"
    )

    assert decisions["irrigation_advice"]["decision"] == "Standard Irrigation Window"
    assert "Safe" in decisions["fertilizer_advice"]["safety_status"]
    assert "optimal" in decisions["crop_health_advice"]["risk_badge"].lower()
    print(f"\n[TEST 1] Normal Weather -> Irrigation: {decisions['irrigation_advice']['decision']}, Fert: {decisions['fertilizer_advice']['safety_status']}")


def test_2_rain_forecast_triggers_alerts():
    """Scenario 2: Rain forecast triggers Rain Alert, Irrigation Delay, and Fertilizer Warning."""
    mock_weather = {
        "current_weather": {
            "temperature": 25.0,
            "feels_like": 26.0,
            "humidity": 68,
            "wind_speed": 12.0,
            "rainfall_mm": 8.5, # 8.5 mm rain forecast
            "rain_probability": 65, # 65% chance
            "condition": "Moderate Rain"
        }
    }
    decisions = generate_weather_intelligence_decisions(
        weather_data=mock_weather,
        crop="Rice",
        crop_stage="Vegetative Growth",
        soil_type="Alluvial"
    )

    alert_types = [a["alert_type"] for a in decisions["alerts"]]
    assert "Rain Alert" in alert_types
    assert "Irrigation Delay" in alert_types
    assert "Fertilizer Application Warning" in alert_types
    assert decisions["irrigation_advice"]["decision"] == "Delay Irrigation"
    assert "Delay" in decisions["fertilizer_advice"]["safety_status"]
    print(f"\n[TEST 2] Rain Forecast (8.5mm, 65%) -> Alerts: {alert_types}")


def test_3_heavy_rain_triggers_danger_alert():
    """Scenario 3: Heavy rain (>= 20mm) triggers Heavy Rain Alert with drainage warning."""
    mock_weather = {
        "current_weather": {
            "temperature": 23.0,
            "feels_like": 24.0,
            "humidity": 85,
            "wind_speed": 16.0,
            "rainfall_mm": 24.0, # 24 mm downpour
            "rain_probability": 90,
            "condition": "Heavy Rain"
        }
    }
    decisions = generate_weather_intelligence_decisions(
        weather_data=mock_weather,
        crop="Sugarcane",
        crop_stage="Vegetative Growth",
        soil_type="Alluvial"
    )

    heavy_alerts = [a for a in decisions["alerts"] if a["alert_type"] == "Heavy Rain Alert"]
    assert len(heavy_alerts) > 0
    assert heavy_alerts[0]["severity"] == "danger"
    print(f"\n[TEST 3] Heavy Rain (24mm) -> Alert: {heavy_alerts[0]['alert_type']}")


def test_4_high_temperature_heat_alert():
    """Scenario 4: High temp (>= 35°C) triggers Heat Alert."""
    mock_weather = {
        "current_weather": {
            "temperature": 37.5,
            "feels_like": 40.2,
            "humidity": 30,
            "wind_speed": 11.0,
            "rainfall_mm": 0.0,
            "rain_probability": 5,
            "condition": "Clear Sky"
        }
    }
    decisions = generate_weather_intelligence_decisions(
        weather_data=mock_weather,
        crop="Cotton",
        crop_stage="Flowering / Tillering",
        soil_type="Black Cotton Soil"
    )

    heat_alerts = [a for a in decisions["alerts"] if a["alert_type"] == "Heat Alert"]
    assert len(heat_alerts) > 0
    assert heat_alerts[0]["severity"] == "danger"
    print(f"\n[TEST 4] High Temp (37.5 C) -> Alert: {heat_alerts[0]['alert_type']}")


def test_5_high_humidity_fungal_risk():
    """Scenario 5: High humidity (>= 70%) triggers Fungal Disease Alert."""
    mock_weather = {
        "current_weather": {
            "temperature": 24.0,
            "feels_like": 25.0,
            "humidity": 78, # 78% RH
            "wind_speed": 8.0,
            "rainfall_mm": 0.0,
            "rain_probability": 20,
            "condition": "Overcast"
        }
    }
    decisions = generate_weather_intelligence_decisions(
        weather_data=mock_weather,
        crop="Potato",
        crop_stage="Vegetative Growth",
        soil_type="Loam"
    )

    fungal_alerts = [a for a in decisions["alerts"] if a["alert_type"] == "High Humidity/Fungal Risk"]
    assert len(fungal_alerts) > 0
    assert "Fungal" in decisions["crop_health_advice"]["fungal_risk_level"]
    print(f"\n[TEST 5] High Humidity (78%) -> Alert: {fungal_alerts[0]['alert_type']}")


def test_6_strong_wind_alert():
    """Scenario 6: Wind speed >= 18 km/h triggers Strong Wind Alert."""
    mock_weather = {
        "current_weather": {
            "temperature": 28.0,
            "feels_like": 28.5,
            "humidity": 50,
            "wind_speed": 22.5, # 22.5 km/h gusts
            "rainfall_mm": 0.0,
            "rain_probability": 10,
            "condition": "Mainly Clear"
        }
    }
    decisions = generate_weather_intelligence_decisions(
        weather_data=mock_weather,
        crop="Chilli",
        crop_stage="Flowering / Tillering",
        soil_type="Red Sandy Loam"
    )

    wind_alerts = [a for a in decisions["alerts"] if a["alert_type"] == "Strong Wind Alert"]
    assert len(wind_alerts) > 0
    assert "hold foliar" in decisions["fertilizer_advice"]["status_badge"].lower()
    print(f"\n[TEST 6] Strong Wind (22.5 km/h) -> Alert: {wind_alerts[0]['alert_type']}")


def test_7_missing_farm_location_handled():
    """Scenario 7: Farm with missing latitude/longitude returns is_location_missing: True."""
    u1_id, f1_id, f2_id, u2_id = setup_weather_test_db()
    token = create_access_token({"sub": str(u1_id)})
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get(f"/api/weather/intelligence?farm_id={f2_id}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["is_location_missing"] is True
    assert "missing" in data["location_prompt"].lower()
    print(f"\n[TEST 7] Missing Location -> is_location_missing: {data['is_location_missing']}, Prompt: {data['location_prompt']}")


def test_8_api_weather_intelligence_live():
    """Scenario 8: GET /api/weather/intelligence returns complete structured telemetry."""
    u1_id, f1_id, f2_id, u2_id = setup_weather_test_db()
    token = create_access_token({"sub": str(u1_id)})
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get(f"/api/weather/intelligence?farm_id={f1_id}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["is_location_missing"] is False
    assert data["farm_id"] == f1_id
    assert data["current_weather"] is not None
    assert "temperature" in data["current_weather"]
    assert len(data["forecast"]) >= 5
    assert len(data["farming_advice"]) >= 3
    assert data["irrigation_advice"] is not None
    assert data["fertilizer_advice"] is not None
    assert data["crop_health_advice"] is not None
    print(f"\n[TEST 8] Live API Weather Intelligence -> Farm: {data['farm_name']}, Temp: {data['current_weather']['temperature']} C, Condition: {data['current_weather']['condition']}, Forecast Days: {len(data['forecast'])}")


def test_9_current_and_forecast_endpoints():
    """Scenario 9: Verifies GET /api/weather/current and GET /api/weather/forecast."""
    u1_id, f1_id, f2_id, u2_id = setup_weather_test_db()
    token = create_access_token({"sub": str(u1_id)})
    headers = {"Authorization": f"Bearer {token}"}

    # Test Current
    r_curr = client.get(f"/api/weather/current?farm_id={f1_id}", headers=headers)
    assert r_curr.status_code == 200
    curr_data = r_curr.json()
    assert "current_weather" in curr_data
    assert curr_data["current_weather"]["temperature"] > 0

    # Test Forecast
    r_fore = client.get(f"/api/weather/forecast?farm_id={f1_id}", headers=headers)
    assert r_fore.status_code == 200
    fore_data = r_fore.json()
    assert "forecast" in fore_data
    assert len(fore_data["forecast"]) >= 5
    print(f"\n[TEST 9] Endpoints /current & /forecast -> Current Temp: {curr_data['current_weather']['temperature']} C, Forecast count: {len(fore_data['forecast'])}")


def test_10_unauthorized_farm_access_rejected():
    """Scenario 10: Farmer 2 cannot access Farmer 1's farm weather data."""
    u1_id, f1_id, f2_id, u2_id = setup_weather_test_db()
    token_u2 = create_access_token({"sub": str(u2_id)})
    headers_u2 = {"Authorization": f"Bearer {token_u2}"}

    res = client.get(f"/api/weather/intelligence?farm_id={f1_id}", headers=headers_u2)
    assert res.status_code == 404
    assert "not have permission" in res.json()["detail"] or "not found" in res.json()["detail"]
    print(f"\n[TEST 10] Security -> Successfully rejected unauthorized access to Farm ID {f1_id} from User ID {u2_id}.")


def test_11_smart_irrigation_weather_integration():
    """Scenario 11: Verifies Smart Irrigation respects weather rain forecast."""
    # When rain >= 5.0 mm, Smart Irrigation must DELAY IRRIGATION
    res_irr = evaluate_smart_irrigation_decision(
        crop="Sugarcane",
        soil_type="Alluvial",
        crop_stage="Vegetative Growth",
        soil_moisture=30.0, # Low moisture, would normally irrigate
        rainfall=12.5, # 12.5 mm rain forecast
        rain_probability=80.0,
        farm_area=3.5
    )
    assert res_irr["decision"] == "DELAY IRRIGATION"
    print(f"\n[TEST 11] Smart Irrigation Weather Interlock -> Decision: {res_irr['decision']}, Warning: {res_irr['rain_warning'][:60]}...")


def test_12_fertilizer_weather_integration():
    """Scenario 12: Verifies Fertilizer Advisor respects weather rain forecast."""
    # When rain >= 5.0 mm, Fertilizer Recommendation must set status to 'Delay Application'
    res_fert = calculate_real_fertilizer_recommendation(
        crop="Sugarcane",
        crop_stage="Vegetative Growth",
        soil_type="Alluvial",
        nitrogen=30.0, # Low N
        phosphorus=30.0,
        potassium=30.0,
        ph=6.5,
        rainfall=15.0, # 15 mm rain forecast
        farm_area=3.5
    )
    assert res_fert["status"] == "Delay Application"
    assert "leaching" in res_fert["weather_advice"].lower() or "runoff" in res_fert["weather_advice"].lower()
    print(f"\n[TEST 12] Fertilizer Weather Interlock -> Status: {res_fert['status']}")


if __name__ == "__main__":
    print("=" * 75)
    print("RUNNING ALL REAL WEATHER INTELLIGENCE AUTOMATED TESTS")
    print("=" * 75)
    test_1_normal_weather_intelligence()
    test_2_rain_forecast_triggers_alerts()
    test_3_heavy_rain_triggers_danger_alert()
    test_4_high_temperature_heat_alert()
    test_5_high_humidity_fungal_risk()
    test_6_strong_wind_alert()
    test_7_missing_farm_location_handled()
    test_8_api_weather_intelligence_live()
    test_9_current_and_forecast_endpoints()
    test_10_unauthorized_farm_access_rejected()
    test_11_smart_irrigation_weather_integration()
    test_12_fertilizer_weather_integration()
    print("\n" + "=" * 75)
    print("ALL 12 REAL WEATHER INTELLIGENCE TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 75)
