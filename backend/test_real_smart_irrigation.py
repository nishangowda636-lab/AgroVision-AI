"""
AgroVision AI — Real ML Smart Irrigation Automated Test Suite
============================================================
Comprehensive test suite testing all 11 specified scenarios for Smart Irrigation:
1. Low soil moisture + No rain -> Irrigation Recommended
2. Low soil moisture + Rain expected -> Delay Irrigation (Rain Safety)
3. High / Optimal soil moisture -> Irrigation Not Required
4. Real IoT sensor connected -> Uses real sensor telemetry
5. IoT disconnected -> No fake sensor readings ("Live sensor unavailable")
6. Weather / Rain API fallback -> Safe defaults
7. Sensor failure (<0% or >100%) -> "CHECK SENSOR", prevents automatic pump activation
8. Manual override -> Starts/Stops pump correctly
9. Emergency stop -> Blocks automation
10. Unauthorized farm access -> Rejected with 404/403
11. Model Info & Contract verification -> Test accuracy & confusion matrix verified
"""

import sys
import os
from datetime import datetime

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.session import Base, get_db
from app.models.models import User, Farm, Sensor, PumpController, PumpEvent
from app.utils.auth import create_access_token, get_password_hash
from app.ai.real_smart_irrigation_model import (
    evaluate_smart_irrigation_decision,
    load_smart_irrigation_artifacts
)

# In-memory test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

def test_1_low_moisture_no_rain_recommends_irrigation():
    """Scenario 1: Soil moisture low + No rain -> Irrigation recommended."""
    res = evaluate_smart_irrigation_decision(
        crop="Tomato",
        crop_stage="Flowering / Tillering",
        soil_type="Loam",
        soil_moisture=32.0, # Below 45% critical threshold
        temperature=29.0,
        humidity=55.0,
        rainfall=0.0,
        rain_probability=10.0,
        farm_area=2.0,
        irrigation_method="Drip Irrigation",
        is_sensor_connected=True
    )

    assert res["irrigation_required"] is True
    assert res["decision"] == "IRRIGATION REQUIRED"
    assert res["recommended_amount"] > 0
    assert res["duration"] > 0
    assert "Drip" in res["important_factors"][3]["value"]
    print(f"\n[TEST 1] Low Moisture (32%) + No Rain -> Decision: {res['decision']}, Amount: {res['recommended_amount']:,} L, Duration: {res['duration']} mins")

def test_2_low_moisture_rain_expected_delays_irrigation():
    """Scenario 2: Soil moisture low + Significant rain expected -> Delay irrigation (Rain Safety)."""
    res = evaluate_smart_irrigation_decision(
        crop="Tomato",
        crop_stage="Flowering / Tillering",
        soil_type="Loam",
        soil_moisture=32.0,
        temperature=26.0,
        humidity=78.0,
        rainfall=18.0, # Significant rain expected
        rain_probability=85.0,
        farm_area=2.0,
        irrigation_method="Drip Irrigation",
        is_sensor_connected=True
    )

    assert res["irrigation_required"] is False
    assert res["decision"] == "DELAY IRRIGATION"
    assert res["recommended_amount"] == 0
    assert "Rain is expected" in res["rain_warning"]
    print(f"\n[TEST 2] Low Moisture (32%) + Rain Forecast (18mm, 85%) -> Decision: {res['decision']}, Warning: {res['rain_warning']}")

def test_3_optimal_moisture_not_required():
    """Scenario 3: Soil moisture sufficient -> Irrigation not required."""
    res = evaluate_smart_irrigation_decision(
        crop="Tomato",
        crop_stage="Vegetative Growth",
        soil_type="Loam",
        soil_moisture=72.0, # Above 65% optimal threshold
        temperature=27.0,
        humidity=65.0,
        rainfall=0.0,
        rain_probability=10.0,
        farm_area=2.0,
        irrigation_method="Drip Irrigation",
        is_sensor_connected=True
    )

    assert res["irrigation_required"] is False
    assert res["decision"] == "IRRIGATION NOT REQUIRED"
    assert res["recommended_amount"] == 0
    print(f"\n[TEST 3] Optimal Moisture (72%) -> Decision: {res['decision']}")

def test_4_real_iot_sensor_telemetry_integrated():
    """Scenario 4: Real IoT sensor connected -> Uses real sensor data."""
    db = TestingSessionLocal()
    # Create test user & farm
    u = User(
        full_name="Ramesh Gowda",
        email="ramesh.irr@agrovision.ai",
        phone="9876543210",
        hashed_password=get_password_hash("FarmSecure123!"),
        preferred_language="English"
    )
    db.add(u)
    db.commit()
    db.refresh(u)

    f = Farm(
        user_id=u.id,
        name="Green Valley Drip Plot",
        location_name="Mandya, Karnataka",
        latitude=12.520,
        longitude=76.900,
        size_acres=3.0,
        crop="Tomato",
        soil_type="Loam",
        irrigation_method="Drip Irrigation"
    )
    db.add(f)
    db.commit()
    db.refresh(f)

    # Attach live online soil moisture sensor reporting 28%
    s = Sensor(
        farm_id=f.id,
        sensor_type="moisture",
        name="Soil Probe Alpha",
        status="Online",
        current_value=28.0,
        unit="%"
    )
    db.add(s)
    db.commit()

    token = create_access_token({"sub": str(u.id)})
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/smart-irrigation/predict",
        json={"farm_id": f.id, "rainfall": 0.0, "rain_probability": 0.0},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_sensor_connected"] is True
    assert data["soil_moisture_pct"] == 28.0
    assert data["decision"] == "IRRIGATION REQUIRED"
    assert "Live IoT Soil Moisture Sensor" in data["data_sources"]
    print(f"\n[TEST 4] IoT Connected -> Farm: {f.name}, Live Sensor: {data['soil_moisture_pct']}%, Decision: {data['decision']}")
    db.close()

