"""
AgroVision AI — Real ML Crop Yield Prediction Training & Benchmarking Pipeline
==============================================================================
Trains, benchmarks, and evaluates machine learning regression models for
precision crop yield forecasting based on Crop Type, Agricultural Season,
State / Location, Farm Area, Annual Rainfall, Fertilizer, and Pesticide inputs.

Benchmarks:
1. Random Forest Regressor
2. HistGradientBoosting Regressor
3. Extra Trees Regressor
4. Decision Tree Regressor

Saves champion model, preprocessor, feature metadata, and evaluation metrics (MAE, RMSE, R²) to `backend/models/yield_prediction/`.
"""

import os
import sys
import json
import urllib.request
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split, KFold, cross_val_score
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor, ExtraTreesRegressor
from sklearn.tree import DecisionTreeRegressor
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

os.makedirs(MODEL_DIR, exist_ok=True)

# Canonical dataset source URLs
DATASET_URLS = [
    "https://raw.githubusercontent.com/Drashti16N/Crop_yield_prediction/main/crop_yield.csv",
    "https://raw.githubusercontent.com/Aswins10/Agricultural-Crop-Yield-in-Indian-States-Dataset/main/crop_yield.csv"
]

CAT_COLS = ["Crop", "Season", "State"]
NUM_COLS = ["Area", "Annual_Rainfall", "Fertilizer", "Pesticide"]
TARGET_COL = "Yield"

def fetch_or_load_dataset() -> pd.DataFrame:
    """Fetches the canonical agricultural crop yield dataset if not locally cached, and returns DataFrame."""
    if os.path.exists(DATASET_PATH):
        print(f"Loading cached dataset from {DATASET_PATH}...", flush=True)
        df = pd.read_csv(DATASET_PATH)
        return df

    print("Fetching verified agricultural crop yield dataset from canonical source...", flush=True)
    downloaded = False
    for url in DATASET_URLS:
        try:
            print(f"Attempting download from: {url}", flush=True)
            req = urllib.request.urlopen(url, timeout=15)
            content = req.read().decode('utf-8')
            with open(DATASET_PATH, "w", encoding="utf-8") as f:
                f.write(content)
            downloaded = True
            print(f"Successfully downloaded and saved dataset to {DATASET_PATH}", flush=True)
            break
        except Exception as e:
            print(f"Failed download from {url}: {e}", flush=True)

    if not downloaded:
        raise RuntimeError("Unable to download crop yield dataset from canonical sources.")

    df = pd.read_csv(DATASET_PATH)
    return df

