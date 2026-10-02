# AgroVision AI: Satellite Field Health & Multispectral Remote Sensing

## Overview
The **Satellite Field Health** module in AgroVision AI provides farmers with satellite monitoring powered by the **Sentinel-2 L2A (Copernicus Earth Observation)** constellation. It ingests optical multispectral imagery at 10-meter spatial resolution, computes vegetation and moisture indices, identifies spatial stress zones within farm boundaries, tracks historical changes across orbital revisit cycles (every 5 days), and synthesizes remote sensing signals with live weather radar and on-farm IoT soil moisture sensors.

---

## Remote Sensing Data Architecture

### 1. Satellite Constellation & Provider
- **Provider:** European Space Agency (ESA) Copernicus Sentinel-2 Multi-Spectral Instrument (MSI) Level-2A (Bottom-Of-Atmosphere reflectance).
- **Public STAC Endpoints:**
  - Primary: `https://earth-search.aws.element84.com/v1/search` (AWS Earth Search STAC API v1)
  - Fallback: `https://planetarycomputer.microsoft.com/api/stac/v1/search` (Microsoft Planetary Computer STAC)
  - Optional Enterprise Connectors: `Copernicus Data Space Ecosystem`, `Sentinel Hub`, `Agromonitoring`
- **Revisit Frequency:** 5 days (Sentinel-2A + Sentinel-2B combined constellation).
- **Spatial Resolution:** 10 meters per pixel for visible and Near-Infrared (NIR) bands; 20 meters for Shortwave Infrared (SWIR).

### 2. Spectral Bands Used
| Band | Spectral Region | Central Wavelength ($\mu m$) | Spatial Resolution | Agronomic Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **B02** | Blue | $0.490$ | 10 m | Atmospheric scattering calibration & EVI calculation |
| **B03** | Green | $0.560$ | 10 m | True-color optical visualization & green peak detection |
| **B04** | Red | $0.665$ | 10 m | Maximum chlorophyll absorption |
| **B08** | Near-Infrared (NIR) | $0.842$ | 10 m | Mesophyll cell structure reflectance & canopy biomass |
| **B11** | Shortwave Infrared (SWIR-1) | $1.610$ | 20 m | Leaf canopy water absorption & liquid water content |

---

## Mathematical Index Calculations

### 1. Normalized Difference Vegetation Index (NDVI)
$$\text{NDVI} = \frac{\text{NIR} - \text{Red}}{\text{NIR} + \text{Red}} = \frac{B08 - B04}{B08 + B04}$$
- **Scale:** $-1.0$ to $+1.0$
- **Classification:**
  - $\ge 0.65$: **Healthy Canopy** (Vigorous photosynthetic activity, high leaf area index)
  - $0.45 - 0.64$: **Moderate Stress** (Thinning canopy, early chlorosis, or sub-optimal vegetative growth)
  - $< 0.45$: **High Stress / Sparse Biomass** (Severe chlorosis, water deficit, or early crop emergence)

### 2. Normalized Difference Moisture Index (NDMI)
$$\text{NDMI} = \frac{\text{NIR} - \text{SWIR}}{\text{NIR} + \text{SWIR}} = \frac{B08 - B11}{B08 + B11}$$
- **Scale:** $-1.0$ to $+1.0$
- **Agronomic Interpretation:** Tracks leaf mesophyll water thickness. Low values ($<0.30$) indicate canopy transpiration deficit or drought stress.

### 3. Enhanced Vegetation Index (EVI)
$$\text{EVI} = 2.5 \times \frac{\text{NIR} - \text{Red}}{\text{NIR} + 6 \times \text{Red} - 7.5 \times \text{Blue} + 1.0}$$

---

## Spatial Stress Zone Detection
The engine subdivides the farm field boundary polygon into four distinct quadrants:
1. **North-East Zone**
2. **North-West Zone**
3. **South-East Zone**
4. **South-West Zone**

Each spatial quadrant provides:
- Zone bounding coordinates (`bounds`)
- Quadrant-specific Mean NDVI and Mean NDMI
- Area in acres
- Status classification (`Healthy`, `Moderate Stress`, `High Stress`)
- **Agronomic Hypotheses:** Evaluates water stress, poor vegetative emergence, nutrient depletion, potential pest/disease hotspots, or environmental factors.
- **Recommended Farmer Action:** Concrete, field-scouting steps.

---

