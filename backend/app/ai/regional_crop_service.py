"""
AgroVision AI — Regional Crop Intelligence Engine
Maps LOCATION -> REGION -> CLIMATE -> SOIL -> SUITABLE CROPS
Covers major Indian agricultural states, districts, agro-climatic zones, and all major crop categories.
"""

from typing import Dict, Any, List, Optional
import math

# Comprehensive Regional Agricultural Profiles
REGIONAL_DATA_REGISTRY: Dict[str, Dict[str, Dict[str, Any]]] = {
    "Karnataka": {
        "Mandya": {
            "climate_zone": "Southern Dry & Canal-Irrigated Zone",
            "soil_types": ["Red Sandy Loam", "Clay Loam", "Alluvial"],
            "avg_rainfall_mm": "700 - 900",
            "temp_range_c": "19 - 34°C",
            "primary_crops": ["Sugarcane", "Rice", "Finger Millet (Ragi)", "Tomato", "Banana", "Pulses"],
            "varieties": {
                "Sugarcane": ["Co 86032", "Co 62175", "VCF 0517"],
                "Rice": ["JGL 1798", "MTU 1010", "Jyothi"],
                "Finger Millet (Ragi)": ["MR 1", "GPU 28", "ML 365"],
                "Tomato": ["Arka Rakshak", "Arka Samrat", "Abhinav Hybrid"]
            }
        },
        "Kolar": {
            "climate_zone": "Eastern Dry Zone (Semi-Arid Plateau)",
            "soil_types": ["Red Loam", "Laterite", "Gravelly Sandy Loam"],
            "avg_rainfall_mm": "650 - 780",
            "temp_range_c": "18 - 36°C",
            "primary_crops": ["Tomato", "Mango", "Groundnut", "Capsicum", "Finger Millet (Ragi)", "Mulberry"],
            "varieties": {
                "Tomato": ["Arka Rakshak (High Resistance)", "Arka Saurabh", "Heemsohna"],
                "Capsicum": ["Indra", "Orobelle", "Bachata"],
                "Mango": ["Mallika", "Totapuri", "Alphonso", "Banganapalli"],
                "Groundnut": ["TMV 2", "JL 24", "Kadiri 6"]
            }
        },
        "Belagavi": {
            "climate_zone": "Northern Transition & Malnad Border",
            "soil_types": ["Medium Deep Black", "Red Sandy Loam", "Laterite"],
            "avg_rainfall_mm": "800 - 1300",
            "temp_range_c": "16 - 37°C",
            "primary_crops": ["Sugarcane", "Maize", "Soybean", "Rice", "Cotton", "Sunflower"],
            "varieties": {
                "Sugarcane": ["Co 86032", "CoM 0265"],
                "Soybean": ["JS 335", "JS 9305", "DSb 21"],
                "Maize": ["Pioneer 30V92", "DKC 9108", "DeKalb 9144"]
            }
        },
        "Shimoga": {
            "climate_zone": "Southern Transition & Heavy Rainfall Malnad",
            "soil_types": ["Red Lateritic", "Clay Loam", "Alluvial Riverbank"],
            "avg_rainfall_mm": "1100 - 1900",
            "temp_range_c": "20 - 33°C",
            "primary_crops": ["Arecanut", "Paddy", "Ginger", "Pepper", "Maize", "Banana"],
            "varieties": {
                "Arecanut": ["Thirthahalli Local", "Mangala", "Sumangala"],
                "Paddy": ["Intan", "Abhilash", "IR 64"],
                "Ginger": ["Maran", "Rio de Janeiro", "Varada"]
            }
        },
        "Vijayapura": {
            "climate_zone": "Northern Dry Zone (Arid Deccan)",
            "soil_types": ["Deep Black Cotton Soil", "Clay Loam"],
            "avg_rainfall_mm": "500 - 650",
            "temp_range_c": "15 - 42°C",
            "primary_crops": ["Grapes", "Pomegranate", "Lime / Lemon", "Sorghum (Jowar)", "Chickpea (Gram)", "Sunflower"],
            "varieties": {
                "Grapes": ["Thompson Seedless", "Tas-A-Ganesh", "Flame Seedless"],
                "Pomegranate": ["Bhagwa", "Arakta", "Ganesh"],
                "Sorghum (Jowar)": ["M 35-1 (Maldandi)", "CSV 22R"]
            }
        },
        "Mysuru": {
            "climate_zone": "Southern Transition Zone",
            "soil_types": ["Red Sandy Loam", "Medium Black", "Alluvial"],
            "avg_rainfall_mm": "750 - 950",
            "temp_range_c": "18 - 34°C",
            "primary_crops": ["Paddy", "Banana", "Cotton", "Tobacco", "Ginger", "Turmeric"],
            "varieties": {
                "Paddy": ["BPT 5204 (Sona Masoori)", "Jyothi", "IR 64"],
                "Banana": ["Grand Naine", "Nanjangud Rasabale", "Elakki"],
                "Turmeric": ["Prathibha", "Alleppey Supreme"]
            }
        }
    },
    "Maharashtra": {
        "Nashik": {
            "climate_zone": "Western Maharashtra Ghat Transition",
            "soil_types": ["Black Cotton Clay", "Sandy Loam", "Red Soil"],
            "avg_rainfall_mm": "650 - 950",
            "temp_range_c": "12 - 38°C",
            "primary_crops": ["Grapes", "Onion", "Tomato", "Pomegranate", "Maize", "Soybean"],
            "varieties": {
                "Grapes": ["Thompson Seedless", "Sharad Seedless", "Super Sonaka"],
                "Onion": ["N-53", "Bhima Super", "Bhima Red", "Agri-Found Dark Red"],
                "Tomato": ["Abhinav", "US 440", "Aryaman"]
            }
        },
        "Pune": {
            "climate_zone": "Western Plateau Dry Zone",
            "soil_types": ["Medium Black Soil", "Sandy Loam"],
            "avg_rainfall_mm": "650 - 850",
            "temp_range_c": "14 - 37°C",
            "primary_crops": ["Sugarcane", "Tomato", "Onion", "Floriculture / Flowers", "Soybean", "Wheat"],
            "varieties": {
                "Sugarcane": ["Co 86032", "CoM 0265 (Phule 0265)"],
                "Wheat": ["Lokwan", "MACS 6222", "GW 496"]
            }
        },
        "Nagpur": {
            "climate_zone": "Vidarbha Semi-Arid Sub-Humid",
            "soil_types": ["Deep Black Cotton Soil"],
            "avg_rainfall_mm": "1000 - 1200",
            "temp_range_c": "12 - 44°C",
            "primary_crops": ["Nagpur Orange / Mandarin", "Cotton", "Soybean", "Pigeon Pea (Tur)", "Wheat"],
            "varieties": {
                "Nagpur Orange / Mandarin": ["Nagpur Mandarin", "Coorg Mandarin"],
                "Cotton": ["Bt Cotton RCH 659", "Bollgard II"],
                "Pigeon Pea (Tur)": ["BSMR 736", "BDN 711"]
            }
        }
    },
    "Andhra Pradesh": {
        "Guntur": {
            "climate_zone": "Coastal Humid & Krishna Delta Plains",
            "soil_types": ["Black Cotton Soil", "Deltaic Alluvial", "Red Loam"],
            "avg_rainfall_mm": "850 - 1050",
            "temp_range_c": "21 - 42°C",
            "primary_crops": ["Chilli", "Cotton", "Paddy", "Tobacco", "Turmeric", "Black Gram"],
            "varieties": {
                "Chilli": ["Guntur Sannam (S4)", "Teja", "Byadgi", "Armoor"],
                "Cotton": ["Tulasi 118", "Brahma Bt", "RCH 2"],
                "Paddy": ["BPT 5204 (Samba Mahsuri)", "MTU 1061"]
            }
        },
        "Anantapur": {
            "climate_zone": "Scarce Rainfall Rayalaseema Dry Zone",
            "soil_types": ["Red Gravelly Loam", "Shallow Black Soil"],
            "avg_rainfall_mm": "500 - 620",
            "temp_range_c": "17 - 42°C",
            "primary_crops": ["Groundnut", "Sweet Lime (Mosambi)", "Pomegranate", "Castor", "Sorghum", "Millet"],
            "varieties": {
                "Groundnut": ["Kadiri 6", "Kadiri 9", "Dharani", "K-1812"],
                "Sweet Lime (Mosambi)": ["Sathgudi", "Batavian"]
            }
        }
    },
    "Tamil Nadu": {
        "Coimbatore": {
            "climate_zone": "Western Agro-Climatic Zone (Palghat Gap Influence)",
            "soil_types": ["Red Loam", "Black Soil", "Clayey"],
            "avg_rainfall_mm": "650 - 850",
            "temp_range_c": "20 - 36°C",
            "primary_crops": ["Coconut", "Cotton", "Vegetables", "Maize", "Banana", "Turmeric"],
            "varieties": {
                "Coconut": ["West Coast Tall", "East Coast Tall", "VPM 3"],
                "Cotton": ["MCU 5", "Suraj", "SVPR 4"]
            }
        },
        "Thanjavur": {
            "climate_zone": "Cauvery Delta Zone (Rice Bowl of TN)",
            "soil_types": ["Deep Alluvial Delta Soil", "Clay Loam"],
            "avg_rainfall_mm": "950 - 1200",
            "temp_range_c": "22 - 38°C",
            "primary_crops": ["Rice", "Black Gram", "Green Gram", "Banana", "Coconut", "Groundnut"],
            "varieties": {
                "Rice": ["ADT 43", "ADT 45", "CR 1009 Sub 1", "CO 51"],
                "Black Gram": ["VBN 6", "VBN 8", "ADT 5"]
            }
        }
    },
    "Punjab": {
        "Ludhiana": {
            "climate_zone": "Central Alluvial Plain Zone",
            "soil_types": ["Fertile Loamy Sand & Silt Alluvial"],
            "avg_rainfall_mm": "600 - 800",
            "temp_range_c": "5 - 42°C",
            "primary_crops": ["Wheat", "Paddy (Basmati)", "Potato", "Mustard", "Maize", "Sugarcane"],
            "varieties": {
                "Wheat": ["PBW 826", "HD 3086", "PBW 725", "DBW 187"],
                "Paddy (Basmati)": ["Pusa Basmati 1121", "Pusa Basmati 1509", "PR 126"],
                "Potato": ["Kufri Pukhraj", "Kufri Jyoti", "Kufri Chipsona"]
            }
        }
    },
    "Uttar Pradesh": {
        "Agra": {
            "climate_zone": "South-Western Semi-Arid Yamuna Basin",
            "soil_types": ["Alluvial Sandy Loam"],
            "avg_rainfall_mm": "650 - 750",
            "temp_range_c": "6 - 44°C",
            "primary_crops": ["Potato", "Mustard", "Wheat", "Bajra (Pearl Millet)", "Vegetables"],
            "varieties": {
                "Potato": ["Kufri Bahar", "Kufri Khyati", "Kufri Garima"],
                "Mustard": ["Pusa Mustard 25", "Giriraj", "RH 749"]
            }
        }
    }
}

