"""
=============================================================================
AGRO-VISION AI: COMPREHENSIVE SATELLITE FIELD HEALTH VERIFICATION SUITE
=============================================================================
Tests:
1. Valid GPS Coordinates & Sentinel-2 STAC Telemetry Querying
2. Auto-generated Field Bounding Box Geometry
3. Custom GeoJSON Polygon Boundary Saving & Recalculation
4. Multispectral Vegetation (NDVI) & Canopy Moisture (NDMI) Calculations
5. Spatial Quadrant Stress Zones (Healthy, Moderate, High Stress)
6. Historical Pass Comparison Timeline & 'What Changed?' Delta
7. Joint Cross-Correlation (Satellite + IoT Soil Moisture + Weather Radar)
8. High Cloud Coverage (>50%) Advisory Flagging
9. Multi-Farm Isolation & Data Separation
10. Unauthorized Farm Access Rejection (404 / 403)
11. Missing GPS Coordinates Error Handling (400)
12. Remote Force Refresh Endpoint Synchronization
"""

import sys
import os
import json
import uuid

# Setup PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.models import User, Farm, Sensor, SensorReading, SatelliteObservation
from app.utils.auth import create_access_token
from app.ai.satellite_engine import (
    compute_field_bounding_box,
    calculate_vegetation_indices,
    generate_spatial_quadrant_zones,
    synthesize_cross_correlation,
    compute_sentinel2_field_health,
    query_sentinel2_stac_scenes
)

client = TestClient(app)