def test_5_iot_disconnected_no_fake_readings():
    """Scenario 5: IoT disconnected -> Shows is_sensor_connected=False, does not claim fake live sensor."""
    db = TestingSessionLocal()
    u = db.query(User).filter(User.email == "ramesh.irr@agrovision.ai").first()
    assert u is not None, "User must exist"
    
    # Create farm with no sensors attached
    f2 = Farm(
        user_id=u.id,
        name="Dry Ridge Plot",
        location_name="Mysuru, Karnataka",
        latitude=12.295,
        longitude=76.639,
        size_acres=2.5,
        crop="Maize",
        soil_type="Red Sandy Loam",
        irrigation_method="Sprinkler System"
    )
    db.add(f2)
    db.commit()
    db.refresh(f2)

    token = create_access_token({"sub": str(u.id)})
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/smart-irrigation/predict",
        json={"farm_id": f2.id},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_sensor_connected"] is False
    assert "Live IoT Soil Moisture Sensor" not in data["data_sources"]
    assert "Farm Profile Baseline" in data["data_sources"]
    print(f"\n[TEST 5] IoT Disconnected -> is_sensor_connected: {data['is_sensor_connected']}, Data Sources: {data['data_sources']}")
    db.close()

def test_6_weather_fallback():
    """Scenario 6: Weather values safe fallback when API is unreachable."""
    res = evaluate_smart_irrigation_decision(
        crop="Wheat",
        crop_stage="Vegetative Growth",
        soil_type="Alluvial",
        soil_moisture=38.0,
        temperature=None, # Missing weather
        humidity=None,
        rainfall=None,
        rain_probability=None,
        farm_area=2.0
    )
    assert res["decision"] in ["IRRIGATION REQUIRED", "IRRIGATION NOT REQUIRED", "DELAY IRRIGATION"]
    assert res["recommended_amount"] >= 0
    print(f"\n[TEST 6] Weather Fallback -> Safe Decision: {res['decision']}")

def test_7_sensor_failure_suspends_automatic_pump():
    """Scenario 7: Sensor failure (<0% or >100%) -> "CHECK SENSOR", suspends automatic irrigation."""
    res = evaluate_smart_irrigation_decision(
        crop="Tomato",
        crop_stage="Flowering / Tillering",
        soil_type="Loam",
        soil_moisture=145.0, # Impossible out of bounds reading
        temperature=28.0,
        humidity=60.0,
        rainfall=0.0,
        farm_area=2.0,
        is_sensor_connected=True
    )
    assert res["irrigation_required"] is False
    assert res["decision"] == "CHECK SENSOR"
    assert res["recommended_amount"] == 0
    assert "malfunctioning" in res["reason"] or "bounds" in res["reason"]
    print(f"\n[TEST 7] Sensor Out of Bounds (145%) -> Decision: {res['decision']}, Reason: {res['reason']}")

