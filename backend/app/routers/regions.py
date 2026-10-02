from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.ai.regional_crop_service import get_supported_regions, recommend_regional_crops, REGIONAL_DATA_REGISTRY
from app.schemas.schemas import RegionalCropRecommendIn, RegionalCropRecommendOut, RegionStateOut

router = APIRouter(prefix="/api/regions", tags=["Regional Crop Intelligence"])

@router.get("", response_model=List[RegionStateOut])
def list_regions():
    """
    Returns list of all supported Indian agricultural states, districts, and climate zones.
    """
    return get_supported_regions()

@router.get("/{state}/{district}/crops")
def get_district_crop_profile(state: str, district: str):
    """
    Retrieves the typical historical agro-climatic and crop profile for a specific district.
    """
    state_data = REGIONAL_DATA_REGISTRY.get(state)
    if not state_data:
        raise HTTPException(status_code=404, detail=f"State '{state}' not found")
    
    dist_data = state_data.get(district)
    if not dist_data:
        raise HTTPException(status_code=404, detail=f"District '{district}' not found in state '{state}'")

    return {
        "state": state,
        "district": district,
        "climate_zone": dist_data["climate_zone"],
        "soil_types": dist_data["soil_types"],
        "avg_rainfall_mm": dist_data["avg_rainfall_mm"],
        "temp_range_c": dist_data["temp_range_c"],
        "primary_crops": dist_data["primary_crops"],
        "varieties": dist_data.get("varieties", {})
    }

@router.post("/recommend", response_model=RegionalCropRecommendOut)
def recommend_crops_for_region(req: RegionalCropRecommendIn):
    """
    'What Should I Grow?' AI Co-Pilot Recommendation Engine.
    Combines Location, Region Climate, Soil NPK, pH, Water source, and Season.
    """
    result = recommend_regional_crops(
        state=req.state,
        district=req.district,
        farm_size_acres=req.farm_size_acres or 1.0,
        soil_type=req.soil_type or "Loam",
        soil_ph=req.soil_ph or 6.5,
        nitrogen=req.nitrogen or 140.0,
        phosphorus=req.phosphorus or 40.0,
        potassium=req.potassium or 200.0,
        water_source=req.water_source or "Borewell",
        season=req.season or "Kharif (Monsoon)"
    )
    return result
