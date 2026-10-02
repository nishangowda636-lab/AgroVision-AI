import os
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.session import get_db, SessionLocal
from app.models.models import MarketplaceProduct
from app.schemas.schemas import (
    MarketplaceProductOut,
    MarketplaceCategoryOut,
    MarketplaceProductListOut
)

router = APIRouter(prefix="/api/marketplace", tags=["Agricultural Marketplace & Official Discovery"])

MARKETPLACE_CATEGORIES = [
    "Tractors",
    "Sprayers",
    "Farm Tools",
    "Seeds",
    "Pesticides / Crop Protection",
    "Fertilizers",
    "Farm Machinery",
    "Irrigation & Pumps",
    "Animal Husbandry",
    "IoT / Smart Farming Equipment"
]

VERIFIED_MARKETPLACE_PRODUCTS = [
    # 1. Tractors
    {
        "name": "Sonalika DI 35 Sikander Tractor",
        "brand": "Sonalika Tractors",
        "category": "Tractors",
        "description": "Heavy-duty 39 HP category agricultural tractor powered by a 3-cylinder HDM engine with 8F + 2R constant mesh transmission and 2000 kg hydraulic lifting capacity.",
        "image_url": "https://www.sonalika.com/media/product-thumbnail/di-35-16744550-1682754259.webp",
        "official_product_url": "https://www.sonalika.com/tractor/di-35.html",
        "official_brand_url": "https://www.sonalika.com",
        "source_name": "Sonalika International Official Portal",
        "source_type": "manufacturer",
        "source_verified": True,
        "image_verified": True,
        "url_verified": True
    },
    {
        "name": "Mahindra 275 DI TU XP Plus Tractor",
        "brand": "Mahindra Tractors",
        "category": "Tractors",
        "description": "Advanced 39 HP 3-cylinder DI tractor featuring Extra Long Stroke (ELS) engine, 8F + 2R partial constant mesh transmission, and 1500 kg lift capacity for superior fuel economy and haulage.",
        "image_url": "https://www.mahindratractor.com/sites/default/files/2023-08/275-DI-TU-XP-Plus.png",
        "official_product_url": "https://www.mahindratractor.com/tractors/mahindra-275-di-tu-xp-plus",
        "official_brand_url": "https://www.mahindratractor.com",
        "source_name": "Mahindra Farm Equipment Official Website",
        "source_type": "manufacturer",
        "source_verified": True,
        "image_verified": True,
        "url_verified": True
    },
    {
        "name": "Mahindra 575 DI SP Plus Tractor",
        "brand": "Mahindra Tractors",
        "category": "Tractors",
        "description": "Powerful 47 HP 4-cylinder DI tractor with technological ELS engine, high backup torque, 8F + 2R transmission, and 1500 kg hydraulic lift capacity for rotavators and heavy implements.",
        "image_url": "https://www.mahindratractor.com/sites/default/files/2023-08/575-DI-SP-PLUS.png",
        "official_product_url": "https://www.mahindratractor.com/tractors/mahindra-575-di-sp-plus",
        "official_brand_url": "https://www.mahindratractor.com",
        "source_name": "Mahindra Farm Equipment Official Website",
        "source_type": "manufacturer",
        "source_verified": True,
        "image_verified": True,
        "url_verified": True
    },
    # 2. Sprayers
    {
        "name": "ASPEE Electro Battery Operated Sprayer (AEL001)",
        "brand": "ASPEE Group",
        "category": "Sprayers",
        "description": "Ergonomic 16-liter knapsack sprayer equipped with rechargeable 12V 8Ah battery, high-pressure continuous diaphragm pump, and brass spray lance for uniform foliar chemical coverage.",
        "image_url": "https://aspee.com/attachments/products/aspee-electro-battery-sprayer-ael001-8ahbr-ael001-12ahbr--ln-190-190.png",
        "official_product_url": "https://aspee.com/products-details/AEL001-8AHBR/aspee-electro-battery-sprayer-ael001-8ahbr-ael001-12ahbr-s",
        "official_brand_url": "https://aspee.com",
        "source_name": "ASPEE India Official Website",
        "source_type": "manufacturer",
        "source_verified": True,
        "image_verified": True,
        "url_verified": True
    },
    # 3. Farm Tools
    {
        "name": "Tata Agrico Agri Sickle Plastic Handle 0.23 kg (SIC021)",
        "brand": "Tata Agrico",
        "category": "Farm Tools",
        "description": "High-grade alloy steel serrated agricultural sickle with lightweight molded plastic handle (0.23 kg), precision-crafted for harvesting cereal crops, grass cutting, and stalk clearing.",
        "image_url": "https://www.tataagrico.com/wp-content/uploads/2024/12/IMG-_1057.jpg",
        "official_product_url": "https://tataagrico.com/product/tata-agrico-sickle/",
        "official_brand_url": "https://tataagrico.com",
        "source_name": "Tata Agrico Official Portal",
        "source_type": "manufacturer",
        "source_verified": True,
        "image_verified": True,
        "url_verified": True
    },
    {
        "name": "Pad Corp Sprayer Pump Battery Fast Charger",
        "brand": "Pad Corp",
        "category": "Farm Tools",
        "description": "Automatic 12V battery smart charger with overcharge protection and LED status indicator, engineered for agricultural knapsack battery sprayers.",
        "image_url": "https://dujjhct8zer0r.cloudfront.net/media/prod_image/12999141611770101511.webp",
        "official_product_url": "https://agribegri.com/products/sprayer-pump-battery-charger--buy-sprayer-charger-online.php",
        "official_brand_url": "https://agribegri.com",
        "source_name": "AgriBegri Agricultural Retail Portal",
        "source_type": "verified_retailer",
        "source_verified": True,
        "image_verified": True,
        "url_verified": True
    },
    # 4. Seeds
    {
        "name": "Syngenta Saaho TO-3251 Hybrid Tomato Seeds",
        "brand": "Syngenta India",
        "category": "Seeds",
        "description": "Premium commercial hybrid tomato variety with high yield potential, exceptional fruit firmness, and strong field resistance to Tomato Leaf Curl Virus (ToLCV) and Bacterial Wilt.",
        "image_url": "https://dujjhct8zer0r.cloudfront.net/media/prod_image/1541691661764419952.webp",
        "official_product_url": "https://agribegri.com/products/syngenta-saaho-to-3251-tomato-seeds.php",
        "official_brand_url": "https://agribegri.com",
        "source_name": "AgriBegri Agricultural Retail Portal",
        "source_type": "verified_retailer",
        "source_verified": True,
        "image_verified": True,
        "url_verified": True
    },
    # 5. Pesticides / Crop Protection
    {
        "name": "Bayer Nativo Fungicide (Tebuconazole 50% + Trifloxystrobin 25% WG)",
        "brand": "Bayer CropScience",
        "category": "Pesticides / Crop Protection",
        "description": "Broad-spectrum systemic and mesostemic fungicide formulation offering dual-mode protective and curative action against blast, sheath blight, powdery mildew, and leaf spots.",
        "image_url": "https://dujjhct8zer0r.cloudfront.net/media/prod_image/7c203c8f0c72fc18899c40dca7bf6e3a-04-02-25-17-19-29.webp",
        "official_product_url": "https://agribegri.com/products/bayer-nativo-fungicide.php",
        "official_brand_url": "https://agribegri.com",
        "source_name": "AgriBegri Agricultural Retail Portal",
        "source_type": "verified_retailer",
        "source_verified": True,
        "image_verified": True,
        "url_verified": True
    },
    {
        "name": "Bayer Antracol Fungicide (Propineb 70% WP)",
        "brand": "Bayer CropScience",
        "category": "Pesticides / Crop Protection",
        "description": "Contact fungicide containing 70% Propineb with superior zinc availability, providing broad-spectrum protection against early and late blight, dieback, and fruit rot.",
        "image_url": "https://dujjhct8zer0r.cloudfront.net/media/prod_image/85df35d73004e715c1877765ce6ae7ca-03-22-25-18-43-18.webp",
        "official_product_url": "https://agribegri.com/products/bayer-antracol-fungicide.php",
        "official_brand_url": "https://agribegri.com",
        "source_name": "AgriBegri Agricultural Retail Portal",
        "source_type": "verified_retailer",
        "source_verified": True,
        "image_verified": True,
        "url_verified": True
    },
    # 6. Fertilizers
    {
        "name": "Seaweed Extract Powder 100% Organic Bio Stimulant Fertilizer",
        "brand": "AgriBegri Bio Nutrition",
        "category": "Fertilizers",
        "description": "100% water-soluble pure Ascophyllum Nodosum seaweed extract rich in natural cytokinins, auxins, and trace minerals for robust root development and drought tolerance.",
        "image_url": "https://dujjhct8zer0r.cloudfront.net/media/prod_image/8302034461763641434.webp",
        "official_product_url": "https://agribegri.com/products/seaweed-extract.php",
        "official_brand_url": "https://agribegri.com",
        "source_name": "AgriBegri Agricultural Retail Portal",
        "source_type": "verified_retailer",
        "source_verified": True,
        "image_verified": True,
        "url_verified": True
    },
    # 7. Farm Machinery
    {
        "name": "Farmio Sudarshan 2-Stroke Heavy Duty Brush Cutter",
        "brand": "Farmio Agro Equipment",
        "category": "Farm Machinery",
        "description": "High-power 2-stroke engine brush cutter and grass trimmer equipped with 80T carbide alloy blade and tap-and-go nylon trimmer head for crop harvesting and orchard weeding.",
        "image_url": "https://dujjhct8zer0r.cloudfront.net/media/prod_image/2963770041779078398.webp",
        "official_product_url": "https://agribegri.com/products/farmio-sudarshan-grass-cutter-brush-cutter-machine.php",
        "official_brand_url": "https://agribegri.com",
        "source_name": "AgriBegri Agricultural Retail Portal",
        "source_type": "verified_retailer",
        "source_verified": True,
        "image_verified": True,
        "url_verified": True
    },
    {
        "name": "ASPEE Bolo MB2 Motorized Knapsack Mist Blower & Duster",
        "brand": "ASPEE Group",
        "category": "Farm Machinery",
        "description": "Commercial-grade 35cc 2-stroke motorized knapsack mist blower cum duster producing high-velocity airflow for ultrafine mist spraying in orchards, tea gardens, and field crops.",
        "image_url": "https://aspee.com/attachments/products/aspee-bolo-motorized-knapsack-mist-blower-cum-duster-mb2--lc-190-190.png",
        "official_product_url": "https://aspee.com/products-details/MB2/aspee-bolo-motorized-knapsack-mist-blower-cum-duster-mb2-s",
        "official_brand_url": "https://aspee.com",
        "source_name": "ASPEE India Official Website",
        "source_type": "manufacturer",
        "source_verified": True,
        "image_verified": True,
        "url_verified": True
    },
    # 8. Irrigation & Pumps
    {
        "name": "KisanKraft KK-WPP-10 Petrol Engine Water Pump (1.5 HP)",
        "brand": "KisanKraft",
        "category": "Irrigation & Pumps",
        "description": "Compact and portable 1.5 HP 2-stroke petrol centrifugal water pump delivering high flow rates for agricultural irrigation, field water transfer, and garden sprinkler systems.",
        "image_url": "https://kisankraftwebsite.s3.ap-south-1.amazonaws.com/upload/products//KK_WPP_10_cff57c8847.jpg",
        "official_product_url": "https://kisankraft.com/product/kisan-kraft-water-pump-kk-wpp-10",
        "official_brand_url": "https://kisankraft.com",
        "source_name": "KisanKraft Official Website",
        "source_type": "manufacturer",
        "source_verified": True,
        "image_verified": True,
        "url_verified": True
    },
    {
        "name": "KisanKraft KK-WPP-21 Petrol Centrifugal Water Pump (4.5 HP)",
        "brand": "KisanKraft",
        "category": "Irrigation & Pumps",
        "description": "Heavy-duty 4.5 HP 4-stroke OHV petrol centrifugal water pump engineered for high-volume agricultural flood, furrow, and drip irrigation across multi-acre farm holdings.",
        "image_url": "https://kisankraftwebsite.s3.ap-south-1.amazonaws.com/upload/products//thumbnail_KK_WPP_21_27fcab8e14.jpg",
        "official_product_url": "https://kisankraft.com/product/petrol-engine-water-pump-kk-wpp-21",
        "official_brand_url": "https://kisankraft.com",
        "source_name": "KisanKraft Official Website",
        "source_type": "manufacturer",
        "source_verified": True,
        "image_verified": True,
        "url_verified": True
    },
    {
        "name": "Apras Y-Type Screen Filter for Drip Irrigation (25mm / 1-Inch)",
        "brand": "Apras",
        "category": "Irrigation & Pumps",
        "description": "Commercial-grade 25mm (1-inch) Y-type screen filter cartridge designed to remove sand, silt, and algae to prevent clogging in drip emitters and micro-sprinklers.",
        "image_url": "https://dujjhct8zer0r.cloudfront.net/media/prod_image/6c621715827c29e549fed1829d56b6cc-02-09-23-17-41-56.webp",
        "official_product_url": "https://agribegri.com/products/apras-y-type-screen-filter-for-drip-irrigation.php",
        "official_brand_url": "https://agribegri.com",
        "source_name": "AgriBegri Agricultural Retail Portal",
        "source_type": "verified_retailer",
        "source_verified": True,
        "image_verified": True,
        "url_verified": True
    },
    # 9. Animal Husbandry
    {
        "name": "KisanKraft KK-FMC-500 Agricultural Chaff Cutter (with 3 HP Motor)",
        "brand": "KisanKraft",
        "category": "Animal Husbandry",
        "description": "High-performance agricultural fodder and chaff cutter machine with 3 HP electric motor, designed for chopping green and dry fodder for dairy cows and livestock.",
        "image_url": "https://kisankraftwebsite.s3.ap-south-1.amazonaws.com/upload/products//KK_FMC_500_WITH_3hp_Motor_64d427d8fa.jpg",
        "official_product_url": "https://kisankraft.com/product/chaff-cutter-kk-fmc-500-with-3hp-motor",
        "official_brand_url": "https://kisankraft.com",
        "source_name": "KisanKraft Official Website",
        "source_type": "manufacturer",
        "source_verified": True,
        "image_verified": True,
        "url_verified": True
    },
    {
        "name": "Balwaan CH-120 Agricultural Chaff Cutter Machine with Motor",
        "brand": "Balwaan",
        "category": "Animal Husbandry",
        "description": "High-efficiency electric fodder and chaff cutter machine with 4 hardened alloy blades, engineered for chopping green and dry fodder for dairy cattle, goats, and livestock.",
        "image_url": "https://dujjhct8zer0r.cloudfront.net/media/prod_image/d4ee61ea02c87d5b65f5953a3fe1738b-07-27-24-18-00-30.webp",
        "official_product_url": "https://agribegri.com/products/buy-balwaan-ch-120-chaff-cutter-with-motor-online-agribegri.php",
        "official_brand_url": "https://agribegri.com",
        "source_name": "AgriBegri Agricultural Retail Portal",
        "source_type": "verified_retailer",
        "source_verified": True,
        "image_verified": True,
        "url_verified": True
    },
    {
        "name": "VetMantra Cal Gold Liquid Calcium & Mineral Feed Supplement (5 Litre)",
        "brand": "VetMantra",
        "category": "Animal Husbandry",
        "description": "Veterinary formulated liquid calcium, phosphorus, Vitamin D3, and biotin feed supplement for dairy cattle and livestock to enhance milk yield, skeletal strength, and metabolic health.",
        "image_url": "https://dujjhct8zer0r.cloudfront.net/media/prod_image/8397980381742468498.webp",
        "official_product_url": "https://agribegri.com/products/buy-cattle-care-mineral-mixture-online--animal-feed-supplement.php",
        "official_brand_url": "https://agribegri.com",
        "source_name": "AgriBegri Agricultural Retail Portal",
        "source_type": "verified_retailer",
        "source_verified": True,
        "image_verified": True,
        "url_verified": True
    },
    # 10. IoT / Smart Farming Equipment
    {
        "name": "Aedaa Automatic UV Solar Light Pest Trap for Smart Crop Protection",
        "brand": "Aedaa",
        "category": "IoT / Smart Farming Equipment",
        "description": "Solar-powered automated pest control system with intelligent dusk-to-dawn UV light lure and high-efficiency collection chamber for chemical-free insect monitoring and crop management.",
        "image_url": "https://dujjhct8zer0r.cloudfront.net/media/prod_image/01bfee0edd677ebed92ecb470b00aa33-12-05-23-12-10-57.webp",
        "official_product_url": "https://agribegri.com/products/automatic-uv-solar-light-trap.php",
        "official_brand_url": "https://agribegri.com",
        "source_name": "AgriBegri Agricultural Retail Portal",
        "source_type": "verified_retailer",
        "source_verified": True,
        "image_verified": True,
        "url_verified": True
    },
    {
        "name": "Chipku Mini Solar Insect Trap with Smart UV Auto Sensor",
        "brand": "Chipku Agro",
        "category": "IoT / Smart Farming Equipment",
        "description": "Autonomous solar-powered insect monitoring and management device with integrated photovoltaic charging panel, optical wavelength LEDs, and automatic twilight activation sensor.",
        "image_url": "https://dujjhct8zer0r.cloudfront.net/media/prod_image/11385801301723202988.webp",
        "official_product_url": "https://agribegri.com/products/buy-chipku-mini-solar-trap-for-organic-farming-is-modern-solution.php",
        "official_brand_url": "https://agribegri.com",
        "source_name": "AgriBegri Agricultural Retail Portal",
        "source_type": "verified_retailer",
        "source_verified": True,
        "image_verified": True,
        "url_verified": True
    }
]

