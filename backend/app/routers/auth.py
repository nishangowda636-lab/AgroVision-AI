from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import User, Farm, Sensor, PumpController
from app.schemas.schemas import UserRegister, UserLogin, Token, UserOut, UserUpdate, LanguageUpdate, PasswordChangeIn
from app.utils.auth import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/register", response_model=Token)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = get_password_hash(user_in.password)
    new_user = User(
        full_name=user_in.full_name,
        email=user_in.email,
        phone=user_in.phone,
        hashed_password=hashed_pw,
        role="Farmer",
        preferred_language=user_in.preferred_language or "English"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Auto-provision default farm and sensors for new farmers
    farm_first_name = user_in.full_name.strip().split()[0] if user_in.full_name else "My"
    default_farm = Farm(
        user_id=new_user.id,
        name=f"{farm_first_name}'s Green Farm",
        size_acres=2.5,
        location_name="Mandya, Karnataka",
        latitude=12.5218,
        longitude=76.8951,
        soil_type="Loam",
        soil_ph=6.5,
        nitrogen=140.0,
        phosphorus=40.0,
        potassium=200.0,
        water_source="Borewell",
        irrigation_method="Drip Irrigation",
        crop="Tomato",
        crop_variety="Arka Rakshak (Hybrid)",
        sowing_date="2026-06-01",
        expected_harvest="2026-09-30"
    )
    db.add(default_farm)
    db.commit()
    db.refresh(default_farm)

    sensors_to_create = [
        ("Soil Moisture Node", "moisture", "%", 42.0, "Online"),
        ("Air Temperature Node", "temp", "°C", 27.5, "Online"),
        ("Air Humidity Node", "humidity", "%", 68.0, "Online"),
        ("Soil pH Probe", "ph", "pH", 6.5, "Online"),
        ("Soil NPK Sensor", "npk", "mg/kg", 140.0, "Online"),
        ("Water Tank Level", "tank", "%", 85.0, "Online")
    ]
    for s_name, s_type, s_unit, s_val, s_status in sensors_to_create:
        db.add(Sensor(
            farm_id=default_farm.id,
            name=s_name,
            sensor_type=s_type,
            unit=s_unit,
            current_value=s_val,
            status=s_status
        ))

    db.add(PumpController(
        farm_id=default_farm.id,
        name=f"{default_farm.name} - Borewell Controller",
        device_id=f"ESP32-PUMP-{default_farm.id:04d}",
        status="OFF",
        mode="AUTO",
        is_simulated=True,
        hardware_connected=False,
        emergency_stopped=False,
        rain_lock=False,
        moisture_low_threshold=40.0,
        moisture_high_threshold=60.0,
        target_duration_mins=30,
        last_command="SYSTEM_INIT"
    ))
    db.commit()

    token = create_access_token(data={"sub": str(new_user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "full_name": new_user.full_name,
            "email": new_user.email,
            "role": new_user.role,
            "preferred_language": new_user.preferred_language
        }
    }

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "preferred_language": user.preferred_language
        }
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/profile", response_model=UserOut)
def get_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserOut)
def update_user_profile(profile_in: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    for field, val in profile_in.model_dump(exclude_unset=True).items():
        setattr(current_user, field, val)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/language")
def update_user_language(lang_in: LanguageUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    setattr(current_user, "preferred_language", lang_in.language)
    db.commit()
    return {"status": "success", "preferred_language": current_user.preferred_language}

@router.post("/change-password")
def change_password(pass_in: PasswordChangeIn, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(pass_in.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password incorrect")
    setattr(current_user, "hashed_password", get_password_hash(pass_in.new_password))
    db.commit()
    return {"status": "success", "message": "Password changed successfully"}

