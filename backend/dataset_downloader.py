"""
AgroVision AI — Authentic PlantVillage Agricultural Dataset Downloader & Preprocessor
Uses repository tree indexing to fetch authentic high-resolution crop disease images,
verifies file integrity with PIL, and partitions data into Train (70%), Val (15%), and Test (15%) sets.
"""

import os
import sys
import json
import random
import subprocess
import urllib.parse
import requests
from PIL import Image
from io import BytesIO
from concurrent.futures import ThreadPoolExecutor, as_completed

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset")
MODEL_DIR = os.path.join(BASE_DIR, "models", "crop_health")
RAW_PV_DIR = os.path.join(BASE_DIR, "raw_pv_git")

os.makedirs(DATASET_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)

# 38 authentic classes from the PlantVillage Benchmark Dataset
CLASSES_TO_DOWNLOAD = [
    # 🍅 Tomato Classes
    "Tomato___healthy",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Bacterial_spot",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    
    # 🥔 Potato Classes
    "Potato___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    
    # 🌽 Corn / Maize Classes
    "Corn_(maize)___healthy",
    "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    
    # 🫑 Pepper Bell Classes
    "Pepper,_bell___healthy",
    "Pepper,_bell___Bacterial_spot",
    
    # 🍎 Apple Classes
    "Apple___healthy",
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
    
    # 🍇 Grape Classes
    "Grape___healthy",
    "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    
    # 🍊 Orange / Citrus Classes
    "Orange___Haunglongbing_(Citrus_greening)",
    
    # 🍑 Peach Classes
    "Peach___healthy",
    "Peach___Bacterial_spot",
    
    # 🍓 Strawberry Classes
    "Strawberry___healthy",
    "Strawberry___Leaf_scorch",
    
    # 🥒 Squash Classes
    "Squash___Powdery_mildew",
    
    # 🍒 Cherry Classes
    "Cherry_(including_sour)___healthy",
    "Cherry_(including_sour)___Powdery_mildew",
    
    # 🌿 Soybean, Blueberry, Raspberry
    "Soybean___healthy",
    "Blueberry___healthy",
    "Raspberry___healthy"
]

IMAGES_PER_CLASS = 60  # 60 images * 38 classes = 2,280 authentic images for rapid & robust training

def get_git_tree_files():
    """Extracts the entire file tree of raw/color from GitHub API or sparse git metadata."""
    class_to_files = {}

    # Try GitHub API first (instant, no clone needed)
    try:
        api_url = "https://api.github.com/repos/spMohanty/PlantVillage-Dataset/git/trees/master?recursive=1"
        headers = {"User-Agent": "AgroVision-AI-Downloader"}
        r = requests.get(api_url, headers=headers, timeout=15)
        if r.status_code == 200:
            tree_data = r.json().get("tree", [])
            for item in tree_data:
                path = item.get("path", "")
                parts = path.strip().split("/")
                if len(parts) >= 3 and parts[0] == "raw" and parts[1] == "color":
                    cls_name = parts[2]
                    if cls_name not in class_to_files:
                        class_to_files[cls_name] = []
                    class_to_files[cls_name].append(path.strip())
            if class_to_files:
                return class_to_files
    except Exception as e:
        print(f"Notice: GitHub API tree fetch fallback ({e}). Using git metadata...")

    # Fallback to local git repository or shallow metadata clone
    if not os.path.exists(RAW_PV_DIR):
        print(f"Cloning metadata repository into {RAW_PV_DIR}...")
        subprocess.run(
            ["git", "clone", "--depth", "1", "--filter=blob:none", "--no-checkout", "https://github.com/spMohanty/PlantVillage-Dataset.git", RAW_PV_DIR],
            check=True
        )

    cmd = ["git", "ls-tree", "-r", "--name-only", "HEAD", "raw/color"]
    res = subprocess.run(cmd, cwd=RAW_PV_DIR, capture_output=True, text=True, check=True)
    lines = res.stdout.strip().splitlines()
    
    for line in lines:
        parts = line.strip().split("/")
        if len(parts) >= 3 and parts[0] == "raw" and parts[1] == "color":
            cls_name = parts[2]
            if cls_name not in class_to_files:
                class_to_files[cls_name] = []
            class_to_files[cls_name].append(line.strip())
    return class_to_files

def download_and_verify_image(git_rel_path: str, save_path: str) -> bool:
    """Downloads an authentic raw image via CDN, verifies integrity with PIL, and saves it."""
    encoded_path = urllib.parse.quote(git_rel_path)
    url = f"https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/{encoded_path}"
    
    try:
        r = requests.get(url, timeout=12)
        if r.status_code == 200 and len(r.content) > 1000:
            # Validate integrity
            img = Image.open(BytesIO(r.content))
            img.verify()
            
            # Save validated RGB JPEG
            img = Image.open(BytesIO(r.content)).convert("RGB")
            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            img.save(save_path, "JPEG", quality=95)
            return True
    except Exception:
        pass
    return False