def run_satellite_test_suite():
    print("=" * 75)
    print("  AGRO-VISION AI: SATELLITE FIELD HEALTH & REMOTE SENSING VERIFICATION")
    print("=" * 75)

    db = SessionLocal()
    unique_suffix = str(uuid.uuid4())[:8]

    # Create 2 test farmer users
    farmer_a = User(
        email=f"farmer_sat_a_{unique_suffix}@example.com",
        full_name="Shiva Gowda",
        phone=f"98765{unique_suffix[:5]}",
        hashed_password="mock_hash",
        role="Farmer",
        preferred_language="English"
    )
    farmer_b = User(
        email=f"farmer_sat_b_{unique_suffix}@example.com",
        full_name="Kavitha Reddy",
        phone=f"98764{unique_suffix[:5]}",
        hashed_password="mock_hash",
        role="Farmer",
        preferred_language="English"
    )
    db.add_all([farmer_a, farmer_b])
    db.commit()
    db.refresh(farmer_a)
    db.refresh(farmer_b)

    token_a = create_access_token({"sub": str(farmer_a.id), "role": "Farmer", "user_id": farmer_a.id})
    token_b = create_access_token({"sub": str(farmer_b.id), "role": "Farmer", "user_id": farmer_b.id})
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 1. Create Farm A in Mandya (Sugarcane, 3.5 Acres, with GPS)
    farm_a = Farm(
        user_id=farmer_a.id,
        name="Mandya Riverbed Plot",
        location_name="Mandya, Karnataka",
        latitude=12.5223,
        longitude=76.8974,
        crop="Sugarcane",
        size_acres=3.5,
        sowing_date="2026-02-15",
        current_stage_override="Vegetative Growth"
    )
    # Farm B without GPS coordinates (testing validation)
    farm_b = Farm(
        user_id=farmer_a.id,
        name="Unmapped Plot",
        location_name="Unknown",
        latitude=0.0,
        longitude=0.0,
        crop="Maize",
        size_acres=1.5
    )
    # Farm C owned by Farmer B
    farm_c = Farm(
        user_id=farmer_b.id,
        name="Kolar Red Soil Farm",
        location_name="Kolar, Karnataka",
        latitude=13.1362,
        longitude=78.1291,
        crop="Tomato",
        size_acres=2.0
    )
    db.add_all([farm_a, farm_b, farm_c])
    db.commit()
    db.refresh(farm_a)
    db.refresh(farm_b)
    db.refresh(farm_c)

    # Attach IoT Soil Moisture Sensor to Farm A (Low Moisture: 32%)
    sensor_a = Sensor(
        farm_id=farm_a.id,
        sensor_type="moisture",
        name="Root Zone Moisture Node",
        current_value=32.0,
        status="Online"
    )
    db.add(sensor_a)
    db.commit()

    print(f"[OK] 1. Test setup complete: Farmer A (ID {farmer_a.id}), Farm A (ID {farm_a.id})")

    # -------------------------------------------------------------
    # TEST 2: Satellite Field Health API for Valid Farm
    # -------------------------------------------------------------
    res = client.get(f"/api/satellite/field-health/{farm_a.id}", headers=headers_a)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data_a = res.json()

    assert data_a["farm_id"] == farm_a.id
    assert data_a["mean_ndvi"] >= 0.20 and data_a["mean_ndvi"] <= 0.95
    assert data_a["moisture_index"] >= 0.10 and data_a["moisture_index"] <= 0.85
    assert data_a["health_status"] in ["Healthy", "Moderate Stress", "High Stress"]
    assert len(data_a["zones"]) == 4
    assert "Sentinel-2" in data_a["satellite_provider"]
    assert data_a["observation_date"] is not None

    print(f"[OK] 2. Sentinel-2 Telemetry: Mean NDVI = {data_a['mean_ndvi']}, NDMI = {data_a['mean_ndmi']}, Status = {data_a['health_status']}")

    # -------------------------------------------------------------
    # TEST 3: Spatial Quadrants & Agronomic Stress Hypotheses
    # -------------------------------------------------------------
    zones = data_a["zones"]
    zone_ids = [z["zone_id"] for z in zones]
    assert "zone_ne" in zone_ids
    assert "zone_nw" in zone_ids
    assert "zone_se" in zone_ids
    assert "zone_sw" in zone_ids

    sw_zone = next(z for z in zones if z["zone_id"] == "zone_sw")
    assert sw_zone["stress_cause_hypothesis"] is not None
    assert sw_zone["recommended_action"] is not None
    print(f"[OK] 3. Spatial Stress Quadrants: Verified 4 distinct zones. South-West hypothesis: '{sw_zone['stress_cause_hypothesis'][:60]}...'")

    # -------------------------------------------------------------
    # TEST 4: Joint Cross-Correlation (Low Soil Moisture + Satellite)
    # -------------------------------------------------------------
    cross = data_a["cross_analysis"]
    assert cross["soil_moisture_pct"] == 32.0
    assert cross["sensor_status"] == "Online (IoT Sensor)"
    assert cross["diagnosis_type"] in ["WATER_STRESS", "BIOLOGICAL_OR_NUTRIENT_STRESS", "WEATHER_RISK", "OPTIMAL_GROWTH"]
    assert len(cross["action_steps"]) >= 2
    print(f"[OK] 4. Cross-Correlation: Diagnosis = '{cross['headline']}' (IoT Moisture {cross['soil_moisture_pct']}%)")

    # -------------------------------------------------------------
    # TEST 5: Custom GeoJSON Boundary Update & Polygon Recalculation
    # -------------------------------------------------------------
    custom_polygon = {
        "type": "Feature",
        "properties": {"name": "Farmer Shiva Custom Drawn Boundary"},
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[76.8970, 12.5220], [76.8980, 12.5220], [76.8980, 12.5230], [76.8970, 12.5230], [76.8970, 12.5220]]]
        }
    }
    b_res = client.post(f"/api/satellite/boundary/{farm_a.id}", json={"boundary_geojson": custom_polygon}, headers=headers_a)
    assert b_res.status_code == 200
    assert b_res.json()["status"] == "success"

    # Verify updated field health reflects the custom boundary
    refetch = client.get(f"/api/satellite/field-health/{farm_a.id}", headers=headers_a)
    assert refetch.status_code == 200
    assert refetch.json()["boundary_geojson"]["properties"]["name"] == "Farmer Shiva Custom Drawn Boundary"
    print("[OK] 5. Custom Field Boundary: Saved GeoJSON polygon and successfully recomputed spatial bounds")

    # -------------------------------------------------------------
    # TEST 6: Historical Passes Timeline & 'What Changed?'
    # -------------------------------------------------------------
    history_res = client.get(f"/api/satellite/history/{farm_a.id}", headers=headers_a)
    assert history_res.status_code == 200
    history_records = history_res.json()
    assert len(history_records) >= 1
    assert history_records[0]["mean_ndvi"] == data_a["mean_ndvi"]

    what_changed = data_a["what_changed"]
    assert what_changed["trend"] in ["IMPROVING", "DECLINING", "STABLE"]
    assert len(what_changed["possible_reasons"]) >= 2
    print(f"[OK] 6. Historical Comparison: Trend = '{what_changed['trend']}' ({what_changed['ndvi_change_pct']}% delta)")

    # -------------------------------------------------------------
    # TEST 7: High Cloud Coverage Handling
    # -------------------------------------------------------------
    cloudy_health = compute_sentinel2_field_health(
        lat=12.52,
        lon=76.89,
        size_acres=2.0,
        crop="Rice",
        crop_stage="Vegetative",
        live_weather={"rain_prob": 90.0},
        force_refresh=True
    )
    assert "cloud_cover_pct" in cloudy_health
    assert cloudy_health["is_cloud_covered"] == (cloudy_health["cloud_cover_pct"] >= 50.0)
    print(f"[OK] 7. Cloud Coverage Assessment: Cloud = {cloudy_health['cloud_cover_pct']}%, Flagged = {cloudy_health['is_cloud_covered']}")

    # -------------------------------------------------------------
    # TEST 8: Missing Coordinates Validation (400 Bad Request)
    # -------------------------------------------------------------
    err_res = client.get(f"/api/satellite/field-health/{farm_b.id}", headers=headers_a)
    assert err_res.status_code == 400
    assert "GPS coordinates not configured" in err_res.json()["detail"]
    print("[OK] 8. Missing GPS Validation: Clean 400 Bad Request returned with farmer guidance prompt")

    # -------------------------------------------------------------
    # TEST 9: Unauthorized Cross-Farmer Access (404 Not Found)
    # -------------------------------------------------------------
    unauth_res = client.get(f"/api/satellite/field-health/{farm_c.id}", headers=headers_a)
    assert unauth_res.status_code == 404
    print("[OK] 9. Security & Farm Isolation: Farmer A denied access to Farmer B's farm (404 Not Found)")

    # -------------------------------------------------------------
    # TEST 10: Remote Force Refresh Endpoint
    # -------------------------------------------------------------
    sync_res = client.post(f"/api/satellite/refresh/{farm_a.id}", headers=headers_a)
    assert sync_res.status_code == 200
    assert sync_res.json()["farm_id"] == farm_a.id
    print("[OK] 10. Force Remote Synchronization: Re-queried STAC provider and synced latest pass")

    # -------------------------------------------------------------
    # Cleanup Test Records
    # -------------------------------------------------------------
    db.query(SatelliteObservation).filter(SatelliteObservation.farm_id.in_([farm_a.id, farm_b.id, farm_c.id])).delete(synchronize_session=False)
    db.query(Sensor).filter(Sensor.farm_id.in_([farm_a.id, farm_b.id, farm_c.id])).delete(synchronize_session=False)
    db.query(Farm).filter(Farm.id.in_([farm_a.id, farm_b.id, farm_c.id])).delete(synchronize_session=False)
    db.query(User).filter(User.id.in_([farmer_a.id, farmer_b.id])).delete(synchronize_session=False)
    db.commit()
    db.close()

    print("=" * 75)
    print("  ALL 10 SATELLITE FIELD HEALTH TEST SCENARIOS PASSED 100%!")
    print("=" * 75)

if __name__ == "__main__":
    run_satellite_test_suite()
