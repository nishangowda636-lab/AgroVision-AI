from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timezone

# Auth & User Schemas
class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    preferred_language: Optional[str] = "English"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None
    preferred_language: Optional[str] = None
    temperature_unit: Optional[str] = "C"
    area_unit: Optional[str] = "Acres"
    currency: Optional[str] = "INR"
    notify_weather: Optional[bool] = True
    notify_disease: Optional[bool] = True
    notify_market: Optional[bool] = True
    notify_irrigation: Optional[bool] = True
    notify_orders: Optional[bool] = True

class LanguageUpdate(BaseModel):
    language: str

class PasswordChangeIn(BaseModel):
    current_password: str
    new_password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    role: str
    preferred_language: str
    avatar_url: Optional[str] = None
    location: Optional[str] = None
    temperature_unit: Optional[str] = "C"
    area_unit: Optional[str] = "Acres"
    currency: Optional[str] = "INR"
    notify_weather: Optional[bool] = True
    notify_disease: Optional[bool] = True
    notify_market: Optional[bool] = True
    notify_irrigation: Optional[bool] = True
    notify_orders: Optional[bool] = True
    created_at: datetime

    class Config:
        from_attributes = True

# Farm Schemas
class FarmCreate(BaseModel):
    name: str
    size_acres: float = 1.0
    location_name: Optional[str] = "Farm Location"
    latitude: float = 12.9716
    longitude: float = 77.5946
    soil_type: str = "Loam"
    soil_ph: float = 6.5
    nitrogen: float = 140.0
    phosphorus: float = 40.0
    potassium: float = 200.0
    water_source: str = "Borewell"
    irrigation_method: str = "Drip Irrigation"
    crop: str = "Tomato"
    crop_variety: Optional[str] = "Hybrid"
    sowing_date: Optional[str] = None
    expected_harvest: Optional[str] = None

class FarmUpdate(BaseModel):
    name: Optional[str] = None
    size_acres: Optional[float] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    soil_type: Optional[str] = None
    soil_ph: Optional[float] = None
    nitrogen: Optional[float] = None
    phosphorus: Optional[float] = None
    potassium: Optional[float] = None
    water_source: Optional[str] = None
    irrigation_method: Optional[str] = None
    crop: Optional[str] = None
    crop_variety: Optional[str] = None
    sowing_date: Optional[str] = None
    expected_harvest: Optional[str] = None