def seed_initial_marketplace_catalog(db: Session, force_refresh: bool = False):
    """
    Populates marketplace_products with genuine, verified manufacturer products.
    Purges any stale or unverified legacy records.
    Only products satisfying source_verified=True, image_verified=True, url_verified=True are maintained.
    """
    count = db.query(MarketplaceProduct).count()
    category_mismatch = any(
        db.query(MarketplaceProduct).filter(
            MarketplaceProduct.name == item["name"],
            MarketplaceProduct.category != item["category"]
        ).first() is not None
        for item in VERIFIED_MARKETPLACE_PRODUCTS
    )
    needs_sync = (
        count != len(VERIFIED_MARKETPLACE_PRODUCTS) or
        force_refresh or
        category_mismatch or
        db.query(MarketplaceProduct).filter(
            or_(
                MarketplaceProduct.name.like('%Namdhari%'),
                MarketplaceProduct.name.like('%TO-3150%'),
                MarketplaceProduct.image_verified == False,
                MarketplaceProduct.url_verified == False
            )
        ).count() > 0
    )
    if needs_sync:
        db.query(MarketplaceProduct).delete()
        db.commit()
        
        for item in VERIFIED_MARKETPLACE_PRODUCTS:
            prod = MarketplaceProduct(
                name=item["name"],
                brand=item["brand"],
                category=item["category"],
                description=item["description"],
                image_url=item["image_url"],
                official_product_url=item["official_product_url"],
                official_brand_url=item["official_brand_url"],
                source_name=item["source_name"],
                source_type=item.get("source_type", "manufacturer"),
                source_verified=item.get("source_verified", True),
                image_verified=item.get("image_verified", True),
                url_verified=item.get("url_verified", True),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            db.add(prod)
        db.commit()

@router.get("/categories", response_model=List[MarketplaceCategoryOut])
def get_marketplace_categories(db: Session = Depends(get_db)):
    """
    Returns official categories and current product count in database.
    """
    seed_initial_marketplace_catalog(db)
    
    # Get all categories that exist in database
    db_cats = [c[0] for c in db.query(MarketplaceProduct.category).filter(
        MarketplaceProduct.source_verified == True,
        MarketplaceProduct.image_verified == True,
        MarketplaceProduct.url_verified == True
    ).distinct().all() if c[0]]
    combined_cats = list(dict.fromkeys(MARKETPLACE_CATEGORIES + db_cats))
    
    results = []
    for cat in combined_cats:
        cnt = db.query(MarketplaceProduct).filter(
            MarketplaceProduct.category == cat,
            MarketplaceProduct.source_verified == True,
            MarketplaceProduct.image_verified == True,
            MarketplaceProduct.url_verified == True
        ).count()
        if cnt > 0 or cat in MARKETPLACE_CATEGORIES:
            results.append(MarketplaceCategoryOut(name=cat, count=cnt))
    return results

@router.get("/products", response_model=MarketplaceProductListOut)
def get_marketplace_products(
    category: Optional[str] = Query(None, description="Filter by category"),
    brand: Optional[str] = Query(None, description="Filter by brand"),
    search: Optional[str] = Query(None, description="Search keyword in name, brand, or description"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Discovery endpoint to browse verified farming products from official manufacturers and verified retailers.
    Strictly filters for products where source_verified=True, image_verified=True, and url_verified=True.
    AgroVision AI does NOT handle payments, cart, checkout, or sellers.
    """
    seed_initial_marketplace_catalog(db)

    # Strictly filter for verified products only
    query = db.query(MarketplaceProduct).filter(
        MarketplaceProduct.source_verified == True,
        MarketplaceProduct.image_verified == True,
        MarketplaceProduct.url_verified == True
    )

    if category and category != "All":
        query = query.filter(MarketplaceProduct.category == category)

    if brand and brand != "All":
        query = query.filter(MarketplaceProduct.brand == brand)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                MarketplaceProduct.name.ilike(search_term),
                MarketplaceProduct.brand.ilike(search_term),
                MarketplaceProduct.description.ilike(search_term),
                MarketplaceProduct.category.ilike(search_term)
            )
        )

    total = query.count()
    products = query.order_by(MarketplaceProduct.id.asc()).offset(skip).limit(limit).all()

    # Get distinct categories and brands for filtering UI from verified products
    all_cats = [c[0] for c in db.query(MarketplaceProduct.category).filter(
        MarketplaceProduct.source_verified == True,
        MarketplaceProduct.image_verified == True,
        MarketplaceProduct.url_verified == True
    ).distinct().order_by(MarketplaceProduct.category.asc()).all() if c[0]]
    
    all_brands = [b[0] for b in db.query(MarketplaceProduct.brand).filter(
        MarketplaceProduct.source_verified == True,
        MarketplaceProduct.image_verified == True,
        MarketplaceProduct.url_verified == True
    ).distinct().order_by(MarketplaceProduct.brand.asc()).all() if b[0]]

    return MarketplaceProductListOut(
        products=products,
        total=total,
        categories=all_cats,
        brands=all_brands
    )

@router.get("/products/{product_id}", response_model=MarketplaceProductOut)
def get_marketplace_product_by_id(product_id: int, db: Session = Depends(get_db)):
    """
    Retrieves detailed specifications and official redirect links for a specific product.
    """
    seed_initial_marketplace_catalog(db)
    prod = db.query(MarketplaceProduct).filter(
        MarketplaceProduct.id == product_id,
        MarketplaceProduct.source_verified == True,
        MarketplaceProduct.image_verified == True,
        MarketplaceProduct.url_verified == True
    ).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found in verified agricultural catalog")
    return prod
