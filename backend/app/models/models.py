from sqlalchemy import Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
import enum
from app.database.session import Base

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, default="Farmer")
    preferred_language: Mapped[str] = mapped_column(String, default="English")
    avatar_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    temperature_unit: Mapped[str] = mapped_column(String, default="C") # C, F
    area_unit: Mapped[str] = mapped_column(String, default="Acres") # Acres, Hectares, Guntas
    currency: Mapped[str] = mapped_column(String, default="INR") # INR, USD
    notify_weather: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_disease: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_market: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_irrigation: Mapped[bool] = mapped_column(Boolean, default=True)
    notify_orders: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    farms = relationship("Farm", back_populates="owner", cascade="all, delete-orphan")
    disease_detections = relationship("DiseaseDetection", back_populates="user")
    fertilizer_applications = relationship("FertilizerApplication", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")

class Farm(Base):
    __tablename__ = "farms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    size_acres: Mapped[float] = mapped_column(Float, default=1.0)
    location_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    latitude: Mapped[float] = mapped_column(Float, default=12.9716)
    longitude: Mapped[float] = mapped_column(Float, default=77.5946)
    soil_type: Mapped[str] = mapped_column(String, default="Loam")
    soil_ph: Mapped[float] = mapped_column(Float, default=6.5)
    nitrogen: Mapped[float] = mapped_column(Float, default=140.0) # mg/kg or kg/ha
    phosphorus: Mapped[float] = mapped_column(Float, default=40.0)
    potassium: Mapped[float] = mapped_column(Float, default=200.0)
    water_source: Mapped[str] = mapped_column(String, default="Borewell")
    irrigation_method: Mapped[str] = mapped_column(String, default="Drip Irrigation")
    crop: Mapped[str] = mapped_column(String, default="Tomato")
    crop_variety: Mapped[str] = mapped_column(String, default="Hybrid")
    sowing_date: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    expected_harvest: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    current_stage_override: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    boundary_geojson: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    iot_device_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    owner = relationship("User", back_populates="farms")
    sensors = relationship("Sensor", back_populates="farm", cascade="all, delete-orphan")
    disease_detections = relationship("DiseaseDetection", back_populates="farm", cascade="all, delete-orphan")
    fertilizer_applications = relationship("FertilizerApplication", back_populates="farm", cascade="all, delete-orphan")
    irrigation_records = relationship("IrrigationRecord", back_populates="farm", cascade="all, delete-orphan")
    yield_predictions = relationship("YieldPrediction", back_populates="farm", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="farm", cascade="all, delete-orphan")
    calendar_events = relationship("CropCalendarEvent", back_populates="farm", cascade="all, delete-orphan")
    plan_tasks = relationship("FarmPlanTaskRecord", back_populates="farm", cascade="all, delete-orphan")
    pump_controller = relationship("PumpController", uselist=False, back_populates="farm", cascade="all, delete-orphan")
    pump_events = relationship("PumpEvent", back_populates="farm", cascade="all, delete-orphan")

class Sensor(Base):
    __tablename__ = "sensors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    farm_id: Mapped[int] = mapped_column(Integer, ForeignKey("farms.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    sensor_type: Mapped[str] = mapped_column(String, nullable=False) # moisture, temp, humidity, ph, npk
    model: Mapped[str] = mapped_column(String, default="ESP32-AgroNode-V1")
    status: Mapped[str] = mapped_column(String, default="Online") # Online, Warning, Offline
    current_value: Mapped[float] = mapped_column(Float, default=0.0)
    unit: Mapped[str] = mapped_column(String, default="%")
    last_updated: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    farm = relationship("Farm", back_populates="sensors")
    readings = relationship("SensorReading", back_populates="sensor", cascade="all, delete-orphan")

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sensor_id: Mapped[int] = mapped_column(Integer, ForeignKey("sensors.id"), nullable=False)
    farm_id: Mapped[int] = mapped_column(Integer, ForeignKey("farms.id"), nullable=False)
    reading_type: Mapped[str] = mapped_column(String, nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String, default="")
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    sensor = relationship("Sensor", back_populates="readings")

class DiseaseDetection(Base):
    __tablename__ = "disease_detections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    farm_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("farms.id"), nullable=True)
    image_path: Mapped[str] = mapped_column(String, nullable=False)
    plant_part: Mapped[str] = mapped_column(String, default="Leaf")
    detected_crop: Mapped[str] = mapped_column(String, nullable=False)
    detected_problem: Mapped[str] = mapped_column(String, nullable=False)
    health_status: Mapped[str] = mapped_column(String, default="Possible Issue") # Healthy, Possible Issue, High Risk
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    severity: Mapped[str] = mapped_column(String, default="Moderate") # Low, Moderate, High
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    visible_symptoms: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    possible_causes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    next_steps: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    prevention: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    multi_images_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # JSON list of multiple photos
    trend_status: Mapped[str] = mapped_column(String, default="Baseline") # Improving, Stable, Getting worse, Baseline
    weather_correlation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    fertilizer_link: Mapped[bool] = mapped_column(Boolean, default=False)
    contact_expert: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    user = relationship("User", back_populates="disease_detections")
    farm = relationship("Farm", back_populates="disease_detections")

class FertilizerApplication(Base):
    __tablename__ = "fertilizer_applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    farm_id: Mapped[int] = mapped_column(Integer, ForeignKey("farms.id"), nullable=False)
    product_name: Mapped[str] = mapped_column(String, nullable=False) # e.g. "Urea", "DAP", "MOP", "19:19:19", "Neem Cake"
    date_applied: Mapped[str] = mapped_column(String, nullable=False) # YYYY-MM-DD
    quantity: Mapped[float] = mapped_column(Float, nullable=False) # e.g. 50.0
    unit: Mapped[str] = mapped_column(String, default="kg") # kg, liters, bags
    area_applied_acres: Mapped[float] = mapped_column(Float, default=1.0)
    crop: Mapped[str] = mapped_column(String, nullable=False)
    crop_stage: Mapped[str] = mapped_column(String, default="Vegetative")
    nutrient_focus: Mapped[Optional[str]] = mapped_column(String, nullable=True) # Nitrogen, Phosphorus, Potassium, Micronutrient, Organic
    application_method: Mapped[str] = mapped_column(String, default="Fertigation / Drip") # Basal, Top-dressing, Fertigation / Drip, Foliar Spray
    cost: Mapped[float] = mapped_column(Float, default=0.0)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    user = relationship("User", back_populates="fertilizer_applications")
    farm = relationship("Farm", back_populates="fertilizer_applications")

class IrrigationRecord(Base):
    __tablename__ = "irrigation_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    farm_id: Mapped[int] = mapped_column(Integer, ForeignKey("farms.id"), nullable=False)
    water_recommended_liters: Mapped[float] = mapped_column(Float, default=1000.0)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=45)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recommended_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    farm = relationship("Farm", back_populates="irrigation_records")

