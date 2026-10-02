"""
AgroVision AI — Comprehensive Real ML Crop Recommendation Test Suite
====================================================================
Validates:
1. Model artifact integrity (Random Forest classifier, scaler, classes, eval metrics)
2. Direct ML inference pipeline & explainable agronomic output
3. FastAPI endpoint /api/crop-recommendation/predict with authentication
4. Farm setup integration (location, soil data, live weather)
5. Missing parameter handling & data completeness flags
6. Security / unauthorized farm access protection
"""

import os
import sys
import json
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Setup test environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database.session import Base, get_db
from app.models.models import User, Farm
from app.utils.auth import create_access_token, get_password_hash
from app.ai.real_crop_recommendation_model import (
    predict_crop_recommendations,
    load_ml_artifacts,
    determine_current_season
)

client = TestClient(app)

def test_01_model_artifacts_exist():
    print("\n[TEST 1] Verifying ML model artifacts exist...")
    model, scaler, classes, eval_info = load_ml_artifacts()
    
    assert model is not None, "Model failed to load"
    assert scaler is not None, "Scaler failed to load"
    assert classes is not None and len(classes) == 22, f"Expected 22 crop classes, found {len(classes) if classes is not None else 0}"
    assert eval_info is not None, "Expected eval_info metadata"
    assert eval_info.get("model_name") == "Random Forest", "Expected Random Forest champion model"
    assert float(eval_info.get("test_accuracy_pct", 0)) > 95.0, "Model test accuracy too low"
    print(f"✓ Model: {eval_info.get('model_name')} | Test Acc: {eval_info.get('test_accuracy_pct')}% | Classes: {len(classes)}")

def test_02_direct_ml_inference_profiles():
    print("\n[TEST 2] Testing direct ML inference across diverse agricultural profiles...")
    
    # Profile A: High N, High Rain -> Expect Rice or Jute or Banana
    res_a = predict_crop_recommendations(
        nitrogen=90.0, phosphorus=42.0, potassium=43.0, ph=6.5,
        temperature=21.0, humidity=82.0, rainfall=200.0, season="Kharif"
    )
    assert len(res_a["recommendations"]) >= 3, "Expected at least 3 recommendations"
    top_crops_a = [r["crop"] for r in res_a["recommendations"]]
    print(f"Profile A (High Rain & N) Top Recommendations: {top_crops_a}")
    assert "rice" in top_crops_a or "jute" in top_crops_a, f"Expected rice or jute in top crops, got {top_crops_a}"

    # Profile B: Low N, High P, Low Rain, Cool -> Expect Chickpea / Lentil
    res_b = predict_crop_recommendations(
        nitrogen=35.0, phosphorus=65.0, potassium=80.0, ph=7.2,
        temperature=18.0, humidity=20.0, rainfall=70.0, season="Rabi"
    )
    top_crops_b = [r["crop"] for r in res_b["recommendations"]]
    print(f"Profile B (Low N, High P, Rabi) Top Recommendations: {top_crops_b}")
    assert any(c in top_crops_b for c in ["chickpea", "lentil", "blackgram", "pigeonpeas", "kidneybeans"]), f"Got {top_crops_b}"

    # Profile C: High K, Moderate Rain -> Expect Fruit Crops (Grapes / Apple / Pomegranate)
    res_c = predict_crop_recommendations(
        nitrogen=25.0, phosphorus=130.0, potassium=200.0, ph=6.2,
        temperature=15.0, humidity=80.0, rainfall=110.0, season="Annual"
    )
    top_crops_c = [r["crop"] for r in res_c["recommendations"]]
    print(f"Profile C (High K, High P) Top Recommendations: {top_crops_c}")
    assert any(c in top_crops_c for c in ["grapes", "apple", "banana"]), f"Got {top_crops_c}"

def test_03_missing_data_handling():
    print("\n[TEST 3] Testing missing parameter detection...")
    res = predict_crop_recommendations(
        nitrogen=None, phosphorus=None, ph=None, temperature=28.0, humidity=65.0, rainfall=100.0
    )
    assert res["data_completeness"] == "partial"
    assert "Nitrogen (N)" in res["missing_parameters"]
    assert "Phosphorus (P)" in res["missing_parameters"]
    assert "Soil pH" in res["missing_parameters"]
    print(f"✓ Correctly flagged missing parameters: {res['missing_parameters']}")

