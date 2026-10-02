from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

def calculate_smart_irrigation(
    crop: str,
    crop_stage: str = "Vegetative Growth",
    soil_moisture_pct: float = 50.0,
    is_sensor_connected: bool = False,
    temp_c: float = 27.5,
    humidity_pct: float = 65.0,
    rain_prob_pct: float = 15.0,
    farm_size_acres: float = 1.0,
    irrigation_method: str = "Drip Irrigation"
) -> Dict[str, Any]:
    """
    Calculates precision irrigation requirement based on crop stage evapotranspiration,
    IoT soil moisture status, live weather forecast, and farm area.
    """
    acres = max(0.1, float(farm_size_acres or 1.0))
    stage_lower = crop_stage.lower()

    # Stage-specific water demand factor (Kc)
    if "seedling" in stage_lower or "emergence" in stage_lower:
        stage_kc = 0.60
        target_moisture = 50.0
        stage_water_note = "Early root establishment requires light, frequent moisture to avoid seed bed drying."
    elif "flower" in stage_lower or "fruit" in stage_lower or "grain" in stage_lower:
        stage_kc = 1.25
        target_moisture = 60.0
        stage_water_note = "Peak reproductive stage: moisture stress causes severe flower abortion and fruit drop."
    elif "ripen" in stage_lower or "matur" in stage_lower or "harvest" in stage_lower:
        stage_kc = 0.55
        target_moisture = 42.0
        stage_water_note = "Late maturity: reducing irrigation enhances sugar accumulation and firm skin."
    else:
        stage_kc = 1.0
        target_moisture = 55.0
        stage_water_note = "Active vegetative canopy growth requires steady transpiration replenishment."

    # 1. Weather Rain Interception
    if rain_prob_pct >= 45.0:
        return {
            "recommended": False,
            "action": "Delay Irrigation",
            "water_amount_liters": 0,
            "duration_minutes": 0,
            "best_time": "N/A (Rain Expected)",
            "reason": f"Rainfall expected in next 24 hours ({int(rain_prob_pct)}% probability). Delaying irrigation saves water, avoids root zone saturation, and prevents nutrient leaching.",
            "why": f"Atmospheric precipitation will provide natural soil replenishment. {stage_water_note}",
            "water_saved_liters": int(1350 * acres * stage_kc),
            "priority": "Warning",
            "is_sensor_connected": is_sensor_connected
        }

    # 2. IoT Sensor Moisture check
    if is_sensor_connected and soil_moisture_pct is not None:
        moisture_deficit = target_moisture - soil_moisture_pct
        if moisture_deficit <= 0:
            return {
                "recommended": False,
                "action": "Maintain Current Level (Soil Moisture Adequate)",
                "water_amount_liters": 0,
                "duration_minutes": 0,
                "best_time": "Next check tomorrow morning",
                "reason": f"Connected IoT soil sensor reading is {soil_moisture_pct:.1f}% (target: {target_moisture}%). Root zone has adequate moisture.",
                "why": f"Over-irrigation in {crop} during the {crop_stage} stage restricts root oxygen availability.",
                "water_saved_liters": 0,
                "priority": "Info",
                "is_sensor_connected": True
            }
    else:
        moisture_deficit = 12.0 # Standard agronomic deficit assumption when sensor is offline

    # 3. Calculate Water Liters
    base_liters_per_acre = 1200.0
    crop_factor = {
        "Tomato": 1.15, "Rice": 1.90, "Paddy": 1.90, "Maize": 0.95,
        "Corn": 0.95, "Wheat": 0.85, "Cotton": 1.05, "Chilli": 1.10,
        "Sugarcane": 1.60, "Groundnut": 0.80, "Potato": 1.10
    }.get(crop.title().strip(), 1.0)

    method_efficiency = {
        "Drip Irrigation": 0.90,
        "Sprinkler": 0.75,
        "Flood Irrigation": 0.50,
        "Furrow Irrigation": 0.60
    }.get(irrigation_method, 0.85)

    temp_factor = 1.0 + max(0.0, (temp_c - 25.0) * 0.03)

    calculated_liters = int(
        (base_liters_per_acre * acres * crop_factor * stage_kc * (moisture_deficit / 15.0) * temp_factor) / method_efficiency
    )
    duration_mins = max(15, int(calculated_liters / (35.0 if "Drip" in irrigation_method else 65.0)))

    priority = "High" if (is_sensor_connected and soil_moisture_pct < 38.0) else "Medium"
    sensor_note = f"IoT soil moisture is {soil_moisture_pct:.1f}%" if is_sensor_connected else "Soil sensor not connected (Standard agronomic buffer used)"

    return {
        "recommended": True,
        "action": "Irrigation Recommended",
        "water_amount_liters": calculated_liters,
        "duration_minutes": duration_mins,
        "best_time": "6:00 AM – 8:30 AM (Early morning to minimize evaporation)",
        "reason": f"{sensor_note}. Crop: {crop} ({crop_stage}), Temperature: {temp_c}°C.",
        "why": f"{stage_water_note} Irrigation via {irrigation_method} restores optimal stomatal transpiration.",
        "water_saved_liters": int(calculated_liters * (1.0 - method_efficiency)),
        "priority": priority,
        "is_sensor_connected": is_sensor_connected
    }