# Master Database of Crop Requirements & Agronomics
COMPREHENSIVE_CROPS_DB: Dict[str, Dict[str, Any]] = {
    # Cereals
    "Rice": {
        "category": "Cereals",
        "optimal_ph": (5.5, 7.2),
        "min_water_liters_day_acre": 6500,
        "ideal_temp_c": (20, 35),
        "soil_pref": ["Clay Loam", "Alluvial", "Deltaic Alluvial", "Deep Alluvial Delta Soil"],
        "seasons": ["Kharif (Monsoon)", "Rabi"],
        "duration_days": "115 - 140 days",
        "expected_yield": "2.8 - 4.2 tonnes / acre",
        "risk_level": "Low - Moderate (Needs assured irrigation)",
        "market_demand": "Very High (Staple grain, MSP procurement)",
        "estimated_price_per_kg": 24.5,
        "water_req_desc": "High (Standing water during tillering to panicle initiation)",
        "description": "High-yielding staple cereal with strong minimum support price backing."
    },
    "Wheat": {
        "category": "Cereals",
        "optimal_ph": (6.0, 7.5),
        "min_water_liters_day_acre": 2800,
        "ideal_temp_c": (10, 25),
        "soil_pref": ["Loam", "Clay Loam", "Fertile Loamy Sand & Silt Alluvial", "Alluvial"],
        "seasons": ["Rabi"],
        "duration_days": "110 - 135 days",
        "expected_yield": "2.2 - 3.2 tonnes / acre",
        "risk_level": "Low",
        "market_demand": "High (Government procurement & flour mills)",
        "estimated_price_per_kg": 23.0,
        "water_req_desc": "Moderate (4-6 split irrigations at critical stages)",
        "description": "Premier winter cereal crop with stable nationwide demand."
    },
    "Maize": {
        "category": "Cereals",
        "optimal_ph": (5.8, 7.5),
        "min_water_liters_day_acre": 3200,
        "ideal_temp_c": (18, 35),
        "soil_pref": ["Well-Drained Loam", "Red Loam", "Medium Black"],
        "seasons": ["Kharif (Monsoon)", "Rabi", "Zaid / Summer"],
        "duration_days": "90 - 110 days",
        "expected_yield": "3.5 - 5.0 tonnes / acre",
        "risk_level": "Low",
        "market_demand": "Very High (Poultry feed, starch & bio-fuel industries)",
        "estimated_price_per_kg": 22.5,
        "water_req_desc": "Moderate (Avoid waterlogging)",
        "description": "Versatile industrial crop with robust poultry and livestock feed demand."
    },
    "Finger Millet (Ragi)": {
        "category": "Cereals",
        "optimal_ph": (5.0, 8.0),
        "min_water_liters_day_acre": 1800,
        "ideal_temp_c": (18, 34),
        "soil_pref": ["Red Sandy Loam", "Red Loam", "Laterite", "Gravelly Sandy Loam"],
        "seasons": ["Kharif (Monsoon)", "Summer"],
        "duration_days": "100 - 120 days",
        "expected_yield": "1.2 - 1.8 tonnes / acre",
        "risk_level": "Very Low (Extremely drought-resilient)",
        "market_demand": "Rising Fast (Nutri-cereal health superfood)",
        "estimated_price_per_kg": 38.0,
        "water_req_desc": "Low (Thrives with minimal rainfed moisture)",
        "description": "Nutrient-dense super-grain ideal for dryland and organic farming."
    },

    # Sugar Crops
    "Sugarcane": {
        "category": "Sugar Crops",
        "optimal_ph": (6.5, 7.8),
        "min_water_liters_day_acre": 8500,
        "ideal_temp_c": (20, 38),
        "soil_pref": ["Deep Rich Loam", "Clay Loam", "Black Cotton Soil", "Alluvial"],
        "seasons": ["Annual (12-14 Months)"],
        "duration_days": "330 - 365 days",
        "expected_yield": "38 - 55 tonnes / acre",
        "risk_level": "Low (Direct sugar mill contract linkage)",
        "market_demand": "Guaranteed (FRP pricing by state sugar factories)",
        "estimated_price_per_kg": 3.4, # ~₹3,400 / ton
        "water_req_desc": "Very High (Drip fertigation highly recommended)",
        "description": "Commercial cash crop providing long-term high revenue per acre."
    },

    # Vegetables
    "Tomato": {
        "category": "Vegetables",
        "optimal_ph": (6.0, 7.0),
        "min_water_liters_day_acre": 4000,
        "ideal_temp_c": (18, 32),
        "soil_pref": ["Red Loam", "Sandy Loam", "Clay Loam", "Well-Drained Loam"],
        "seasons": ["Kharif (Monsoon)", "Rabi", "Zaid / Summer"],
        "duration_days": "100 - 125 days",
        "expected_yield": "14 - 22 tonnes / acre",
        "risk_level": "Moderate (Market price volatility)",
        "market_demand": "Constant High (Urban household consumption & food processing)",
        "estimated_price_per_kg": 32.0,
        "water_req_desc": "Moderate-High (Precise drip irrigation required)",
        "description": "Fast-rotating horticulture powerhouse with immense profit potential."
    },
    "Onion": {
        "category": "Vegetables",
        "optimal_ph": (6.0, 7.2),
        "min_water_liters_day_acre": 3500,
        "ideal_temp_c": (15, 32),
        "soil_pref": ["Friable Sandy Loam", "Medium Black", "Alluvial"],
        "seasons": ["Kharif", "Late Kharif", "Rabi"],
        "duration_days": "110 - 130 days",
        "expected_yield": "10 - 15 tonnes / acre",
        "risk_level": "Moderate",
        "market_demand": "Very High (National food essential)",
        "estimated_price_per_kg": 28.0,
        "water_req_desc": "Moderate (Avoid excess moisture near harvest)",
        "description": "High-value commercial vegetable with major APMC mandi liquidity."
    },
    "Chilli": {
        "category": "Vegetables",
        "optimal_ph": (6.2, 7.5),
        "min_water_liters_day_acre": 3800,
        "ideal_temp_c": (20, 35),
        "soil_pref": ["Black Cotton Soil", "Red Sandy Loam", "Well-Drained Loam"],
        "seasons": ["Kharif", "Rabi"],
        "duration_days": "140 - 180 days (Multiple Pickings)",
        "expected_yield": "4.5 - 7.0 tonnes / acre (Fresh) / 1.5 - 2.5 t (Dry)",
        "risk_level": "Moderate",
        "market_demand": "High (Spice export & oleoresin extraction)",
        "estimated_price_per_kg": 140.0, # Dry chilli price benchmark
        "water_req_desc": "Moderate (Sensitive to moisture stress at flowering)",
        "description": "High-margin spice cash crop with high export and domestic value."
    },
    "Potato": {
        "category": "Vegetables",
        "optimal_ph": (5.2, 6.8),
        "min_water_liters_day_acre": 3500,
        "ideal_temp_c": (12, 24),
        "soil_pref": ["Loose Sandy Loam", "Alluvial Sandy Loam", "Red Soil"],
        "seasons": ["Rabi (Winter)"],
        "duration_days": "80 - 105 days",
        "expected_yield": "9 - 14 tonnes / acre",
        "risk_level": "Low - Moderate",
        "market_demand": "Very High (Cold storage & chip manufacturing)",
        "estimated_price_per_kg": 18.0,
        "water_req_desc": "Moderate (Frequent light waterings)",
        "description": "Short-duration heavy-yielding tuber crop."
    },

    # Pulses
    "Chickpea (Gram)": {
        "category": "Pulses",
        "optimal_ph": (6.0, 7.8),
        "min_water_liters_day_acre": 1500,
        "ideal_temp_c": (10, 30),
        "soil_pref": ["Deep Black Cotton Soil", "Clay Loam", "Sandy Loam"],
        "seasons": ["Rabi"],
        "duration_days": "95 - 115 days",
        "expected_yield": "0.9 - 1.4 tonnes / acre",
        "risk_level": "Low",
        "market_demand": "High (Fixes soil nitrogen naturally, high MSP)",
        "estimated_price_per_kg": 62.0,
        "water_req_desc": "Low (Grows on residual soil moisture)",
        "description": "Soil-enriching legume crop with low input costs and stable returns."
    },
    "Pigeon Pea (Tur)": {
        "category": "Pulses",
        "optimal_ph": (6.5, 7.8),
        "min_water_liters_day_acre": 2200,
        "ideal_temp_c": (20, 35),
        "soil_pref": ["Deep Black Soil", "Loam"],
        "seasons": ["Kharif"],
        "duration_days": "150 - 180 days",
        "expected_yield": "0.8 - 1.2 tonnes / acre",
        "risk_level": "Low - Moderate",
        "market_demand": "Very High (Essential dal commodity)",
        "estimated_price_per_kg": 85.0,
        "water_req_desc": "Low-Moderate (Deep tap root drought tolerance)",
        "description": "Prime protein legume crop fixing up to 40 kg N/ha in soil."
    },

    # Oilseeds
    "Groundnut": {
        "category": "Oilseeds",
        "optimal_ph": (5.8, 7.2),
        "min_water_liters_day_acre": 2600,
        "ideal_temp_c": (22, 34),
        "soil_pref": ["Red Sandy Loam", "Gravelly Sandy Loam", "Light Loam"],
        "seasons": ["Kharif", "Rabi / Summer"],
        "duration_days": "105 - 125 days",
        "expected_yield": "1.4 - 2.1 tonnes / acre",
        "risk_level": "Low",
        "market_demand": "Very High (Edible oil & confectionery export)",
        "estimated_price_per_kg": 68.0,
        "water_req_desc": "Moderate (Critical at pegging and pod development)",
        "description": "Dual-purpose cash legume providing valuable oil and cattle fodder."
    },
    "Soybean": {
        "category": "Oilseeds",
        "optimal_ph": (6.0, 7.5),
        "min_water_liters_day_acre": 2800,
        "ideal_temp_c": (20, 32),
        "soil_pref": ["Black Cotton Soil", "Clay Loam", "Medium Deep Black"],
        "seasons": ["Kharif"],
        "duration_days": "90 - 105 days",
        "expected_yield": "1.0 - 1.6 tonnes / acre",
        "risk_level": "Low",
        "market_demand": "High (Soy oil & meal export industries)",
        "estimated_price_per_kg": 46.0,
        "water_req_desc": "Moderate (Rainfed with good drainage)",
        "description": "Short-cycle protein & oil powerhouse ideal for kharif rotations."
    },
    "Mustard": {
        "category": "Oilseeds",
        "optimal_ph": (6.0, 7.5),
        "min_water_liters_day_acre": 1800,
        "ideal_temp_c": (10, 25),
        "soil_pref": ["Loam", "Sandy Loam", "Alluvial Sandy Loam"],
        "seasons": ["Rabi"],
        "duration_days": "95 - 110 days",
        "expected_yield": "0.8 - 1.3 tonnes / acre",
        "risk_level": "Low",
        "market_demand": "High (Dominant cooking oil in North India)",
        "estimated_price_per_kg": 54.0,
        "water_req_desc": "Low-Moderate (Needs 2-3 irrigations)",
        "description": "High-return winter oilseed with minimal water needs."
    },

    # Fruits
    "Mango": {
        "category": "Fruits",
        "optimal_ph": (5.5, 7.5),
        "min_water_liters_day_acre": 3000,
        "ideal_temp_c": (20, 40),
        "soil_pref": ["Red Loam", "Alluvial", "Deep Well-Drained Soil"],
        "seasons": ["Perennial Orchard"],
        "duration_days": "Perennial (Harvest: April - July)",
        "expected_yield": "4.0 - 8.0 tonnes / acre (Mature)",
        "risk_level": "Low",
        "market_demand": "Very High (King of fruits, strong export)",
        "estimated_price_per_kg": 65.0,
        "water_req_desc": "Moderate (Drip irrigation during flowering to fruit set)",
        "description": "Lucrative long-term orchard investment with high export value."
    },
    "Grapes": {
        "category": "Fruits",
        "optimal_ph": (6.5, 8.0),
        "min_water_liters_day_acre": 4200,
        "ideal_temp_c": (15, 38),
        "soil_pref": ["Deep Black Cotton Soil", "Sandy Loam", "Clay Loam"],
        "seasons": ["Perennial (Pruning: Oct / Harvest: Feb - April)"],
        "duration_days": "130 - 150 days (Post-pruning)",
        "expected_yield": "10 - 16 tonnes / acre",
        "risk_level": "Moderate (Requires canopy and disease management)",
        "market_demand": "Extremely High (Table grape export & raisin making)",
        "estimated_price_per_kg": 85.0,
        "water_req_desc": "Moderate (Precision drip with moisture stress before harvest)",
        "description": "High-technology export fruit with premium earnings per acre."
    },
    "Pomegranate": {
        "category": "Fruits",
        "optimal_ph": (6.5, 8.0),
        "min_water_liters_day_acre": 2800,
        "ideal_temp_c": (18, 40),
        "soil_pref": ["Deep Loam", "Light Soil", "Gravelly Sandy Loam"],
        "seasons": ["Perennial (Mridag / Hasta / Ambe Bahar)"],
        "duration_days": "160 - 180 days (Bahar to Harvest)",
        "expected_yield": "6.0 - 10.0 tonnes / acre",
        "risk_level": "Moderate",
        "market_demand": "High (Superfood health demand & export)",
        "estimated_price_per_kg": 95.0,
        "water_req_desc": "Low-Moderate (Highly drought hardy)",
        "description": "Arid-zone commercial fruit crop with top shelf-life and value."
    },
    "Banana": {
        "category": "Fruits",
        "optimal_ph": (6.0, 7.5),
        "min_water_liters_day_acre": 7500,
        "ideal_temp_c": (20, 36),
        "soil_pref": ["Clay Loam", "Rich Alluvial", "Red Sandy Loam"],
        "seasons": ["Annual (11-12 Months)"],
        "duration_days": "300 - 350 days",
        "expected_yield": "25 - 40 tonnes / acre",
        "risk_level": "Low - Moderate",
        "market_demand": "Constant High (Year-round urban consumption)",
        "estimated_price_per_kg": 18.0,
        "water_req_desc": "High (Requires regular heavy drip irrigation)",
        "description": "Massive-volume cash fruit with continuous cash flow."
    },

    # Plantation / Commercial
    "Cotton": {
        "category": "Plantation / Commercial",
        "optimal_ph": (6.5, 8.0),
        "min_water_liters_day_acre": 3500,
        "ideal_temp_c": (21, 38),
        "soil_pref": ["Deep Black Cotton Soil", "Red Sandy Loam", "Alluvial"],
        "seasons": ["Kharif"],
        "duration_days": "150 - 180 days",
        "expected_yield": "1.2 - 2.0 tonnes / acre (Seed cotton)",
        "risk_level": "Moderate (Pest management required)",
        "market_demand": "High (Textile mills & export demand)",
        "estimated_price_per_kg": 72.0,
        "water_req_desc": "Moderate (Drip irrigation significantly enhances lint yield)",
        "description": "White gold commercial fiber crop powering textile economies."
    },
    "Arecanut": {
        "category": "Plantation / Commercial",
        "optimal_ph": (5.5, 7.0),
        "min_water_liters_day_acre": 5500,
        "ideal_temp_c": (18, 35),
        "soil_pref": ["Red Lateritic", "Clay Loam", "Alluvial Riverbank"],
        "seasons": ["Perennial Plantation"],
        "duration_days": "Perennial (Annual harvest cycle)",
        "expected_yield": "1.2 - 1.8 tonnes / acre (Processed chali)",
        "risk_level": "Low",
        "market_demand": "High (Mandi auctions in Karnataka)",
        "estimated_price_per_kg": 380.0,
        "water_req_desc": "High (Needs shade trees & sprinkler/drip irrigation)",
        "description": "Top commercial cash plantation crop of the Western Ghats and coastal belt."
    },
    "Coffee": {
        "category": "Plantation / Commercial",
        "optimal_ph": (5.5, 6.5),
        "min_water_liters_day_acre": 3000,
        "ideal_temp_c": (15, 30),
        "soil_pref": ["Deep Forest Loam", "Red Laterite"],
        "seasons": ["Perennial (Shade-Grown)"],
        "duration_days": "Perennial (Harvest: Nov - Feb)",
        "expected_yield": "0.6 - 1.1 tonnes / acre (Clean coffee)",
        "risk_level": "Low - Moderate",
        "market_demand": "Very High (Global specialty export)",
        "estimated_price_per_kg": 220.0,
        "water_req_desc": "Moderate (Blossom showers in March-April critical)",
        "description": "High-value shade plantation crop intercropped with black pepper."
    }
}