class YieldPrediction(Base):
    __tablename__ = "yield_predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    farm_id: Mapped[int] = mapped_column(Integer, ForeignKey("farms.id"), nullable=False)
    crop_name: Mapped[str] = mapped_column(String, nullable=False)
    expected_yield_tons: Mapped[float] = mapped_column(Float, default=0.0)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    harvest_date: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    factors_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    farm = relationship("Farm", back_populates="yield_predictions")

class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sender_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    farm_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("farms.id"), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")

class MarketPrice(Base):
    __tablename__ = "market_prices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    crop_name: Mapped[str] = mapped_column(String, nullable=False)
    market_name: Mapped[str] = mapped_column(String, nullable=False)
    state: Mapped[str] = mapped_column(String, nullable=False)
    price_per_kg: Mapped[float] = mapped_column(Float, nullable=False)
    prev_price_per_kg: Mapped[float] = mapped_column(Float, nullable=False)
    demand: Mapped[str] = mapped_column(String, default="High")
    trend: Mapped[str] = mapped_column(String, default="Increasing")
    historical_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    farm_id: Mapped[int] = mapped_column(Integer, ForeignKey("farms.id"), nullable=False)
    type: Mapped[str] = mapped_column(String, default="expense") # expense, income
    category: Mapped[str] = mapped_column(String, nullable=False) # Seeds, Fertilizer, Pesticides, Labour, Irrigation, Fuel/Electricity, Machinery, Equipment Rental, Transport, Repairs, Crop Sales, Produce Sales, Other
    crop: Mapped[Optional[str]] = mapped_column(String, nullable=True) # Tomato, Sugarcane, etc.
    item_name: Mapped[str] = mapped_column(String, nullable=False) # Description / Item name
    cost: Mapped[float] = mapped_column(Float, nullable=False) # Amount in INR
    date: Mapped[str] = mapped_column(String, nullable=False) # YYYY-MM-DD
    quantity: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String, nullable=True) # kg, bags, litres, quintals, hours, trips
    stage: Mapped[Optional[str]] = mapped_column(String, nullable=True) # Sowing, Germination, Vegetative Growth, Flowering, Fruiting, Harvest, Post-Harvest
    provenance: Mapped[str] = mapped_column(String, default="ACTUAL") # ACTUAL, ESTIMATED, PROJECTED
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    client_sync_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True) # For offline deduplication
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    farm = relationship("Farm", back_populates="expenses")

