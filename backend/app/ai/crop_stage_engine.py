"""
AgroVision AI — Crop Stage Intelligence Engine (CropStageEngine)
Provides standardized 8-stage crop lifecycle modeling, crop-specific growth durations,
stage transition calculations, manual override support, and stage-specific agronomic advisories.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, date

# Standardized 8 Lifecycle Stages
STANDARD_STAGES = [
    "Sowing",
    "Germination",
    "Seedling",
    "Vegetative Growth",
    "Flowering",
    "Fruiting / Grain Filling",
    "Maturity",
    "Harvest"
]

STAGE_ICONS = {
    "Sowing": "🌱",
    "Germination": "🌿",
    "Seedling": "☘️",
    "Vegetative Growth": "🌳",
    "Flowering": "🌸",
    "Fruiting / Grain Filling": "🍅",
    "Maturity": "🌾",
    "Harvest": "🧺"
}

# Crop Duration Profiles (Days in ground for each of the 8 stages)
CROP_STAGE_PROFILES: Dict[str, List[Dict[str, Any]]] = {
    "Tomato": [
        {
            "stage_name": "Sowing",
            "stage_index": 1,
            "start_day": 0,
            "end_day": 5,
            "icon": "🌱",
            "description": "Seedbed preparation, nursery seed sowing, and initial moisture establishment.",
            "key_tasks": ["Treat seeds with Trichoderma viride", "Prepare raised nursery beds", "Keep seedbed surface gently moist"],
            "irrigation": "Light misting twice daily; avoid standing water.",
            "nutrients": "Organic compost / FYM rich bed; no heavy chemical NPK at sowing.",
            "disease_risks": "Damping-off fungal pathogens (Pythium/Rhizoctonia).",
            "scouting_tips": "Check for uniform soil moisture and seed coverage."
        },
        {
            "stage_name": "Germination",
            "stage_index": 2,
            "start_day": 6,
            "end_day": 12,
            "icon": "🌿",
            "description": "Radicle and cotyledon emergence above soil surface.",
            "key_tasks": ["Monitor cotyledon emergence", "Provide light shade against harsh noon sun", "Prevent crust formation"],
            "irrigation": "Morning topsoil watering with fine rose-can.",
            "nutrients": "Humic acid drenching to promote lateral root hairs.",
            "disease_risks": "Pre-emergence rot and nursery ant damage.",
            "scouting_tips": "Inspect seedlings for upright hypocotyl emergence."
        },
        {
            "stage_name": "Seedling",
            "stage_index": 3,
            "start_day": 13,
            "end_day": 25,
            "icon": "☘️",
            "description": "True leaf development and nursery hardening before transplanting into main field.",
            "key_tasks": ["Harden seedlings 3-4 days before transplanting", "Transplant 21-25 day seedlings to main field", "Dip seedling roots in biofertilizer slurry"],
            "irrigation": "Copious watering immediately upon field transplanting.",
            "nutrients": "Starter NPK 19:19:19 fertigation 4 days after transplanting.",
            "disease_risks": "Transplant shock and early cutworm damage.",
            "scouting_tips": "Check for sturdy stem girth and vibrant green leaves."
        },
        {
            "stage_name": "Vegetative Growth",
            "stage_index": 4,
            "start_day": 26,
            "end_day": 45,
            "icon": "🌳",
            "description": "Rapid stem elongation, lateral branching, and deep root establishment.",
            "key_tasks": ["Provide bamboo stake / trellis support", "Prune lower sucker shoots", "Intercultural weeding & mulching"],
            "irrigation": "Precision drip irrigation every 2-3 days (1,200 - 1,500 L/acre/cycle).",
            "nutrients": "High Nitrogen split dose (Urea/Bio-NPK) to boost canopy biomass.",
            "disease_risks": "Early blight (Alternaria solani), leaf miners, and whiteflies.",
            "scouting_tips": "Scout lower leaf surfaces for concentric dark brown target spots."
        },
        {
            "stage_name": "Flowering",
            "stage_index": 5,
            "start_day": 46,
            "end_day": 65,
            "icon": "🌸",
            "description": "Bright yellow floral cluster emergence, anthesis, and initial pollination.",
            "key_tasks": ["Ensure optimal bee activity / pollination", "Maintain steady moisture to avoid blossom drop", "Avoid harsh chemical sprays during active bloom"],
            "irrigation": "Uniform drip hydration; avoid drying-wetting stress cycles.",
            "nutrients": "Boost Phosphorus, Potassium (0:52:34) and foliar Boron (1g/L) for fruit set.",
            "disease_risks": "Blossom drop, powdery mildew, and thrips damage on flowers.",
            "scouting_tips": "Examine flower trusses for healthy yellow petals and fruit set."
        },
        {
            "stage_name": "Fruiting / Grain Filling",
            "stage_index": 6,
            "start_day": 66,
            "end_day": 85,
            "icon": "🍅",
            "description": "Rapid berry expansion, chlorophyll accumulation, and breaker stage color transition.",
            "key_tasks": ["Apply Calcium nitrate to prevent Blossom End Rot", "Install yellow/blue sticky traps and pheromone lures for fruit borer", "Maintain fruit load balance"],
            "irrigation": "High water demand; consistent morning drip irrigation.",
            "nutrients": "Potassium sulphate (0:0:50) + Calcium to improve fruit firmness and skin shine.",
            "disease_risks": "Tomato fruit borer (Helicoverpa armigera) and Blossom End Rot (Calcium deficit).",
            "scouting_tips": "Check bottom calyx of developing green fruits for dark water-soaked spots."
        },
        {
            "stage_name": "Maturity",
            "stage_index": 7,
            "start_day": 86,
            "end_day": 100,
            "icon": "🌾",
            "description": "Fruit ripening from breaker/pink to deep firm red table maturity.",
            "key_tasks": ["Reduce irrigation frequency to concentrate brix sugar levels", "Inspect crates and prepare shaded grading station", "Check local APMC Mandi rates"],
            "irrigation": "Moderate irrigation; withhold water 24h before harvest to prevent fruit split.",
            "nutrients": "Micronutrient maintenance spray; cease heavy nitrogen.",
            "disease_risks": "Fruit cracking/splitting and post-rain anthracnose.",
            "scouting_tips": "Evaluate fruit firmness and harvest index across rows."
        },
        {
            "stage_name": "Harvest",
            "stage_index": 8,
            "start_day": 101,
            "end_day": 130,
            "icon": "🧺",
            "description": "Multiple picking cycles, grading by size/color, and APMC Mandi distribution.",
            "key_tasks": ["Pick fruits in early morning (6:00 AM - 9:00 AM)", "Grade into Grade A (local market) and Grade B", "Transport in ventilated plastic crates"],
            "irrigation": "Light post-picking drip hydration to support subsequent flushes.",
            "nutrients": "Post-first-pick booster fertigation (13:0:45) for secondary flushes.",
            "disease_risks": "Transit decay and mechanical bruising.",
            "scouting_tips": "Harvest at turning/pink stage for distant transport; red-ripe for local sale."
        }
    ],

    "Rice": [
        {
            "stage_name": "Sowing",
            "stage_index": 1,
            "start_day": 0,
            "end_day": 5,
            "icon": "🌱",
            "description": "Wet or dry nursery bed preparation, seed soaking, and sprouting.",
            "key_tasks": ["Soak seeds in salt solution to eliminate chaffy grains", "Treat with Carbendazim/Pseudomonas", "Sow pre-germinated seeds uniformly in nursery"],
            "irrigation": "Saturated nursery bed; drain excess water after sowing.",
            "nutrients": "Well-rotted FYM in nursery beds.",
            "disease_risks": "Seed rot and bird picking.",
            "scouting_tips": "Check seed germination percentage before field sowing."
        },
        {
            "stage_name": "Germination",
            "stage_index": 2,
            "start_day": 6,
            "end_day": 10,
            "icon": "🌿",
            "description": "Coleoptile and radicle emergence in nursery beds.",
            "key_tasks": ["Maintain thin water layer in wet nursery", "Protect from water stagnancy during heavy rains"],
            "irrigation": "Maintain saturated soil condition without submergence.",
            "nutrients": "Light top-dressing of nitrogen if seedling yellowing occurs.",
            "disease_risks": "Algal scum and damping-off.",
            "scouting_tips": "Inspect for uniform green shoots across nursery."
        },
        {
            "stage_name": "Seedling",
            "stage_index": 3,
            "start_day": 11,
            "end_day": 25,
            "icon": "☘️",
            "description": "4-5 leaf stage seedlings ready for field uprooting and transplanting.",
            "key_tasks": ["Uproot 20-25 day seedlings carefully", "Transplant 2-3 seedlings per hill with 20x15 cm spacing", "Puddle main field thoroughly"],
            "irrigation": "Maintain 2-3 cm standing water in main field during transplanting.",
            "nutrients": "Basal application of NPK + Zinc sulphate (25 kg/ha).",
            "disease_risks": "Transplant shock and whorl maggot.",
            "scouting_tips": "Ensure shallow planting (2-3 cm depth) for rapid tillering."
        },
        {
            "stage_name": "Vegetative Growth",
            "stage_index": 4,
            "start_day": 26,
            "end_day": 55,
            "icon": "🌳",
            "description": "Active tillering, maximum tillering, and stem elongation.",
            "key_tasks": ["Weed with cono-weeder at 30 & 45 DAT", "Maintain intermittent wetting and drying (AWD)", "Apply first split of Urea"],
            "irrigation": "Alternate Wetting and Drying (AWD) to save water and strengthen root anchorage.",
            "nutrients": "Top dress Urea (Nitrogen) at active tillering stage.",
            "disease_risks": "Stem borer (dead hearts), leaf folder, and blast (Magnaporthe oryzae).",
            "scouting_tips": "Check for dead hearts in central tillers and folded leaves."
        },
        {
            "stage_name": "Flowering",
            "stage_index": 5,
            "start_day": 56,
            "end_day": 80,
            "icon": "🌸",
            "description": "Panicle initiation, boot leaf emergence, and anthesis.",
            "key_tasks": ["Maintain continuous shallow water depth (5 cm)", "Avoid water deficit during panicle emergence", "Monitor for gundhi bug during morning hours"],
            "irrigation": "Maintain 3-5 cm water layer continuously during flowering.",
            "nutrients": "Apply MOP (Potash) split dose at panicle initiation.",
            "disease_risks": "Sheath blight, bacterial leaf blight (BLB), and rice gundhi bug.",
            "scouting_tips": "Inspect flag leaves for lesion development and panicle emergence."
        },
        {
            "stage_name": "Fruiting / Grain Filling",
            "stage_index": 6,
            "start_day": 81,
            "end_day": 105,
            "icon": "🌾",
            "description": "Milky, dough, and grain hardening stages in panicles.",
            "key_tasks": ["Scout for rice earhead bug (gundhi bug)", "Apply Neem oil / bio-pesticide if bug threshold exceeds 2/hill", "Maintain light moisture"],
            "irrigation": "Keep soil moist; do not allow field to crack.",
            "nutrients": "Foliar 1% Potassium Nitrate spray for filled, heavy grains.",
            "disease_risks": "False smut and grain discoloration.",
            "scouting_tips": "Check milky grains for punctures or discoloration."
        },
        {
            "stage_name": "Maturity",
            "stage_index": 7,
            "start_day": 106,
            "end_day": 120,
            "icon": "☀️",
            "description": "85-90% panicle golden yellow transition, moisture drops to 20-22%.",
            "key_tasks": ["Drain all standing water from field 10 days before harvest", "Prepare threshing floor and combine harvester booking"],
            "irrigation": "Completely drain field to facilitate uniform ripening and tractor movement.",
            "nutrients": "No nutrient application.",
            "disease_risks": "Lodging from untimely late rains.",
            "scouting_tips": "Bite grain test: hard chalky grain indicates physiological maturity."
        },
        {
            "stage_name": "Harvest",
            "stage_index": 8,
            "start_day": 121,
            "end_day": 135,
            "icon": "🧺",
            "description": "Crop harvesting, threshing, winnowing, and moisture reduction to 14%.",
            "key_tasks": ["Harvest when 85% grains are straw golden", "Thresh immediately to prevent shattering loss", "Sun-dry paddy to 14% moisture for storage or Mandi sale"],
            "irrigation": "Field dry.",
            "nutrients": "None.",
            "disease_risks": "Storage grain weevils and mould if bagged wet.",
            "scouting_tips": "Check moisture meter reading before bagging."
        }
    ],

    "Cotton": [
        {
            "stage_name": "Sowing",
            "stage_index": 1,
            "start_day": 0,
            "end_day": 5,
            "icon": "🌱",
            "description": "Field preparation, ridge-furrow making, and seed dibbling at recommended spacing.",
            "key_tasks": ["Treat Bt cotton seeds with Imidacloprid", "Dibble seeds at 90x60 cm or 120x45 cm", "Ensure deep moist soil"],
            "irrigation": "Pre-sowing irrigation to ensure deep root-zone moisture.",
            "nutrients": "Basal FYM + DAP + Potash placement.",
            "disease_risks": "Soil-borne seedling root rot.",
            "scouting_tips": "Verify uniform seed placement at 3-4 cm depth."
        },
        {
            "stage_name": "Germination",
            "stage_index": 2,
            "start_day": 6,
            "end_day": 12,
            "icon": "🌿",
            "description": "Cotyledon emergence and initial taproot penetration.",
            "key_tasks": ["Gap filling within 8-10 days of sowing", "Thinning excess seedlings leaving one robust plant per hill"],
            "irrigation": "Avoid heavy water stagnation; keep furrows drained.",
            "nutrients": "None at this stage.",
            "disease_risks": "Damping-off and cutworms.",
            "scouting_tips": "Scout for uniform plant stand and gap filling requirement."
        },
        {
            "stage_name": "Seedling",
            "stage_index": 3,
            "start_day": 13,
            "end_day": 30,
            "icon": "☘️",
            "description": "First true leaf emergence to 4-5 leaf establishment.",
            "key_tasks": ["First weeding and light intercultivation", "Scout for sucking pests (jassids, aphids, thrips)", "Install yellow sticky traps"],
            "irrigation": "Light irrigation at 10-14 day interval based on rain.",
            "nutrients": "First split of Nitrogen (Urea) at 30 DAS.",
            "disease_risks": "Early sucking pests causing leaf curl and hopper burn.",
            "scouting_tips": "Examine underside of top 3 leaves for nymphs."
        },
        {
            "stage_name": "Vegetative Growth",
            "stage_index": 4,
            "start_day": 31,
            "end_day": 60,
            "icon": "🌳",
            "description": "Sympodial branch development and square (flower bud) formation.",
            "key_tasks": ["Second intercultivation and earthing up", "Monitor square formation rate", "Apply balanced NPK split"],
            "irrigation": "Moderate irrigation; do not stress during square formation.",
            "nutrients": "Second split dose of Urea + Potash.",
            "disease_risks": "Square shedding due to mirid bug or moisture stress.",
            "scouting_tips": "Count squares per plant to assess reproductive vigor."
        },
        {
            "stage_name": "Flowering",
            "stage_index": 5,
            "start_day": 61,
            "end_day": 90,
            "icon": "🌸",
            "description": "White/cream flower anthesis, pollination, and pink flower transition.",
            "key_tasks": ["Scout for Pink Bollworm (install pheromone traps @ 5/acre)", "Apply 2% DAP or Potassium Nitrate spray to reduce flower shedding", "Maintain uniform moisture"],
            "irrigation": "Critical moisture window; avoid drought stress during peak bloom.",
            "nutrients": "Foliar spray of 19:19:19 + Boron (1g/L).",
            "disease_risks": "Pink bollworm (Pectinophora gossypiella) rosette flowers.",
            "scouting_tips": "Inspect rosette flowers for pink bollworm larvae."
        },
        {
            "stage_name": "Fruiting / Grain Filling",
            "stage_index": 6,
            "start_day": 91,
            "end_day": 130,
            "icon": "🍅",
            "description": "Boll expansion, fiber elongation, and seed maturation inside green bolls.",
            "key_tasks": ["Monitor boll load and boll weight", "Spray Magnesium Sulphate (10g/L) to prevent leaf reddening", "Continue bollworm surveillance"],
            "irrigation": "Regular irrigation at 12-15 day intervals.",
            "nutrients": "0:0:50 (Potassium sulphate) foliar spray for fiber strength.",
            "disease_risks": "Boll rot (fungal/bacterial) during humid overcast spells.",
            "scouting_tips": "Cut open developing green bolls to check for internal burrowing."
        },
        {
            "stage_name": "Maturity",
            "stage_index": 7,
            "start_day": 131,
            "end_day": 155,
            "icon": "🌾",
            "description": "Boll dehiscence, fluffing of white fiber locks, and moisture reduction.",
            "key_tasks": ["Withhold irrigation to encourage clean boll bursting", "Avoid defoliant spray unless high moisture"],
            "irrigation": "Cease irrigation completely.",
            "nutrients": "None.",
            "disease_risks": "Boll staining from rain or dusk moisture.",
            "scouting_tips": "Check percentage of open bolls across field."
        },
        {
            "stage_name": "Harvest",
            "stage_index": 8,
            "start_day": 156,
            "end_day": 180,
            "icon": "🧺",
            "description": "Multiple picking passes (first, second, third pickings), grading, and Mandi trade.",
            "key_tasks": ["Pick clean, fully opened bolls in sunny afternoon (dry fiber)", "Store in clean cotton bags; avoid plastic bags to prevent contamination", "Check APMC Kapas MSP rates"],
            "irrigation": "None.",
            "nutrients": "None.",
            "disease_risks": "Trash contamination and moisture degradation in storage.",
            "scouting_tips": "Pick bolls without bracts or dry leaves for Grade-A market rate."
        }
    ],

    "Maize": [
        {
            "stage_name": "Sowing",
            "stage_index": 1,
            "start_day": 0,
            "end_day": 4,
            "icon": "🌱",
            "description": "Seedbed preparation and dibbling at 60x20 cm spacing.",
            "key_tasks": ["Treat hybrid seed with Cyantraniliprole for Fall Armyworm", "Sow at 4-5 cm depth in moist soil"],
            "irrigation": "Pre-sowing irrigation or immediately after sowing.",
            "nutrients": "Basal NPK (DAP + MOP + Zinc).",
            "disease_risks": "Seedling rot and bird damage.",
            "scouting_tips": "Ensure uniform depth and spacing."
        },
        {
            "stage_name": "Germination",
            "stage_index": 2,
            "start_day": 5,
            "end_day": 10,
            "icon": "🌿",
            "description": "Coleoptile emergence and spike leaf unfolding.",
            "key_tasks": ["Gap filling within 7 days", "Check for proper emergence across rows"],
            "irrigation": "Keep soil moist without ponding.",
            "nutrients": "None.",
            "disease_risks": "Soil cutworms.",
            "scouting_tips": "Count emerged plants per 10-meter row."
        },
        {
            "stage_name": "Seedling",
            "stage_index": 3,
            "start_day": 11,
            "end_day": 25,
            "icon": "☘️",
            "description": "V3 to V6 leaf stage with rapid nodal root development.",
            "key_tasks": ["Scout for Fall Armyworm (FAW) pinholes and frass in whorls", "Apply bio-pesticide / Bacillus thuringiensis if FAW spotted", "First intercultural weeding"],
            "irrigation": "Irrigate at 10-12 day intervals.",
            "nutrients": "First split of Nitrogen at V4 stage.",
            "disease_risks": "Fall Armyworm (Spodoptera frugiperda) whorl damage.",
            "scouting_tips": "Look into central whorl for sawdust-like fecal frass."
        },
        {
            "stage_name": "Vegetative Growth",
            "stage_index": 4,
            "start_day": 26,
            "end_day": 50,
            "icon": "🌳",
            "description": "Rapid stem elongation, knee-high stage (V8) to flag leaf.",
            "key_tasks": ["Earthing up at knee-high stage to prevent lodging", "Apply second split of Urea", "Maintain weed-free field"],
            "irrigation": "Important vegetative growth hydration.",
            "nutrients": "Urea top dressing before earthing up.",
            "disease_risks": "Turcicum leaf blight and stem borer.",
            "scouting_tips": "Inspect leaves for long spindle-shaped necrotic lesions."
        },
        {
            "stage_name": "Flowering",
            "stage_index": 5,
            "start_day": 51,
            "end_day": 65,
            "icon": "🌸",
            "description": "Tasseling (male flower) and silking (female flower) anthesis.",
            "key_tasks": ["CRITICAL: Do NOT allow any water stress during silking", "Monitor silk emergence and pollen shedding synchronization"],
            "irrigation": "Peak water demand; irrigate every 5-7 days.",
            "nutrients": "Foliar spray of 13:0:45 (Potassium Nitrate).",
            "disease_risks": "Pollen desiccation if temperature exceeds 38°C.",
            "scouting_tips": "Check silk freshness and pollen shed timing."
        },
        {
            "stage_name": "Fruiting / Grain Filling",
            "stage_index": 6,
            "start_day": 66,
            "end_day": 85,
            "icon": "🌽",
            "description": "Blister, milk, and dough stages in developing corn cobs.",
            "key_tasks": ["Maintain soil moisture for plump kernel filling", "Scout for earhead caterpillars", "Protect cobs from wild animal damage"],
            "irrigation": "Maintain adequate moisture until dough stage.",
            "nutrients": "Potassium spray to increase kernel test weight.",
            "disease_risks": "Cob rot and kernel smut.",
            "scouting_tips": "Peel back cob husk to check grain set to tip of ear."
        },
        {
            "stage_name": "Maturity",
            "stage_index": 7,
            "start_day": 86,
            "end_day": 100,
            "icon": "🌾",
            "description": "Black layer formation at kernel base; husk leaves turn straw yellow.",
            "key_tasks": ["Withhold irrigation", "Check for black layer at seed attachment point (physiological maturity)"],
            "irrigation": "Completely stop irrigation.",
            "nutrients": "None.",
            "disease_risks": "Pre-harvest cob mould if unseasonal rains occur.",
            "scouting_tips": "Break a kernel to check the black abscission layer."
        },
        {
            "stage_name": "Harvest",
            "stage_index": 8,
            "start_day": 101,
            "end_day": 115,
            "icon": "🧺",
            "description": "Cob harvesting, de-husking, shelling, and grain drying to 12-14% moisture.",
            "key_tasks": ["Harvest dry cobs", "Sun-dry or machine shell", "Store or deliver to Mandi / poultry feed mill buyers"],
            "irrigation": "None.",
            "nutrients": "None.",
            "disease_risks": "Aflatoxin contamination if stored above 14% moisture.",
            "scouting_tips": "Ensure grain moisture is below 14% before bagging."
        }
    ],

    "Sugarcane": [
        {
            "stage_name": "Sowing",
            "stage_index": 1,
            "start_day": 0,
            "end_day": 15,
            "icon": "🌱",
            "description": "Sett preparation, fungicide dipping, and furrow planting.",
            "key_tasks": ["Select 2-3 bud setts from 8-10 month disease-free cane", "Dip in Carbendazim + Chlorpyrifos", "Plant in deep furrows"],
            "irrigation": "Immediate copius irrigation along furrows.",
            "nutrients": "Basal FYM + SSP + Potash.",
            "disease_risks": "Sett rot (Pineapple disease).",
            "scouting_tips": "Check sett eye buds for healthy pink/green appearance."
        },
        {
            "stage_name": "Germination",
            "stage_index": 2,
            "start_day": 16,
            "end_day": 35,
            "icon": "🌿",
            "description": "Sprouting of eye buds and primary shoot emergence.",
            "key_tasks": ["Monitor sprout percentage", "Light hoeing to break soil crust"],
            "irrigation": "Irrigate at 8-10 day intervals.",
            "nutrients": "None.",
            "disease_risks": "Early shoot borer (Chilo infuscatellus).",
            "scouting_tips": "Inspect for dead hearts in young sprouts."
        },
        {
            "stage_name": "Seedling",
            "stage_index": 3,
            "start_day": 36,
            "end_day": 100,
            "icon": "☘️",
            "description": "Tillering phase (Formative stage) establishing multiple millable canes.",
            "key_tasks": ["Partial earthing up at 45 & 90 days", "Apply first & second split of Nitrogen", "Scout for early shoot borer"],
            "irrigation": "Regular irrigation every 7-10 days.",
            "nutrients": "Nitrogen split application (Urea).",
            "disease_risks": "Early shoot borer and root grubs.",
            "scouting_tips": "Pull central leaf whorl: dead heart pulling easily indicates borer."
        },
        {
            "stage_name": "Vegetative Growth",
            "stage_index": 4,
            "start_day": 101,
            "end_day": 250,
            "icon": "🌳",
            "description": "Grand growth period: rapid internode elongation, cane thickening, and heavy biomass.",
            "key_tasks": ["Full earthing up at 120-150 days", "Trash mulching and detrashes to improve aeration", "Propping / tying canes together to prevent lodging"],
            "irrigation": "Peak water requirement; deep irrigation every 10 days.",
            "nutrients": "Complete all Nitrogen doses by 120-150 days; top dress MOP.",
            "disease_risks": "Internode borer, red rot (Colletotrichum falcatum), and woolly aphid.",
            "scouting_tips": "Check for third leaf drying and red discoloration in split cane."
        },
        {
            "stage_name": "Flowering",
            "stage_index": 5,
            "start_day": 251,
            "end_day": 290,
            "icon": "🌸",
            "description": "Arrowing / tassel emergence (in flowering varieties) and vegetative cessation.",
            "key_tasks": ["Monitor arrowing percentage", "Maintain moisture without waterlogging"],
            "irrigation": "Moderate irrigation.",
            "nutrients": "Foliar Potassium to enhance sucrose synthesis.",
            "disease_risks": "Pith formation if harvest delayed post-arrowing.",
            "scouting_tips": "Check cane stalk for hollow pith development."
        },
        {
            "stage_name": "Fruiting / Grain Filling",
            "stage_index": 6,
            "start_day": 291,
            "end_day": 340,
            "icon": "🌾",
            "description": "Ripening & sucrose accumulation inside stalk internodes.",
            "key_tasks": ["Gradual widening of irrigation intervals", "Field de-trashing of dry bottom leaves", "Brix refractometer sugar testing"],
            "irrigation": "Extend irrigation intervals to 15-20 days to trigger sugar concentration.",
            "nutrients": "No nitrogen (excess N lowers sugar recovery).",
            "disease_risks": "Red rot and scale insects.",
            "scouting_tips": "Use hand refractometer: top-to-bottom brix ratio should reach 0.95 - 1.0."
        },
        {
            "stage_name": "Maturity",
            "stage_index": 7,
            "start_day": 341,
            "end_day": 365,
            "icon": "☀️",
            "description": "Peak sugar recovery stage; cane metallic ring sound when tapped.",
            "key_tasks": ["Withhold water 15 days prior to harvest", "Coordinate cutting schedule with local sugar factory mill"],
            "irrigation": "Completely stop irrigation 15 days before cutting.",
            "nutrients": "None.",
            "disease_risks": "Sucrose inversion if cut cane stays uncrushed >24 hours.",
            "scouting_tips": "Tap mature cane: metallic sound indicates full maturity; dull sound indicates immature."
        },
        {
            "stage_name": "Harvest",
            "stage_index": 8,
            "start_day": 366,
            "end_day": 400,
            "icon": "🧺",
            "description": "Ground-level cutting, de-topping, and rapid transport to sugar mill within 24h.",
            "key_tasks": ["Cut flush with ground level (bottom internodes contain highest sugar)", "De-top green leaves for cattle fodder", "Transport to mill within 24 hours to prevent weight & sugar loss"],
            "irrigation": "Dry field during cut; post-harvest irrigation for ratoon crop.",
            "nutrients": "Plan ratoon management (stubble shaving + fertilizer).",
            "disease_risks": "Post-harvest inversion loss.",
            "scouting_tips": "Ensure ground flush cutting for healthy ratoon emergence."
        }
    ]
}

# Generic fallback profile with proportional duration
DEFAULT_PROFILE: List[Dict[str, Any]] = [
    {
        "stage_name": "Sowing",
        "stage_index": 1,
        "start_day": 0,
        "end_day": 6,
        "icon": "🌱",
        "description": "Land preparation, seed treatment, and initial field sowing.",
        "key_tasks": ["Treat seeds with biofertilizers", "Ensure seedbed moisture", "Sow at recommended depth"],
        "irrigation": "Light initial watering to ensure germination.",
        "nutrients": "Organic FYM / starter basal compost.",
        "disease_risks": "Seed rot and soil pests.",
        "scouting_tips": "Verify uniform seed spacing and soil depth."
    },
    {
        "stage_name": "Germination",
        "stage_index": 2,
        "start_day": 7,
        "end_day": 14,
        "icon": "🌿",
        "description": "Initial radicle and shoot emergence through the soil surface.",
        "key_tasks": ["Monitor emergence rate", "Gap fill where required", "Prevent surface crusting"],
        "irrigation": "Gentle topsoil moisture maintenance.",
        "nutrients": "None.",
        "disease_risks": "Damping-off fungal pathogens.",
        "scouting_tips": "Check for uniform green sprout emergence."
    },
    {
        "stage_name": "Seedling",
        "stage_index": 3,
        "start_day": 15,
        "end_day": 28,
        "icon": "☘️",
        "description": "Early vegetative establishment and primary root network expansion.",
        "key_tasks": ["Light intercultural weeding", "Monitor for early sucking pests", "Thin out crowded seedlings"],
        "irrigation": "Standard irrigation cycle every 4-7 days.",
        "nutrients": "Starter Nitrogen / balanced NPK application.",
        "disease_risks": "Early foliage spots and cutworms.",
        "scouting_tips": "Inspect leaf color and stem vigor."
    },
    {
        "stage_name": "Vegetative Growth",
        "stage_index": 4,
        "start_day": 29,
        "end_day": 55,
        "icon": "🌳",
        "description": "Active canopy expansion, tillering/branching, and root deepening.",
        "key_tasks": ["Intercultural operations & weeding", "Apply scheduled split fertilizer", "Maintain adequate irrigation"],
        "irrigation": "Regular irrigation matching evapotranspiration rate.",
        "nutrients": "High Nitrogen split dose to support leafy vegetative biomass.",
        "disease_risks": "Foliar blights, caterpillars, and sucking pests.",
        "scouting_tips": "Check under leaf canopy for pest colonies or early lesion spots."
    },
    {
        "stage_name": "Flowering",
        "stage_index": 5,
        "start_day": 56,
        "end_day": 75,
        "icon": "🌸",
        "description": "Bud formation, floral opening, pollination, and fruit/grain set.",
        "key_tasks": ["Maintain consistent irrigation to prevent blossom drop", "Boost Phosphorus & Potassium", "Avoid harsh chemical sprays during bloom"],
        "irrigation": "Critical moisture window; avoid both water deficit and waterlogging.",
        "nutrients": "Phosphorus and Potassium supplementation with micronutrients.",
        "disease_risks": "Flower blight, powdery mildew, and flower-eating pests.",
        "scouting_tips": "Examine flower clusters and ensure healthy pollination set."
    },
    {
        "stage_name": "Fruiting / Grain Filling",
        "stage_index": 6,
        "start_day": 76,
        "end_day": 100,
        "icon": "🍅",
        "description": "Rapid pod, fruit, or grain development and biomass filling.",
        "key_tasks": ["Maintain soil moisture for plump development", "Apply targeted pest management", "Support heavy fruiting branches if needed"],
        "irrigation": "Adequate moisture until filling completes.",
        "nutrients": "Potassium application to increase fruit/grain weight and quality.",
        "disease_risks": "Fruit borers, pod borers, and anthracnose.",
        "scouting_tips": "Inspect developing produce for healthy sizing and absence of borer punctures."
    },
    {
        "stage_name": "Maturity",
        "stage_index": 7,
        "start_day": 101,
        "end_day": 115,
        "icon": "🌾",
        "description": "Crop ripening, color change, moisture reduction, and harvest readiness.",
        "key_tasks": ["Gradually reduce or stop irrigation", "Prepare harvesting machinery and crates", "Check market prices"],
        "irrigation": "Withhold irrigation to encourage uniform maturity.",
        "nutrients": "None.",
        "disease_risks": "Lodging or mold from sudden late rains.",
        "scouting_tips": "Test firmness/moisture for physiological maturity."
    },
    {
        "stage_name": "Harvest",
        "stage_index": 8,
        "start_day": 116,
        "end_day": 135,
        "icon": "🧺",
        "description": "Commercial picking/harvesting, grading, and post-harvest transport.",
        "key_tasks": ["Harvest during cool morning hours", "Grade produce by quality", "Transport in clean containers to market"],
        "irrigation": "None.",
        "nutrients": "None.",
        "disease_risks": "Post-harvest bruising and storage pests.",
        "scouting_tips": "Grade immediately after picking to maximize market price."
    }
]


def normalize_crop_name(crop: Optional[str]) -> str:
    """Matches user-entered crop strings to supported crop profile keys."""
    if not crop:
        return "Tomato"
    c = crop.strip().lower()
    if "tomat" in c:
        return "Tomato"
    elif "rice" in c or "paddy" in c:
        return "Rice"
    elif "cotton" in c or "kapas" in c:
        return "Cotton"
    elif "maize" in c or "corn" in c:
        return "Maize"
    elif "sugar" in c or "cane" in c:
        return "Sugarcane"
    elif "wheat" in c:
        return "Wheat"
    elif "potato" in c or "alu" in c:
        return "Potato"
    elif "chili" in c or "chilli" in c or "mirchi" in c or "pepper" in c:
        return "Chili"
    elif "groundnut" in c or "peanut" in c:
        return "Groundnut"
    elif "onion" in c or "pyaz" in c:
        return "Onion"
    elif "soy" in c:
        return "Soybean"
    elif "ragi" in c or "millet" in c:
        return "Ragi"
    return "Default"


def calculate_days_since_sowing(sowing_date_str: Optional[str]) -> int:
    """Calculates integer days elapsed since the sowing date."""
    if not sowing_date_str:
        return 45 # Default sensible age if no date provided
    try:
        clean_date = sowing_date_str.strip()[:10]
        sowing_dt = datetime.strptime(clean_date, "%Y-%m-%d").date()
        today = date.today()
        diff = (today - sowing_dt).days
        return max(0, diff)
    except Exception:
        return 45


def get_crop_profile(crop_name: Optional[str]) -> List[Dict[str, Any]]:
    """Returns the 8-stage duration profile for the given crop."""
    key = normalize_crop_name(crop_name)
    return CROP_STAGE_PROFILES.get(key, DEFAULT_PROFILE)


def calculate_crop_stage_intelligence(
    crop_name: Optional[str],
    sowing_date_str: Optional[str],
    current_stage_override: Optional[str] = None
) -> Dict[str, Any]:
    """
    Computes complete Crop Stage Intelligence:
    - Calculates days elapsed since sowing
    - Determines estimated stage from duration curves
    - Applies farmer manual override if provided
    - Calculates stage index (1-8), progress %, days remaining in stage, next stage, and days to transition
    - Returns full 8-stage timeline array and stage-specific agronomic guidance
    """
    profile = get_crop_profile(crop_name)
    crop_age_days = calculate_days_since_sowing(sowing_date_str)

    # 1. Estimate stage based on day duration
    estimated_stage_dict = profile[-1] # Fallback to Harvest
    for s in profile:
        if s["start_day"] <= crop_age_days <= s["end_day"]:
            estimated_stage_dict = s
            break
        elif crop_age_days < s["start_day"]:
            break

    estimated_stage_name = estimated_stage_dict["stage_name"]

    # 2. Determine active stage (considering farmer manual override)
    active_stage_name = estimated_stage_name
    is_overridden = False

    if current_stage_override and current_stage_override.strip():
        override_clean = current_stage_override.strip()
        if override_clean in STANDARD_STAGES:
            is_overridden = True
            active_stage_name = override_clean
            matched = next((s for s in profile if s["stage_name"] == active_stage_name), None)
            if matched:
                active_stage_dict = matched
            else:
                active_stage_dict = estimated_stage_dict
        else:
            active_stage_dict = estimated_stage_dict
    else:
        active_stage_dict = estimated_stage_dict

    active_index = active_stage_dict["stage_index"] # 1 to 8

    # 3. Next Stage and transition days calculation
    next_stage_name: Optional[str] = None
    days_to_next_stage: Optional[int] = None

    if active_index < len(profile):
        next_stage_dict = profile[active_index] # Next in list (0-indexed)
        next_stage_name = next_stage_dict["stage_name"]
        if not is_overridden:
            days_to_next_stage = max(1, active_stage_dict["end_day"] - crop_age_days + 1)
        else:
            # If overridden, estimate based on duration of overridden stage
            stage_span = active_stage_dict["end_day"] - active_stage_dict["start_day"]
            days_to_next_stage = max(1, int(stage_span * 0.5))
    else:
        next_stage_name = "Cycle Complete / Next Planting"
        days_to_next_stage = 0

    # 4. Build timeline array for the 8 stages
    stages_timeline = []
    for s in profile:
        s_idx = s["stage_index"]
        is_current = (s["stage_name"] == active_stage_name)
        is_completed = (s_idx < active_index)
        is_upcoming = (s_idx > active_index)

        stages_timeline.append({
            "stage_name": s["stage_name"],
            "stage_index": s_idx,
            "icon": STAGE_ICONS.get(s["stage_name"], s.get("icon", "🌱")),
            "start_day": s["start_day"],
            "end_day": s["end_day"],
            "is_current": is_current,
            "is_completed": is_completed,
            "is_upcoming": is_upcoming,
            "description": s["description"],
            "key_tasks": s["key_tasks"],
            "irrigation": s["irrigation"],
            "nutrients": s["nutrients"],
            "disease_risks": s["disease_risks"],
            "scouting_tips": s["scouting_tips"]
        })

    # 5. Dynamic stage summary headline
    stage_headline = f"{active_stage_name} {STAGE_ICONS.get(active_stage_name, '🌱')}"

    return {
        "crop_name": crop_name or "Tomato",
        "sowing_date": sowing_date_str or "Not set",
        "crop_age_days": crop_age_days,
        "estimated_stage": estimated_stage_name,
        "active_stage": active_stage_name,
        "stage_headline": stage_headline,
        "stage_index": active_index,
        "total_stages": 8,
        "is_overridden": is_overridden,
        "stage_icon": STAGE_ICONS.get(active_stage_name, "🌱"),
        "next_stage": next_stage_name,
        "days_to_next_stage": days_to_next_stage,
        "stage_description": active_stage_dict["description"],
        "key_tasks": active_stage_dict["key_tasks"],
        "irrigation_guidance": active_stage_dict["irrigation"],
        "nutrient_guidance": active_stage_dict["nutrients"],
        "disease_risks": active_stage_dict["disease_risks"],
        "scouting_tips": active_stage_dict["scouting_tips"],
        "stages": stages_timeline,
        "all_stage_names": STANDARD_STAGES
    }
