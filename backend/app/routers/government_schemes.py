import os
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.session import get_db, SessionLocal
from app.models.models import GovernmentScheme
from app.schemas.schemas import (
    GovernmentSchemeOut,
    GovernmentSchemeCategoryOut,
    GovernmentSchemeListOut
)

router = APIRouter(prefix="/api/government-schemes", tags=["Government Agricultural Schemes & Farmer Welfare"])

SCHEME_CATEGORIES = [
    "Agriculture",
    "Crop Insurance",
    "Equipment / Machinery Subsidy",
    "Irrigation",
    "Seeds & Fertilizers",
    "Agricultural Loans / Credit",
    "Solar / Renewable Energy",
    "Livestock / Animal Husbandry",
    "Karnataka State Schemes",
    "Central Government Schemes"
]

VERIFIED_GOVERNMENT_SCHEMES = [
    # 1. PM-KISAN
    {
        "name": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
        "department": "Department of Agriculture and Farmers Welfare",
        "ministry": "Ministry of Agriculture & Farmers Welfare, Govt. of India",
        "scheme_type": "Central",
        "category": "Agriculture",
        "state": "All India",
        "description": "Central sector direct income support initiative providing guaranteed financial assistance to all landholding farmer families across India to supplement their agricultural input requirements.",
        "benefits": "₹6,000 per year disbursed in 3 equal four-monthly installments of ₹2,000 directly into Aadhaar-seeded bank accounts via Direct Benefit Transfer (DBT).",
        "eligibility": "All landholding farmer families with cultivable land parcels in their names, subject to standard constitutional and high-income taxpayer exclusions.",
        "required_documents": "Aadhaar Card, Land ownership records (Khata / RTC / Pahani / 7-12 extract), Active bank account passbook with Aadhaar linkage.",
        "application_process": "Online registration via official PM-KISAN portal (Farmers Corner > New Farmer Registration) or in-person via Common Service Centers (CSCs) and local agricultural offices.",
        "official_source_name": "PM-KISAN Official Government Portal",
        "official_source_url": "https://pmkisan.gov.in",
        "official_apply_url": "https://pmkisan.gov.in",
        "source_verified": True,
        "active": True
    },
    # 2. PMFBY
    {
        "name": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        "department": "Department of Agriculture and Farmers Welfare",
        "ministry": "Ministry of Agriculture & Farmers Welfare, Govt. of India",
        "scheme_type": "Central",
        "category": "Crop Insurance",
        "state": "All India",
        "description": "Comprehensive yield protection and crop insurance scheme providing extensive risk coverage against crop loss caused by natural calamities, droughts, floods, pests, and plant diseases.",
        "benefits": "Comprehensive pre-sowing to post-harvest crop loss coverage. Extremely low farmer premium: 1.5% for Rabi crops, 2.0% for Kharif crops, and 5.0% for commercial/horticultural crops with remaining premium subsidized by government.",
        "eligibility": "All farmers growing notified crops in notified insurance units, including landowner cultivators, tenant farmers, and sharecroppers.",
        "required_documents": "Land Record (ROR / RTC), Sowing Certificate / Crop Declaration, Bank passbook copy, Aadhaar Card.",
        "application_process": "Apply directly via the National Crop Insurance Portal (NCIP), designated commercial/cooperative banks, or local Village Common Service Centers before the seasonal cutoff date.",
        "official_source_name": "PMFBY National Crop Insurance Portal",
        "official_source_url": "https://pmfby.gov.in",
        "official_apply_url": "https://pmfby.gov.in",
        "source_verified": True,
        "active": True
    },
    # 3. PMKSY
    {
        "name": "Pradhan Mantri Krishi Sinchayee Yojana (PMKSY - Per Drop More Crop)",
        "department": "Department of Agriculture and Farmers Welfare",
        "ministry": "Ministry of Agriculture & Farmers Welfare, Govt. of India",
        "scheme_type": "Central",
        "category": "Irrigation",
        "state": "All India",
        "description": "National micro-irrigation mission dedicated to maximizing water productivity on farm holdings through substantial subsidies on modern drip and micro-sprinkler irrigation systems.",
        "benefits": "Up to 55% financial assistance for small and marginal farmers (up to 45% for general farmers) on the total cost of installing drip and sprinkler irrigation systems.",
        "eligibility": "All agricultural landowners, tenant farmers, and operational farm holders possessing an assured water source (borewell, canal, farm pond, or open well).",
        "required_documents": "Land RTC / Patta / Khasra ownership record, Water source proof, Aadhaar Card, Bank passbook, Quotation from authorized irrigation equipment vendor.",
        "application_process": "Submit application through state horticulture/agriculture departments or via the official PMKSY web portal and local district agricultural offices.",
        "official_source_name": "PMKSY Official Government Portal",
        "official_source_url": "https://pmksy.gov.in",
        "official_apply_url": "https://pmksy.gov.in",
        "source_verified": True,
        "active": True
    },
    # 4. PM-KUSUM
    {
        "name": "PM-KUSUM (Solar Agriculture Pump Scheme)",
        "department": "Department of Renewable Energy",
        "ministry": "Ministry of New and Renewable Energy (MNRE), Govt. of India",
        "scheme_type": "Central",
        "category": "Solar / Renewable Energy",
        "state": "All India",
        "description": "Clean energy program empowering farmers to install standalone solar water pumps and solarize grid-connected irrigation pumps for reliable day-time power.",
        "benefits": "60% direct capital subsidy (30% Central Government + 30% State Government) on standalone solar pump systems, with bank loan financing up to 30%, requiring only 10% farmer investment.",
        "eligibility": "Individual farmers, groups of farmers, Water User Associations (WUAs), and Primary Agricultural Credit Societies (PACS).",
        "required_documents": "Aadhaar Card, Land ownership certificate, Bank passbook, Existing electricity connection details (for grid solarization), Passport photographs.",
        "application_process": "Register through respective State Renewable Energy Development Agencies (SNA) or the official MNRE PM-KUSUM online portal.",
        "official_source_name": "Ministry of New and Renewable Energy (MNRE) Portal",
        "official_source_url": "https://pmkusum.mnre.gov.in",
        "official_apply_url": "https://pmkusum.mnre.gov.in",
        "source_verified": True,
        "active": True
    },
    # 5. SMAM
    {
        "name": "Sub-Mission on Agricultural Mechanization (SMAM)",
        "department": "Mechanization & Technology Division",
        "ministry": "Ministry of Agriculture & Farmers Welfare, Govt. of India",
        "scheme_type": "Central",
        "category": "Equipment / Machinery Subsidy",
        "state": "All India",
        "description": "Farm mechanization initiative promoting modern machinery adoption, custom hiring centers, and precision equipment including power tillers, rotavators, and sprayers.",
        "benefits": "40% to 50% capital subsidy on individual purchase of certified farm implements and agricultural machinery (up to 80% subsidy for Custom Hiring Centers operated by FPOs).",
        "eligibility": "Individual farmers, Farmer Producer Organizations (FPOs), cooperative societies, and registered rural agri-entrepreneurs with priority for small and marginal landholders.",
        "required_documents": "Aadhaar Card, Land Record copy (ROR), Bank account passbook, Proforma invoice / quotation from empanelled agricultural equipment dealer.",
        "application_process": "Register on the Central Agrimachinery Direct Benefit Transfer (DBT) portal and submit application with equipment selection.",
        "official_source_name": "Government of India Agrimachinery Portal",
        "official_source_url": "https://agrimachinery.nic.in",
        "official_apply_url": "https://agrimachinery.nic.in",
        "source_verified": True,
        "active": True
    },
    # 6. KCC
    {
        "name": "Kisan Credit Card (KCC) Scheme",
        "department": "Department of Financial Services / NABARD",
        "ministry": "Ministry of Finance & Ministry of Agriculture, Govt. of India",
        "scheme_type": "Central",
        "category": "Agricultural Loans / Credit",
        "state": "All India",
        "description": "Pioneering institutional credit facility delivering low-interest working capital credit for crop cultivation expenses, post-harvest management, and allied agricultural activities.",
        "benefits": "Revolving credit limit up to ₹3,00,000 at a subsidized base interest rate of 7%, reduced to an effective 4% per annum upon prompt repayment due to a 3% prompt repayment incentive.",
        "eligibility": "All farmers, owner-cultivators, tenant farmers, sharecroppers, self-help groups (SHGs), Joint Liability Groups (JLGs), and allied animal husbandry / dairy / fisheries farmers.",
        "required_documents": "Filled KCC application form, Land ownership records / tenancy agreement, Aadhaar Card, PAN Card, Voter ID, Recent passport photographs.",
        "application_process": "Apply at any public sector commercial bank, Regional Rural Bank (RRB), primary cooperative bank branch, or online via the official myScheme government portal.",
        "official_source_name": "National myScheme Government Portal / NABARD",
        "official_source_url": "https://myscheme.gov.in/schemes/kcc",
        "official_apply_url": "https://myscheme.gov.in/schemes/kcc",
        "source_verified": True,
        "active": True
    },
    # 7. Soil Health Card
    {
        "name": "Soil Health Card Scheme",
        "department": "Department of Agriculture and Farmers Welfare",
        "ministry": "Ministry of Agriculture & Farmers Welfare, Govt. of India",
        "scheme_type": "Central",
        "category": "Seeds & Fertilizers",
        "state": "All India",
        "description": "Scientific soil nutrition program delivering periodic lab analysis of farm soil health with customized chemical and organic fertilizer dosage recommendations.",
        "benefits": "Free comprehensive soil testing report covering 12 vital parameters (N, P, K, S, Zn, Fe, Cu, Mn, Bo, pH, EC, Organic Carbon) to optimize fertilizer spending and boost yield.",
        "eligibility": "All farmers possessing agricultural land across all states and union territories in India.",
        "required_documents": "Land survey number, Farmer contact information, Soil sample receipt issued by testing laboratory.",
        "application_process": "Soil samples are collected by agriculture extension staff or can be submitted at nearest district Soil Testing Laboratories (STLs). Results published online.",
        "official_source_name": "Department of Agriculture & Farmers Welfare Soil Health Portal",
        "official_source_url": "https://soilhealth.dac.gov.in",
        "official_apply_url": "https://soilhealth.dac.gov.in",
        "source_verified": True,
        "active": True
    },
    # 8. National Livestock Mission
    {
        "name": "National Livestock Mission (NLM)",
        "department": "Department of Animal Husbandry & Dairying",
        "ministry": "Ministry of Fisheries, Animal Husbandry and Dairying, Govt. of India",
        "scheme_type": "Central",
        "category": "Livestock / Animal Husbandry",
        "state": "All India",
        "description": "National livestock enterprise development mission supporting poultry breeding, sheep/goat farms, piggery development, and commercial fodder processing units.",
        "benefits": "50% capital subsidy (up to ₹50 Lakhs for commercial poultry and sheep/goat parent breeding units; up to ₹50 Lakhs for fodder block/silage infrastructure) directly credited via SIDBI.",
        "eligibility": "Individual farmers, Self-Help Groups (SHGs), Farmer Producer Organizations (FPOs), Joint Liability Groups (JLGs), and rural agri-entrepreneurs.",
        "required_documents": "Detailed Project Report (DPR), Land records or valid lease agreement, Bank loan sanction letter, Aadhaar card, PAN card, Animal husbandry training certificate.",
        "application_process": "Apply online directly through the official National Livestock Mission Udyami Mitra portal managed by SIDBI and Department of Animal Husbandry.",
        "official_source_name": "National Livestock Mission Official Portal (SIDBI / Govt. of India)",
        "official_source_url": "https://nlm.udyamimitra.in",
        "official_apply_url": "https://nlm.udyamimitra.in",
        "source_verified": True,
        "active": True
    },
    # 9. Karnataka Krishi Bhagya
    {
        "name": "Karnataka Krishi Bhagya Scheme",
        "department": "Department of Agriculture, Karnataka",
        "ministry": "Government of Karnataka",
        "scheme_type": "State",
        "category": "Irrigation",
        "state": "Karnataka",
        "description": "Flagship Karnataka state dryland agricultural mission focused on on-farm rainwater harvesting through farm ponds (Krishi Honda), polythene lining, diesel pumps, and micro-irrigation.",
        "benefits": "Up to 80% to 90% subsidy for SC/ST farmers and 50% to 70% for general farmers in rainfed dryland taluks for farm pond construction, polythene lining, pump sets, and shade nets.",
        "eligibility": "Small and marginal farmers holding agricultural land in rainfed and dryland agro-climatic zones across Karnataka state.",
        "required_documents": "FRUITS ID / Farmer Registration Number, RTC (Pahani) land record, Aadhaar card, Bank passbook linked with Aadhaar, Caste certificate (if SC/ST).",
        "application_process": "Submit application via the official Karnataka Raitha Mitra portal or visit nearest Raitha Samparka Kendras (RSK) and Taluk Agricultural Offices.",
        "official_source_name": "Department of Agriculture, Government of Karnataka (Raitha Mitra)",
        "official_source_url": "https://raitamitra.karnataka.gov.in",
        "official_apply_url": "https://raitamitra.karnataka.gov.in",
        "source_verified": True,
        "active": True
    },
    # 10. Karnataka Raitha Siri
    {
        "name": "Karnataka Raitha Siri Scheme",
        "department": "Department of Agriculture, Karnataka",
        "ministry": "Government of Karnataka",
        "scheme_type": "State",
        "category": "Seeds & Fertilizers",
        "state": "Karnataka",
        "description": "State incentive program promoting climate-resilient nutritious millet cultivation (Ragi, Jowar, Bajra, Foxtail, Little, Kodo millets) across Karnataka farm lands.",
        "benefits": "Direct financial incentive of ₹10,000 per hectare (up to a maximum of 2 hectares, i.e., ₹20,000 max per farmer) deposited directly into bank accounts via DBT upon millet crop verification.",
        "eligibility": "Farmers cultivating recognized millet crops on their operational landholdings in Karnataka with updated land records.",
        "required_documents": "FRUITS ID, Land RTC (Pahani) with millet crop entry in seasonal crop survey, Aadhaar card, Aadhaar-linked bank account.",
        "application_process": "Record millet crop in the Karnataka Crop Survey mobile app and confirm enrollment through the nearest Raitha Samparka Kendra (RSK).",
        "official_source_name": "Department of Agriculture, Government of Karnataka (Raitha Mitra)",
        "official_source_url": "https://raitamitra.karnataka.gov.in",
        "official_apply_url": "https://raitamitra.karnataka.gov.in",
        "source_verified": True,
        "active": True
    },
    # 11. Karnataka FRUITS Portal
    {
        "name": "Karnataka FRUITS Direct Farmer Beneficiary Portal",
        "department": "Department of Agriculture and Centre for e-Governance, Karnataka",
        "ministry": "Government of Karnataka",
        "scheme_type": "State",
        "category": "Karnataka State Schemes",
        "state": "Karnataka",
        "description": "Unified farmer registration repository and single-window Direct Benefit Transfer (DBT) verification portal for all Karnataka state agricultural and horticultural schemes.",
        "benefits": "Unique 8-digit FRUITS ID that eliminates redundant paperwork across all state departments, enabling instant eligibility verification for input subsidies, loan waivers, and relief grants.",
        "eligibility": "All farmers owning or cultivating agricultural, horticultural, sericulture, or livestock landholdings in Karnataka.",
        "required_documents": "Aadhaar Card, RTC / Land title survey numbers, Bank account passbook, Aadhaar-linked mobile number.",
        "application_process": "Register online via the Karnataka FRUITS PMK portal or visit Grama One centers, Bapuji Seva Kendras, or local Raitha Samparka Kendras (RSK).",
        "official_source_name": "Government of Karnataka FRUITS Portal",
        "official_source_url": "https://fruitspmk.karnataka.gov.in",
        "official_apply_url": "https://fruitspmk.karnataka.gov.in",
        "source_verified": True,
        "active": True
    }
]

