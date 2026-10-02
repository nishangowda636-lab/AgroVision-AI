import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.models import MarketPrice

router = APIRouter(prefix="/api/market-prices", tags=["Market Prices"])

INITIAL_MARKET_PRICES = [
    {
        "crop_name": "Tomato",
        "market_name": "Kolar APMC Mandi",
        "state": "Karnataka",
        "price_per_kg": 32.0,
        "prev_price_per_kg": 29.5,
        "demand": "High",
        "trend": "Increasing",
        "historical_json": json.dumps([
            {"day": "Mon", "price": 27.0, "mandi": "Kolar"},
            {"day": "Tue", "price": 28.5, "mandi": "Kolar"},
            {"day": "Wed", "price": 29.0, "mandi": "Kolar"},
            {"day": "Thu", "price": 29.5, "mandi": "Kolar"},
            {"day": "Fri", "price": 31.0, "mandi": "Kolar"},
            {"day": "Sat", "price": 31.5, "mandi": "Kolar"},
            {"day": "Sun", "price": 32.0, "mandi": "Kolar"}
        ])
    },
    {
        "crop_name": "Maize / Corn",
        "market_name": "Davanagere APMC",
        "state": "Karnataka",
        "price_per_kg": 24.5,
        "prev_price_per_kg": 23.0,
        "demand": "High",
        "trend": "Increasing",
        "historical_json": json.dumps([
            {"day": "Mon", "price": 22.0, "mandi": "Davanagere"},
            {"day": "Tue", "price": 22.5, "mandi": "Davanagere"},
            {"day": "Wed", "price": 23.0, "mandi": "Davanagere"},
            {"day": "Thu", "price": 23.5, "mandi": "Davanagere"},
            {"day": "Fri", "price": 23.8, "mandi": "Davanagere"},
            {"day": "Sat", "price": 24.0, "mandi": "Davanagere"},
            {"day": "Sun", "price": 24.5, "mandi": "Davanagere"}
        ])
    },
    {
        "crop_name": "Red Chili (Byadgi)",
        "market_name": "Byadgi APMC Mandi",
        "state": "Karnataka",
        "price_per_kg": 185.0,
        "prev_price_per_kg": 192.0,
        "demand": "Moderate",
        "trend": "Decreasing",
        "historical_json": json.dumps([
            {"day": "Mon", "price": 195.0, "mandi": "Byadgi"},
            {"day": "Tue", "price": 192.0, "mandi": "Byadgi"},
            {"day": "Wed", "price": 190.0, "mandi": "Byadgi"},
            {"day": "Thu", "price": 188.0, "mandi": "Byadgi"},
            {"day": "Fri", "price": 186.5, "mandi": "Byadgi"},
            {"day": "Sat", "price": 185.0, "mandi": "Byadgi"},
            {"day": "Sun", "price": 185.0, "mandi": "Byadgi"}
        ])
    },
    {
        "crop_name": "Paddy / Rice (Sona Masoori)",
        "market_name": "Raichur APMC",
        "state": "Karnataka",
        "price_per_kg": 28.5,
        "prev_price_per_kg": 27.5,
        "demand": "High",
        "trend": "Stable",
        "historical_json": json.dumps([
            {"day": "Mon", "price": 27.0, "mandi": "Raichur"},
            {"day": "Tue", "price": 27.2, "mandi": "Raichur"},
            {"day": "Wed", "price": 27.5, "mandi": "Raichur"},
            {"day": "Thu", "price": 28.0, "mandi": "Raichur"},
            {"day": "Fri", "price": 28.2, "mandi": "Raichur"},
            {"day": "Sat", "price": 28.5, "mandi": "Raichur"},
            {"day": "Sun", "price": 28.5, "mandi": "Raichur"}
        ])
    },
    {
        "crop_name": "Onion (Nashik Red)",
        "market_name": "Nashik APMC",
        "state": "Maharashtra",
        "price_per_kg": 26.0,
        "prev_price_per_kg": 22.0,
        "demand": "High",
        "trend": "Increasing",
        "historical_json": json.dumps([
            {"day": "Mon", "price": 20.0, "mandi": "Nashik"},
            {"day": "Tue", "price": 21.5, "mandi": "Nashik"},
            {"day": "Wed", "price": 22.0, "mandi": "Nashik"},
            {"day": "Thu", "price": 23.5, "mandi": "Nashik"},
            {"day": "Fri", "price": 24.8, "mandi": "Nashik"},
            {"day": "Sat", "price": 25.5, "mandi": "Nashik"},
            {"day": "Sun", "price": 26.0, "mandi": "Nashik"}
        ])
    },
    {
        "crop_name": "Potato (Hassan Jyoti)",
        "market_name": "Hassan APMC",
        "state": "Karnataka",
        "price_per_kg": 22.0,
        "prev_price_per_kg": 21.0,
        "demand": "Moderate",
        "trend": "Stable",
        "historical_json": json.dumps([
            {"day": "Mon", "price": 20.5, "mandi": "Hassan"},
            {"day": "Tue", "price": 21.0, "mandi": "Hassan"},
            {"day": "Wed", "price": 21.0, "mandi": "Hassan"},
            {"day": "Thu", "price": 21.5, "mandi": "Hassan"},
            {"day": "Fri", "price": 21.8, "mandi": "Hassan"},
            {"day": "Sat", "price": 22.0, "mandi": "Hassan"},
            {"day": "Sun", "price": 22.0, "mandi": "Hassan"}
        ])
    },
    {
        "crop_name": "Cotton (Medium Staple)",
        "market_name": "Guntur Mandi",
        "state": "Andhra Pradesh",
        "price_per_kg": 72.0,
        "prev_price_per_kg": 70.0,
        "demand": "High",
        "trend": "Increasing",
        "historical_json": json.dumps([
            {"day": "Mon", "price": 68.0, "mandi": "Guntur"},
            {"day": "Tue", "price": 69.5, "mandi": "Guntur"},
            {"day": "Wed", "price": 70.0, "mandi": "Guntur"},
            {"day": "Thu", "price": 70.8, "mandi": "Guntur"},
            {"day": "Fri", "price": 71.5, "mandi": "Guntur"},
            {"day": "Sat", "price": 71.8, "mandi": "Guntur"},
            {"day": "Sun", "price": 72.0, "mandi": "Guntur"}
        ])
    }
]

@router.get("")
def get_market_prices(db: Session = Depends(get_db)):
    prices = db.query(MarketPrice).all()

    if not prices:
        for p in INITIAL_MARKET_PRICES:
            obj = MarketPrice(**p)
            db.add(obj)
        db.commit()
        prices = db.query(MarketPrice).all()

    return prices

