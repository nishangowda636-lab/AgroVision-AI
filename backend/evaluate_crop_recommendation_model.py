"""
AgroVision AI — Standalone Crop Recommendation Model Evaluator
==============================================================
Loads the saved champion model, scaler, and label metadata, evaluates on
the dataset test split, and outputs verification metrics.
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    classification_report,
    confusion_matrix
)

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models", "crop_recommendation")
DATASET_PATH = os.path.join(MODEL_DIR, "crop_recommendation_dataset.csv")

MODEL_PATH = os.path.join(MODEL_DIR, "crop_recommendation_model.joblib")
SCALER_PATH = os.path.join(MODEL_DIR, "crop_recommendation_scaler.joblib")
CLASSES_PATH = os.path.join(MODEL_DIR, "crop_recommendation_classes.json")
EVAL_PATH = os.path.join(MODEL_DIR, "crop_recommendation_eval.json")

FEATURE_COLS = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
TARGET_COL = "label"

def run_evaluation():
    print("=" * 70)
    print("🔬 AGROVISION AI — CROP RECOMMENDATION MODEL EVALUATION SUITE")
    print("=" * 70)

    if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH) or not os.path.exists(DATASET_PATH):
        print("Model or dataset artifacts not found. Running training first...")
        import train_crop_recommendation_model
        train_crop_recommendation_model.main()

    # Load artifacts
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    with open(CLASSES_PATH, "r", encoding="utf-8") as f:
        classes = json.load(f)

    print(f"Loaded model: {type(model).__name__}")
    print(f"Loaded scaler: {type(scaler).__name__}")
    print(f"Loaded {len(classes)} crop classes: {', '.join(classes[:8])}...")

    # Load and prep dataset
    df = pd.read_csv(DATASET_PATH)
    df.columns = [c.strip() for c in df.columns]
    df[TARGET_COL] = df[TARGET_COL].astype(str).str.strip().str.lower()
    for col in FEATURE_COLS:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df = df.dropna(subset=FEATURE_COLS + [TARGET_COL])

    X = df[FEATURE_COLS].values
    y_raw = df[TARGET_COL].values
    
    class_to_idx = {cls_name: i for i, cls_name in enumerate(classes)}
    y = np.array([class_to_idx[name] for name in y_raw])

    # Unseen 20% test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    X_test_scaled = scaler.transform(X_test)
    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)

    test_acc = accuracy_score(y_test, y_pred) * 100.0
    macro_p, macro_r, macro_f1, _ = precision_recall_fscore_support(y_test, y_pred, average="macro", zero_division=0)
    weighted_p, weighted_r, weighted_f1, _ = precision_recall_fscore_support(y_test, y_pred, average="weighted", zero_division=0)

    print("\n--- INDEPENDENT TEST SET EVALUATION METRICS ---")
    print(f"Test Samples Evaluated:     {len(y_test)}")
    print(f"Test Accuracy:              {test_acc:.2f}%")
    print(f"Macro Precision:            {macro_p * 100.0:.2f}%")
    print(f"Macro Recall:               {macro_r * 100.0:.2f}%")
    print(f"Macro F1-Score:             {macro_f1 * 100.0:.2f}%")
    print(f"Weighted F1-Score:          {weighted_f1 * 100.0:.2f}%")

    print("\nDetailed Classification Report:")
    print(classification_report(y_test, y_pred, target_names=classes, digits=4))

    return {
        "test_accuracy_pct": test_acc,
        "macro_f1_pct": macro_f1 * 100.0,
        "weighted_f1_pct": weighted_f1 * 100.0,
        "classes": classes
    }

if __name__ == "__main__":
    run_evaluation()
