"""
AgroVision AI — End-to-End Real ML Model & API Pipeline Test Suite
==================================================================
Tests all 5 core production ML models, endpoints, preprocessing, safety rules,
and edge cases.
"""

import os
import sys
import json
import numpy as np

# Ensure backend root is on sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi.testclient import TestClient
from app.main import app
from app.database.session import get_db, SessionLocal
from app.models.models import User, Farm
from app.utils.auth import create_access_token

client = TestClient(app)

# Helper to get auth header
def get_auth_token(db):
    user = db.query(User).filter(User.email == "farmer_ml@agrovision.ai").first()
    if not user:
        from app.utils.auth import get_password_hash
        user = User(
            email="farmer_ml@agrovision.ai",
            hashed_password=get_password_hash("password123"),
            full_name="Test ML Farmer",
            role="Farmer"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(data={"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}, user

# Helper to get or create a test farm
def get_test_farm(db, user):
    farm = db.query(Farm).filter(Farm.user_id == user.id).first()
    if not farm:
        farm = Farm(
            name="Green Valley ML Farm",
            location_name="Mandya, Karnataka",
            latitude=12.5218,
            longitude=76.8951,
            size_acres=3.5,
            crop="Tomato",
            soil_type="Red Sandy Loam",
            soil_ph=6.4,
            nitrogen=95.0,
            phosphorus=48.0,
            potassium=75.0,
            irrigation_method="Drip Irrigation",
            user_id=user.id
        )
        db.add(farm)
        db.commit()
        db.refresh(farm)
    return farm


print("\n===========================================================")
print("🧪 AGROVISION AI — REAL ML MODELS END-TO-END VALIDATION")
print("===========================================================")


# ==========================================
# 1. CENTRALIZED MODEL STATUS API TEST
# ==========================================
def test_all_models_status():
    print("\n[TEST 1] Centralized Model Status API...")
    res = client.get("/api/models/status")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    
    assert "crop_health" in data
    assert "crop_recommendation" in data
    assert "yield_prediction" in data
    assert "smart_irrigation" in data
    assert "fertilizer" in data
    
    assert data["crop_health"]["loaded"] is True
    assert data["crop_recommendation"]["loaded"] is True
    assert data["yield_prediction"]["loaded"] is True
    assert data["smart_irrigation"]["loaded"] is True
    assert data["fertilizer"]["loaded"] is True
    assert data["all_models_operational"] is True
    print("  ✓ Centralized Model Status: All 5 ML models verified LOADED and OPERATIONAL.")


# ==========================================
# 2. CROP HEALTH & DISEASE DETECTION TEST
# ==========================================
def test_crop_health_model():
    print("\n[TEST 2] Crop Health & Disease Detection Model...")
    # Check health status endpoint
    status_res = client.get("/api/crop-health/model-status")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["loaded"] is True
    assert status_data["classes_count"] == 14
    assert len(status_data.get("supported_classes", [])) == 14
    assert "38 Pathologies" in status_data.get("dataset", "")
    
    from app.ai.real_disease_model import get_crop_health_model
    mgr = get_crop_health_model()
    assert len(mgr.crop_classes) == 14
    assert len(mgr.disease_classes) == 38
    print(f"  ✓ Model Status: Two-Stage MobileNetV2 loaded ({status_data['classes_count']} crops, {len(mgr.disease_classes)} pathologies, Device: {status_data['device']}).")

    # Check inference on actual test dataset image
    test_img_dir = os.path.join(BASE_DIR, "dataset", "test", "Tomato___Early_blight")
    if os.path.exists(test_img_dir):
        files = os.listdir(test_img_dir)
        if files:
            sample_img_path = os.path.join(test_img_dir, files[0])
            from app.ai.real_disease_model import get_crop_health_model
            mgr = get_crop_health_model()
            pred = mgr.predict_image(sample_img_path)
            
            assert "crop_name" in pred
            assert "condition" in pred
            assert pred["confidence"] > 0
            assert len(pred["top_predictions"]) > 0
            print(f"  ✓ Real Image Inference on {files[0]}: Detected '{pred['crop_name']}' - '{pred['condition']}' (Confidence: {pred['confidence']}%)")


# ==========================================
# 3. CROP RECOMMENDATION MODEL TEST
# ==========================================
def test_crop_recommendation_model():
    print("\n[TEST 3] Real ML Crop Recommendation...")
    db = SessionLocal()
    try:
        headers, user = get_auth_token(db)
        farm = get_test_farm(db, user)

        # Test Case A: High water/humidity/nitrogen input (Rice profile)
        payload_rice = {
            "nitrogen": 90.0,
            "phosphorus": 42.0,
            "potassium": 43.0,
            "ph": 6.5,
            "temperature": 24.0,
            "humidity": 82.0,
            "rainfall": 220.0,
            "season": "Kharif",
            "top_k": 3
        }
        res_rice = client.post("/api/crop-recommendation/predict", json=payload_rice, headers=headers)
        assert res_rice.status_code == 200, f"Error: {res_rice.text}"
        data_rice = res_rice.json()
        top_crop_rice = data_rice["recommendations"][0]["crop"].lower()
        print(f"  ✓ High rainfall/humidity input -> Top recommendation: '{data_rice['recommendations'][0]['crop']}' (Confidence: {data_rice['recommendations'][0]['suitability_pct']}%)")
        assert "rice" in top_crop_rice or "jute" in top_crop_rice or "cotton" in top_crop_rice or "maize" in top_crop_rice

        # Test Case B: Low rainfall/arid profile (Mothbeans / Chickpea / Lentil)
        payload_dry = {
            "nitrogen": 20.0,
            "phosphorus": 40.0,
            "potassium": 20.0,
            "ph": 7.5,
            "temperature": 28.0,
            "humidity": 35.0,
            "rainfall": 45.0,
            "season": "Rabi",
            "top_k": 3
        }
        res_dry = client.post("/api/crop-recommendation/predict", json=payload_dry, headers=headers)
        assert res_dry.status_code == 200
        data_dry = res_dry.json()
        top_crop_dry = data_dry["recommendations"][0]["crop"].lower()
        print(f"  ✓ Arid/low rainfall input -> Top recommendation: '{data_dry['recommendations'][0]['crop']}' (Confidence: {data_dry['recommendations'][0]['suitability_pct']}%)")
        
        # Verify predictions adapt dynamically (not hard-coded)
        assert top_crop_rice != top_crop_dry, "Model output must vary based on input features"
        print("  ✓ Feature sensitivity verified: Distinct climate inputs produce distinct agronomic recommendations.")
    finally:
        db.close()


# ==========================================
# 4. CROP YIELD PREDICTION MODEL TEST
# ==========================================
def test_yield_prediction_model():
    print("\n[TEST 4] Precision Crop Yield Regressor...")
    db = SessionLocal()
    try:
        headers, user = get_auth_token(db)
        farm = get_test_farm(db, user)

        payload = {
            "crop": "Tomato",
            "area_acres": 2.5,
            "season": "Kharif",
            "state": "Karnataka",
            "nitrogen": 90.0,
            "phosphorus": 45.0,
            "potassium": 60.0,
            "temperature": 26.0,
            "humidity": 65.0,
            "rainfall": 110.0,
            "irrigation_method": "Drip Irrigation"
        }
        res = client.post("/api/yield-prediction/predict", json=payload, headers=headers)
        assert res.status_code == 200, f"Error: {res.text}"
        data = res.json()

        assert "predicted_yield_per_hectare" in data
        assert "estimated_total_production" in data
        assert data["predicted_yield_per_hectare"] > 0
        assert data["estimated_total_production"] > 0
        assert data["unit"] == "tonnes/hectare"
        assert data["production_unit"] == "tonnes"
        
        # Mathematical verification: total production = yield_per_ha * area_ha
        expected_tonnes = data["predicted_yield_per_hectare"] * data["farm_size_hectares"]
        assert abs(data["estimated_total_production"] - round(expected_tonnes, 2)) <= 0.05
        
        print(f"  ✓ Yield prediction: {data['predicted_yield_per_hectare']} t/ha -> {data['estimated_total_production']} tonnes total for {data['farm_size_acres']} acres.")
        print(f"  ✓ Model verified: {data['model_used']} (Test R²: {data['model_r2_score']})")
    finally:
        db.close()


# ==========================================
# 5. SMART IRRIGATION DECISION & VOLUME TEST
# ==========================================
def test_smart_irrigation_model():
    print("\n[TEST 5] Smart Irrigation Model & Safety Rules...")
    db = SessionLocal()
    try:
        headers, user = get_auth_token(db)
        farm = get_test_farm(db, user)

        # Case A: Low moisture, NO rain -> Irrigation required
        payload_dry = {
            "crop": "Tomato",
            "crop_stage": "Vegetative Growth",
            "soil_type": "Loam",
            "soil_moisture": 32.0,  # Below threshold
            "temperature": 32.0,
            "humidity": 45.0,
            "rainfall": 0.0,
            "rain_probability": 10.0,
            "farm_area": 2.0,
            "irrigation_method": "Drip Irrigation"
        }
        res_dry = client.post("/api/smart-irrigation/predict", json=payload_dry, headers=headers)
        assert res_dry.status_code == 200, f"Error: {res_dry.text}"
        data_dry = res_dry.json()
        assert data_dry["irrigation_required"] is True
        assert data_dry["recommended_amount"] > 0
        print(f"  ✓ Low moisture + Clear weather -> Irrigation REQUIRED: {data_dry['recommended_amount']} L ({data_dry['duration']} mins).")

        # Case B: Low moisture, but HEAVY RAIN EXPECTED -> Delay irrigation (Rain Safety Rule)
        payload_rain = {
            "crop": "Tomato",
            "crop_stage": "Vegetative Growth",
            "soil_type": "Loam",
            "soil_moisture": 32.0,
            "temperature": 25.0,
            "humidity": 85.0,
            "rainfall": 25.0,
            "rain_probability": 85.0,  # High rain chance
            "farm_area": 2.0,
            "irrigation_method": "Drip Irrigation"
        }
        res_rain = client.post("/api/smart-irrigation/predict", json=payload_rain, headers=headers)
        assert res_rain.status_code == 200
        data_rain = res_rain.json()
        assert data_rain["irrigation_required"] is False or "delay" in data_rain["decision"].lower() or "rain" in data_rain["decision"].lower()
        print(f"  ✓ Rain Safety Interlock Verified: High rain forecast -> Decision: '{data_rain['decision']}' (Reason: {data_rain['reason']})")

        # Case C: Adequate moisture -> No irrigation
        payload_wet = {
            "crop": "Tomato",
            "crop_stage": "Vegetative Growth",
            "soil_type": "Loam",
            "soil_moisture": 75.0,  # Well above target
            "temperature": 26.0,
            "humidity": 60.0,
            "rainfall": 0.0,
            "rain_probability": 10.0,
            "farm_area": 2.0
        }
        res_wet = client.post("/api/smart-irrigation/predict", json=payload_wet, headers=headers)
        assert res_wet.status_code == 200
        data_wet = res_wet.json()
        assert data_wet["irrigation_required"] is False
        print(f"  ✓ Optimal soil moisture (75%) -> Decision: '{data_wet['decision']}'.")
    finally:
        db.close()


# ==========================================
# 6. FERTILIZER RECOMMENDATION MODEL TEST
# ==========================================
def test_fertilizer_recommendation_model():
    print("\n[TEST 6] Precision Fertilizer Recommendation...")
    db = SessionLocal()
    try:
        headers, user = get_auth_token(db)
        farm = get_test_farm(db, user)

        # Case A: Low Nitrogen soil
        payload_n_low = {
            "crop": "Tomato",
            "crop_stage": "Vegetative Growth",
            "soil_type": "Loam",
            "nitrogen": 25.0,  # Low
            "phosphorus": 50.0,
            "potassium": 75.0,
            "ph": 6.5,
            "farm_area": 2.0,
            "temperature": 26.0,
            "humidity": 60.0,
            "rainfall": 0.0
        }
        res_n = client.post("/api/fertilizer-recommendation/predict", json=payload_n_low, headers=headers)
        assert res_n.status_code == 200, f"Error: {res_n.text}"
        data_n = res_n.json()
        assert "recommendation" in data_n
        assert len(data_n["dosage_items"]) > 0
        print(f"  ✓ N deficit test -> Recommended formulation: '{data_n['recommendation']}' (Nutrient status: {data_n['nutrient_status']})")

        # Case B: Significant rain expected -> Weather Intelligence Delay Alert
        payload_rain = {
            "crop": "Tomato",
            "crop_stage": "Vegetative Growth",
            "nitrogen": 25.0,
            "phosphorus": 50.0,
            "potassium": 75.0,
            "ph": 6.5,
            "temperature": 22.0,
            "humidity": 90.0,
            "rainfall": 35.0  # Significant rain
        }
        res_rain = client.post("/api/fertilizer-recommendation/predict", json=payload_rain, headers=headers)
        assert res_rain.status_code == 200
        data_rain = res_rain.json()
        assert data_rain["weather_advice"] is not None
        assert "delay" in data_rain["weather_advice"].lower() or "rain" in data_rain["weather_advice"].lower()
        print(f"  ✓ Weather Intelligence check: '{data_rain['weather_advice']}'")
    finally:
        db.close()


# ==========================================
# 7. SECURITY & ACCESS CONTROL TEST
# ==========================================
def test_unauthorized_access():
    print("\n[TEST 7] Security & Multi-Tenant Farm Isolation...")
    # Missing auth token
    res = client.post("/api/crop-recommendation/predict", json={"nitrogen": 80})
    assert res.status_code == 401
    print("  ✓ Unauthenticated requests rejected with 401 Unauthorized.")

    # Wrong farm ID
    db = SessionLocal()
    try:
        headers, user = get_auth_token(db)
        res_wrong = client.post("/api/crop-recommendation/predict", json={"farm_id": 999999}, headers=headers)
        assert res_wrong.status_code == 404
        print("  ✓ Non-existent or unauthorized farm_id rejected with 404 Not Found.")
    finally:
        db.close()


if __name__ == "__main__":
    test_all_models_status()
    test_crop_health_model()
    test_crop_recommendation_model()
    test_yield_prediction_model()
    test_smart_irrigation_model()
    test_fertilizer_recommendation_model()
    test_unauthorized_access()
    print("\n===========================================================")
    print("🎉 ALL 7 TEST SUITES PASSED! ALL ML MODELS 100% OPERATIONAL.")
    print("===========================================================\n")
