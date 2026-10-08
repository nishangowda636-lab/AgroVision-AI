from fastapi import APIRouter
from app.schemas.schemas import CalculatorRequest, CalculatorResponse

router = APIRouter(prefix="/api/calculator", tags=["Farm Calculator"])

CROP_BENCHMARKS = {
    "Tomato": {
        "seed_rate_kg_acre": 0.15, # 150g hybrid seed
        "n_kg_acre": 50.0,
        "p_kg_acre": 30.0,
        "k_kg_acre": 40.0,
        "water_liters_acre_day": 1200.0,
        "yield_tons_acre": 12.0,
        "market_price_kg": 32.0,
        "seed_cost_acre": 3500.0,
        "fert_cost_acre": 6500.0,
        "labour_cost_acre": 12000.0,
        "irrigation_cost_acre": 4000.0,
        "transport_cost_acre": 5000.0,
        "misc_cost_acre": 2500.0
    },
    "Chili": {
        "seed_rate_kg_acre": 0.5,
        "n_kg_acre": 45.0,
        "p_kg_acre": 25.0,
        "k_kg_acre": 35.0,
        "water_liters_acre_day": 950.0,
        "yield_tons_acre": 6.5,
        "market_price_kg": 65.0,
        "seed_cost_acre": 4000.0,
        "fert_cost_acre": 6000.0,
        "labour_cost_acre": 14000.0,
        "irrigation_cost_acre": 3500.0,
        "transport_cost_acre": 4000.0,
        "misc_cost_acre": 2000.0
    },
    "Maize": {
        "seed_rate_kg_acre": 8.0,
        "n_kg_acre": 60.0,
        "p_kg_acre": 25.0,
        "k_kg_acre": 20.0,
        "water_liters_acre_day": 1400.0,
        "yield_tons_acre": 3.8,
        "market_price_kg": 24.0,
        "seed_cost_acre": 2200.0,
        "fert_cost_acre": 5000.0,
        "labour_cost_acre": 6000.0,
        "irrigation_cost_acre": 3000.0,
        "transport_cost_acre": 3500.0,
        "misc_cost_acre": 1500.0
    },
    "Cotton": {
        "seed_rate_kg_acre": 2.0,
        "n_kg_acre": 50.0,
        "p_kg_acre": 25.0,
        "k_kg_acre": 25.0,
        "water_liters_acre_day": 1100.0,
        "yield_tons_acre": 1.4,
        "market_price_kg": 72.0,
        "seed_cost_acre": 3000.0,
        "fert_cost_acre": 5500.0,
        "labour_cost_acre": 13000.0,
        "irrigation_cost_acre": 3500.0,
        "transport_cost_acre": 3000.0,
        "misc_cost_acre": 2000.0
    },
    "Coffee": {
        "seed_rate_kg_acre": 1.0,
        "n_kg_acre": 65.0,
        "p_kg_acre": 45.0,
        "k_kg_acre": 65.0,
        "water_liters_acre_day": 1100.0,
        "yield_tons_acre": 0.85,
        "market_price_kg": 280.0,
        "seed_cost_acre": 4500.0,
        "fert_cost_acre": 8500.0,
        "labour_cost_acre": 18000.0,
        "irrigation_cost_acre": 3500.0,
        "transport_cost_acre": 4000.0,
        "misc_cost_acre": 3000.0
    },
    "Black Pepper": {
        "seed_rate_kg_acre": 0.5,
        "n_kg_acre": 40.0,
        "p_kg_acre": 20.0,
        "k_kg_acre": 55.0,
        "water_liters_acre_day": 850.0,
        "yield_tons_acre": 0.65,
        "market_price_kg": 520.0,
        "seed_cost_acre": 3800.0,
        "fert_cost_acre": 6500.0,
        "labour_cost_acre": 15000.0,
        "irrigation_cost_acre": 3000.0,
        "transport_cost_acre": 3000.0,
        "misc_cost_acre": 2500.0
    },
    "Pepper": {
        "seed_rate_kg_acre": 0.5,
        "n_kg_acre": 40.0,
        "p_kg_acre": 20.0,
        "k_kg_acre": 55.0,
        "water_liters_acre_day": 850.0,
        "yield_tons_acre": 0.65,
        "market_price_kg": 520.0,
        "seed_cost_acre": 3800.0,
        "fert_cost_acre": 6500.0,
        "labour_cost_acre": 15000.0,
        "irrigation_cost_acre": 3000.0,
        "transport_cost_acre": 3000.0,
        "misc_cost_acre": 2500.0
    },
    "Cardamom": {
        "seed_rate_kg_acre": 0.3,
        "n_kg_acre": 35.0,
        "p_kg_acre": 35.0,
        "k_kg_acre": 50.0,
        "water_liters_acre_day": 900.0,
        "yield_tons_acre": 0.25,
        "market_price_kg": 1800.0,
        "seed_cost_acre": 5000.0,
        "fert_cost_acre": 9000.0,
        "labour_cost_acre": 22000.0,
        "irrigation_cost_acre": 4000.0,
        "transport_cost_acre": 2500.0,
        "misc_cost_acre": 3500.0
    },
    "Arecanut": {
        "seed_rate_kg_acre": 0.8,
        "n_kg_acre": 45.0,
        "p_kg_acre": 20.0,
        "k_kg_acre": 60.0,
        "water_liters_acre_day": 1300.0,
        "yield_tons_acre": 1.2,
        "market_price_kg": 410.0,
        "seed_cost_acre": 4000.0,
        "fert_cost_acre": 7000.0,
        "labour_cost_acre": 16000.0,
        "irrigation_cost_acre": 4000.0,
        "transport_cost_acre": 3500.0,
        "misc_cost_acre": 2500.0
    },
    "Default": {
        "seed_rate_kg_acre": 5.0,
        "n_kg_acre": 50.0,
        "p_kg_acre": 30.0,
        "k_kg_acre": 30.0,
        "water_liters_acre_day": 1200.0,
        "yield_tons_acre": 4.5,
        "market_price_kg": 30.0,
        "seed_cost_acre": 3000.0,
        "fert_cost_acre": 5500.0,
        "labour_cost_acre": 9000.0,
        "irrigation_cost_acre": 3500.0,
        "transport_cost_acre": 3500.0,
        "misc_cost_acre": 2000.0
    }
}

