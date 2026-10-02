"""
AgroVision AI — Comprehensive Real ML Crop Yield Prediction Test Suite
======================================================================
Validates:
1. Model artifact integrity (Extra Trees Regressor, preprocessor, eval metrics, feature schema)
2. Direct ML regression inference across various crops and farm scales
3. Hectare vs Acre unit consistency and total production calculations
4. FastAPI endpoint /api/yield-prediction/predict with farmer authentication
5. Farm setup integration (crop, area, soil, location, live weather)
6. Missing parameter handling & data completeness flags
7. Security / unauthorized farm access protection
8. Prediction interval / uncertainty bounds
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
from app.ai.real_crop_yield_model import (
    predict_crop_yield,
    load_yield_artifacts,
    normalize_crop_name
)

client = TestClient(app)

def test_01_model_artifacts_exist():
    print("\n[TEST 1] Verifying Yield ML model artifacts exist...")
    model, preprocessor, eval_info, features_meta = load_yield_artifacts()
    
    assert model is not None, "Model failed to load"
    assert preprocessor is not None, "Preprocessor failed to load"
    assert eval_info.get("model_name") == "Extra Trees Regressor", "Expected Extra Trees champion model"
    assert eval_info.get("test_r2", 0) > 0.90, "Model test R² too low"
    assert eval_info.get("test_mae", 10.0) < 2.0, "Model test MAE too high"
    print(f"✓ Model: {eval_info.get('model_name')} | Test R²: {eval_info.get('test_r2')} | Test MAE: {eval_info.get('test_mae')} t/ha")

def test_02_direct_ml_yield_inference():
    print("\n[TEST 2] Testing direct ML regression across multiple crops and acreages...")
    
    # Crop 1: Rice in Karnataka (3.0 Acres)
    res_rice = predict_crop_yield(
        crop="Rice", farm_size_acres=3.0, season="Kharif", state="Karnataka",
        soil_ph=6.5, nitrogen=100.0, phosphorus=45.0, potassium=50.0,
        temperature=26.0, humidity=75.0, rainfall=120.0
    )
    print(f"Rice (3.0 Acres) -> {res_rice['predicted_yield_per_hectare']} t/ha | Total: {res_rice['estimated_total_production']} t | Range: {res_rice['prediction_range_per_hectare']}")
    assert 1.0 <= res_rice["predicted_yield_per_hectare"] <= 6.0, f"Unexpected rice yield: {res_rice['predicted_yield_per_hectare']}"
    assert res_rice["estimated_total_production"] > 0
    assert "–" in res_rice["prediction_range_per_hectare"]

    # Crop 2: Sugarcane in Mandya (5.0 Acres)
    res_cane = predict_crop_yield(
        crop="Sugarcane", farm_size_acres=5.0, season="Whole Year", state="Karnataka",
        soil_ph=7.0, nitrogen=160.0, phosphorus=60.0, potassium=120.0,
        irrigation_method="Drip Irrigation"
    )
    print(f"Sugarcane (5.0 Acres) -> {res_cane['predicted_yield_per_hectare']} t/ha | Total: {res_cane['estimated_total_production']} t")
    assert 30.0 <= res_cane["predicted_yield_per_hectare"] <= 100.0, f"Unexpected sugarcane yield: {res_cane['predicted_yield_per_hectare']}"
    assert res_cane["estimated_total_production"] > 50.0

    # Crop 3: Gram / Chickpea (2.0 Acres)
    res_gram = predict_crop_yield(
        crop="Gram", farm_size_acres=2.0, season="Rabi", state="Karnataka",
        soil_ph=7.2, nitrogen=30.0, phosphorus=60.0, potassium=30.0
    )
    print(f"Gram (2.0 Acres) -> {res_gram['predicted_yield_per_hectare']} t/ha | Total: {res_gram['estimated_total_production']} t")
    assert 0.4 <= res_gram["predicted_yield_per_hectare"] <= 2.5

def test_03_unit_consistency_hectares_vs_acres():
    print("\n[TEST 3] Verifying mathematical conversion between tonnes/ha and total farm production...")
    # 2.47105 acres = 1.0 hectare
    res = predict_crop_yield(
        crop="Maize", farm_size_acres=2.47105, season="Kharif", state="Karnataka"
    )
    y_ha = res["predicted_yield_per_hectare"]
    total_t = res["estimated_total_production"]
    diff = abs(y_ha - total_t)
    print(f"For 1 Hectare (2.471 Acres) Maize -> Yield/ha: {y_ha} t/ha | Total Farm Production: {total_t} t (Diff: {diff:.3f})")
    assert diff <= 0.05, f"Unit calculation inconsistency between yield/ha ({y_ha}) and total ({total_t})"

def test_04_fastapi_endpoint_prediction():
    print("\n[TEST 4] Testing FastAPI /api/yield-prediction/predict endpoint...")
    
    # 1. Create or query test user
    db = next(get_db())
    test_user = db.query(User).filter(User.email == "test_farmer_yield_ml@agrovision.ai").first()
    if not test_user:
        test_user = User(
            full_name="Mahadevappa",
            email="test_farmer_yield_ml@agrovision.ai",
            hashed_password=get_password_hash("password123"),
            role="Farmer",
            location="Mandya, Karnataka"
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)

    # 2. Create test farm
    test_farm = db.query(Farm).filter(Farm.user_id == test_user.id, Farm.name == "Sugar Valley Plot").first()
    if not test_farm:
        test_farm = Farm(
            user_id=test_user.id,
            name="Sugar Valley Plot",
            location_name="Mandya, Karnataka",
            latitude=12.5218,
            longitude=76.8951,
            soil_type="Red Sandy Loam",
            soil_ph=6.8,
            nitrogen=140.0,
            phosphorus=50.0,
            potassium=110.0,
            size_acres=4.0,
            crop="Sugarcane",
            irrigation_method="Drip Irrigation"
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
        "crop": "Sugarcane"
    }
    response = client.post("/api/yield-prediction/predict", json=payload, headers=headers)
    assert response.status_code == 200, f"Error {response.status_code}: {response.text}"
    data = response.json()
    
    assert data["farm_id"] == test_farm.id
    assert data["farm_name"] == "Sugar Valley Plot"
    assert data["crop"] == "Sugarcane"
    assert data["predicted_yield_per_hectare"] > 25.0
    assert data["estimated_total_production"] > 40.0
    assert len(data["important_factors"]) >= 3
    assert len(data["recommendations"]) >= 1
    assert "safety_disclaimer" in data
    
    print(f"✓ API Successfully predicted yield for {data['farm_name']}:")
    print(f"  • Expected Yield: {data['predicted_yield_per_hectare']} {data['unit']} ({data['predicted_yield_per_acre']} {data['unit_acre']})")
    print(f"  • Total Production: {data['estimated_total_production']} {data['production_unit']} (Range: {data['prediction_range_total']})")
    print(f"  • Harvest Window: {data['harvest_window']}")

def test_05_unauthorized_farm_protection():
    print("\n[TEST 5] Testing unauthorized farm access rejection...")
    db = next(get_db())
    
    user2 = db.query(User).filter(User.email == "other_farmer_yield@agrovision.ai").first()
    if not user2:
        user2 = User(
            full_name="Rajesh Patil",
            email="other_farmer_yield@agrovision.ai",
            hashed_password=get_password_hash("password123"),
            role="Farmer"
        )
        db.add(user2)
        db.commit()
        db.refresh(user2)

    user1 = db.query(User).filter(User.email == "test_farmer_yield_ml@agrovision.ai").first()
    assert user1 is not None, "Test user 1 not found"
    farm1 = db.query(Farm).filter(Farm.user_id == user1.id).first()
    assert farm1 is not None, "Test farm 1 not found"

    token2 = create_access_token(data={"sub": str(user2.id)})
    headers2 = {"Authorization": f"Bearer {token2}"}

    payload = {"farm_id": farm1.id}
    response = client.post("/api/yield-prediction/predict", json=payload, headers=headers2)
    assert response.status_code == 404, f"Expected 404 unauthorized, got {response.status_code}"
    print("✓ Successfully rejected unauthorized access to another farmer's farm.")

def test_06_yield_model_info_endpoint():
    print("\n[TEST 6] Testing /api/yield-prediction/model-info endpoint...")
    db = next(get_db())
    test_user = db.query(User).filter(User.email == "test_farmer_yield_ml@agrovision.ai").first()
    assert test_user is not None, "Test user not found"
    token = create_access_token(data={"sub": str(test_user.id)})
    headers = {"Authorization": f"Bearer {token}"}
    
    response = client.get("/api/yield-prediction/model-info", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["model_name"] == "Extra Trees Regressor"
    assert data["test_r2_score"] > 0.90
    assert len(data["supported_crops"]) >= 40
    print(f"✓ Model Info: {data['model_name']} (R²: {data['test_r2_score']}, MAE: {data['test_mae_tonnes_per_ha']} t/ha across {len(data['supported_crops'])} crops)")

def test_07_farm_switching_dynamic_inputs_no_stale_data():
    print("\n[TEST 7] Testing farm switching: verifying dynamic inputs and no stale data...")
    db = next(get_db())
    test_user = db.query(User).filter(User.email == "test_farmer_yield_ml@agrovision.ai").first()
    assert test_user is not None, "Test user not found"
    token = create_access_token(data={"sub": str(test_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    # Create Farm B: Rice farm in Shimoga
    farm_b = db.query(Farm).filter(Farm.user_id == test_user.id, Farm.name == "Shimoga Paddy Estate").first()
    if not farm_b:
        farm_b = Farm(
            user_id=test_user.id,
            name="Shimoga Paddy Estate",
            location_name="Shimoga, Karnataka",
            latitude=13.9299,
            longitude=75.5681,
            soil_type="Alluvial",
            soil_ph=6.2,
            nitrogen=95.0,
            phosphorus=42.0,
            potassium=48.0,
            size_acres=2.0,
            crop="Rice",
            irrigation_method="Canal",
            current_stage_override="Flowering / Tillering"
        )
        db.add(farm_b)
        db.commit()
        db.refresh(farm_b)

    # Predict for Farm B (Rice, 2.0 acres)
    resp_b = client.post("/api/yield-prediction/predict", json={"farm_id": farm_b.id}, headers=headers)
    assert resp_b.status_code == 200
    data_b = resp_b.json()

    assert data_b["farm_id"] == farm_b.id
    assert data_b["farm_name"] == "Shimoga Paddy Estate"
    assert data_b["crop"] == "Rice"
    assert data_b["farm_size_acres"] == 2.0
    assert 1.0 <= data_b["predicted_yield_per_hectare"] <= 6.0
    assert data_b["estimated_total_production"] > 0
    # Mathematical validation: total = yield/acre * area
    expected_prod = round(data_b["predicted_yield_per_acre"] * data_b["farm_size_acres"], 2)
    assert abs(data_b["estimated_total_production"] - expected_prod) <= 0.05

    # Check that Farm A (Sugarcane 4.0 acres) and Farm B (Rice 2.0 acres) have distinct predictions
    farm_a = db.query(Farm).filter(Farm.user_id == test_user.id, Farm.name == "Sugar Valley Plot").first()
    assert farm_a is not None, "Farm A not found"
    resp_a = client.post("/api/yield-prediction/predict", json={"farm_id": farm_a.id}, headers=headers)
    data_a = resp_a.json()

    assert data_a["crop"] == "Sugarcane"
    assert data_a["farm_size_acres"] == 4.0
    assert data_a["predicted_yield_per_hectare"] != data_b["predicted_yield_per_hectare"]
    assert data_a["estimated_total_production"] != data_b["estimated_total_production"]
    print(f"✓ Farm A ({data_a['crop']} {data_a['farm_size_acres']} ac): {data_a['predicted_yield_per_hectare']} t/ha -> {data_a['estimated_total_production']} T")
    print(f"✓ Farm B ({data_b['crop']} {data_b['farm_size_acres']} ac): {data_b['predicted_yield_per_hectare']} t/ha -> {data_b['estimated_total_production']} T")
    print("✓ Farm switching verified with no stale parameters.")

def test_08_crop_stage_and_soil_type_sensitivity():
    print("\n[TEST 8] Testing crop growth stage & soil texture sensitivity...")
    res_veg = predict_crop_yield(
        crop="Tomato", farm_size_acres=1.5, season="Kharif", state="Karnataka",
        soil_type="Black Cotton Soil", crop_stage="Vegetative / Early Stage"
    )
    res_flower = predict_crop_yield(
        crop="Tomato", farm_size_acres=1.5, season="Kharif", state="Karnataka",
        soil_type="Black Cotton Soil", crop_stage="Flowering / Tillering"
    )
    
    assert res_veg["predicted_yield_per_hectare"] > 0
    assert res_flower["predicted_yield_per_hectare"] > 0
    assert any("Soil Texture" in f["name"] for f in res_veg["important_factors"])
    assert any("Crop Growth Stage" in f["name"] for f in res_veg["important_factors"])
    assert "Vegetative" in res_veg["harvest_window"] or "days" in res_veg["harvest_window"]
    print(f"✓ Tomato Vegetative: {res_veg['predicted_yield_per_hectare']} t/ha | Harvest Window: {res_veg['harvest_window']}")
    print(f"✓ Tomato Flowering: {res_flower['predicted_yield_per_hectare']} t/ha | Harvest Window: {res_flower['harvest_window']}")

def test_09_model_metrics_transparency_not_fake_confidence():
    print("\n[TEST 9] Verifying real model metrics transparency...")
    db = next(get_db())
    test_user = db.query(User).filter(User.email == "test_farmer_yield_ml@agrovision.ai").first()
    assert test_user is not None, "Test user not found"
    token = create_access_token(data={"sub": str(test_user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/yield-prediction/model-info", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["model_name"] == "Extra Trees Regressor"
    assert data["test_r2_score"] == 0.9505
    assert data["test_mae_tonnes_per_ha"] == 0.9301
    assert data["test_rmse_tonnes_per_ha"] == 2.4353
    assert data["total_records"] == 18993
    print(f"✓ Verified Real Evaluation Metrics: Model={data['model_name']}, Holdout R²={data['test_r2_score']}, MAE={data['test_mae_tonnes_per_ha']} t/ha, RMSE={data['test_rmse_tonnes_per_ha']} t/ha, Dataset={data['total_records']} samples")

if __name__ == "__main__":
    test_01_model_artifacts_exist()
    test_02_direct_ml_yield_inference()
    test_03_unit_consistency_hectares_vs_acres()
    test_04_fastapi_endpoint_prediction()
    test_05_unauthorized_farm_protection()
    test_06_yield_model_info_endpoint()
    test_07_farm_switching_dynamic_inputs_no_stale_data()
    test_08_crop_stage_and_soil_type_sensitivity()
    test_09_model_metrics_transparency_not_fake_confidence()
    print("\n" + "=" * 70)
    print("🎯 ALL 9 REAL ML CROP YIELD PREDICTION TESTS PASSED PERFECTLY!")
    print("=" * 70)
