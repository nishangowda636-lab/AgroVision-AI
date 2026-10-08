from dotenv import load_dotenv
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
Base.metadata.create_all(bind=engine)
run_auto_migrations()

app = FastAPI(
    title="AgroVision AI API",
    description="AI-Powered Intelligent Farming Ecosystem - Backend Services",
    version="1.0.0"
)

# CORS Configuration for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
