import os
from dotenv import load_dotenv

_base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_env_path = os.path.join(_base_dir, ".env")
if os.path.exists(_env_path):
    load_dotenv(_env_path)
else:
    load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database.session import engine, Base, run_auto_migrations
from app.utils.storage import UPLOAD_DIR
from app.routers import (
    auth, farms, weather, sensors, disease, irrigation, smart_irrigation,
    fertilizer, fertilizer_recommendation, crops, yield_api, market_prices,
    profit, assistant, notifications, admin, messages,
    calendar, government_services, government_schemes, calculator, regions, pumps,
    ledger, ai_farm_agent, models_status, marketplace
)

# Initialize database tables and run schema auto-migrations
try:
    Base.metadata.create_all(bind=engine)
    run_auto_migrations()
except Exception as e:
    import logging
    logging.getLogger("uvicorn.error").warning(f"Database initialization deferred: {e}")

app = FastAPI(
    title="AgroVision AI API",
    description="AI-Powered Intelligent Farming Ecosystem - Backend Services",
    version="1.0.0"
)

# CORS Configuration for React Frontend (supports environment override in production)
cors_origins_raw = os.getenv("CORS_ORIGINS", "")
if cors_origins_raw and cors_origins_raw.strip() != "*":
    allowed_origins = [orig.strip() for orig in cors_origins_raw.split(",") if orig.strip()]
    for dev_orig in ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"]:
        if dev_orig not in allowed_origins:
            allowed_origins.append(dev_orig)
else:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for image uploads
app.mount("/static/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Mount Routers
app.include_router(auth.router)
app.include_router(farms.router)
app.include_router(ai_farm_agent.router)
app.include_router(weather.router)
app.include_router(sensors.router)
app.include_router(pumps.router)
app.include_router(disease.router)
app.include_router(disease.crop_health_router)
app.include_router(smart_irrigation.router)
app.include_router(irrigation.router)
app.include_router(fertilizer_recommendation.router)
app.include_router(fertilizer.router)
app.include_router(crops.router)
app.include_router(crops.legacy_crops_router)
app.include_router(regions.router)
app.include_router(yield_api.router)
app.include_router(yield_api.legacy_yield_router)
app.include_router(market_prices.router)
app.include_router(profit.router)
app.include_router(assistant.router)
app.include_router(calendar.router)
app.include_router(government_services.router)
app.include_router(government_schemes.router)
app.include_router(calculator.router)
app.include_router(ledger.router)
app.include_router(notifications.router)
app.include_router(messages.router)
app.include_router(admin.router)
app.include_router(models_status.router)
app.include_router(marketplace.router)

@app.get("/")
def root():
    return {
        "app": "AgroVision AI API",
        "status": "Online",
        "tagline": "Intelligent Farming • Better Tomorrow",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