class FarmOut(FarmCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Sensor Schemas
class SensorReadingCreate(BaseModel):
    sensor_id: int
    farm_id: int
    reading_type: str
    value: float
    unit: str = "%"

class SensorOut(BaseModel):
    id: int
    farm_id: int
    name: str
    sensor_type: str
    model: str
    status: str
    current_value: float
    unit: str
    last_updated: datetime

    class Config:
        from_attributes = True

# Disease Detection Schemas
class ModelStatusOut(BaseModel):
    loaded: Optional[bool] = True
    model_loaded: bool
    version: Optional[str] = "1.0.0"
    model_name: str
    dataset: Optional[str] = None
    supported_classes: List[str]
    classes_count: int
    device: str
    architecture: str
    vision_layer: str
    vision_api_configured: bool
    metrics: Optional[Dict[str, Any]] = None
    status_message: str

class DiseaseDetectionOut(BaseModel):
    id: int
    user_id: int
    farm_id: Optional[int] = None
    image_path: str
    status: Optional[str] = "VALID_RESULT" # VALID_RESULT, LOW_CONFIDENCE, UNKNOWN, UNSUPPORTED
    reason: Optional[str] = None
    identified_crop: Optional[str] = "Unknown"
    crop_confidence: Optional[float] = None
    companion_crop: Optional[str] = None
    companion_observations: Optional[str] = None
    plant_part: Optional[str] = "Leaf"
    image_type: Optional[str] = "Leaf"
    disease: Optional[str] = None
    disease_confidence: Optional[float] = None
    severity: str = "Moderate"
    recommendation: Optional[str] = None
    analysis_status: Optional[str] = "VALID_RESULT" # VALID_RESULT, LOW_CONFIDENCE, UNKNOWN, UNSUPPORTED, SUCCESS
    message: Optional[str] = None
    detected_crop: str
    detected_problem: str
    crop_name: Optional[str] = None
    disease_name: Optional[str] = None
    condition: Optional[str] = None
    health_status: Optional[str] = "Possible Issue" # Healthy, Possible Issue, High Risk, Low Confidence, Not Supported
    confidence: Optional[float] = None
    identification_confidence: Optional[float] = None
    condition_confidence: Optional[float] = None
    explanation: Optional[str] = None
    visible_symptoms: Optional[str] = None
    visual_observations: Optional[List[str]] = None
    possible_causes: Optional[Any] = None
    next_steps: Optional[str] = None
    recommended_next_steps: Optional[str] = None
    recommended_actions: Optional[List[str]] = None
    warnings: Optional[List[str]] = None
    prevention: Optional[str] = None
    monitoring_plan: Optional[str] = None
    multi_images_json: Optional[str] = None
    trend_status: Optional[str] = "Baseline"
    weather_correlation: Optional[str] = None
    fertilizer_link: Optional[bool] = False
    contact_expert: bool = False
    is_unclear: Optional[bool] = False
    analysis_method: Optional[str] = "Two-Stage PyTorch ML"
    model_status: Optional[str] = "Online"
    needs_field_verification: Optional[bool] = False
    farmer_guidance: Optional[str] = None
    crop_verified: Optional[bool] = False
    suggested_crops: Optional[List[str]] = None
    top_predictions: Optional[List[Dict[str, Any]]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class VerifyCropRequest(BaseModel):
    scan_id: int
    verified_crop: str

# Fertilizer Application Schemas
class FertilizerApplicationCreate(BaseModel):
    farm_id: int
    product_name: str
    date_applied: str # YYYY-MM-DD
    quantity: float
    unit: Optional[str] = "kg"
    area_applied_acres: Optional[float] = 1.0
    crop: Optional[str] = "Tomato"
    crop_stage: Optional[str] = "Vegetative"
    nutrient_focus: Optional[str] = None
    application_method: Optional[str] = "Fertigation / Drip"
    cost: Optional[float] = 0.0
    notes: Optional[str] = None

class FertilizerApplicationOut(FertilizerApplicationCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Direct Messaging Schemas
class MessageCreate(BaseModel):
    receiver_id: int
    farm_id: Optional[int] = None
    content: str

class MessageOut(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    sender_name: Optional[str] = None
    receiver_name: Optional[str] = None
    farm_id: Optional[int] = None
    content: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationSummary(BaseModel):
    user_id: int
    user_name: str
    user_role: str
    last_message: str
    last_message_time: datetime
    unread_count: int

# AI Assistant & Farm Agent Chat
class AIChatRequest(BaseModel):
    farm_id: Optional[int] = None
    message: str
    language: Optional[str] = "English"
    page_context: Optional[str] = None # e.g. "weather", "disease", "irrigation", "dashboard"

class AIChatResponse(BaseModel):
    response: str
    language: str
    farm_context_used: bool
    farm_id: Optional[int] = None
    farm_name: Optional[str] = None
    crop: Optional[str] = None
    crop_stage: Optional[str] = None
    crop_age_days: Optional[int] = None
    sensor_connected: Optional[bool] = False
    proactive_alerts: List[str] = []
    data_citations: List[str] = []
    page_context_used: Optional[str] = None
    action: Optional[Dict[str, Any]] = None
    confirmation_required: Optional[bool] = False


# Crop Stage Intelligence Schemas
class CropStageTimelineItem(BaseModel):
    stage_name: str
    stage_index: int
    icon: str
    start_day: int
    end_day: int
    is_current: bool
    is_completed: bool
    is_upcoming: bool
    description: str
    key_tasks: List[str]
    irrigation: str
    nutrients: str
    disease_risks: str
    scouting_tips: str

class CropStageOut(BaseModel):
    crop_name: str
    sowing_date: Optional[str] = None
    crop_age_days: int
    estimated_stage: str
    active_stage: str
    stage_headline: str
    stage_index: int
    total_stages: int = 8
    is_overridden: bool = False
    stage_icon: str
    next_stage: Optional[str] = None
    days_to_next_stage: Optional[int] = None
    stage_description: str
    key_tasks: List[str]
    irrigation_guidance: str
    nutrient_guidance: str
    disease_risks: str
    scouting_tips: str
    stages: List[CropStageTimelineItem]
    all_stage_names: List[str]

class CropStageUpdateIn(BaseModel):
    sowing_date: Optional[str] = None
    crop: Optional[str] = None
    crop_variety: Optional[str] = None
    current_stage_override: Optional[str] = None

# Today's Farm Plan Schemas
class TodayPlanTaskOut(BaseModel):
    id: str
    priority: str # High, Medium, Low
    priority_rank: Optional[int] = 1
    action_type: str # weather, irrigation, crop_stage, crop_health, fertilizer, market
    title: str
    what_to_do: str
    why_recommended: str
    best_time: str
    data_used: str
    action_route: str
    action_text: str
    is_completed: bool = False
    completed_at: Optional[datetime] = None

class TodayPlanResponse(BaseModel):
    farm_id: int
    farm_name: str
    crop: str
    crop_variety: Optional[str] = None
    active_stage: str
    crop_age_days: int
    generated_at: str
    total_actions: int
    completed_count: int
    actions: List[TodayPlanTaskOut]
    voice_script: str

class TodayPlanCompleteIn(BaseModel):
    notes: Optional[str] = None

# Dynamic Farm Plan Action Item (Backward Compatibility)
class FarmPlanItem(BaseModel):
    id: str
    priority: int # 1 (Highest) to 5
    type: str # irrigation, disease, weather, market, equipment, fertilizer, calendar
    title: str
    summary: str
    why: str # Clear explanation why generated
    action_text: str
    action_route: str
    icon: Optional[str] = "Sparkles"
    severity: Optional[str] = "normal" # urgent, warning, normal, opportunity

class FarmPlanResponse(BaseModel):
    farm_id: int
    farm_name: str
    crop: str
    generated_at: str
    actions: List[FarmPlanItem]
    voice_script: str # Complete speech summary in chosen language

# Crop Calendar Schemas
class CropCalendarEventCreate(BaseModel):
    farm_id: int
    event_type: str # Sowing, Irrigation, Fertilizer, Pest Treatment, Disease Detection, Labour, Harvest, Scouting, General Note
    title: str
    description: Optional[str] = None
    stage: Optional[str] = "Vegetative"
    event_date: str # YYYY-MM-DD
    cost: Optional[float] = 0.0

class CropCalendarEventOut(CropCalendarEventCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class CropCalendarStage(BaseModel):
    stage_name: str
    start_day: int
    end_day: int
    is_current: bool
    is_completed: bool
    description: str
    key_tasks: List[str]

class CropCalendarSummary(BaseModel):
    farm_id: int
    crop_name: str
    sowing_date: Optional[str] = None
    crop_age_days: int
    current_stage: str
    stages: List[CropCalendarStage]
    events: List[CropCalendarEventOut]
    recommendation: str

# Calculator Schemas
class CalculatorRequest(BaseModel):
    crop_name: str
    size_acres: float
    soil_type: Optional[str] = "Loam"
    irrigation_method: Optional[str] = "Drip Irrigation"

class CalculatorResponse(BaseModel):
    crop_name: str
    size_acres: float
    seed_qty_kg: float
    fertilizer_npk_kg: dict
    irrigation_liters_per_cycle: float
    expected_yield_tons: float
    estimated_cost_inr: float
    estimated_revenue_inr: float
    estimated_profit_inr: float
    break_even_price_per_kg: float
    roi_percent: float
    cost_breakdown: List[dict]

# Smart Pump Controller Schemas
class PumpControllerOut(BaseModel):
    id: int
    farm_id: int
    name: str
    device_id: str
    status: str # ON, OFF
    mode: str # AUTO, MANUAL
    is_simulated: bool
    hardware_connected: bool
    emergency_stopped: bool
    rain_lock: bool
    manual_override: bool = False
    moisture_low_threshold: float
    moisture_high_threshold: float
    target_duration_mins: int
    last_command: str
    last_command_time: datetime
    last_updated: datetime

    class Config:
        from_attributes = True

class PumpCommandIn(BaseModel):
    command: str # PUMP_ON, PUMP_OFF, SET_MODE_AUTO, SET_MODE_MANUAL, EMERGENCY_STOP, SET_THRESHOLDS
    moisture_low: Optional[float] = None
    moisture_high: Optional[float] = None
    duration_mins: Optional[int] = None
    reason: Optional[str] = "Manual operator command"

class PumpEventOut(BaseModel):
    id: int
    farm_id: int
    event_type: str
    trigger_reason: str
    pump_id: Optional[str] = None
    device_id: Optional[str] = None
    requested_command: Optional[str] = None
    result: Optional[str] = "EXECUTED"
    reason: Optional[str] = None
    resulting_status: Optional[str] = None
    resulting_pump_status: Optional[str] = None
    rain_lock: Optional[bool] = False
    details_json: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

# Real ML Crop Recommendation Schemas
class CropRecommendationPredictIn(BaseModel):
    farm_id: Optional[int] = None
    nitrogen: Optional[float] = None
    phosphorus: Optional[float] = None
    potassium: Optional[float] = None
    ph: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    rainfall: Optional[float] = None
    season: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    state: Optional[str] = None
    district: Optional[str] = None
    soil_type: Optional[str] = None
    top_k: Optional[int] = 5

class CropRecommendationItem(BaseModel):
    crop: str
    display_name: str
    confidence: float
    suitability_pct: int
    category: str
    why_recommended: str
    soil_suitability: str
    climate_suitability: str
    water_requirement: str
    water_requirement_category: str
    duration_days: str
    expected_yield: str
    important_considerations: str
    recommended_varieties: List[str]
    market_demand: str

class CropRecommendationResponse(BaseModel):
    farm_id: Optional[int] = None
    farm_name: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    weather_source: str
    target_season: str
    model_used: str
    model_accuracy_pct: float
    input_parameters: Dict[str, Any]
    missing_parameters: List[str]
    data_completeness: str
    recommendations: List[CropRecommendationItem]
    safety_disclaimer: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Real ML Crop Yield Prediction Schemas
class CropYieldPredictIn(BaseModel):
    farm_id: Optional[int] = None
    crop: Optional[str] = None
    area_acres: Optional[float] = None
    season: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    soil_type: Optional[str] = None
    soil_ph: Optional[float] = None
    nitrogen: Optional[float] = None
    phosphorus: Optional[float] = None
    potassium: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    rainfall: Optional[float] = None
    irrigation_method: Optional[str] = None
    soil_moisture_pct: Optional[float] = None
    sowing_date: Optional[str] = None
    crop_stage: Optional[str] = None

class CropYieldFactorItem(BaseModel):
    name: str
    value: str
    status: str
    impact: str
    description: str

class CropYieldResponse(BaseModel):
    farm_id: Optional[int] = None
    farm_name: Optional[str] = None
    crop: str
    standardized_crop: str
    farm_size_acres: float
    farm_size_hectares: float
    predicted_yield_per_hectare: float
    unit: str = "tonnes/hectare"
    predicted_yield_per_acre: float
    unit_acre: str = "tonnes/acre"
    estimated_total_production: float
    production_unit: str = "tonnes"
    prediction_range_per_hectare: str
    prediction_range_total: str
    confidence_pct: Optional[float] = None
    model_used: str
    model_r2_score: float
    test_mae_tonnes_per_ha: float
    test_rmse_tonnes_per_ha: Optional[float] = 2.4353
    harvest_window: str
    important_factors: List[CropYieldFactorItem]
    recommendations: List[str]
    missing_parameters: List[str]
    data_completeness: str
    safety_disclaimer: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Regional Crop Intelligence Schemas
class RegionalCropRecommendIn(BaseModel):
    state: str
    district: str
    taluk: Optional[str] = None
    farm_size_acres: Optional[float] = 1.0
    soil_type: Optional[str] = "Loam"
    soil_ph: Optional[float] = 6.5
    nitrogen: Optional[float] = 140.0
    phosphorus: Optional[float] = 40.0
    potassium: Optional[float] = 200.0
    water_source: Optional[str] = "Borewell"
    season: Optional[str] = "Kharif (Monsoon)" # Kharif, Rabi, Zaid / Summer, Annual

class RegionalCropOption(BaseModel):
    crop_name: str
    category: str # Cereals, Pulses, Oilseeds, Vegetables, Fruits, Plantation / Commercial, Sugar Crops
    suitability_score: int # 0 to 100
    why_recommended: str
    growing_season: str
    soil_suitability: str
    water_requirement: str
    duration_days: str
    expected_yield: str
    risk_level: str
    market_demand: str
    estimated_price_per_kg: Optional[float] = None
    recommended_varieties: List[str]

class RegionalCropRecommendOut(BaseModel):
    location_summary: str
    climate_zone: str
    recommended_crops: List[RegionalCropOption]
    soil_health_assessment: str
    water_advisory: str

class RegionDistrictOut(BaseModel):
    district: str
    climate_zone: str
    top_crops: List[str]

class RegionStateOut(BaseModel):
    state: str
    districts: List[RegionDistrictOut]

# Farm Services Schemas
class FarmServiceOut(BaseModel):
    id: int
    title: str
    service_type: str
    provider_name: str
    provider_phone: Optional[str] = None
    location: str
    distance_km: Optional[float] = None
    price_rate: float
    price_unit: str
    rating: float
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_verified: bool
    is_demo: bool

    class Config:
        from_attributes = True

# Farm Ledger & Profitability Schemas
class LedgerTransactionCreate(BaseModel):
    farm_id: int
    type: str = "expense" # expense, income
    category: str # Seeds, Fertilizer, Pesticides, Labour, Irrigation, Fuel/Electricity, Machinery, Equipment Rental, Transport, Repairs, Crop Sales, Produce Sales, Other
    crop: Optional[str] = "Tomato"
    item_name: str
    cost: float # amount in INR
    date: str # YYYY-MM-DD
    quantity: Optional[float] = None
    unit: Optional[str] = None
    stage: Optional[str] = "Vegetative Growth"
    provenance: Optional[str] = "ACTUAL" # ACTUAL, ESTIMATED, PROJECTED
    notes: Optional[str] = None
    client_sync_id: Optional[str] = None

class LedgerTransactionOut(BaseModel):
    id: int
    farm_id: int
    type: str
    category: str
    crop: Optional[str] = None
    item_name: str
    cost: float
    date: str
    quantity: Optional[float] = None
    unit: Optional[str] = None
    stage: Optional[str] = None
    provenance: str = "ACTUAL"
    notes: Optional[str] = None
    client_sync_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class StageFinancialBreakdown(BaseModel):
    stage: str
    expenses: float
    income: float
    net: float

class CategoryFinancialBreakdown(BaseModel):
    category: str
    type: str
    amount: float
    percentage: float

class LedgerSummaryOut(BaseModel):
    farm_id: int
    farm_name: str
    crop: str
    size_acres: float
    total_income: float
    total_expenses: float
    net_profit: float
    cost_per_acre: float
    revenue_per_acre: float
    profit_per_acre: float
    roi_percent: float
    transaction_count: int
    actual_count: int
    estimated_count: int
    projected_count: int
    category_breakdown: List[CategoryFinancialBreakdown]
    stage_breakdown: List[StageFinancialBreakdown]
    recent_transactions: List[LedgerTransactionOut]

class LedgerSyncItem(BaseModel):
    client_sync_id: str
    farm_id: int
    type: str = "expense"
    category: str
    crop: Optional[str] = None
    item_name: str
    cost: float
    date: str
    quantity: Optional[float] = None
    unit: Optional[str] = None
    stage: Optional[str] = None
    notes: Optional[str] = None

class LedgerSyncRequest(BaseModel):
    transactions: List[LedgerSyncItem]


# ⚙️ IoT AUTOMATION SCHEMAS
class IoTAutomationStatusOut(BaseModel):
    farm_id: int
    farm_name: str
    crop: str
    soil_moisture_pct: Optional[float] = None
    moisture_status: str # LOW, OPTIMAL, HIGH, UNKNOWN
    moisture_low_threshold: float
    moisture_high_threshold: float
    sensor_connected: bool
    hardware_connected: bool
    is_simulated: bool
    pump_status: str # ON, OFF
    pump_mode: str # AUTO, MANUAL
    rain_lock: bool
    manual_override: bool = False
    emergency_stopped: bool
    rain_prob_next_24h: float
    weather_condition: str
    current_recommendation: str
    recommendation_reason: str
    last_action_type: Optional[str] = None
    last_action_reason: Optional[str] = None
    last_action_time: Optional[datetime] = None
    safety_status: str # NORMAL, RAIN_LOCKED, EMERGENCY_LOCKED, SENSOR_TIMEOUT

# Real ML Smart Irrigation Decision & Water Requirement Schemas
class SmartIrrigationPredictIn(BaseModel):
    farm_id: Optional[int] = None
    crop: Optional[str] = None
    crop_stage: Optional[str] = None
    soil_type: Optional[str] = None
    soil_moisture: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    rainfall: Optional[float] = None
    rain_probability: Optional[float] = None
    farm_area: Optional[float] = None
    irrigation_method: Optional[str] = None

class SmartIrrigationFactorItem(BaseModel):
    name: str
    value: str
    status: str
    impact: str
    description: str

class SmartIrrigationResponse(BaseModel):
    farm_id: Optional[int] = None
    farm_name: Optional[str] = None
    crop: str
    crop_stage: str
    soil_type: str
    irrigation_method: str
    soil_moisture_pct: Optional[float] = None
    is_sensor_connected: bool
    irrigation_required: bool
    decision: str
    reason: str
    recommended_amount: Union[float, int, str]
    unit: str = "Litres"
    duration: int
    duration_unit: str = "Minutes"
    water_saved_liters: float = 0.0
    optimal_window: str = "Morning"
    rain_warning: str
    confidence_or_uncertainty: str
    data_sources: List[str]
    important_factors: List[SmartIrrigationFactorItem]
    recommendations: List[str]
    missing_parameters: List[str] = []
    model_used: str = "Gradient Boosting Classifier"
    model_accuracy: float = 0.9833
    raw_model_prediction: Optional[float] = None
    raw_model_unit: Optional[str] = None
    farm_area: Optional[float] = None
    calculation_used: Optional[str] = None
    area_scaling_applied: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Real ML Fertilizer Recommendation Schemas
class FertilizerRecommendationPredictIn(BaseModel):
    farm_id: Optional[int] = None
    crop: Optional[str] = None
    crop_stage: Optional[str] = None
    soil_type: Optional[str] = None
    nitrogen: Optional[float] = None
    phosphorus: Optional[float] = None
    potassium: Optional[float] = None
    ph: Optional[float] = None
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    rainfall: Optional[float] = None
    farm_area: Optional[float] = None
    previous_fertilizer: Optional[str] = None

class FertilizerDosageItem(BaseModel):
    fertilizer_name: str
    nutrient_category: str
    dose_per_acre: str
    total_for_farm: str
    application_method: str
    why: str
    when: str
    how: str
    soil_basis: str

class FertilizerRecommendationResponse(BaseModel):
    farm_id: Optional[int] = None
    farm_name: Optional[str] = None
    crop: str
    crop_stage: str
    soil_type: str
    farm_area: Optional[float] = None
    soil_ph: Optional[float] = None
    status: str # "Recommendation Available", "More Soil Data Required", "Delay Application"
    recommendation: str
    nutrient_status: str
    quantity: float
    quantity_per_acre: float
    unit: str = "kg"
    timing: str
    application_method: str
    reason: str
    precautions: List[str]
    confidence: str
    missing_data: List[str] = []
    weather_advice: str
    next_safe_window: Optional[str] = None
    weather_source: Optional[str] = "Open-Meteo Real-Time Meteorological API"
    dosage_items: List[FertilizerDosageItem]
    application_warnings: Optional[List[str]] = []
    model_used: str = "Gradient Boosting Classifier"
    model_accuracy: float = 0.9675
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ==========================================
# Real Weather Intelligence Schemas
# ==========================================

class WeatherAlertItem(BaseModel):
    alert_type: str
    severity: str # "info", "warning", "danger"
    title: str
    description: str
    action_required: str

class FarmingAdviceItem(BaseModel):
    category: str
    title: str
    message: str
    why: str
    impact: str
    type: str = "info"

class IrrigationAdviceItem(BaseModel):
    decision: str
    status_badge: str
    safety_level: str
    reason: str
    water_saving_litres: str
    recommended_timing: str

class FertilizerAdviceItem(BaseModel):
    safety_status: str
    status_badge: str
    warning: str
    application_window: str
    agronomic_recommendation: str

class CropHealthAdviceItem(BaseModel):
    fungal_risk_level: str
    risk_badge: str
    pathogens_of_concern: List[str]
    scouting_advice: str
    preventive_action: str

class CurrentWeatherOut(BaseModel):
    temperature: float
    feels_like: float
    humidity: int
    wind_speed: float
    wind_direction: Optional[int] = 180
    rainfall_mm: float
    rain_probability: int
    precipitation_now_mm: float = 0.0
    pressure_hpa: Optional[float] = 1013.2
    weather_code: int = 1
    condition: str
    description: str
    sunrise: str = "06:10"
    sunset: str = "18:30"
    uv_index: float = 6.5

class DailyForecastItem(BaseModel):
    day: str
    date: Optional[str] = ""
    high: float
    low: float
    rain_prob: int
    rainfall_mm: float
    wind_speed_max: Optional[float] = 12.0
    condition: str
    description: str = ""
    sunrise: Optional[str] = "06:10"
    sunset: Optional[str] = "18:30"
    uv_index: Optional[float] = 6.5

class WeatherIntelligenceResponse(BaseModel):
    farm_id: Optional[int] = None
    farm_name: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_location_missing: bool = False
    location_prompt: Optional[str] = None
    crop: Optional[str] = None
    crop_stage: Optional[str] = None
    soil_type: Optional[str] = None
    current_weather: Optional[CurrentWeatherOut] = None
    forecast: List[DailyForecastItem] = []
    alerts: List[WeatherAlertItem] = []
    farming_advice: List[FarmingAdviceItem] = []
    irrigation_advice: Optional[IrrigationAdviceItem] = None
    fertilizer_advice: Optional[FertilizerAdviceItem] = None
    crop_health_advice: Optional[CropHealthAdviceItem] = None
    data_source: str = "Open-Meteo High-Resolution Real-Time Meteorological API"
    fetched_at: str


# ==========================================
# AI Farm Agent Schemas
# ==========================================

class AIFarmAgentActionItem(BaseModel):
    id: str
    priority: str # HIGH, MEDIUM, LOW
    priority_rank: int = 1
    action_type: str = "general" # weather, irrigation, fertilizer, crop_health, crop_stage, scouting
    action: str
    title: str
    reason: str
    what_to_do: str
    why_recommended: str
    when_to_do: str
    best_time: str
    related_condition: str
    source_data: str
    data_used: str
    status: str = "PENDING" # PENDING, IN_PROGRESS, COMPLETED, SKIPPED
    action_route: Optional[str] = "/dashboard"
    action_text: Optional[str] = "View Details"
    is_completed: bool = False
    completed_at: Optional[str] = None
    farmer_note: Optional[str] = None

class AIFarmAgentTodayPlanResponse(BaseModel):
    farm_id: int
    farm_name: str
    crop: str
    crop_stage: str
    summary: str
    priorities: List[str] = []
    today_plan: List[AIFarmAgentActionItem] = []
    alerts: List[Dict[str, Any]] = []
    recommendations: List[str] = []
    data_sources: Dict[str, Any] = {}
    uncertainty: Optional[str] = None
    voice_script: Optional[str] = None
    language: str = "English"
    generated_at: str

class AIFarmAgentChatRequest(BaseModel):
    farm_id: Optional[int] = None
    message: str
    conversation_id: Optional[str] = None
    language: Optional[str] = "English"
    page_context: Optional[str] = None

class AIFarmAgentChatResponse(BaseModel):
    response: str
    what_to_do: Optional[str] = None
    why: Optional[str] = None
    when_to_do: Optional[str] = None
    data_used: Optional[str] = None
    caution: Optional[str] = None
    actions: List[AIFarmAgentActionItem] = []
    confidence: Optional[str] = "High"
    language: str = "English"
    voice_audio_base64: Optional[str] = None
    source_citations: List[str] = []
    data_sources: Dict[str, Any] = {}
    action: Optional[Dict[str, Any]] = None
    confirmation_required: Optional[bool] = False

class AIFarmAgentActionStatusIn(BaseModel):
    action_id: str
    status: str # PENDING, IN_PROGRESS, COMPLETED, SKIPPED
    note: Optional[str] = None

# Marketplace Schemas
class MarketplaceProductOut(BaseModel):
    id: int
    name: str
    brand: str
    category: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    official_product_url: Optional[str] = None
    official_brand_url: Optional[str] = None
    amazon_url: Optional[str] = None
    flipkart_url: Optional[str] = None
    estimated_price: Optional[str] = None
    rating: Optional[float] = 4.6
    key_benefits: Optional[str] = None
    pack_size: Optional[str] = None
    redirect_platform: Optional[str] = "Official Website"
    redirect_button_text: Optional[str] = "Buy on Official Website"
    source_name: str
    source_type: Optional[str] = "manufacturer"
    source_verified: bool = False
    image_verified: bool = False
    url_verified: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MarketplaceCategoryOut(BaseModel):
    name: str
    count: int
    icon: Optional[str] = None

class MarketplaceProductListOut(BaseModel):
    products: List[MarketplaceProductOut]
    total: int
    categories: List[str]
    brands: List[str]

# Government Schemes Schemas
class GovernmentSchemeOut(BaseModel):
    id: int
    name: str
    department: str
    ministry: str
    scheme_type: str
    category: str
    state: str
    description: str
    benefits: str
    eligibility: str
    required_documents: Optional[str] = None
    application_process: Optional[str] = None
    official_source_name: str
    official_source_url: str
    official_apply_url: str
    source_verified: bool = True
    active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class GovernmentSchemeCategoryOut(BaseModel):
    name: str
    count: int

class GovernmentSchemeListOut(BaseModel):
    schemes: List[GovernmentSchemeOut]
    total: int
    categories: List[str]
    states: List[str]
    scheme_types: List[str]
