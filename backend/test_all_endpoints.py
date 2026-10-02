import sys
import os
import io
import uuid

# Ensure backend root is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_all_endpoints():
    print("=" * 65)
    print("  AGRO-VISION AI: COMPREHENSIVE ENDPOINT VERIFICATION SUITE")
    print("=" * 65)

    # 1. Root Endpoint
    r = client.get("/")
    assert r.status_code == 200, f"Root failed: {r.text}"
    print(f"[OK] 1. Root: {r.json()['app']} (v{r.json()['version']}) - Status: {r.json()['status']}")

    # 2. Authentication (Register & Login Farmer)
    farmer_email = f"farmer_{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/api/auth/register", json={
        "email": farmer_email,
        "password": "Password123!",
        "full_name": "Ramesh Gowda",
        "phone": "+919876543210",
        "role": "Farmer",
        "preferred_language": "English"
    })
    assert r.status_code == 200, f"Farmer registration failed: {r.text}"
    token_data = r.json()
    farmer_token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {farmer_token}"}
    print(f"[OK] 2. Auth: Farmer registered ({farmer_email}) & JWT acquired")

    # Auth: Login
    r = client.post("/api/auth/login", json={
        "email": farmer_email,
        "password": "Password123!"
    })
    assert r.status_code == 200, f"Farmer login failed: {r.text}"
    print("[OK] 2b. Auth: Farmer login verified")

    # Auth: Me
    r = client.get("/api/auth/me", headers=headers)
    assert r.status_code == 200, f"Auth Me failed: {r.text}"
    farmer_id = r.json()["id"]
    print(f"[OK] 2c. Auth: Current user fetched (ID: {farmer_id}, Name: {r.json()['full_name']})")

    # 3. Farms CRUD
    r = client.post("/api/farms", headers=headers, json={
        "name": "Green Valley Test Farm",
        "location_name": "Kolar, Karnataka",
        "latitude": 13.1367,
        "longitude": 78.1291,
        "size_acres": 3.5,
        "crop": "Tomato",
        "soil_type": "Red Loam",
        "soil_ph": 6.5,
        "nitrogen": 145.0,
        "phosphorus": 45.0,
        "potassium": 210.0,
        "irrigation_method": "Drip Irrigation",
        "sowing_date": "2026-06-01"
    })
    assert r.status_code == 200, f"Create farm failed: {r.text}"
    farm = r.json()
    farm_id = farm["id"]
    print(f"[OK] 3. Farms: Created farm ID {farm_id} ({farm['name']})")

    # List Farms
    r = client.get("/api/farms", headers=headers)
    assert r.status_code == 200, f"List farms failed: {r.text}"
    assert len(r.json()) >= 1, "Expected at least 1 farm"
    print(f"[OK] 3b. Farms: Listed {len(r.json())} farm(s)")

    # Get Single Farm
    r = client.get(f"/api/farms/{farm_id}", headers=headers)
    assert r.status_code == 200, f"Get farm failed: {r.text}"
    print(f"[OK] 3c. Farms: Retrieved farm details for ID {farm_id}")

    # Update Farm
    r = client.put(f"/api/farms/{farm_id}", headers=headers, json={
        "name": "Green Valley Organic Farm",
        "size_acres": 4.0
    })
    assert r.status_code == 200, f"Update farm failed: {r.text}"
    assert r.json()["name"] == "Green Valley Organic Farm"
    print("[OK] 3d. Farms: Updated farm successfully")

    # 4. Crop Recommendations
    r = client.post(f"/api/crops/recommend?farm_id={farm_id}", headers=headers)
    assert r.status_code == 200, f"Crop recommendation failed: {r.text}"
    rankings = r.json().get("rankings", [])
    assert len(rankings) > 0, "Expected crop recommendations"
    print(f"[OK] 4. Crop Recommendation: Top recommendation = {rankings[0]['crop']} ({rankings[0]['suitability']}% match)")

    # 5. Fertilizer Advice
    r = client.post(f"/api/fertilizer/recommend?farm_id={farm_id}", headers=headers)
    assert r.status_code == 200, f"Fertilizer advice failed: {r.text}"
    fert_summary = r.json().get('summary', 'Optimal')
    print(f"[OK] 5. Fertilizer Advice: {fert_summary}")

    # 6. Smart Irrigation Recommendation
    r = client.post(f"/api/irrigation/recommend?farm_id={farm_id}", headers=headers)
    assert r.status_code == 200, f"Irrigation recommendation failed: {r.text}"
    irr_data = r.json()
    print(f"[OK] 6. Smart Irrigation: Action = {irr_data.get('action')}, Water = {irr_data.get('water_amount_liters')} Litres")

    # 7. Yield Forecast
    r = client.post(f"/api/yield/predict?farm_id={farm_id}", headers=headers)
    assert r.status_code == 200, f"Yield prediction failed: {r.text}"
    yield_res = r.json()
    print(f"[OK] 7. Yield Prediction: Expected {yield_res.get('expected_yield_tons')} Tons (Confidence: {yield_res.get('confidence_pct')}%)")

    # 8. Farm Profit Calculation
    r = client.get(f"/api/profit/{farm_id}", headers=headers)
    assert r.status_code == 200, f"Profit calculation failed: {r.text}"
    prof = r.json()
    print(f"[OK] 8. Farm Profit: Revenue = Rs.{prof.get('estimated_revenue')}, Cost = Rs.{prof.get('estimated_cost')}, Profit = Rs.{prof.get('estimated_profit')}")

    # 9. Weather API
    r = client.get(f"/api/weather/{farm_id}", headers=headers)
    assert r.status_code == 200, f"Weather failed: {r.text}"
    w_data = r.json()
    print(f"[OK] 9. Weather: Temp = {w_data.get('temperature')}°C, Condition = {w_data.get('condition')}, Humidity = {w_data.get('humidity')}%")

    # 10. IoT Sensors
    r = client.get(f"/api/sensors/{farm_id}", headers=headers)
    assert r.status_code == 200, f"Sensors failed: {r.text}"
    sensors = r.json()
    assert len(sensors) > 0, "Expected sensors auto-initialized"
    print(f"[OK] 10. Sensors: {len(sensors)} sensor nodes active for farm")

    # Sensor hardware telemetry push
    first_sensor = sensors[0]
    r = client.post("/api/sensors/readings", json={
        "sensor_id": first_sensor["id"],
        "farm_id": farm_id,
        "reading_type": first_sensor["sensor_type"],
        "value": 48.5,
        "unit": first_sensor["unit"]
    })
    assert r.status_code == 200, f"Sensor reading post failed: {r.text}"
    print(f"[OK] 10b. Hardware Telemetry: Ingested reading for sensor {first_sensor['id']}")

    # 11. Disease Detection (Analyze image + History)
    fake_img = io.BytesIO(b"fake_plant_leaf_image_binary_data")
    r = client.post(
        "/api/disease/analyze",
        headers=headers,
        data={"farm_id": farm_id, "plant_part": "Leaf"},
        files={"file": ("leaf.jpg", fake_img, "image/jpeg")}
    )
    assert r.status_code == 200, f"Disease analyze failed: {r.text}"
    disease_data = r.json()
    print(f"[OK] 11. Disease Detection: Detected '{disease_data.get('detected_problem')}' on {disease_data.get('detected_crop')} (Confidence: {disease_data.get('confidence')}%)")

    # Disease History
    r = client.get(f"/api/disease/history?farm_id={farm_id}", headers=headers)
    assert r.status_code == 200, f"Disease history failed: {r.text}"
    assert len(r.json()) >= 1, "Expected at least 1 disease scan in history"
    print(f"[OK] 11b. Disease History: {len(r.json())} scan record(s) retrieved")

    # 12. AI Assistant Chat & Farm Plan
    r = client.post("/api/assistant/chat", headers=headers, json={
        "message": "How do I protect my tomato crop from early blight?",
        "farm_id": farm_id,
        "language": "English",
        "page_context": "dashboard"
    })
    assert r.status_code == 200, f"AI Assistant chat failed: {r.text}"
    print(f"[OK] 12. AI Assistant Chat: Response generated ({len(r.json().get('response', ''))} chars)")

    # Farm Plan
    r = client.get(f"/api/assistant/farm-plan/{farm_id}?language=English", headers=headers)
    assert r.status_code == 200, f"Farm plan failed: {r.text}"
    plan = r.json()
    print(f"[OK] 12b. AI Daily Farm Plan: Farm = {plan.get('farm_name')}, Action Items = {len(plan.get('actions', []))}")

    # 13. Crop Calendar
    r = client.get(f"/api/calendar/summary/{farm_id}", headers=headers)
    assert r.status_code == 200, f"Crop calendar summary failed: {r.text}"
    cal_summary = r.json()
    print(f"[OK] 13. Crop Calendar: Age = {cal_summary.get('crop_age_days')} days, Current Stage = '{cal_summary.get('current_stage')}'")

    # Create calendar event
    r = client.post("/api/calendar/events", headers=headers, json={
        "farm_id": farm_id,
        "event_type": "Fertilizer",
        "title": "Bio-NPK Spray Application",
        "description": "Foliar spray for fruit enlargement",
        "stage": "Fruit Development",
        "event_date": "2026-06-20",
        "cost": 1500.0
    })
    assert r.status_code == 200, f"Create calendar event failed: {r.text}"
    event_id = r.json()["id"]
    print(f"[OK] 13b. Crop Calendar: Created event ID {event_id}")

    # List calendar events
    r = client.get(f"/api/calendar/events/{farm_id}", headers=headers)
    assert r.status_code == 200, f"List calendar events failed: {r.text}"
    print(f"[OK] 13c. Crop Calendar: Listed {len(r.json())} event(s)")

    # Delete calendar event
    r = client.delete(f"/api/calendar/events/{event_id}", headers=headers)
    assert r.status_code == 200, f"Delete calendar event failed: {r.text}"
    print("[OK] 13d. Crop Calendar: Deleted test event")

    # 14. Government Services
    r = client.get("/api/government-services")
    assert r.status_code == 200, f"Government services failed: {r.text}"
    schemes = r.json()
    assert len(schemes) >= 6, "Expected at least 6 schemes"
    print(f"[OK] 14. Government Services: {len(schemes)} schemes loaded")

    # 15. Farm Calculator
    r = client.post("/api/calculator/calculate", json={
        "crop_name": "Tomato",
        "size_acres": 2.5,
        "soil_type": "Loam",
        "irrigation_method": "Drip Irrigation"
    })
    assert r.status_code == 200, f"Calculator failed: {r.text}"
    calc = r.json()
    print(f"[OK] 15. Farm Calculator: Expected Yield = {calc['expected_yield_tons']} Tons, Revenue = Rs.{calc['estimated_revenue_inr']}, Profit = Rs.{calc['estimated_profit_inr']}")

    # 16. Market Prices (APMC Mandis)
    r = client.get("/api/market-prices")
    assert r.status_code == 200, f"Market prices failed: {r.text}"
    commodities = r.json()
    assert len(commodities) >= 5, "Expected market prices data"
    print(f"[OK] 16. Market Prices: {len(commodities)} commodities loaded with live APMC mandi rates")

    # 17. Messaging (Agricultural Officer - Farmer Advisory Communication)
    officer_email = f"officer_{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/api/auth/register", json={
        "email": officer_email,
        "password": "Password123!",
        "full_name": "Dr. Ananya Sharma",
        "phone": "+919123456780",
        "role": "Agricultural Officer",
        "preferred_language": "English"
    })
    assert r.status_code == 200
    officer_token = r.json()["access_token"]
    officer_headers = {"Authorization": f"Bearer {officer_token}"}
    officer_id = client.get("/api/auth/me", headers=officer_headers).json()["id"]

    # Send advisory message from officer to farmer
    r = client.post("/api/messages", headers=officer_headers, json={
        "receiver_id": farmer_id,
        "farm_id": farm_id,
        "content": "Hello Ramesh, please inspect your Tomato crop for early blight symptoms due to recent humidity."
    })
    assert r.status_code == 200, f"Send message failed: {r.text}"
    print(f"[OK] 17. Messages: Agricultural Extension Officer sent advisory message to farmer")

    # Get conversations
    r = client.get("/api/messages/conversations", headers=headers)
    assert r.status_code == 200, f"Get conversations failed: {r.text}"
    assert len(r.json()) >= 1, "Expected active conversation thread"
    print(f"[OK] 17b. Messages: Farmer retrieved {len(r.json())} conversation thread(s)")

    # Get thread messages
    r = client.get(f"/api/messages/{officer_id}", headers=headers)
    assert r.status_code == 200, f"Get thread messages failed: {r.text}"
    assert len(r.json()) >= 1, "Expected message history"
    print(f"[OK] 17c. Messages: Retrieved {len(r.json())} message(s) in thread with officer")

    # 19. Notifications
    r = client.get("/api/notifications", headers=headers)
    assert r.status_code == 200, f"Get notifications failed: {r.text}"
    notifs = r.json()
    assert len(notifs) >= 1, "Expected notifications"
    first_notif = notifs[0]
    print(f"[OK] 19. Notifications: Retrieved {len(notifs)} notification(s)")

    # Mark notification read
    r = client.put(f"/api/notifications/{first_notif['id']}/read", headers=headers)
    assert r.status_code == 200, f"Mark notification read failed: {r.text}"
    print(f"[OK] 19b. Notifications: Marked notification {first_notif['id']} as read")

    # 20. Admin & Officer Dashboard
    officer_email = f"officer_{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/api/auth/register", json={
        "email": officer_email,
        "password": "Password123!",
        "full_name": "Dr. Ananya Sharma (Agri Officer)",
        "phone": "+919988776655",
        "role": "Agricultural Officer",
        "preferred_language": "English"
    })
    assert r.status_code == 200
    officer_token = r.json()["access_token"]
    officer_headers = {"Authorization": f"Bearer {officer_token}"}

    r = client.get("/api/admin/stats", headers=officer_headers)
    assert r.status_code == 200, f"Admin stats failed: {r.text}"
    admin_stats = r.json()
    print(f"[OK] 20. Admin & Officer Stats: Total Farms = {admin_stats.get('total_farms')}, Total Detections = {admin_stats.get('total_detections')}")

    # 22. Regional Crop Intelligence Engine
    r = client.get("/api/regions")
    assert r.status_code == 200, f"List regions failed: {r.text}"
    regions_data = r.json()
    assert len(regions_data) >= 1, "Expected regional data"
    print(f"[OK] 22. Regions: Retrieved {len(regions_data)} supported agricultural states")

    r = client.get("/api/regions/Karnataka/Mandya/crops")
    assert r.status_code == 200, f"District crops profile failed: {r.text}"
    print(f"[OK] 22b. Regions: Fetched Mandya district profile (Zone: {r.json()['climate_zone']})")

    r = client.post("/api/regions/recommend", json={
        "state": "Karnataka",
        "district": "Kolar",
        "farm_size_acres": 2.5,
        "soil_type": "Red Loam",
        "soil_ph": 6.5,
        "nitrogen": 140.0,
        "phosphorus": 40.0,
        "potassium": 200.0,
        "water_source": "Borewell",
        "season": "Kharif (Monsoon)"
    })
    assert r.status_code == 200, f"Regional recommendation failed: {r.text}"
    rec_res = r.json()
    assert len(rec_res["recommended_crops"]) >= 1, "Expected recommended crops"
    print(f"[OK] 22c. Regional Intelligence: Generated {len(rec_res['recommended_crops'])} crop suitability recommendations (Top: {rec_res['recommended_crops'][0]['crop_name']} @ {rec_res['recommended_crops'][0]['suitability_score']}%)")

    # 23. Smart Borewell & Irrigation IoT Controller
    r = client.get(f"/api/pumps/{farm_id}", headers=headers)
    assert r.status_code == 200, f"Get pump failed: {r.text}"
    pump_node = r.json()
    print(f"[OK] 23. Smart Borewell: Initialized controller for Farm {farm_id} (Status: {pump_node['status']}, Mode: {pump_node['mode']})")

    # Ensure rain lock is cleared for manual pump test if needed
    if pump_node.get("rain_lock"):
        client.post(f"/api/pumps/{farm_id}/command", headers=headers, json={"command": "TOGGLE_RAIN_LOCK"})

    # Send pump command
    r = client.post(f"/api/pumps/{farm_id}/command", headers=headers, json={
        "command": "PUMP_ON",
        "duration_mins": 40,
        "reason": "Test drip cycle"
    })
    assert r.status_code == 200, f"Pump ON failed: {r.text}"
    assert r.json()["status"] == "ON"
    print("[OK] 23b. Smart Borewell: Executed PUMP_ON command successfully")

    # Send pump stop command
    r = client.post(f"/api/pumps/{farm_id}/command", headers=headers, json={
        "command": "PUMP_OFF",
        "reason": "Target moisture attained"
    })
    assert r.status_code == 200, f"Pump OFF failed: {r.text}"
    assert r.json()["status"] == "OFF"
    print("[OK] 23c. Smart Borewell: Executed PUMP_OFF command successfully")

    # Check pump events audit log
    r = client.get(f"/api/pumps/{farm_id}/events", headers=headers)
    assert r.status_code == 200, f"Pump events failed: {r.text}"
    assert len(r.json()) >= 1, "Expected pump activity events"
    print(f"[OK] 23d. Smart Borewell: Retrieved {len(r.json())} controller activity log event(s)")

    # 25. Farmer Profile & Language Updates
    r = client.put("/api/auth/profile", headers=headers, json={
        "full_name": "Ramesh Gowda (Kisan Ratna)",
        "location": "Mandya, Karnataka",
        "temperature_unit": "C",
        "area_unit": "Acres",
        "currency": "INR",
        "notify_weather": True,
        "notify_irrigation": True
    })
    assert r.status_code == 200, f"Profile update failed: {r.text}"
    assert r.json()["full_name"] == "Ramesh Gowda (Kisan Ratna)"
    print("[OK] 25. Profile: Updated farmer profile and farming preferences")

    r = client.put("/api/auth/language", headers=headers, json={
        "language": "Kannada"
    })
    assert r.status_code == 200, f"Language update failed: {r.text}"
    assert r.json()["preferred_language"] == "Kannada"
    print("[OK] 25b. Profile: Persisted preferred language (Kannada) to database")

    # 26. Central Decision Engine Farm Action Plan
    r = client.get(f"/api/assistant/farm-plan/{farm_id}?language=Kannada", headers=headers)
    assert r.status_code == 200, f"Farm decision plan failed: {r.text}"
    plan = r.json()
    assert len(plan["actions"]) >= 1, "Expected central action recommendations"
    print(f"[OK] 26. Central Decision Engine: Generated {len(plan['actions'])} prioritized daily tasks with voice script")

    # 21. Delete Farm Cleanup
    r = client.delete(f"/api/farms/{farm_id}", headers=headers)
    assert r.status_code == 200, f"Delete farm failed: {r.text}"
    print(f"[OK] 21. Cleanup: Deleted test farm ID {farm_id}")

    print("=" * 65)
    print("ALL AGRO-VISION AI MODULES & UPGRADED ENDPOINTS VERIFIED 100%!")
    print("=" * 65)

if __name__ == "__main__":
    test_all_endpoints()

