from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Farm, User, Expense
from app.utils.auth import get_current_user
from app.ai.yield_service import predict_crop_yield

router = APIRouter(prefix="/api/profit", tags=["Farm Profit"])

@router.get("/{farm_id}")
def calculate_farm_profit(farm_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    # Predict yield
    yield_data = predict_crop_yield(
        crop=farm.crop or "Tomato",
        farm_size_acres=farm.size_acres or 1.0,
        soil_ph=farm.soil_ph or 6.5,
        n=farm.nitrogen or 140.0,
        p=farm.phosphorus or 40.0,
        k=farm.potassium or 200.0
    )

    expected_tons = yield_data["expected_yield_tons"]
    expected_kg = expected_tons * 1000.0

    # Market price per kg (default ₹32 for Tomato)
    price_per_kg = 32.0 if farm.crop == "Tomato" else 24.5
    estimated_revenue = round(expected_kg * price_per_kg, 2)

    # Cost breakdown per acre
    size = farm.size_acres or 1.0
    seed_cost = round(3500.0 * size, 2)
    fertilizer_cost = round(6500.0 * size, 2)
    labour_cost = round(12000.0 * size, 2)
    irrigation_cost = round(4000.0 * size, 2)
    transport_cost = round(5000.0 * size, 2)
    other_cost = round(2500.0 * size, 2)

    total_cost = round(seed_cost + fertilizer_cost + labour_cost + irrigation_cost + transport_cost + other_cost, 2)
    estimated_profit = round(estimated_revenue - total_cost, 2)
    roi_percent = round((estimated_profit / total_cost) * 100.0, 1) if total_cost > 0 else 0.0

    return {
        "farm_id": farm.id,
        "farm_name": farm.name,
        "crop": farm.crop,
        "size_acres": farm.size_acres,
        "expected_yield_tons": expected_tons,
        "market_price_per_kg": price_per_kg,
        "estimated_revenue": estimated_revenue,
        "estimated_cost": total_cost,
        "estimated_profit": estimated_profit,
        "roi_percent": roi_percent,
        "cost_breakdown": [
            {"category": "Seeds & Saplings", "cost": seed_cost},
            {"category": "Fertilizers & Bio-agents", "cost": fertilizer_cost},
            {"category": "Field Labour", "cost": labour_cost},
            {"category": "Irrigation & Power", "cost": irrigation_cost},
            {"category": "Transport & Packaging", "cost": transport_cost},
            {"category": "Miscellaneous", "cost": other_cost}
        ]
    }