def get_supported_regions() -> List[Dict[str, Any]]:
    """Returns list of supported states and districts for frontend dropdowns."""
    results = []
    for state, districts in REGIONAL_DATA_REGISTRY.items():
        district_list = []
        for dist_name, dist_info in districts.items():
            district_list.append({
                "district": dist_name,
                "climate_zone": dist_info["climate_zone"],
                "top_crops": dist_info["primary_crops"]
            })
        results.append({
            "state": state,
            "districts": district_list
        })
    return results


def recommend_regional_crops(
    state: str,
    district: str,
    farm_size_acres: float = 1.0,
    soil_type: str = "Loam",
    soil_ph: float = 6.5,
    nitrogen: float = 140.0,
    phosphorus: float = 40.0,
    potassium: float = 200.0,
    water_source: str = "Borewell",
    season: str = "Kharif (Monsoon)"
) -> Dict[str, Any]:
    """
    Computes data-driven crop suitability rankings combining regional agro-climatic profile
    and farm-specific soil & water parameters.
    """
    # 1. Look up regional context
    state_data = REGIONAL_DATA_REGISTRY.get(state, REGIONAL_DATA_REGISTRY["Karnataka"])
    dist_data: Dict[str, Any] = state_data.get(district, {})
    
    if not dist_data:
        # Fallback to first available district in state
        first_dist = list(state_data.keys())[0]
        dist_data = state_data[first_dist]
        district = first_dist

    climate_zone: str = str(dist_data.get("climate_zone", "Tropical Agricultural Zone"))
    primary_regional_crops: List[str] = list(dist_data.get("primary_crops", []))
    regional_varieties: Dict[str, List[str]] = dict(dist_data.get("varieties", {}))

    scored_crops: List[Dict[str, Any]] = []

    for crop_name, crop_info in COMPREHENSIVE_CROPS_DB.items():
        base_score = 70

        # Region historical alignment
        if crop_name in primary_regional_crops:
            base_score += 16
        
        # pH score match
        optimal_ph = crop_info.get("optimal_ph", (6.0, 7.5))
        min_ph = float(optimal_ph[0])
        max_ph = float(optimal_ph[1])
        if min_ph <= soil_ph <= max_ph:
            base_score += 6
        else:
            diff = min(abs(soil_ph - min_ph), abs(soil_ph - max_ph))
            base_score -= int(diff * 8)

        # Soil type match
        soil_pref = [str(s).lower() for s in crop_info.get("soil_pref", [])]
        if any(soil_type.lower() in pref or pref in soil_type.lower() for pref in soil_pref):
            base_score += 5
        
        # Water availability match
        min_water = float(crop_info.get("min_water_liters_day_acre", 3500))
        if water_source in ["Borewell", "Canal / River"] and min_water >= 5000:
            base_score += 4 # Can sustain high water crops
        elif water_source in ["Rainfed Only", "Farm Pond"] and min_water < 3000:
            base_score += 6 # Perfect for drought resilient crops

        # NPK nutrient alignment
        total_npk = nitrogen + phosphorus + potassium
        crop_category = str(crop_info.get("category", "General"))
        if total_npk >= 350 and crop_category in ["Vegetables", "Sugar Crops", "Fruits"]:
            base_score += 4

        # Clamp score between 60% and 96%
        final_score = min(96, max(62, base_score))

        # Recommended varieties
        var_list = regional_varieties.get(crop_name, ["High-Yielding Hybrid", "State Certified Selection", "PUSA Regional Variety"])

        why_text = f"Highly suited for {district}'s {climate_zone.lower()}. Matches your {soil_type} (pH {soil_ph}) and {water_source} water supply."

        seasons_list = [str(s) for s in crop_info.get("seasons", ["Annual"])]
        soil_pref_raw = [str(s) for s in crop_info.get("soil_pref", ["Well-Drained Loam"])]

        scored_crops.append({
            "crop_name": crop_name,
            "category": crop_category,
            "suitability_score": final_score,
            "why_recommended": why_text,
            "growing_season": ", ".join(seasons_list),
            "soil_suitability": f"Optimal for {', '.join(soil_pref_raw[:2])}",
            "water_requirement": str(crop_info.get("water_req_desc", "Moderate")),
            "duration_days": str(crop_info.get("duration_days", "90-120 days")),
            "expected_yield": str(crop_info.get("expected_yield", "2-4 tonnes / acre")),
            "risk_level": str(crop_info.get("risk_level", "Moderate")),
            "market_demand": str(crop_info.get("market_demand", "High")),
            "estimated_price_per_kg": crop_info.get("estimated_price_per_kg"),
            "recommended_varieties": var_list
        })

    # Sort descending by suitability score
    scored_crops.sort(key=lambda x: int(x["suitability_score"]), reverse=True)

    # Top recommendations
    top_recommendations = scored_crops[:8]

    return {
        "location_summary": f"{district}, {state} ({climate_zone})",
        "climate_zone": climate_zone,
        "recommended_crops": top_recommendations,
        "soil_health_assessment": f"Soil pH {soil_ph} is {'ideal' if 6.0 <= soil_ph <= 7.2 else 'slightly acidic' if soil_ph < 6.0 else 'alkaline'} for {top_recommendations[0]['crop_name']}. Total NPK level: {int(nitrogen+phosphorus+potassium)} mg/kg.",
        "water_advisory": f"With {water_source} irrigation on {farm_size_acres} acre(s), you can comfortably support {top_recommendations[0]['crop_name']} or {top_recommendations[1]['crop_name']}."
    }