def test_04_fastapi_endpoint_prediction():
    print("\n[TEST 4] Testing FastAPI /api/crop-recommendation/predict endpoint...")
    
    # 1. Create or query test user
    db = next(get_db())
    test_user = db.query(User).filter(User.email == "test_farmer_crop_rec@agrovision.ai").first()
    if not test_user:
        test_user = User(
            full_name="Ramesh Gowda",
            email="test_farmer_crop_rec@agrovision.ai",
            hashed_password=get_password_hash("password123"),
            role="Farmer",
            location="Mandya, Karnataka"
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)

    # 2. Create test farm
    test_farm = db.query(Farm).filter(Farm.user_id == test_user.id, Farm.name == "Cauvery River Farm").first()
    if not test_farm:
        test_farm = Farm(
            user_id=test_user.id,
            name="Cauvery River Farm",
            location_name="Mandya, Karnataka",
            latitude=12.5218,
            longitude=76.8951,
            soil_type="Red Sandy Loam",
            soil_ph=6.8,
            nitrogen=95.0,
            phosphorus=45.0,
            potassium=50.0,
            size_acres=3.5,
            crop="Sugarcane"
        )
        db.add(test_farm)
        db.commit()
        db.refresh(test_farm)

    # 3. Create auth token
    token = create_access_token(data={"sub": str(test_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # 4. Predict using farm context
    payload = {
        "farm_id": test_farm.id,
        "season": "Kharif (Monsoon)"
    }
    response = client.post("/api/crop-recommendation/predict", json=payload, headers=headers)
    assert response.status_code == 200, f"Error {response.status_code}: {response.text}"
    data = response.json()
    
    assert data["farm_id"] == test_farm.id
    assert data["farm_name"] == "Cauvery River Farm"
    assert data["model_used"] == "Random Forest"
    assert len(data["recommendations"]) >= 3
    assert "safety_disclaimer" in data
    
    print(f"✓ API Successfully returned {len(data['recommendations'])} recommendations for farm {data['farm_name']}")
    for i, rec in enumerate(data["recommendations"]):
        print(f"  #{i+1}: {rec['display_name']} (Suitability: {rec['suitability_pct']}%) - {rec['why_recommended']}")

def test_05_unauthorized_farm_protection():
    print("\n[TEST 5] Testing unauthorized farm access rejection...")
    db = next(get_db())
    
    # Create second user
    user2 = db.query(User).filter(User.email == "other_farmer_rec@agrovision.ai").first()
    if not user2:
        user2 = User(
            full_name="Suresh Kumar",
            email="other_farmer_rec@agrovision.ai",
            hashed_password=get_password_hash("password123"),
            role="Farmer"
        )
        db.add(user2)
        db.commit()
        db.refresh(user2)

    # Get farm of user 1
    user1 = db.query(User).filter(User.email == "test_farmer_crop_rec@agrovision.ai").first()
    assert user1 is not None, "Test user 1 not found"
    farm1 = db.query(Farm).filter(Farm.user_id == user1.id).first()
    assert farm1 is not None, "Test farm 1 not found"

    # User 2 tries to access User 1's farm
    token2 = create_access_token(data={"sub": str(user2.id)})
    headers2 = {"Authorization": f"Bearer {token2}"}

    payload = {"farm_id": farm1.id}
    response = client.post("/api/crop-recommendation/predict", json=payload, headers=headers2)
    assert response.status_code == 404, f"Expected 404 unauthorized, got {response.status_code}"
    print("✓ Successfully rejected unauthorized access to another farmer's farm.")

def test_06_model_info_endpoint():
    print("\n[TEST 6] Testing /api/crop-recommendation/model-info endpoint...")
    db = next(get_db())
    test_user = db.query(User).filter(User.email == "test_farmer_crop_rec@agrovision.ai").first()
    assert test_user is not None, "Test user not found"
    token = create_access_token(data={"sub": str(test_user.id)})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get("/api/crop-recommendation/model-info", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_classes"] == 22
    assert "feature_importances" in data
    print(f"✓ Model Info: {data['model_name']} ({data['total_classes']} classes, {data['test_accuracy_pct']}% test accuracy)")

if __name__ == "__main__":
    test_01_model_artifacts_exist()
    test_02_direct_ml_inference_profiles()
    test_03_missing_data_handling()
    test_04_fastapi_endpoint_prediction()
    test_05_unauthorized_farm_protection()
    test_06_model_info_endpoint()
    print("\n" + "=" * 70)
    print("🎯 ALL 6 REAL ML CROP RECOMMENDATION TESTS PASSED PERFECTLY!")
    print("=" * 70)
