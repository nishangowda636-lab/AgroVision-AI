import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

dest_dir = r'd:\AgroVision-AI new\frontend\public\products'
os.makedirs(dest_dir, exist_ok=True)

def create_studio_pouch(
    filename,
    bg_color=(250, 252, 251),
    pouch_color=(25, 120, 75),
    accent_color=(245, 170, 30),
    brand_text="IFFCO",
    title_text="NPK 19:19:19",
    subtitle_text="100% WATER SOLUBLE FERTILIZER",
    net_wt="NET WT: 1 KG",
    badge_text="FOLIAR & DRIP GRADE",
    details=["19% Nitrogen (N)", "19% Phosphorus (P2O5)", "19% Potassium (K2O)", "Chloride Free • Quick Absorption"]
):
    w, h = 800, 800
    img = Image.new('RGB', (w, h), bg_color)
    draw = ImageDraw.Draw(img)

    # Soft radial background vignette
    for r in range(400, 0, -20):
        alpha = int(15 * (1 - r / 400))
        draw.ellipse([w//2 - r*1.2, h//2 - r*1.1, w//2 + r*1.2, h//2 + r*1.1], fill=(240-alpha, 244-alpha, 242-alpha))

    # Pouch drop shadow
    shadow = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.ellipse([180, 680, 620, 750], fill=(0, 0, 0, 70))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    img.paste(shadow, (0, 0), shadow)

    # Standup pouch coordinates (realistic trapezoidal standup pouch)
    pouch_poly = [
        (260, 150), (540, 150), # Top heat seal
        (570, 220), (585, 630), # Right curve
        (540, 700), (400, 720), (260, 700), # Bottom gusset
        (215, 630), (230, 220)  # Left curve
    ]

    # Draw pouch base
    draw.polygon(pouch_poly, fill=pouch_color)

    # 3D shading gradients on pouch sides
    for i in range(35):
        shade_alpha = int(45 * (1 - i / 35))
        # Left shadow
        draw.line([(230 + i, 220), (215 + i, 630)], fill=(0, 0, 0), width=1)
        # Right highlight
        draw.line([(570 - i, 220), (585 - i, 630)], fill=(255, 255, 255), width=1)

    # Top heat seal texture
    draw.rectangle([250, 140, 550, 175], fill=(pouch_color[0]-25, pouch_color[1]-25, pouch_color[2]-25))
    for x in range(255, 545, 6):
        draw.line([(x, 145), (x, 170)], fill=(255, 255, 255, 80), width=1)

    # Notch
    draw.polygon([(240, 185), (255, 192), (240, 200)], fill=(230, 235, 232))
    draw.polygon([(560, 185), (545, 192), (560, 200)], fill=(230, 235, 232))

    # Center label shield
    label_box = [260, 215, 540, 655]
    draw.rounded_rectangle(label_box, radius=18, fill=(255, 255, 255), outline=accent_color, width=3)

    # Top brand ribbon
    draw.rounded_rectangle([270, 225, 530, 280], radius=10, fill=pouch_color)
    
    # Try loading system font, fallback to default
    try:
        font_brand = ImageFont.truetype("arial.ttf", 32)
        font_title = ImageFont.truetype("arialbd.ttf", 36)
        font_sub = ImageFont.truetype("arialbd.ttf", 15)
        font_badge = ImageFont.truetype("arialbd.ttf", 13)
        font_det = ImageFont.truetype("arial.ttf", 16)
        font_wt = ImageFont.truetype("arialbd.ttf", 18)
    except:
        font_brand = ImageFont.load_default()
        font_title = font_brand
        font_sub = font_brand
        font_badge = font_brand
        font_det = font_brand
        font_wt = font_brand

    # Brand text
    bbox = draw.textbbox((0, 0), brand_text, font=font_brand)
    bw = bbox[2] - bbox[0]
    draw.text((400 - bw//2, 235), brand_text, fill=(255, 255, 255), font=font_brand)

    # Main Product Title
    bbox = draw.textbbox((0, 0), title_text, font=font_title)
    tw = bbox[2] - bbox[0]
    draw.text((400 - tw//2, 305), title_text, fill=(20, 28, 24), font=font_title)

    # Subtitle
    bbox = draw.textbbox((0, 0), subtitle_text, font=font_sub)
    sw = bbox[2] - bbox[0]
    draw.text((400 - sw//2, 355), subtitle_text, fill=(80, 95, 88), font=font_sub)

    # Divider bar with accent
    draw.rectangle([290, 385, 510, 390], fill=accent_color)

    # Badge pill
    draw.rounded_rectangle([300, 405, 500, 435], radius=15, fill=accent_color)
    bbox = draw.textbbox((0, 0), badge_text, font=font_badge)
    bgw = bbox[2] - bbox[0]
    draw.text((400 - bgw//2, 412), badge_text, fill=(20, 25, 22), font=font_badge)

    # Details bullet points
    y = 455
    for det in details:
        draw.ellipse([285, y + 4, 293, y + 12], fill=pouch_color)
        draw.text((305, y), det, fill=(40, 50, 45), font=font_det)
        y += 32

    # Bottom Net Wt bar
    draw.rounded_rectangle([280, 595, 520, 640], radius=8, fill=(240, 246, 242))
    bbox = draw.textbbox((0, 0), net_wt, font=font_wt)
    wtw = bbox[2] - bbox[0]
    draw.text((400 - wtw//2, 608), net_wt, fill=pouch_color, font=font_wt)

    out_path = os.path.join(dest_dir, filename)
    img.save(out_path, quality=95)
    print(f"Created studio pouch: {filename}")

# 1. IFFCO NPK 19-19-19
create_studio_pouch(
    "iffco_npk_191919.jpg",
    pouch_color=(20, 115, 65),
    accent_color=(235, 160, 25),
    brand_text="IFFCO",
    title_text="NPK 19-19-19",
    subtitle_text="100% WATER SOLUBLE FERTILIZER",
    net_wt="NET WEIGHT: 1 KG",
    badge_text="FERTIGATION & FOLIAR GRADE",
    details=["19% Total Nitrogen (N)", "19% Available Phosphate (P2O5)", "19% Soluble Potash (K2O)", "Instant 100% Solubility • No Clog"]
)

# 2. Utkarsh Chelated Micronutrients Combo EDTA
create_studio_pouch(
    "utkarsh_micronutrients.jpg",
    pouch_color=(15, 85, 120),
    accent_color=(46, 196, 182),
    brand_text="UTKARSH AGROCHEM",
    title_text="CHELATED COMBO",
    subtitle_text="MULTI-MICRONUTRIENT EDTA",
    net_wt="NET WEIGHT: 500 G",
    badge_text="COMPLETE PLANT DEFICIENCY CURE",
    details=["Zinc (Zn) 3.0% EDTA", "Iron (Fe) 2.5% & Mn 1.0%", "Copper (Cu) 1.0% & Boron 0.5%", "Prevents Interveinal Chlorosis"]
)

# 3. Katyayani Organic Humic Acid 98%
create_studio_pouch(
    "katyayani_humic_acid.jpg",
    pouch_color=(35, 30, 25),
    accent_color=(212, 175, 55),
    brand_text="KATYAYANI ORGANICS",
    title_text="HUMIC ACID 98%",
    subtitle_text="POTASSIUM HUMATE SOIL ENHANCER",
    net_wt="NET WEIGHT: 1 KG",
    badge_text="98% CONCENTRATED BIO-STIMULANT",
    details=["Superior Potassium Humate", "Stimulates Feeder White Roots", "Enhances Soil CEC & Aeration", "Drip & Soil Application Safe"]
)

# 4. TrustBasket Organic Vermicompost
create_studio_pouch(
    "trustbasket_vermicompost.jpg",
    pouch_color=(85, 55, 35),
    accent_color=(120, 190, 32),
    brand_text="TRUSTBASKET",
    title_text="VERMICOMPOST",
    subtitle_text="100% PURE ORGANIC BIO-COMPOST",
    net_wt="NET WEIGHT: 5 KG",
    badge_text="EARTHWORM CASTINGS ENRICHED",
    details=["Rich in Beneficial Microbes", "Improves Soil Water Holding", "All Essential Macro & Micro NPK", "100% Chemical Free & Non-Toxic"]
)

# 5. Seaweed Extract Bio-Stimulant
create_studio_pouch(
    "seaweed_extract.jpg",
    pouch_color=(10, 65, 50),
    accent_color=(72, 191, 145),
    brand_text="AGRI BIO CARE",
    title_text="SEAWEED EXTRACT",
    subtitle_text="100% ASCOPHYLLUM NODOSUM POWDER",
    net_wt="NET WEIGHT: 1 KG",
    badge_text="NATURAL BIO-STIMULANT",
    details=["Pure Cold Water Marine Kelp", "Natural Cytokinins & Auxins", "Drought & Heat Stress Defense", "Enhances Chlorophyll Synthesis"]
)
