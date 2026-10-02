from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter(prefix="/api/government-services", tags=["Government & Farmer Services"])

GOVERNMENT_SCHEMES: List[Dict[str, Any]] = [
    {
        "id": "pm-kisan",
        "title": "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
        "category": "Direct Income Support",
        "benefit": "₹6,000 per year in 3 equal installments of ₹2,000 directly into farmer bank accounts (Aadhaar linked).",
        "eligibility": "All landholding farmer families across India having cultivable landholding in their names.",
        "documents": "Aadhaar Card, Land ownership papers (Khata/Pahani/7-12), Active Bank Account passbook.",
        "official_source": "Ministry of Agriculture & Farmers Welfare, Govt. of India",
        "portal_url": "https://pmkisan.gov.in/",
        "last_updated": "August 2026",
        "status": "Active • 17th Installment Disbursed",
        "badge": "Income Support"
    },
    {
        "id": "pmfby",
        "title": "PMFBY (Pradhan Mantri Fasal Bima Yojana)",
        "category": "Crop Insurance",
        "benefit": "Comprehensive financial support & risk coverage for crop loss/damage due to non-preventable natural calamities, pests & diseases.",
        "eligibility": "All farmers growing notified crops in notified areas (both loanee and non-loanee farmers). Premium rate: 1.5% for Rabi, 2% for Kharif, 5% for commercial/horticultural crops.",
        "documents": "Land record (ROR), Sowing certificate / declaration, Bank passbook, Aadhaar card.",
        "official_source": "Government of India Crop Insurance Portal",
        "portal_url": "https://pmfby.gov.in/",
        "last_updated": "July 2026",
        "status": "Active • Kharif Enrollment Open",
        "badge": "Crop Protection"
    },
    {
        "id": "soil-health-card",
        "title": "Soil Health Card Scheme",
        "category": "Soil Testing & Nutrition",
        "benefit": "Free Soil Health Card issued every 2 years containing status of 12 soil parameters (N, P, K, S, Zn, Fe, Cu, Mn, Bo, pH, EC, OC) and customized dosage advice.",
        "eligibility": "All agricultural landowners and operational farm holders across all states.",
        "documents": "Farmer contact details, Village survey number, Soil sample collection receipt.",
        "official_source": "Department of Agriculture & Farmers Welfare",
        "portal_url": "https://soilhealth.dac.gov.in/",
        "last_updated": "August 2026",
        "status": "Active • Free Soil Lab Testing",
        "badge": "Soil Health"
    },
    {
        "id": "pmksy-drip",
        "title": "PMKSY - Per Drop More Crop (Micro-Irrigation Subsidy)",
        "category": "Irrigation & Water Conservation",
        "benefit": "45% to 55% financial assistance (up to 90% in select states for small/marginal farmers) on drip and sprinkler irrigation installations.",
        "eligibility": "Small, marginal, and general farmers having assured water source (borewell/canal/open well).",
        "documents": "Land RTC/Patta, Water source proof, Aadhaar, Bank passbook, Quotation from empanelled supplier.",
        "official_source": "National Mission on Sustainable Agriculture",
        "portal_url": "https://pmksy.gov.in/",
        "last_updated": "June 2026",
        "status": "Active • State Subsidy Quota Live",
        "badge": "Water Subsidy"
    },
    {
        "id": "smam-mechanization",
        "title": "SMAM (Sub-Mission on Agricultural Mechanization)",
        "category": "Farm Equipment & Machinery",
        "benefit": "40% to 50% subsidy on purchase of agricultural machinery (Tractors, Rotavators, Power Tillers, Seed Drills, Harvesters, Drone Sprayers).",
        "eligibility": "Individual farmers, Farmer Producer Organizations (FPOs), and Custom Hiring Center entrepreneurs.",
        "documents": "Aadhaar Card, Land ownership record, Bank account details, Equipment dealer proforma invoice.",
        "official_source": "Ministry of Agriculture & Farmers Welfare - Agrimachinery Portal",
        "portal_url": "https://agrimachinery.nic.in/",
        "last_updated": "August 2026",
        "status": "Active • Direct Benefit Transfer",
        "badge": "Machinery Subsidy"
    },
    {
        "id": "kisan-credit-card",
        "title": "KCC (Kisan Credit Card) & Interest Subvention",
        "category": "Institutional Credit",
        "benefit": "Concessional credit limit up to ₹3 Lakhs at effective 4% interest rate per annum (7% base interest with 3% prompt repayment incentive).",
        "eligibility": "All farmers, sharecroppers, tenant farmers, self-help groups, animal husbandry & fisheries farmers.",
        "documents": "Application form, Land record copy (Pahani/Khasra), Aadhaar, PAN card, Passport photo.",
        "official_source": "Reserve Bank of India & NABARD",
        "portal_url": "https://www.nabard.org/",
        "last_updated": "July 2026",
        "status": "Active • Low-Interest Credit",
        "badge": "Credit & Finance"
    },
    {
        "id": "enam",
        "title": "e-NAM (National Agriculture Market)",
        "category": "Produce Trading & Mandi Integration",
        "benefit": "Pan-India electronic trading portal networking existing APMC mandis to create a unified national market for agricultural commodities.",
        "eligibility": "Any farmer registered with local APMC market / state agricultural marketing board.",
        "documents": "Aadhaar card, Bank account details, APMC registration / Gate entry receipt.",
        "official_source": "Small Farmers' Agribusiness Consortium (SFAC)",
        "portal_url": "https://www.enam.gov.in/",
        "last_updated": "August 2026",
        "status": "Active • 1,361+ Mandis Integrated",
        "badge": "Mandi Access"
    },
    {
        "id": "kisan-call-center",
        "title": "Kisan Call Center (Toll-Free 1551)",
        "category": "Expert Agricultural Advisory",
        "benefit": "Instant expert consultation in 22 local languages by agriculture graduates on crop production, pest control, weather advisories, and market trends.",
        "eligibility": "Free and open to all farmers across India (Toll-Free: 1800-180-1551, 6:00 AM to 10:00 PM all 7 days).",
        "documents": "No documents required. Direct phone call from any mobile or landline.",
        "official_source": "Department of Agriculture, Cooperation & Farmers Welfare",
        "portal_url": "https://dackkms.gov.in/",
        "last_updated": "August 2026",
        "status": "Active • Toll-Free Dial 1551",
        "badge": "Helpline 1551"
    }
]

@router.get("", response_model=List[Dict[str, Any]])
def get_all_government_services():
    return GOVERNMENT_SCHEMES
