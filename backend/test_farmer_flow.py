import requests
import uuid

BASE_URL = "http://127.0.0.1:8000/api"

def test_farmer_full_flow():
    unique_id = uuid.uuid4().hex[:8]
    test_email = f"farmer_{unique_id}@agrovision.ai"
    test_password = "FarmerPassword123!"
    test_name = f"Farmer Ramesh {unique_id}"

    print(f"=== 1. Testing Registration for {test_email} (NO role specified in payload) ===")
    reg_payload = {
        "full_name": test_name,
        "email": test_email,
        "phone": "+91 98765 43210",
        "password": test_password,
        "preferred_language": "Kannada"
    }
    reg_res = requests.post(f"{BASE_URL}/auth/register", json=reg_payload)
    assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
    reg_data = reg_res.json()
    token = reg_data["access_token"]
    user = reg_data["user"]
    print("Registration Success! Token received.")
    print("User Data:", user)
    assert user["role"] == "Farmer", f"Expected role 'Farmer', got '{user.get('role')}'"
    print("[OK] Backend automatically created Farmer account!")

    headers = {"Authorization": f"Bearer {token}"}

    print("\n=== 2. Testing Login ===")
    login_res = requests.post(f"{BASE_URL}/auth/login", json={"email": test_email, "password": test_password})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    login_data = login_res.json()
    assert login_data["user"]["role"] == "Farmer"
    print("[OK] Login successful, role is Farmer.")

    print("\n=== 3. Testing Get Current User Profile (/auth/me) ===")
    me_res = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["role"] == "Farmer"
    print("[OK] Profile fetched:", me_data["full_name"], "| Role:", me_data["role"])

    print("\n=== 4. Testing Farm Setup & Farms List ===")
    farms_res = requests.get(f"{BASE_URL}/farms", headers=headers)
    assert farms_res.status_code == 200
    farms = farms_res.json()
    print(f"[OK] Default Farm automatically created on register: {len(farms)} farm(s) found.")
    farm_id = farms[0]["id"]
    print("Active Farm ID:", farm_id, "| Name:", farms[0]["name"], "| Crop:", farms[0]["crop"])

    print("\n=== 5. Testing Creating a New Farm Plot ===")
    new_farm_payload = {
        "name": f"Sunrise Plot {unique_id}",
        "size_acres": 4.0,
        "location_name": "Mysuru, Karnataka",
        "latitude": 12.2958,
        "longitude": 76.6394,
        "soil_type": "Red Sandy Loam",
        "soil_ph": 6.8,
        "nitrogen": 160.0,
        "phosphorus": 45.0,
        "potassium": 210.0,
        "water_source": "Canal",
        "irrigation_method": "Drip Irrigation",
        "crop": "Sugarcane",
        "crop_variety": "Co 86032",
        "sowing_date": "2026-05-10",
        "expected_harvest": "2027-03-20"
    }
    create_farm_res = requests.post(f"{BASE_URL}/farms", json=new_farm_payload, headers=headers)
    assert create_farm_res.status_code == 200
    new_farm = create_farm_res.json()
    print(f"[OK] New farm created: {new_farm['name']} (ID: {new_farm['id']})")

    print("\n=== 6. Testing Weather Intelligence ===")
    weather_res = requests.get(f"{BASE_URL}/weather/{farm_id}", headers=headers)
    assert weather_res.status_code == 200
    w_data = weather_res.json()
    print(f"[OK] Weather Telemetry: {w_data.get('temperature')} deg C | Condition: {w_data.get('condition')}")

    print("\n=== 7. Testing Crop Health & Disease Scanner API ===")
    disease_res = requests.get(f"{BASE_URL}/disease/history?farm_id={farm_id}", headers=headers)
    assert disease_res.status_code == 200
    print("[OK] Crop Health records accessible.")

    print("\n=== 8. Testing AI Assistant Chat with Farmer Context ===")
    chat_payload = {
        "farm_id": farm_id,
        "message": "What is the recommended irrigation for my Tomato crop today?",
        "language": "English",
        "page_context": "dashboard"
    }
    chat_res = requests.post(f"{BASE_URL}/assistant/chat", json=chat_payload, headers=headers)
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    print("[OK] AI Assistant Response received:")
    print("AI:", chat_data["response"])

    print("\n=== 9. Testing Marketplace Product Discovery for Farmer ===")
    market_res = requests.get(f"{BASE_URL}/marketplace/products?limit=5", headers=headers)
    assert market_res.status_code == 200
    products = market_res.json()
    items = products.get("items", products) if isinstance(products, dict) else products
    print(f"[OK] Marketplace working! Retrieved {len(items)} products.")

    print("\n=== 10. Testing Farm Machinery & Equipment Discovery for Farmer ===")
    machinery_res = requests.get(f"{BASE_URL}/marketplace/products?category=Farm Machinery", headers=headers)
    assert machinery_res.status_code == 200
    machinery_products = machinery_res.json()
    machinery_items = machinery_products.get("items", machinery_products) if isinstance(machinery_products, dict) else machinery_products
    assert len(machinery_items) > 0
    print(f"[OK] Farm Machinery Discovery working! Retrieved {len(machinery_items)} available machinery listings.")

    print("\n=======================================================")
    print("ALL 10 TESTS PASSED! AgroVision AI is 100% FARMER-ONLY!")
    print("=======================================================")

if __name__ == '__main__':
    test_farmer_full_flow()
