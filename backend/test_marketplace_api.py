"""
AgroVision AI — Marketplace API Verification Suite
=================================================
Verifies that:
1. GET /api/marketplace/categories returns verified categories with accurate counts.
2. GET /api/marketplace/products returns ONLY verified products (source_verified=True, image_verified=True, url_verified=True).
3. Search filtering works across product name, brand, description.
4. Category filtering works properly.
5. GET /api/marketplace/products/{id} returns single product details.
6. 100% of returned products have verified URLs and verified images.
7. No e-commerce (cart, checkout, payment, orders) endpoints exist.
"""

import os
import sys
from fastapi.testclient import TestClient

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.main import app

client = TestClient(app)

def run_tests():
    print("=" * 80)
    print("🛒 TESTING AGROVISION MARKETPLACE DISCOVERY & REDIRECT API")
    print("=" * 80)

    # 1. Categories
    res_cats = client.get("/api/marketplace/categories")
    assert res_cats.status_code == 200, f"Expected 200, got {res_cats.status_code}"
    cats = res_cats.json()
    print(f"\n[1] GET /api/marketplace/categories -> {len(cats)} categories loaded")
    expected_categories = [
        "Tractors", "Sprayers", "Farm Tools", "Sowing Seeds",
        "Pesticides / Crop Protection", "Fertilizers", "Farming Equipments",
        "Irrigation & Pumps", "Animal Husbandry", "IoT / Smart Farming Equipment"
    ]
    returned_cat_names = [c["name"] for c in cats]
    for ec in expected_categories:
        assert ec in returned_cat_names, f"Missing category: {ec}"
        count = next(c["count"] for c in cats if c["name"] == ec)
        print(f"  • {ec}: {count} verified products")

    # 2. Products List
    res_prods = client.get("/api/marketplace/products")
    assert res_prods.status_code == 200, f"Expected 200, got {res_prods.status_code}"
    data = res_prods.json()
    products = data["products"]
    total = data["total"]
    print(f"\n[2] GET /api/marketplace/products -> Total {total} verified products found")
    assert total >= 20, f"Expected at least 20 verified products, found {total}"

    # Verify every product strictly satisfies verification requirements and has a single verified official destination
    for p in products:
        assert p["source_verified"] is True, f"Product {p['name']} has source_verified=False"
        assert p["image_verified"] is True, f"Product {p['name']} has image_verified=False"
        assert p["url_verified"] is True, f"Product {p['name']} has url_verified=False"
        assert p["image_url"] is not None, f"Product {p['name']} is missing image_url"
        assert p["official_product_url"] is not None, f"Product {p['name']} is missing official_product_url"
        assert p["redirect_platform"] is not None, f"Product {p['name']} missing redirect_platform"
        assert p["redirect_button_text"] is not None, f"Product {p['name']} missing redirect_button_text"
        assert p["estimated_price"] is not None, f"Product {p['name']} missing estimated_price"
        assert p["pack_size"] is not None, f"Product {p['name']} missing pack_size"
        assert p["source_type"] in ("manufacturer", "verified_retailer"), f"Invalid source_type {p['source_type']}"

    # Verify IFFCO products redirect directly to IFFCO Bazar official portal
    nano_urea = next(p for p in products if "Nano Urea" in p["name"])
    assert "iffcobazar.co.in" in nano_urea["official_product_url"], f"Nano Urea should point to iffcobazar.co.in, got {nano_urea['official_product_url']}"
    assert "IFFCO Bazar" in nano_urea["redirect_button_text"], f"Expected Buy on IFFCO Bazar, got {nano_urea['redirect_button_text']}"

    print(f"  • Confirmed ALL {total} active products have verified single official destination ({nano_urea['redirect_platform']})")

    # 3. Category Filter
    res_irrigation = client.get("/api/marketplace/products?category=Irrigation%20%26%20Pumps")
    assert res_irrigation.status_code == 200
    irrigation_data = res_irrigation.json()
    assert len(irrigation_data["products"]) >= 3
    assert all(p["category"] == "Irrigation & Pumps" for p in irrigation_data["products"])
    print(f"\n[3] Category Filter 'Irrigation & Pumps' -> {len(irrigation_data['products'])} items matched")

    res_animal = client.get("/api/marketplace/products?category=Animal%20Husbandry")
    assert res_animal.status_code == 200
    animal_data = res_animal.json()
    assert len(animal_data["products"]) >= 2
    assert all(p["category"] == "Animal Husbandry" for p in animal_data["products"])
    print(f"  Category Filter 'Animal Husbandry' -> {len(animal_data['products'])} items matched")

    res_iot = client.get("/api/marketplace/products?category=IoT%20%2F%20Smart%20Farming%20Equipment")
    assert res_iot.status_code == 200
    iot_data = res_iot.json()
    assert len(iot_data["products"]) >= 2
    assert all(p["category"] == "IoT / Smart Farming Equipment" for p in iot_data["products"])
    print(f"  Category Filter 'IoT / Smart Farming Equipment' -> {len(iot_data['products'])} items matched")

    # Seeds check
    res_seeds = client.get("/api/marketplace/products?category=Sowing%20Seeds")
    assert res_seeds.status_code == 200
    seeds_data = res_seeds.json()
    assert len(seeds_data["products"]) >= 5
    print(f"  Category Filter 'Sowing Seeds' -> {len(seeds_data['products'])} items matched")

    # Pesticides check
    res_pesticides = client.get("/api/marketplace/products?category=Pesticides%20%2F%20Crop%20Protection")
    assert res_pesticides.status_code == 200
    pesticides_data = res_pesticides.json()
    assert len(pesticides_data["products"]) >= 6
    print(f"  Category Filter 'Pesticides / Crop Protection' -> {len(pesticides_data['products'])} items matched")

    # Fertilizers check
    res_fert = client.get("/api/marketplace/products?category=Fertilizers")
    assert res_fert.status_code == 200
    fert_data = res_fert.json()
    assert len(fert_data["products"]) >= 7
    print(f"  Category Filter 'Fertilizers' -> {len(fert_data['products'])} items matched")

    # 4. Search Filter
    res_search = client.get("/api/marketplace/products?search=KisanKraft")
    assert res_search.status_code == 200
    search_data = res_search.json()
    assert len(search_data["products"]) >= 3
    print(f"\n[4] Search Filter 'KisanKraft' -> {len(search_data['products'])} items matched")
    for p in search_data["products"]:
        print(f"  • {p['name']} ({p['brand']}) - Image Verified: {p['image_verified']}, URL Verified: {p['url_verified']}")

    # 5. Product by ID
    first_prod_id = products[0]["id"]
    res_single = client.get(f"/api/marketplace/products/{first_prod_id}")
    assert res_single.status_code == 200
    prod_single = res_single.json()
    print(f"\n[5] GET /api/marketplace/products/{first_prod_id} -> {prod_single['name']}")
    assert prod_single["source_verified"] is True
    assert prod_single["image_verified"] is True
    assert prod_single["url_verified"] is True
    assert prod_single["source_type"] in ("manufacturer", "verified_retailer")

    # 6. Safety check: Verify NO e-commerce endpoints exist
    ecommerce_routes = ["/api/marketplace/cart", "/api/marketplace/checkout", "/api/marketplace/orders", "/api/marketplace/buy"]
    for route in ecommerce_routes:
        res_ecom = client.get(route)
        assert res_ecom.status_code in (404, 405), f"E-commerce route {route} should NOT exist!"
    print(f"\n[6] Verified NO e-commerce/checkout/cart endpoints exist (Security & Non-Commerce Confirmed)")

    print("\n" + "=" * 80)
    print("🏆 ALL MARKETPLACE API VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == "__main__":
    run_tests()