def preprocess_and_clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans column names, removes non-tonnage items (e.g., coconut counting in nuts),
    removes non-positive values, and filters extreme biological outliers per crop.
    """
    print("\n--- 1. DATASET INSPECTION & RIGOROUS DATA CLEANING ---", flush=True)
    print(f"Initial raw record count: {len(df)}", flush=True)

    # Standardize column names
    df.columns = [c.strip() for c in df.columns]

    for c in CAT_COLS:
        df[c] = df[c].astype(str).str.strip()

    for c in NUM_COLS + [TARGET_COL]:
        df[c] = pd.to_numeric(df[c], errors="coerce")

    # Exclude Coconut (reported in number of nuts, not tonnes)
    df = df[~df["Crop"].str.lower().str.contains("coconut")].copy()  # type: ignore

    # Drop missing or zero/negative invalid agricultural records
    df = df.dropna(subset=CAT_COLS + NUM_COLS + [TARGET_COL]).copy()
    df = df[(df["Area"] > 0) & (df["Annual_Rainfall"] > 0) & (df[TARGET_COL] > 0)].copy()  # type: ignore

    # Filter extreme biological yield outliers per crop using 1st to 98.5th percentiles
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
    print(f"Cleaned dataset records: {len(df_clean)} across {df_clean['Crop'].nunique()} crop categories and {df_clean['State'].nunique()} states.", flush=True)
    
    print("\nYield Statistics Summary (tonnes/hectare):", flush=True)
    print(df_clean[TARGET_COL].describe().round(3), flush=True)

    return df_clean

def train_and_benchmark_models(df: pd.DataFrame):
    """
    Constructs feature preprocessor, runs 5-fold cross validation across candidate models,
    selects champion regressor, and computes holdout test metrics (MAE, RMSE, R²).
    """
    print("\n--- 2. MULTI-MODEL REGRESSION BENCHMARKING ---", flush=True)

    X = df[CAT_COLS + NUM_COLS]
    y = df[TARGET_COL].values

    # 80/20 Holdout Train/Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )

    print(f"Training Set: {len(X_train)} samples | Independent Test Set: {len(X_test)} samples", flush=True)

    # Column Transformer Preprocessor
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CAT_COLS),
            ("num", StandardScaler(), NUM_COLS)
        ]
    )

    # Candidate Regressors
    models = {
        "Random Forest Regressor": RandomForestRegressor(
            n_estimators=100, max_depth=16, min_samples_split=4, random_state=42
        ),
        "HistGradientBoosting Regressor": HistGradientBoostingRegressor(
            max_iter=100, learning_rate=0.1, max_depth=8, random_state=42
        ),
        "Extra Trees Regressor": ExtraTreesRegressor(
            n_estimators=100, max_depth=16, min_samples_split=4, random_state=42
        ),
        "Decision Tree Regressor": DecisionTreeRegressor(
            max_depth=12, min_samples_split=6, random_state=42
        )
    }

    # Pre-fit transformer on training set for clean benchmarking
    X_train_transformed = preprocessor.fit_transform(X_train)
    X_test_transformed = preprocessor.transform(X_test)

    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    benchmark_results = {}

    print("\nRunning 5-Fold Cross-Validation on Training Split:", flush=True)
    for name, reg in models.items():
        # Negative MAE scores for ranking
        mae_scores = -cross_val_score(reg, X_train_transformed, y_train, cv=kf, scoring="neg_mean_absolute_error")
        r2_scores = cross_val_score(reg, X_train_transformed, y_train, cv=kf, scoring="r2")
        
        mean_mae = float(np.mean(mae_scores))
        mean_r2 = float(np.mean(r2_scores))
        print(f"  • {name:32s}: CV MAE = {mean_mae:.3f} t/ha | CV R² = {mean_r2:.4f}", flush=True)
        
        benchmark_results[name] = {
            "cv_mae": round(mean_mae, 4),
            "cv_r2": round(mean_r2, 4)
        }

    # Select champion based on highest R² / lowest MAE
    champion_name = max(benchmark_results, key=lambda k: benchmark_results[k]["cv_r2"])
    champion_model = models[champion_name]
    print(f"\n🏆 Champion Model Selected: {champion_name}", flush=True)

    # Fit champion on full training split
    print(f"Fitting {champion_name} on full training set...", flush=True)
    champion_model.fit(X_train_transformed, y_train)

    # Evaluate on independent test set
    print("\n--- 3. EVALUATION ON INDEPENDENT TEST SET (20% HOLDOUT) ---", flush=True)
    y_test_pred = champion_model.predict(X_test_transformed)

    test_mae = float(mean_absolute_error(y_test, y_test_pred))
    test_rmse = float(root_mean_squared_error(y_test, y_test_pred))
    test_r2 = float(r2_score(y_test, y_test_pred))

    print(f"Independent Test MAE:  {test_mae:.4f} tonnes/hectare", flush=True)
    print(f"Independent Test RMSE: {test_rmse:.4f} tonnes/hectare", flush=True)
    print(f"Independent Test R²:   {test_r2:.4f} ({test_r2 * 100:.2f}% variance explained)", flush=True)

    # Per-Crop Performance Breakdown on Test Set
    test_df_eval = X_test.copy()
    test_df_eval["Actual_Yield"] = y_test
    test_df_eval["Predicted_Yield"] = y_test_pred
    test_df_eval["Absolute_Error"] = np.abs(y_test - y_test_pred)

    per_crop_eval = {}
    print("\nKey Crops Performance Breakdown (Test Set):", flush=True)
    print(f"{'Crop':20s} | {'Test Count':10s} | {'Mean Actual':12s} | {'Mean Pred':10s} | {'MAE (t/ha)':10s}", flush=True)
    print("-" * 72, flush=True)
    for crop_name, grp in test_df_eval.groupby("Crop"):
        if len(grp) >= 10:
            c_mae = float(grp["Absolute_Error"].mean())
            c_act = float(grp["Actual_Yield"].mean())
            c_pred = float(grp["Predicted_Yield"].mean())
            per_crop_eval[crop_name] = {
                "test_samples": len(grp),
                "mean_actual_yield": round(c_act, 2),
                "mean_predicted_yield": round(c_pred, 2),
                "mae": round(c_mae, 3)
            }
            print(f"{crop_name:20s} | {len(grp):10d} | {c_act:10.2f} t/ha | {c_pred:8.2f} t/ha | {c_mae:8.3f}", flush=True)

    # Feature importances if available
    feature_importances = {}
    if hasattr(champion_model, "feature_importances_"):
        ohe = preprocessor.named_transformers_["cat"]
        feature_names = list(ohe.get_feature_names_out(CAT_COLS)) + NUM_COLS
        importances = champion_model.feature_importances_
        
        # Aggregate importance by source feature group
        group_importances = {"Crop": 0.0, "Season": 0.0, "State": 0.0}
        for f_name, imp in zip(feature_names, importances):
            if f_name.startswith("Crop_"):
                group_importances["Crop"] += float(imp)
            elif f_name.startswith("Season_"):
                group_importances["Season"] += float(imp)
            elif f_name.startswith("State_"):
                group_importances["State"] += float(imp)
            else:
                group_importances[f_name] = float(imp)

        for k, v in group_importances.items():
            feature_importances[k] = round(v * 100.0, 2)

        print("\nAggregated Feature Importances:", flush=True)
        for f_name, imp_val in sorted(feature_importances.items(), key=lambda x: x[1], reverse=True):
            print(f"  • {f_name:18s}: {imp_val:.2f}%", flush=True)

    evaluation_payload = {
        "model_name": champion_name,
        "target": "Yield (tonnes/hectare)",
        "features": CAT_COLS + NUM_COLS,
        "total_records": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "test_mae": round(test_mae, 4),
        "test_rmse": round(test_rmse, 4),
        "test_r2": round(test_r2, 4),
        "benchmark_comparison": benchmark_results,
        "feature_importances": feature_importances,
        "per_crop_performance": per_crop_eval,
        "supported_crops": sorted(list(df["Crop"].unique())),
        "supported_states": sorted(list(df["State"].unique())),
        "supported_seasons": sorted(list(df["Season"].unique()))
    }

    return champion_model, preprocessor, evaluation_payload

def save_artifacts(model, preprocessor, eval_report):
    """Saves serialized model, preprocessor, and evaluation report to `backend/models/yield_prediction/`."""
    print("\n--- 4. SAVING YIELD MODEL ARTIFACTS ---", flush=True)

    model_path = os.path.join(MODEL_DIR, "crop_yield_model.joblib")
    preprocessor_path = os.path.join(MODEL_DIR, "crop_yield_preprocessor.joblib")
    eval_path = os.path.join(MODEL_DIR, "crop_yield_eval.json")
    features_path = os.path.join(MODEL_DIR, "crop_yield_features.json")

    joblib.dump(model, model_path)
    joblib.dump(preprocessor, preprocessor_path)

    with open(eval_path, "w", encoding="utf-8") as f:
        json.dump(eval_report, f, indent=2)

    with open(features_path, "w", encoding="utf-8") as f:
        json.dump({
            "categorical_features": CAT_COLS,
            "numerical_features": NUM_COLS,
            "target": TARGET_COL,
            "target_unit": "tonnes/hectare",
            "supported_crops": eval_report["supported_crops"],
            "supported_states": eval_report["supported_states"],
            "supported_seasons": eval_report["supported_seasons"]
        }, f, indent=2)

    print(f"✓ Saved Yield Model:        {model_path}", flush=True)
    print(f"✓ Saved Preprocessor:       {preprocessor_path}", flush=True)
    print(f"✓ Saved Evaluation Report:  {eval_path}", flush=True)
    print(f"✓ Saved Feature Metadata:   {features_path}", flush=True)

def main():
    print("=" * 70, flush=True)
    print("📈 AGROVISION AI — REAL ML CROP YIELD PREDICTION TRAINING PIPELINE", flush=True)
    print("=" * 70, flush=True)

    df = fetch_or_load_dataset()
    df_clean = preprocess_and_clean_data(df)
    champion_model, preprocessor, eval_report = train_and_benchmark_models(df_clean)
    save_artifacts(champion_model, preprocessor, eval_report)

    print("\n" + "=" * 70, flush=True)
    print("🎉 YIELD MODEL TRAINING & EVALUATION COMPLETED SUCCESSFULLY!", flush=True)
    print(f"Champion Model: {eval_report['model_name']} | Test R²: {eval_report['test_r2']} | Test MAE: {eval_report['test_mae']} t/ha", flush=True)
    print("=" * 70, flush=True)

if __name__ == "__main__":
    main()