def build_dataset():
    print("=" * 70)
    print("AGROVISION AI — REAL DATASET ACQUISITION & PREPROCESSING")
    print(f"Targeting {len(CLASSES_TO_DOWNLOAD)} agricultural classes (~{IMAGES_PER_CLASS} images/class)")
    print("Source: Official PlantVillage Benchmark Dataset (Hughes & Salathé, 2015)")
    print("=" * 70)

    print("\n[1/3] Reading Git tree index for raw/color...")
    class_to_files = get_git_tree_files()
    print(f"Indexed {len(class_to_files)} total classes in repository.")

    # Initialize train/val/test directories
    train_dir = os.path.join(DATASET_DIR, "train")
    val_dir = os.path.join(DATASET_DIR, "val")
    test_dir = os.path.join(DATASET_DIR, "test")

    for split in [train_dir, val_dir, test_dir]:
        os.makedirs(split, exist_ok=True)

    class_stats = {}
    class_indices = {}

    print("\n[2/3] Downloading, verifying integrity, and partitioning splits...")
    for idx, class_name in enumerate(CLASSES_TO_DOWNLOAD):
        class_indices[class_name] = idx
        available_files = class_to_files.get(class_name, [])
        if not available_files:
            print(f"[{idx+1}/{len(CLASSES_TO_DOWNLOAD)}] ❌ Warning: No files found for {class_name}")
            continue

        # Shuffle deterministically
        random.seed(42 + idx)
        shuffled_files = list(available_files)
        random.shuffle(shuffled_files)
        selected_files = shuffled_files[:IMAGES_PER_CLASS]

        # Calculate splits (70% train, 15% val, 15% test)
        n_total = len(selected_files)
        n_train = int(n_total * 0.70)
        n_val = int(n_total * 0.15)
        n_test = n_total - n_train - n_val

        train_files = selected_files[:n_train]
        val_files = selected_files[n_train:n_train + n_val]
        test_files = selected_files[n_train + n_val:]

        tasks = []
        with ThreadPoolExecutor(max_workers=32) as executor:
            for i, p_rel in enumerate(train_files):
                dest = os.path.join(train_dir, class_name, f"img_{i:04d}.jpg")
                tasks.append(executor.submit(download_and_verify_image, p_rel, dest))
            for i, p_rel in enumerate(val_files):
                dest = os.path.join(val_dir, class_name, f"img_{i:04d}.jpg")
                tasks.append(executor.submit(download_and_verify_image, p_rel, dest))
            for i, p_rel in enumerate(test_files):
                dest = os.path.join(test_dir, class_name, f"img_{i:04d}.jpg")
                tasks.append(executor.submit(download_and_verify_image, p_rel, dest))

        success_count = sum(1 for t in as_completed(tasks) if t.result())
        
        train_count = len(os.listdir(os.path.join(train_dir, class_name))) if os.path.exists(os.path.join(train_dir, class_name)) else 0
        val_count = len(os.listdir(os.path.join(val_dir, class_name))) if os.path.exists(os.path.join(val_dir, class_name)) else 0
        test_count = len(os.listdir(os.path.join(test_dir, class_name))) if os.path.exists(os.path.join(test_dir, class_name)) else 0

        class_stats[class_name] = {
            "available_pool": len(available_files),
            "verified_saved": success_count,
            "train": train_count,
            "val": val_count,
            "test": test_count
        }
        print(f"[{idx+1:02d}/{len(CLASSES_TO_DOWNLOAD)}] {class_name:<45} -> Saved: {success_count:2d} (Train: {train_count:2d}, Val: {val_count:2d}, Test: {test_count:2d})")

    # Save class indices mapping
    mapping_path = os.path.join(MODEL_DIR, "class_indices.json")
    with open(mapping_path, "w") as f:
        json.dump(class_indices, f, indent=2)
    print(f"\n[Saved] Class index mapping written to {mapping_path}")

    # Dataset summary statistics
    total_train = sum(s["train"] for s in class_stats.values())
    total_val = sum(s["val"] for s in class_stats.values())
    total_test = sum(s["test"] for s in class_stats.values())
    total_all = total_train + total_val + total_test

    summary = {
        "dataset_name": "PlantVillage Crop Disease Benchmark",
        "citation": "Hughes, D. & Salathé, M. (2015). An open access repository of images on plant health to enable the development of mobile disease diagnostics. arXiv:1511.08060.",
        "num_classes": len(class_indices),
        "total_images": total_all,
        "splits": {
            "train": total_train,
            "val": total_val,
            "test": total_test
        },
        "classes": class_stats
    }

    summary_path = os.path.join(MODEL_DIR, "dataset_summary.json")
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)

    print("\n" + "=" * 70)
    print("DATASET SPLIT & INTEGRITY SUMMARY:")
    print(f"Total Verified Images: {total_all}")
    print(f"  * Training Set (70%):   {total_train} images")
    print(f"  * Validation Set (15%): {total_val} images")
    print(f"  * Testing Set (15%):    {total_test} images")
    print(f"  * Classes Count:        {len(class_indices)}")
    print("=" * 70)

if __name__ == "__main__":
    build_dataset()