## Multi-Sensor Cross-Correlation Engine
The engine correlates Sentinel-2 optical signals with ground telemetry:
- **Low NDVI + Low Soil Moisture ($<38\%$):** Diagnosed as `WATER_STRESS`. Recommends starting drip irrigation and inspecting lateral line emitters.
- **Low NDVI + Normal/High Soil Moisture ($\ge 38\%$):** Diagnosed as `BIOLOGICAL_OR_NUTRIENT_STRESS`. Rules out water shortage and prompts the farmer to scout leaves and scan with **AgroVision Crop Health AI**.
- **Declining NDVI + Upcoming Rain ($\ge 40\%$ in 24h):** Diagnosed as `WEATHER_RISK`. Advises holding off on irrigation to prevent waterlogging and cleaning field drainage trenches.
- **High NDVI + Balanced Soil Moisture:** Diagnosed as `OPTIMAL_GROWTH`. Confirms stable phenological progression.

---

## API Endpoints

### 1. `GET /api/satellite/field-health/{farm_id}`
Retrieves the complete Sentinel-2 field health bundle for the farm.
- **Query Parameter:** `refresh=true` (optional: force re-query of remote STAC provider).
- **Response Schema:**
  ```json
  {
    "farm_id": 1,
    "farm_name": "Green Valley Farm",
    "crop": "Sugarcane",
    "crop_stage": "Vegetative Growth",
    "latitude": 12.5223,
    "longitude": 76.8974,
    "size_acres": 3.5,
    "observation_date": "2026-09-09",
    "satellite_provider": "Sentinel-2 L2A / Copernicus Earth Observation (Sentinel-2B 10m Multispectral)",
    "resolution_meters": 10.0,
    "cloud_cover_pct": 14.2,
    "is_cloud_covered": false,
    "mean_ndvi": 0.72,
    "mean_ndmi": 0.54,
    "health_status": "Healthy",
    "affected_area_acres": 0.88,
    "boundary_geojson": { ... },
    "zones": [ ... ],
    "what_changed": {
      "previous_date": "2026-09-04",
      "previous_ndvi": 0.69,
      "current_date": "2026-09-09",
      "current_ndvi": 0.72,
      "ndvi_change_pct": 4.3,
      "trend": "IMPROVING",
      "summary": "Field canopy vigor has improved by +4.3%...",
      "possible_reasons": [ ... ],
      "recommended_action": "..."
    },
    "historical_timeline": [ ... ],
    "cross_analysis": {
      "soil_moisture_pct": 32.0,
      "rain_prob_next_24h": 15.0,
      "diagnosis_type": "WATER_STRESS",
      "headline": "High Likelihood of Crop Water Deficit",
      "detailed_explanation": "...",
      "action_steps": [ ... ]
    },
    "screening_disclaimer": "Satellite vegetation (NDVI) and moisture (NDMI) indices are optical screening signals. Physical field scouting or leaf photo scanning via AgroVision Crop Health AI is recommended before chemical treatments."
  }
  ```

### 2. `GET /api/satellite/history/{farm_id}`
Returns the sequential observation history log stored for the farm.

### 3. `POST /api/satellite/boundary/{farm_id}`
Saves a custom GeoJSON polygon boundary drawn by the farmer on the interactive map.

### 4. `POST /api/satellite/refresh/{farm_id}`
Forces an immediate remote query to the Sentinel-2 STAC provider and returns fresh telemetry.

---

## Frontend Features
- **Map View Layers:** High-resolution Esri World Imagery True Color tiles, OpenStreetMap streets, and spectral quadrant polygons.
- **Interactive Boundary Drawing:** Farmers can click coordinates on the map to outline custom boundaries and save them directly.
- **Index Switcher:** Toggle between **NDVI (Vegetation Canopy)** and **NDMI (Canopy Moisture)** with distinct color ramps.
- **Historical Timeline:** Interactive timeline card to inspect prior orbital passes and compare NDVI delta.
- **Screening Disclaimer:** Prominently communicates that satellite spectral indices are screening alerts, not definitive pathogen diagnoses.

---

## Environment Variables (Optional)
```env
# Optional enterprise satellite credentials (defaults to public Earth Search STAC API)
SENTINEL_CLIENT_ID=""
SENTINEL_CLIENT_SECRET=""
COPERNICUS_API_KEY=""
AGROMONITORING_API_KEY=""
```