def calculate_fertilizer_recommendation(
    crop: str = "Tomato",
    soil_ph: float = 6.5,
    n: float = 0.0,
    p: float = 0.0,
    k: float = 0.0,
    growth_stage: str = "Vegetative",
    soil_type: str = "Loam",
    variety: str = "Standard Variety",
    farm_size_acres: float = 1.0,
    sowing_date: Optional[str] = None,
    season: str = "Kharif",
    irrigation_method: str = "Drip Irrigation",
    location: str = "Karnataka",
    previous_applications: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Generates agronomy-grounded, precision N-P-K nutrient recommendations for the selected farm.
    Provides structured: RECOMMENDATION, WHY, WHEN, HOW, and SOIL BASIS.
    Calculates exact quantities when soil test data is present; otherwise gives general stage recommendations
    with an explicit notice that exact calculation requires a laboratory soil test.
    """
    crop_norm = crop.title().strip() if crop else "Tomato"
    growth_stage_norm = growth_stage if growth_stage else "Vegetative Growth"
    soil_type_norm = soil_type if soil_type else "Loam"
    acres = max(0.1, float(farm_size_acres or 1.0))
    previous_apps = previous_applications or []

    # 1. Crop Nutrient Profiles (Target kg/acre for standard target yield)
    crop_npk_profiles = {
        "Tomato": {"target_n": 50.0, "target_p": 25.0, "target_k": 50.0, "ratio": "2:1:2", "ph_min": 6.0, "ph_max": 7.0},
        "Potato": {"target_n": 60.0, "target_p": 40.0, "target_k": 60.0, "ratio": "3:2:3", "ph_min": 5.2, "ph_max": 6.5},
        "Cotton": {"target_n": 48.0, "target_p": 24.0, "target_k": 24.0, "ratio": "2:1:1", "ph_min": 6.0, "ph_max": 7.5},
        "Maize": {"target_n": 48.0, "target_p": 24.0, "target_k": 16.0, "ratio": "3:1.5:1", "ph_min": 5.8, "ph_max": 7.2},
        "Corn": {"target_n": 48.0, "target_p": 24.0, "target_k": 16.0, "ratio": "3:1.5:1", "ph_min": 5.8, "ph_max": 7.2},
        "Wheat": {"target_n": 48.0, "target_p": 24.0, "target_k": 16.0, "ratio": "3:1.5:1", "ph_min": 6.0, "ph_max": 7.5},
        "Rice": {"target_n": 40.0, "target_p": 20.0, "target_k": 20.0, "ratio": "2:1:1", "ph_min": 5.5, "ph_max": 6.8},
        "Paddy": {"target_n": 40.0, "target_p": 20.0, "target_k": 20.0, "ratio": "2:1:1", "ph_min": 5.5, "ph_max": 6.8},
        "Chilli": {"target_n": 40.0, "target_p": 20.0, "target_k": 30.0, "ratio": "2:1:1.5", "ph_min": 6.0, "ph_max": 7.0},
        "Chili": {"target_n": 40.0, "target_p": 20.0, "target_k": 30.0, "ratio": "2:1:1.5", "ph_min": 6.0, "ph_max": 7.0},
        "Sugarcane": {"target_n": 100.0, "target_p": 30.0, "target_k": 50.0, "ratio": "3:1:1.5", "ph_min": 6.0, "ph_max": 7.8},
        "Groundnut": {"target_n": 10.0, "target_p": 20.0, "target_k": 30.0, "ratio": "1:2:3", "ph_min": 6.0, "ph_max": 6.8},
        "Soybean": {"target_n": 12.0, "target_p": 32.0, "target_k": 16.0, "ratio": "1:2.5:1", "ph_min": 6.0, "ph_max": 7.0},
        "Onion": {"target_n": 40.0, "target_p": 20.0, "target_k": 40.0, "ratio": "2:1:2", "ph_min": 6.0, "ph_max": 7.0},
        "Ragi": {"target_n": 24.0, "target_p": 16.0, "target_k": 12.0, "ratio": "2:1.3:1", "ph_min": 5.5, "ph_max": 7.5}
    }
    profile = crop_npk_profiles.get(crop_norm, {"target_n": 40.0, "target_p": 20.0, "target_k": 25.0, "ratio": "2:1:1", "ph_min": 6.0, "ph_max": 7.0})

    # 2. Check Soil Test Data Validity
    # Soil test is considered available if any positive test value is provided beyond default zero
    has_soil_test = (n > 0.0 or p > 0.0 or k > 0.0)

    # 3. Check Previous Applications for Duplicate Prevention
    warnings_list = []
    recent_nutrients_applied = set()
    today_dt = datetime.now(timezone.utc)

    for app in previous_apps:
        app_date_str = app.get("date_applied")
        if app_date_str:
            try:
                app_dt = datetime.strptime(app_date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                days_ago = (today_dt - app_dt).days
                if days_ago <= 14:
                    prod = app.get("product_name", "Fertilizer")
                    qty = app.get("quantity", 0)
                    unit = app.get("unit", "kg")
                    nut_focus = app.get("nutrient_focus") or prod
                    recent_nutrients_applied.add(nut_focus.lower())
                    warnings_list.append(
                        f"⚠️ {prod} ({qty} {unit}) was applied {days_ago} day(s) ago on {app_date_str}. Review previous application before applying again to prevent nutrient toxicity."
                    )
            except Exception:
                pass

    # 4. Stage-specific logic & Product recommendations
    stage_lower = growth_stage_norm.lower()

    if "seedling" in stage_lower or "emergence" in stage_lower or "sowing" in stage_lower:
        stage_title = "Seedling / Early Establishment Stage"
        primary_nutrient = "Phosphorus (P) & Starter Nitrogen"
        why_text = f"Young {crop_norm} seedlings prioritize primary root elongation, lateral branching, and mycorrhizal symbiosis. Phosphorus provides the cellular energy (ATP) required for rapid root establishment."
        when_text = "Apply basal dose at the time of field preparation or transplanting. Apply split doses early in the morning."
        how_text = "Place 5 cm to the side and 5 cm below seed/transplant row, or inject water-soluble fertilizer via drip fertigation line."
        products = [
            {
                "product_name": "DAP (Di-Ammonium Phosphate 18:46:0)",
                "nutrient_category": "Phosphorus Source",
                "rate_per_acre_kg": round(profile["target_p"] * 2.17 * 0.60, 1),
                "application_method": "Basal Soil Application",
                "purpose": "Primary source of readily available phosphate for vigorous root establishment."
            },
            {
                "product_name": "Neem-Coated Urea (46% N)",
                "nutrient_category": "Nitrogen Source",
                "rate_per_acre_kg": round(profile["target_n"] * 2.17 * 0.25, 1),
                "application_method": "Top-dressing after 15 days",
                "purpose": "Starter nitrogen to support early photosynthetic leaf emergence."
            },
            {
                "product_name": "Organic Vermicompost / Well-Rotted FYM",
                "nutrient_category": "Organic Carbon & Micronutrients",
                "rate_per_acre_kg": 200.0,
                "application_method": "Soil Conditioning",
                "purpose": "Improves soil organic carbon and root rhizosphere biological activity."
            }
        ]
    elif "flower" in stage_lower or "fruit" in stage_lower or "grain" in stage_lower:
        stage_title = "Flowering & Fruit/Grain Setting Stage"
        primary_nutrient = "Potassium (K), Boron & Balanced NPK"
        why_text = f"During flowering and fruit set, {crop_norm} demands high potassium for carbohydrate translocation, pollen tube viability, flower retention, and osmotic regulation to prevent blossom end rot."
        when_text = "Apply in 2 split applications during the active flowering window. Avoid high nitrogen."
        how_text = "Dissolve completely in fertigation tank and inject via drip lines, or apply foliar spray in early morning before 9:00 AM."
        products = [
            {
                "product_name": "Muriate of Potash (MOP 0:0:60) / Sulfate of Potash (0:0:50)",
                "nutrient_category": "Potassium Source",
                "rate_per_acre_kg": round(profile["target_k"] * 1.66 * 0.60, 1),
                "application_method": "Fertigation / Soil Application",
                "purpose": "Essential for flower firmness, fruit set percentage, and cell wall strength."
            },
            {
                "product_name": "19:19:19 (Water Soluble NPK)",
                "nutrient_category": "Balanced Foliar Nutrition",
                "rate_per_acre_kg": 5.0,
                "application_method": "Foliar Spray @ 5g/L water",
                "purpose": "Provides instant, uniform macro-nutrient replenishment to support canopy load."
            },
            {
                "product_name": "Solubor (20% Disodium Octaborate)",
                "nutrient_category": "Boron Micronutrient",
                "rate_per_acre_kg": 1.0,
                "application_method": "Foliar Spray @ 1g/L water",
                "purpose": "Enhances pollen grain germination and prevents blossom abortion."
            }
        ]
    elif "ripen" in stage_lower or "matur" in stage_lower or "harvest" in stage_lower:
        stage_title = "Maturity & Ripening Stage"
        primary_nutrient = "Potassium (K) & Calcium (Ca)"
        why_text = f"At ripening, {crop_norm} requires potassium to convert starches into sugars, develop uniform skin color, and extend post-harvest shelf life. Nitrogen is minimized to allow natural drying/maturation."
        when_text = "Apply 10–14 days prior to first picking. Withhold nitrogen fertilizers."
        how_text = "Fertigation or light foliar spray. Flush irrigation lines thoroughly after application."
        products = [
            {
                "product_name": "Sulfate of Potash (SOP 0:0:50 + 17.5% S)",
                "nutrient_category": "Potassium & Sulfur Source",
                "rate_per_acre_kg": round(profile["target_k"] * 1.5 * 0.30, 1),
                "application_method": "Fertigation",
                "purpose": "Improves fruit Brix sweetness, firmness, and market appeal."
            },
            {
                "product_name": "Calcium Nitrate",
                "nutrient_category": "Calcium & Nitrate",
                "rate_per_acre_kg": 8.0,
                "application_method": "Drip Fertigation",
                "purpose": "Strengthens fruit cuticle cell structure and prevents storage breakdown."
            }
        ]
    else:
        # Default Vegetative Growth
        stage_title = "Active Vegetative Growth Stage"
        primary_nutrient = "Nitrogen (N) & Secondary Sulfur/Zinc"
        why_text = f"During vegetative growth, {crop_norm} requires nitrogen for chlorophyll synthesis, rapid leaf expansion, and robust stem architecture to support future fruit/grain load."
        when_text = "Apply top-dressing in split doses 25 and 45 days after planting, following irrigation."
        how_text = "Broadcast top-dress along drip rows or inject via fertigation system. Incorporate into topsoil."
        products = [
            {
                "product_name": "Neem-Coated Urea (46% N)",
                "nutrient_category": "Primary Nitrogen Source",
                "rate_per_acre_kg": round(profile["target_n"] * 2.17 * 0.50, 1),
                "application_method": "Top-dressing / Fertigation",
                "purpose": "Sustains lush vegetative canopy and active photosynthesis."
            },
            {
                "product_name": "Muriate of Potash (MOP)",
                "nutrient_category": "Potassium Source",
                "rate_per_acre_kg": round(profile["target_k"] * 1.66 * 0.30, 1),
                "application_method": "Soil Application",
                "purpose": "Reinforces stem vascular bundles against lodging and sucking pests."
            },
            {
                "product_name": "Zinc Sulfate (21% Zn)",
                "nutrient_category": "Zinc Micronutrient",
                "rate_per_acre_kg": 5.0,
                "application_method": "Soil / Fertigation",
                "purpose": "Prevents interveinal chlorosis and promotes auxin hormone synthesis."
            }
        ]

    # 5. Soil pH Assessment & Correction
    if soil_ph < profile["ph_min"]:
        ph_status = f"Acidic (pH {soil_ph:.1f}) — Below ideal ({profile['ph_min']}–{profile['ph_max']})"
        ph_guidance = f"Soil acidity may lock phosphorus and calcium uptake. Apply agricultural lime (200 kg/acre) or dolomite to raise soil pH for {crop_norm}."
    elif soil_ph > profile["ph_max"]:
        ph_status = f"Alkaline (pH {soil_ph:.1f}) — Above ideal ({profile['ph_min']}–{profile['ph_max']})"
        ph_guidance = f"High soil pH may induce iron and zinc micronutrient deficiencies. Incorporate agricultural gypsum and organic green manure to moderate soil alkalinity."
    else:
        ph_status = f"Optimal (pH {soil_ph:.1f}) — In ideal range ({profile['ph_min']}–{profile['ph_max']})"
        ph_guidance = "Soil pH is in the optimal buffer range for maximum root nutrient bioavailability."

    # 6. Build Structured Recommendation Items (RECOMMENDATION, WHY, WHEN, HOW, SOIL BASIS)
    structured_items = []
    for prod in products:
        per_acre = float(prod["rate_per_acre_kg"])
        total_farm = round(per_acre * acres, 1)

        # Soil basis note
        if has_soil_test:
            soil_basis_str = f"Calculated using laboratory soil test (N: {n} kg/ha, P: {p} kg/ha, K: {k} kg/ha) calibrated for {crop_norm} on {soil_type_norm}."
            calculated_amount_display = f"{total_farm} kg (for {acres} acres)"
            per_acre_display = f"{per_acre} kg/acre"
        else:
            soil_basis_str = "Standard Agronomic Package of Practices (POP). Exact fertilizer quantity cannot be calculated without laboratory soil-test information."
            calculated_amount_display = f"General dosage: ~{total_farm} kg (estimate for {acres} acres)"
            per_acre_display = f"~{per_acre} kg/acre (General Guide)"

        structured_items.append({
            "recommendation": f"{prod['product_name']} ({prod['nutrient_category']})",
            "fertilizer_name": prod["product_name"],
            "nutrient_category": prod["nutrient_category"],
            "dose_per_acre": per_acre_display,
            "total_for_farm": calculated_amount_display,
            "numeric_qty_total": total_farm if has_soil_test else None,
            "application_method": prod["application_method"],
            "why": f"{prod['purpose']} {why_text}",
            "when": when_text,
            "how": f"{how_text} Ensure soil has adequate moisture before application.",
            "soil_basis": soil_basis_str
        })

    # 7. Summary & Data Transparency
    if has_soil_test:
        summary_title = f"Precision Soil-Test Nutrient Plan for {crop_norm} ({stage_title})"
        calculation_notice = f"Exact nutrient dosage calculated based on your farm's Soil Health Card (pH {soil_ph:.1f}, N: {n}, P: {p}, K: {k})."
    else:
        summary_title = f"Crop-Stage Nutrient Guidelines for {crop_norm} ({stage_title})"
        calculation_notice = "Exact fertilizer quantity cannot be calculated without soil-test information. Add your soil test results in Farm Setup for calibrated dosage."

    precautions = [
        "Never apply chemical fertilizers directly onto dry root balls or wet foliage to prevent osmotic leaf scorching.",
        "Always ensure adequate soil moisture prior to fertilizer top-dressing or fertigation injection.",
        "Avoid applying nitrogenous fertilizers immediately before heavy forecasted rains to prevent leaching into groundwater.",
        f"For {irrigation_method}, ensure water-soluble fertilizers are fully dissolved and flush drip laterals after application.",
        "Use personal protective equipment (gloves and face masks) during handling."
    ]

    return {
        "crop": crop_norm,
        "crop_variety": variety,
        "growth_stage": stage_title,
        "soil_type": soil_type_norm,
        "soil_ph": round(soil_ph, 1),
        "soil_ph_status": ph_status,
        "soil_ph_guidance": ph_guidance,
        "has_soil_test": has_soil_test,
        "calculation_notice": calculation_notice,
        "exact_calculation_available": has_soil_test,
        "target_npk_ratio": profile["ratio"],
        "farm_size_acres": acres,
        "summary": summary_title,
        "primary_focus": primary_nutrient,
        "why": why_text,
        "when": when_text,
        "how": how_text,
        "dosage_items": structured_items,
        "application_warnings": warnings_list,
        "precautions": precautions,
        "disclaimer": "Recommendations formulated according to ICAR and State Agricultural University agronomic standards. Review with local Extension Officer."
    }