@router.post("/calculate", response_model=CalculatorResponse)
def calculate_farm_metrics(req: CalculatorRequest):
    bench = CROP_BENCHMARKS.get(req.crop_name, CROP_BENCHMARKS["Default"])
    acres = max(0.1, req.size_acres)

    seed_qty = round(bench["seed_rate_kg_acre"] * acres, 2)
    fert_n = round(bench["n_kg_acre"] * acres, 1)
    fert_p = round(bench["p_kg_acre"] * acres, 1)
    fert_k = round(bench["k_kg_acre"] * acres, 1)

    # Irrigation requirement
    method_str = (req.irrigation_method or "").lower()
    method_multiplier = 0.7 if "drip" in method_str else 1.0
    water_liters = round(bench["water_liters_acre_day"] * acres * method_multiplier, 0)

    # Yield & Financials
    expected_yield_tons = round(bench["yield_tons_acre"] * acres, 2)
    expected_kg = expected_yield_tons * 1000.0

    seed_cost = round(bench["seed_cost_acre"] * acres, 2)
    fert_cost = round(bench["fert_cost_acre"] * acres, 2)
    labour_cost = round(bench["labour_cost_acre"] * acres, 2)
    irrigation_cost = round(bench["irrigation_cost_acre"] * acres, 2)
    transport_cost = round(bench["transport_cost_acre"] * acres, 2)
    misc_cost = round(bench["misc_cost_acre"] * acres, 2)

    total_cost = round(seed_cost + fert_cost + labour_cost + irrigation_cost + transport_cost + misc_cost, 2)
    est_revenue = round(expected_kg * bench["market_price_kg"], 2)
    est_profit = round(est_revenue - total_cost, 2)

    break_even_price = round(total_cost / expected_kg, 2) if expected_kg > 0 else 0.0
    roi = round((est_profit / total_cost) * 100.0, 1) if total_cost > 0 else 0.0

    cost_breakdown = [
        {"item": "Seed / Saplings", "cost": seed_cost},
        {"item": "Fertilizers & Soil Amendments", "cost": fert_cost},
        {"item": "Field Labour & Intercultural Operations", "cost": labour_cost},
        {"item": "Irrigation & Energy", "cost": irrigation_cost},
        {"item": "Harvest Packaging & Transport", "cost": transport_cost},
        {"item": "Contingency / Miscellaneous", "cost": misc_cost}
    ]

    return CalculatorResponse(
        crop_name=req.crop_name,
        size_acres=acres,
        seed_qty_kg=seed_qty,
        fertilizer_npk_kg={"N": fert_n, "P": fert_p, "K": fert_k},
        irrigation_liters_per_cycle=water_liters,
        expected_yield_tons=expected_yield_tons,
        estimated_cost_inr=total_cost,
        estimated_revenue_inr=est_revenue,
        estimated_profit_inr=est_profit,
        break_even_price_per_kg=break_even_price,
        roi_percent=roi,
        cost_breakdown=cost_breakdown
    )