class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String, default="info") # weather, disease, sensor, market, yield, rental, order, message
    action_link: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    user = relationship("User", back_populates="notifications")

class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    farm_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("farms.id"), nullable=True)
    user_message: Mapped[str] = mapped_column(Text, nullable=False)
    ai_response: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String, default="English")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

class CropCalendarEvent(Base):
    __tablename__ = "crop_calendar_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    farm_id: Mapped[int] = mapped_column(Integer, ForeignKey("farms.id"), nullable=False)
    event_type: Mapped[str] = mapped_column(String, nullable=False) # Sowing, Irrigation, Fertilizer, Pest Treatment, Disease Detection, Labour, Harvest, Scouting, General Note
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    stage: Mapped[str] = mapped_column(String, default="Vegetative") # Sowing, Germination, Seedling, Vegetative Growth, Flowering, Fruiting / Grain Filling, Maturity, Harvest
    event_date: Mapped[str] = mapped_column(String, nullable=False) # YYYY-MM-DD
    cost: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    farm = relationship("Farm", back_populates="calendar_events")

class FarmPlanTaskRecord(Base):
    __tablename__ = "farm_plan_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    farm_id: Mapped[int] = mapped_column(Integer, ForeignKey("farms.id"), nullable=False)
    task_key: Mapped[str] = mapped_column(String, nullable=False, index=True)
    plan_date: Mapped[str] = mapped_column(String, nullable=False, index=True) # YYYY-MM-DD
    title: Mapped[str] = mapped_column(String, nullable=False)
    action_type: Mapped[str] = mapped_column(String, nullable=False) # weather, irrigation, crop_stage, crop_health, fertilizer, market
    status: Mapped[str] = mapped_column(String, default="PENDING") # PENDING, IN_PROGRESS, COMPLETED, SKIPPED
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    farmer_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    reminded_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    farm = relationship("Farm", back_populates="plan_tasks")

class PumpController(Base):
    __tablename__ = "pump_controllers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    farm_id: Mapped[int] = mapped_column(Integer, ForeignKey("farms.id"), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String, default="Main Farm Borewell Controller")
    device_id: Mapped[str] = mapped_column(String, default="ESP32-PUMP-NODE-01")
    status: Mapped[str] = mapped_column(String, default="OFF") # ON, OFF
    mode: Mapped[str] = mapped_column(String, default="AUTO") # AUTO, MANUAL
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=True)
    hardware_connected: Mapped[bool] = mapped_column(Boolean, default=False)
    emergency_stopped: Mapped[bool] = mapped_column(Boolean, default=False)
    rain_lock: Mapped[bool] = mapped_column(Boolean, default=False)
    manual_override: Mapped[bool] = mapped_column(Boolean, default=False)
    moisture_low_threshold: Mapped[float] = mapped_column(Float, default=40.0)
    moisture_high_threshold: Mapped[float] = mapped_column(Float, default=60.0)
    target_duration_mins: Mapped[int] = mapped_column(Integer, default=30)
    last_command: Mapped[str] = mapped_column(String, default="INIT")
    last_command_time: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    last_updated: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    farm = relationship("Farm", back_populates="pump_controller")