def seed_initial_government_schemes(db: Session, force_refresh: bool = False):
    """
    Populates government_schemes table with genuine, verified government schemes.
    Purges unverified or stale mock data.
    """
    count = db.query(GovernmentScheme).count()
    needs_sync = (count != len(VERIFIED_GOVERNMENT_SCHEMES)) or force_refresh
    if needs_sync:
        db.query(GovernmentScheme).delete()
        db.commit()
        
        for item in VERIFIED_GOVERNMENT_SCHEMES:
            scheme = GovernmentScheme(
                name=item["name"],
                department=item["department"],
                ministry=item["ministry"],
                scheme_type=item.get("scheme_type", "Central"),
                category=item["category"],
                state=item.get("state", "All India"),
                description=item["description"],
                benefits=item["benefits"],
                eligibility=item["eligibility"],
                required_documents=item.get("required_documents"),
                application_process=item.get("application_process"),
                official_source_name=item["official_source_name"],
                official_source_url=item["official_source_url"],
                official_apply_url=item["official_apply_url"],
                source_verified=item.get("source_verified", True),
                active=item.get("active", True),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            db.add(scheme)
        db.commit()

@router.get("/categories", response_model=List[GovernmentSchemeCategoryOut])
def get_government_scheme_categories(db: Session = Depends(get_db)):
    """
    Returns official categories and current active scheme count.
    """
    seed_initial_government_schemes(db)
    
    db_cats = [c[0] for c in db.query(GovernmentScheme.category).filter(
        GovernmentScheme.active == True,
        GovernmentScheme.source_verified == True
    ).distinct().all() if c[0]]
    combined_cats = list(dict.fromkeys(SCHEME_CATEGORIES + db_cats))
    
    results = []
    for cat in combined_cats:
        cnt = db.query(GovernmentScheme).filter(
            GovernmentScheme.category == cat,
            GovernmentScheme.active == True,
            GovernmentScheme.source_verified == True
        ).count()
        results.append(GovernmentSchemeCategoryOut(name=cat, count=cnt))
    return results

@router.get("", response_model=GovernmentSchemeListOut)
def get_government_schemes(
    search: Optional[str] = Query(None, description="Search keyword in name, department, ministry, category, or description"),
    category: Optional[str] = Query(None, description="Filter by category"),
    state: Optional[str] = Query(None, description="Filter by state (e.g. Karnataka, All India)"),
    scheme_type: Optional[str] = Query(None, description="Filter by scheme type (Central or State)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Discovery endpoint to browse verified government agricultural schemes.
    Strictly returns only verified active schemes (active=True, source_verified=True).
    """
    seed_initial_government_schemes(db)

    query = db.query(GovernmentScheme).filter(
        GovernmentScheme.active == True,
        GovernmentScheme.source_verified == True
    )

    if category and category != "All":
        if category == "Central Government Schemes":
            query = query.filter(GovernmentScheme.scheme_type == "Central")
        elif category == "Karnataka State Schemes":
            query = query.filter(GovernmentScheme.state == "Karnataka")
        else:
            query = query.filter(GovernmentScheme.category == category)

    if state and state != "All":
        query = query.filter(GovernmentScheme.state == state)

    if scheme_type and scheme_type != "All":
        query = query.filter(GovernmentScheme.scheme_type == scheme_type)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                GovernmentScheme.name.ilike(term),
                GovernmentScheme.department.ilike(term),
                GovernmentScheme.ministry.ilike(term),
                GovernmentScheme.category.ilike(term),
                GovernmentScheme.description.ilike(term),
                GovernmentScheme.state.ilike(term)
            )
        )

    total = query.count()
    schemes = query.order_by(GovernmentScheme.id.asc()).offset(skip).limit(limit).all()

    # Get distinct categories, states, and scheme types for UI filter dropdowns
    all_cats = [c[0] for c in db.query(GovernmentScheme.category).filter(
        GovernmentScheme.active == True,
        GovernmentScheme.source_verified == True
    ).distinct().order_by(GovernmentScheme.category.asc()).all() if c[0]]

    all_states = [s[0] for s in db.query(GovernmentScheme.state).filter(
        GovernmentScheme.active == True,
        GovernmentScheme.source_verified == True
    ).distinct().order_by(GovernmentScheme.state.asc()).all() if s[0]]

    all_types = [t[0] for t in db.query(GovernmentScheme.scheme_type).filter(
        GovernmentScheme.active == True,
        GovernmentScheme.source_verified == True
    ).distinct().order_by(GovernmentScheme.scheme_type.asc()).all() if t[0]]

    return GovernmentSchemeListOut(
        schemes=schemes,
        total=total,
        categories=all_cats,
        states=all_states,
        scheme_types=all_types
    )

@router.get("/{scheme_id}", response_model=GovernmentSchemeOut)
def get_government_scheme_by_id(scheme_id: int, db: Session = Depends(get_db)):
    """
    Retrieves full details, eligibility, required documents, and official URLs for a specific scheme.
    """
    seed_initial_government_schemes(db)
    scheme = db.query(GovernmentScheme).filter(
        GovernmentScheme.id == scheme_id,
        GovernmentScheme.active == True,
        GovernmentScheme.source_verified == True
    ).first()
    if not scheme:
        raise HTTPException(status_code=404, detail="Government scheme not found in verified registry")
    return scheme