def test_8_manual_override_pump_control():
    """Scenario 8: Manual override starts and stops pump with audit event logging."""
    db = TestingSessionLocal()
    u = db.query(User).filter(User.email == "ramesh.irr@agrovision.ai").first()
    assert u is not None, "User must exist"
    f = db.query(Farm).filter(Farm.user_id == u.id).first()
    assert f is not None, "Farm must exist"

    token = create_access_token({"sub": str(u.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # Manual Start Command
    cmd_start = client.post(
        f"/api/pumps/{f.id}/command",
        json={"command": "PUMP_ON", "duration_mins": 40, "reason": "Farmer manual override for foliar fertigation"},
        headers=headers
    )
    assert cmd_start.status_code == 200
    pump_data = cmd_start.json()
    assert pump_data["status"] == "ON"
    assert "40" in pump_data["last_command"]

    # Manual Stop Command
    cmd_stop = client.post(
        f"/api/pumps/{f.id}/command",
        json={"command": "PUMP_OFF", "reason": "Manual stop"},
        headers=headers
    )
    assert cmd_stop.status_code == 200
    pump_stop_data = cmd_stop.json()
    assert pump_stop_data["status"] == "OFF"

    # Verify event audit log
    events_res = client.get(f"/api/pumps/{f.id}/events", headers=headers)
    assert events_res.status_code == 200
    events = events_res.json()
    assert len(events) >= 2
    assert any(e["event_type"] == "MANUAL_START" for e in events)
    assert any(e["event_type"] == "MANUAL_STOP" for e in events)
    print(f"\n[TEST 8] Manual Override -> Successfully started and stopped pump. Event audit log verified ({len(events)} events).")
    db.close()

def test_9_emergency_stop_prevents_automation():
    """Scenario 9: Emergency stop engages kill switch and blocks pump activation."""
    db = TestingSessionLocal()
    u = db.query(User).filter(User.email == "ramesh.irr@agrovision.ai").first()
    assert u is not None, "User must exist"
    f = db.query(Farm).filter(Farm.user_id == u.id).first()
    assert f is not None, "Farm must exist"

    token = create_access_token({"sub": str(u.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # Engage Emergency Stop
    em_res = client.post(
        f"/api/pumps/{f.id}/command",
        json={"command": "EMERGENCY_STOP", "reason": "Emergency pipe leak detected"},
        headers=headers
    )
    assert em_res.status_code == 200
    p = em_res.json()
    assert p["emergency_stopped"] is True
    assert p["status"] == "OFF"

    # Attempt to start pump while emergency stop is active -> should reject with 400
    bad_start = client.post(
        f"/api/pumps/{f.id}/command",
        json={"command": "PUMP_ON"},
        headers=headers
    )
    assert bad_start.status_code == 400
    assert "Emergency" in bad_start.json()["detail"]

    # Reset Emergency Stop
    reset_res = client.post(
        f"/api/pumps/{f.id}/command",
        json={"command": "RESET_EMERGENCY"},
        headers=headers
    )
    assert reset_res.status_code == 200
    assert reset_res.json()["emergency_stopped"] is False
    print("\n[TEST 9] Emergency Stop -> Engaged kill switch, blocked unauthorized pump start, and safely reset.")
    db.close()

def test_10_unauthorized_farm_access_rejected():
    """Scenario 10: Unauthorized farmer cannot predict or control another farmer's farm."""
    db = TestingSessionLocal()
    # Create Farmer 2
    u2 = User(
        full_name="Suresh Patel",
        email="suresh.irr@agrovision.ai",
        phone="9876543211",
        hashed_password=get_password_hash("PatelSecure123!"),
        preferred_language="Gujarati"
    )
    db.add(u2)
    db.commit()
    db.refresh(u2)

    # Get Farmer 1's farm ID
    u1 = db.query(User).filter(User.email == "ramesh.irr@agrovision.ai").first()
    assert u1 is not None, "User 1 must exist"
    f1 = db.query(Farm).filter(Farm.user_id == u1.id).first()
    assert f1 is not None, "Farm 1 must exist"

    # Login as Farmer 2 and attempt to query Farmer 1's farm
    token_u2 = create_access_token({"sub": str(u2.id)})
    headers_u2 = {"Authorization": f"Bearer {token_u2}"}

    response = client.post(
        "/api/smart-irrigation/predict",
        json={"farm_id": f1.id},
        headers=headers_u2
    )
    assert response.status_code == 404
    assert "not have permission" in response.json()["detail"] or "not found" in response.json()["detail"]
    print(f"\n[TEST 10] Security -> Successfully rejected unauthorized access to Farm ID {f1.id} from user {u2.email}.")
    db.close()

def test_11_model_info_and_evaluation_contract():
    """Scenario 11: /model-info endpoint returns verified metrics, confusion matrix, and feature schema."""
    db = TestingSessionLocal()
    u = db.query(User).filter(User.email == "ramesh.irr@agrovision.ai").first()
    assert u is not None, "User must exist"
    token = create_access_token({"sub": str(u.id)})
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/smart-irrigation/model-info", headers=headers)
    assert res.status_code == 200
    info = res.json()
    assert "classifier_name" in info
    assert info["test_accuracy"] >= 0.95
    assert len(info["confusion_matrix"]) == 2
    assert "supported_crops" in info
    assert "Tomato" in info["supported_crops"]
    print(f"\n[TEST 11] Model Info -> {info['classifier_name']} (Test Accuracy: {info['test_accuracy'] * 100:.2f}%, F1: {info['test_f1'] * 100:.2f}%)")
    print(f"Confusion Matrix: {info['confusion_matrix']}")
    db.close()

if __name__ == "__main__":
    print("=" * 70)
    print("RUNNING ALL 11 REAL SMART IRRIGATION AUTOMATED TESTS")
    print("=" * 70)
    test_1_low_moisture_no_rain_recommends_irrigation()
    test_2_low_moisture_rain_expected_delays_irrigation()
    test_3_optimal_moisture_not_required()
    test_4_real_iot_sensor_telemetry_integrated()
    test_5_iot_disconnected_no_fake_readings()
    test_6_weather_fallback()
    test_7_sensor_failure_suspends_automatic_pump()
    test_8_manual_override_pump_control()
    test_9_emergency_stop_prevents_automation()
    test_10_unauthorized_farm_access_rejected()
    test_11_model_info_and_evaluation_contract()
    print("\n" + "=" * 70)
    print("🎯 ALL 11 REAL SMART IRRIGATION TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 70)
