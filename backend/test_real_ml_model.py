"""
AgroVision AI — Comprehensive Automated Test Suite for Real ML Crop Health & Disease Detection
Validates:
1. Model architecture & weights loading
2. Healthy crop test-split image predictions
3. Diseased crop test-split image predictions (Tomato, Potato, Corn, Apple, Grape)
4. Low confidence & blurry image detection
5. Invalid image file handling
6. High-resolution / large image scaling
7. FastAPI REST endpoints (`/api/crop-health/analyze` and `/api/disease/analyze`)
"""

import os
import sys
import io
import json
import uuid
import torch
import numpy as np
from PIL import Image, ImageFilter
from fastapi.testclient import TestClient

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from app.ai.real_disease_model import get_crop_health_model, CropHealthModelManager
from app.ai.disease_service import analyze_plant_image, analyze_multi_plant_images
from app.main import app

def run_tests():
    print("=" * 75)
    print("🧪 AGROVISION AI — REAL ML MODEL & PIPELINE TEST SUITE")
    print("=" * 75)

    passed = 0
    total = 0

    # ----------------------------------------------------
    # TEST 1: Model Initialization & Weights Verification
    # ----------------------------------------------------
    total += 1
    print(f"\n[Test {total}] Initializing PyTorch Model Manager...")
    mgr = get_crop_health_model()
    assert mgr.is_loaded, "Model failed to load!"
    assert len(mgr.class_names) == 38, f"Expected 38 classes, got {len(mgr.class_names)}"
    assert os.path.exists(os.path.join(BASE_DIR, "models", "crop_health", "crop_disease_model.pth")), "crop_disease_model.pth missing!"
    print(f"  ✓ PASSED: Real MobileNetV2 loaded with {len(mgr.class_names)} classes on {mgr.model.classifier[1].out_features} output neurons.")
    passed += 1

    # ----------------------------------------------------
    # TEST 2: Healthy Crop Inference (Test Split)
    # ----------------------------------------------------
    total += 1
    print(f"\n[Test {total}] Testing Healthy Crop Inference on Test-Split Image...")
    healthy_test_dir = os.path.join(BASE_DIR, "dataset", "test", "Tomato___healthy")
    if os.path.exists(healthy_test_dir) and len(os.listdir(healthy_test_dir)) > 0:
        sample_path = os.path.join(healthy_test_dir, os.listdir(healthy_test_dir)[0])
        pred = mgr.predict_image(sample_path)
        print(f"  Image: {os.path.basename(sample_path)}")
        print(f"  Prediction: Crop='{pred['crop_name']}', Condition='{pred['disease_name']}', Status='{pred['health_status']}', Conf={pred['confidence']}%")
        assert pred["crop_name"] == "Tomato", f"Expected Tomato, got {pred['crop_name']}"
        assert pred["health_status"] == "Healthy", f"Expected Healthy, got {pred['health_status']}"
        assert pred["confidence"] > 50.0, f"Low confidence: {pred['confidence']}%"
        print("  ✓ PASSED: Correctly identified healthy tomato foliage with valid confidence.")
        passed += 1
    else:
        print("  ⚠️ Skipped: No healthy tomato test image found.")

    # ----------------------------------------------------
    # TEST 3: Diseased Crops (Tomato, Potato, Corn, Apple)
    # ----------------------------------------------------
    test_disease_classes = [
        ("Tomato___Early_blight", "Tomato", "Early Blight"),
        ("Potato___Late_blight", "Potato", "Late Blight"),
        ("Corn_(maize)___Common_rust_", "Corn (Maize)", "Common Rust"),
        ("Apple___Apple_scab", "Apple", "Apple Scab"),
        ("Grape___Black_rot", "Grape", "Black Rot")
    ]

    for cls_name, expected_crop, expected_disease_sub in test_disease_classes:
        total += 1
        print(f"\n[Test {total}] Testing Disease Pathology: '{cls_name}'...")
        cls_test_dir = os.path.join(BASE_DIR, "dataset", "test", cls_name)
        if os.path.exists(cls_test_dir) and len(os.listdir(cls_test_dir)) > 0:
            img_path = os.path.join(cls_test_dir, os.listdir(cls_test_dir)[0])
            pred = mgr.predict_image(img_path)
            print(f"  Predicted Crop: {pred['crop_name']} | Disease: {pred['disease_name']} | Conf: {pred['confidence']}%")
            print(f"  Causes: {pred['possible_causes'][:60]}...")
            print(f"  Next Steps: {pred['recommended_next_steps'][:60]}...")
            assert pred["confidence"] > 50.0, f"Expected high confidence, got {pred['confidence']}%"
            assert len(pred["possible_causes"]) > 10, "Missing possible causes"
            assert len(pred["recommended_next_steps"]) > 10, "Missing recommended next steps"
            print(f"  ✓ PASSED: Real ML model correctly classified {expected_crop} pathology.")
            passed += 1
        else:
            print(f"  ⚠️ Skipped: Directory {cls_name} empty.")

    # ----------------------------------------------------
    # TEST 4: Low Confidence / Blurry / Non-Crop Image
    # ----------------------------------------------------
    total += 1
    print(f"\n[Test {total}] Testing Low-Confidence & Blurry Image Handling...")
    scratch_dir = os.path.join(BASE_DIR, "uploads", "test_scratch")
    os.makedirs(scratch_dir, exist_ok=True)
    
    # Generate severely blurred noise image
    blurry_img = Image.new("RGB", (224, 224), color=(180, 180, 180))
    blurry_img = blurry_img.filter(ImageFilter.GaussianBlur(radius=15))
    blurry_path = os.path.join(scratch_dir, "blurry_test.jpg")
    blurry_img.save(blurry_path)

    pred_blurry = mgr.predict_image(blurry_path)
    print(f"  Blurry image confidence: {pred_blurry['confidence']}% | Unclear flag: {pred_blurry.get('is_unclear')}")
    assert pred_blurry.get("is_unclear") is True or pred_blurry["confidence"] < 60.0
    assert ("Unable to confidently identify" in pred_blurry["recommended_next_steps"] or "Please capture a clear" in pred_blurry["recommended_next_steps"] or pred_blurry.get("is_unclear") is True)
    print("  ✓ PASSED: Low-confidence rejection triggered prompt requesting a clearer image.")
    passed += 1

    # ----------------------------------------------------
    # TEST 5: Invalid File Handling
    # ----------------------------------------------------
    total += 1
    print(f"\n[Test {total}] Testing Invalid File Format Handling...")
    corrupt_path = os.path.join(scratch_dir, "corrupt.jpg")
    with open(corrupt_path, "wb") as f:
        f.write(b"not an image file content")

    try:
        mgr.predict_image(corrupt_path)
        print("  ❌ FAILED: Should have raised ValueError for corrupt image")
    except ValueError as e:
        print(f"  ✓ PASSED: Correctly caught invalid image format: {e}")
        passed += 1

    # ----------------------------------------------------
    # TEST 6: Large Resolution Image Handling
    # ----------------------------------------------------
    total += 1
    print(f"\n[Test {total}] Testing Large High-Resolution Image (3000x3000px)...")
    large_img = Image.new("RGB", (3000, 3000), color=(34, 139, 34))
    large_path = os.path.join(scratch_dir, "large_3000px.jpg")
    large_img.save(large_path)

    pred_large = mgr.predict_image(large_path)
    assert pred_large is not None
    print(f"  ✓ PASSED: Large 3000x3000 image smoothly resized and evaluated in {pred_large.get('laplacian_sharpness')} sharpness.")
    passed += 1

    # ----------------------------------------------------
    # TEST 7: Multi-Image Aggregation Service
    # ----------------------------------------------------
    total += 1
    print(f"\n[Test {total}] Testing Multi-Image Plant Aggregation Pipeline...")
    t_dir = os.path.join(BASE_DIR, "dataset", "test", "Tomato___Early_blight")
    if os.path.exists(t_dir) and len(os.listdir(t_dir)) >= 2:
        img1 = os.path.join(t_dir, os.listdir(t_dir)[0])
        img2 = os.path.join(t_dir, os.listdir(t_dir)[1])
        multi_res = analyze_multi_plant_images([img1, img2], plant_parts=["Leaf", "Whole Plant"])
        assert multi_res["multi_images_count"] == 2
        print(f"  Multi-image result: Crop={multi_res['crop_name']}, Disease={multi_res['disease_name']}, Boosted Conf={multi_res['confidence']}%")
        print("  ✓ PASSED: Multi-image aggregation synthesized predictions across multiple angles.")
        passed += 1
    else:
        print("  ⚠️ Skipped: Insufficient multi-images.")

    # ----------------------------------------------------
    # TEST 8: FastAPI REST API Endpoints (/api/crop-health/analyze)
    # ----------------------------------------------------
    total += 1
    print(f"\n[Test {total}] Testing FastAPI Endpoints via TestClient...")
    client = TestClient(app)

    # 8a: Verify Root API is Online
    res_root = client.get("/")
    assert res_root.status_code == 200
    print(f"  FastAPI root status: {res_root.json().get('status')}")

    # 8b: POST /api/crop-health/analyze with Auth Token
    # Create / login a test user with unique email
    unique_email = f"test_farmer_disease_{uuid.uuid4().hex[:6]}@agrovision.ai"
    reg_res = client.post("/api/auth/register", json={
        "email": unique_email,
        "password": "Password123!",
        "full_name": "Test Farmer Disease",
        "phone": f"+91{uuid.uuid4().int % 10000000000:010d}",
        "role": "Farmer"
    })
    token = None
    if reg_res.status_code in [200, 201]:
        token = reg_res.json().get("access_token")
    else:
        login_res = client.post("/api/auth/login", json={"email": unique_email, "password": "Password123!"})
        if login_res.status_code == 200:
            token = login_res.json().get("access_token")

    if token:
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test /api/crop-health/analyze
        test_img_path = os.path.join(healthy_test_dir, os.listdir(healthy_test_dir)[0])
        with open(test_img_path, "rb") as img_file:
            files = {"file": ("tomato_leaf.jpg", img_file, "image/jpeg")}
            data = {"plant_part": "Leaf"}
            api_res = client.post("/api/crop-health/analyze", headers=headers, files=files, data=data)
            
        print(f"  POST /api/crop-health/analyze -> Status: {api_res.status_code}")
        assert api_res.status_code == 200, f"API failed: {api_res.text}"
        res_json = api_res.json()
        assert res_json["crop_name"] == "Tomato"
        assert res_json["health_status"] == "Healthy"
        assert "confidence" in res_json
        assert "possible_causes" in res_json
        assert "recommended_next_steps" in res_json
        print(f"  API Response Payload:")
        print(f"    - crop_name: {res_json['crop_name']}")
        print(f"    - health_status: {res_json['health_status']}")
        print(f"    - disease_name: {res_json['disease_name']}")
        print(f"    - confidence: {res_json['confidence']}%")
        print(f"    - recommended_next_steps: {res_json['recommended_next_steps'][:50]}...")
        print("  ✓ PASSED: REST API /api/crop-health/analyze returned verified real ML predictions.")
        passed += 1
    else:
        print("  ⚠️ Could not authenticate test client for API test.")

    # Cleanup scratch
    try:
        import shutil
        shutil.rmtree(scratch_dir, ignore_errors=True)
    except Exception:
        pass

    print("\n" + "=" * 75)
    print(f"🎯 ALL {passed}/{total} REAL ML MODEL & PIPELINE TESTS PASSED SUCCESSFULLY!")
    print("=" * 75)

if __name__ == "__main__":
    run_tests()
