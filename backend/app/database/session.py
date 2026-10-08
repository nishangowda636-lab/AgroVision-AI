import os
import sqlite3
import tempfile
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_DB_PATH = os.path.join(BACKEND_DIR, "agrovision.db").replace("\\", "/")

raw_db_url = os.getenv("DATABASE_URL")
if raw_db_url and raw_db_url.strip() not in (
    "sqlite:///./agrovision.db",
    "sqlite:///agrovision.db",
):
    DATABASE_URL: str = raw_db_url.strip()
elif os.getenv("VERCEL"):
    temp_db_path = os.path.join(tempfile.gettempdir(), "agrovision.db").replace("\\", "/")
    DATABASE_URL = f"sqlite:///{temp_db_path}"
else:
    DATABASE_URL = f"sqlite:///{DEFAULT_DB_PATH}"

# Handle SQLite vs PostgreSQL configuration
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def run_auto_migrations():
    """Ensures newly added columns exist in existing SQLite database tables and drops obsolete tables."""
    if not DATABASE_URL.startswith("sqlite"):
        return

    # Drop obsolete tables from previous legacy modules
    obsolete_tables = [
        "marketplace_orders", "marketplace_categories",
        "crop_masters", "sellers", "rental_listings", "rental_requests",
        "marketplace_analytics", "farm_services", "tractor_brands",
        "tractor_sources", "tractor_model_sources", "tractor_models", "tractor_specs"
    ]

    with engine.connect() as conn:
        for tbl in obsolete_tables:
            try:
                conn.execute(text(f"DROP TABLE IF EXISTS {tbl}"))
                conn.commit()
            except Exception:
                pass

    migrations = [
        ("users", "avatar_url", "TEXT"),
        ("users", "location", "TEXT DEFAULT 'Karnataka'"),
        ("users", "temperature_unit", "TEXT DEFAULT 'C'"),
        ("users", "area_unit", "TEXT DEFAULT 'Acres'"),
        ("users", "currency", "TEXT DEFAULT 'INR'"),
        ("users", "notify_weather", "BOOLEAN DEFAULT 1"),
        ("users", "notify_disease", "BOOLEAN DEFAULT 1"),
        ("users", "notify_market", "BOOLEAN DEFAULT 1"),
        ("users", "notify_irrigation", "BOOLEAN DEFAULT 1"),
        ("users", "notify_orders", "BOOLEAN DEFAULT 1"),
        ("farms", "current_stage_override", "TEXT"),
        ("disease_detections", "plant_part", "TEXT DEFAULT 'Leaf'"),
        ("disease_detections", "health_status", "TEXT DEFAULT 'Possible Issue'"),
        ("disease_detections", "visible_symptoms", "TEXT"),
        ("disease_detections", "multi_images_json", "TEXT"),
        ("disease_detections", "trend_status", "TEXT DEFAULT 'Baseline'"),
        ("disease_detections", "weather_correlation", "TEXT"),
        ("disease_detections", "fertilizer_link", "BOOLEAN DEFAULT 0"),
        ("expenses", "type", "TEXT DEFAULT 'expense'"),
        ("expenses", "crop", "TEXT"),
        ("expenses", "quantity", "REAL"),
        ("expenses", "unit", "TEXT"),
        ("expenses", "stage", "TEXT DEFAULT 'Vegetative Growth'"),
        ("expenses", "provenance", "TEXT DEFAULT 'ACTUAL'"),
        ("expenses", "notes", "TEXT"),
        ("expenses", "client_sync_id", "TEXT"),
        ("expenses", "created_at", "DATETIME"),
        ("farms", "boundary_geojson", "TEXT"),
        ("farms", "iot_device_id", "TEXT"),
        ("farm_plan_tasks", "status", "TEXT DEFAULT 'PENDING'"),
        ("farm_plan_tasks", "farmer_note", "TEXT"),
        ("farm_plan_tasks", "completed_at", "DATETIME"),
        ("farm_plan_tasks", "reminded_at", "DATETIME"),
        ("pump_events", "device_id", "TEXT"),
        ("pump_events", "pump_id", "TEXT"),
        ("pump_events", "requested_command", "TEXT"),
        ("pump_events", "result", "TEXT DEFAULT 'EXECUTED'"),
        ("pump_events", "reason", "TEXT"),
        ("pump_events", "resulting_status", "TEXT"),
        ("pump_events", "resulting_pump_status", "TEXT"),
        ("pump_events", "rain_lock", "BOOLEAN DEFAULT 0"),
        ("pump_controllers", "name", "TEXT DEFAULT 'Main Farm Borewell Controller'"),
        ("pump_controllers", "device_id", "TEXT DEFAULT 'ESP32-PUMP-NODE-01'"),
        ("pump_controllers", "status", "TEXT DEFAULT 'OFF'"),
        ("pump_controllers", "mode", "TEXT DEFAULT 'AUTO'"),
        ("pump_controllers", "is_simulated", "BOOLEAN DEFAULT 1"),
        ("pump_controllers", "hardware_connected", "BOOLEAN DEFAULT 0"),
        ("pump_controllers", "emergency_stopped", "BOOLEAN DEFAULT 0"),
        ("pump_controllers", "rain_lock", "BOOLEAN DEFAULT 0"),
        ("pump_controllers", "manual_override", "BOOLEAN DEFAULT 0"),
        ("pump_controllers", "moisture_low_threshold", "REAL DEFAULT 45.0"),
        ("pump_controllers", "moisture_high_threshold", "REAL DEFAULT 75.0"),
        ("pump_controllers", "target_duration_mins", "INTEGER DEFAULT 30"),
        ("pump_controllers", "last_command", "TEXT"),
        ("pump_controllers", "last_command_time", "DATETIME"),
        ("pump_controllers", "last_updated", "DATETIME"),
        ("marketplace_products", "source_name", "TEXT DEFAULT 'Official Brand'"),
        ("marketplace_products", "source_type", "TEXT DEFAULT 'manufacturer'"),
        ("marketplace_products", "source_verified", "BOOLEAN DEFAULT 0"),
        ("marketplace_products", "product_verified", "BOOLEAN DEFAULT 0"),
        ("marketplace_products", "image_verified", "BOOLEAN DEFAULT 0"),
        ("marketplace_products", "url_verified", "BOOLEAN DEFAULT 0"),
        ("marketplace_products", "amazon_url", "TEXT"),
        ("marketplace_products", "flipkart_url", "TEXT"),
        ("marketplace_products", "estimated_price", "TEXT"),
        ("marketplace_products", "rating", "REAL DEFAULT 4.6"),
        ("marketplace_products", "key_benefits", "TEXT"),
        ("marketplace_products", "pack_size", "TEXT"),
        ("marketplace_products", "redirect_platform", "TEXT DEFAULT 'Official Website'"),
        ("marketplace_products", "redirect_button_text", "TEXT DEFAULT 'Buy on Official Website'")
    ]

    with engine.connect() as conn:
        for table, col, col_type in migrations:
            try:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"))
                conn.commit()
            except Exception:
                # Column already exists or table not created yet
                pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

