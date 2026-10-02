"""
AgroVision AI — Standalone Crop Yield Model Evaluator
=====================================================
Loads the saved champion regression model and preprocessor, evaluates on
the dataset holdout test split, and outputs MAE, RMSE, and R² metrics.
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    mean_absolute_error,
    root_mean_squared_error,
    r2_score
)

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models", "yield_prediction")
DATASET_PATH = os.path.join(MODEL_DIR, "crop_yield_dataset.csv")

MODEL_PATH = os.path.join(MODEL_DIR, "crop_yield_model.joblib")
PREPROCESSOR_PATH = os.path.join(MODEL_DIR, "crop_yield_preprocessor.joblib")
EVAL_PATH = os.path.join(MODEL_DIR, "crop_yield_eval.json")

CAT_COLS = ["Crop", "Season", "State"]
NUM_COLS = ["Area", "Annual_Rainfall", "Fertilizer", "Pesticide"]
TARGET_COL = "Yield"

def run_evaluation():
    print("=" * 70)
    print("🔬 AGROVISION AI — CROP YIELD MODEL EVALUATION SUITE")
    print("=" * 70)

    if not os.path.exists(MODEL_PATH) or not os.path.exists(PREPROCESSOR_PATH) or not os.path.exists(DATASET_PATH):
        print("Model or dataset artifacts not found. Running training first...")
        import train_crop_yield_model
        train_crop_yield_model.main()

    model = joblib.load(MODEL_PATH)
    preprocessor = joblib.load(PREPROCESSOR_PATH)
    with open(EVAL_PATH, "r", encoding="utf-8") as f:
        eval_meta = json.load(f)

    print(f"Loaded Model:        {type(model).__name__}")
    print(f"Loaded Preprocessor: {type(preprocessor).__name__}")

    # Load and clean dataset
    df = pd.read_csv(DATASET_PATH)
    df.columns = [c.strip() for c in df.columns]
    for c in CAT_COLS:
        df[c] = df[c].astype(str).str.strip()
    for c in NUM_COLS + [TARGET_COL]:
        df[c] = pd.to_numeric(df[c], errors="coerce")

    df = df[~df["Crop"].str.lower().str.contains("coconut")].copy()
    df = df.dropna(subset=CAT_COLS + NUM_COLS + [TARGET_COL]).copy()
    df = df[(df["Area"] > 0) & (df["Annual_Rainfall"] > 0) & (df[TARGET_COL] > 0)].copy()

    # Apply outlier filter per crop
    clean_subsets = []
    for crop_name, grp in df.groupby("Crop"):
        if len(grp) >= 15:
            q_low = grp[TARGET_COL].quantile(0.005)
            q_high = grp[TARGET_COL].quantile(0.985)
            filtered = grp[(grp[TARGET_COL] >= q_low) & (grp[TARGET_COL] <= q_high)]
            clean_subsets.append(filtered)
        else:
            clean_subsets.append(grp)

    df_clean = pd.concat(clean_subsets, ignore_index=True)

    X = df_clean[CAT_COLS + NUM_COLS]
    y = df_clean[TARGET_COL].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )

    X_test_transformed = preprocessor.transform(X_test)
    y_pred = model.predict(X_test_transformed)

    mae = mean_absolute_error(y_test, y_pred)
    rmse = root_mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print("\n--- INDEPENDENT TEST SET EVALUATION METRICS ---")
    print(f"Test Samples Evaluated:     {len(y_test)}")
    print(f"Mean Absolute Error (MAE):  {mae:.4f} tonnes/hectare")
    print(f"Root Mean Squared Error:    {rmse:.4f} tonnes/hectare")
    print(f"R² Score:                   {r2:.4f} ({r2 * 100:.2f}% variance explained)")

    return {
        "test_mae": mae,
        "test_rmse": rmse,
        "test_r2": r2,
        "test_samples": len(y_test)
    }

if __name__ == "__main__":
    run_evaluation()