class PumpEvent(Base):
    __tablename__ = "pump_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    farm_id: Mapped[int] = mapped_column(Integer, ForeignKey("farms.id"), nullable=False)
    event_type: Mapped[str] = mapped_column(String, nullable=False) # AUTO_START, AUTO_STOP_RAIN, AUTO_STOP_MOISTURE, MANUAL_START, MANUAL_STOP, EMERGENCY_STOP, BLOCKED_RAIN_LOCK, BLOCKED_EMERGENCY
    trigger_reason: Mapped[str] = mapped_column(String, nullable=False)
    pump_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    device_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    requested_command: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    result: Mapped[str] = mapped_column(String, default="EXECUTED") # EXECUTED or BLOCKED
    reason: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    resulting_status: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    resulting_pump_status: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    rain_lock: Mapped[bool] = mapped_column(Boolean, default=False)
    details_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    farm = relationship("Farm", back_populates="pump_events")

class RegionData(Base):
    __tablename__ = "regional_data"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    state: Mapped[str] = mapped_column(String, nullable=False, index=True)
    district: Mapped[str] = mapped_column(String, nullable=False, index=True)
    taluk: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    climate_zone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    soil_types_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    rainfall_range_mm: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    temp_range_c: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    suitable_crops_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    varieties_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

class MarketplaceProduct(Base):
    __tablename__ = "marketplace_products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    brand: Mapped[str] = mapped_column(String, nullable=False, index=True)
    category: Mapped[str] = mapped_column(String, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    official_product_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    official_brand_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    amazon_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    flipkart_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    estimated_price: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    rating: Mapped[Optional[float]] = mapped_column(Float, default=4.6)
    key_benefits: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pack_size: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    redirect_platform: Mapped[Optional[str]] = mapped_column(String, default="Official Website")
    redirect_button_text: Mapped[Optional[str]] = mapped_column(String, default="Buy on Official Website")
    source_name: Mapped[str] = mapped_column(String, nullable=False)
    source_type: Mapped[str] = mapped_column(String, default="manufacturer") # manufacturer or verified_retailer
    source_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    product_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    image_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    url_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)

class GovernmentScheme(Base):
    __tablename__ = "government_schemes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    department: Mapped[str] = mapped_column(String, nullable=False)
    ministry: Mapped[str] = mapped_column(String, nullable=False)
    scheme_type: Mapped[str] = mapped_column(String, default="Central") # Central or State
    category: Mapped[str] = mapped_column(String, nullable=False, index=True) # Agriculture, Crop Insurance, Equipment / Machinery Subsidy, Irrigation, Seeds & Fertilizers, Agricultural Loans / Credit, Solar / Renewable Energy, Livestock / Animal Husbandry, Karnataka State Schemes, Central Government Schemes
    state: Mapped[str] = mapped_column(String, default="All India", index=True) # All India, Karnataka, etc.
    description: Mapped[str] = mapped_column(Text, nullable=False)
    benefits: Mapped[str] = mapped_column(Text, nullable=False)
    eligibility: Mapped[str] = mapped_column(Text, nullable=False)
    required_documents: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    application_process: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    official_source_name: Mapped[str] = mapped_column(String, nullable=False)
    official_source_url: Mapped[str] = mapped_column(String, nullable=False)
    official_apply_url: Mapped[str] = mapped_column(String, nullable=False)
    source_verified: Mapped[bool] = mapped_column(Boolean, default=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)
