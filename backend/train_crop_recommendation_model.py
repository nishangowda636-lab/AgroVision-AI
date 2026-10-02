"""
AgroVision AI — Real ML Crop Recommendation Training & Model Selection Pipeline
================================================================================
Trains, benchmarks, and evaluates machine learning models for precision agricultural
crop recommendation based on soil nutrients (N, P, K), soil pH, and microclimatic
parameters (temperature, relative humidity, rainfall).

Benchmarks:
1. Random Forest Classifier
2. Gradient Boosting Classifier (HistGradientBoosting / GradientBoosting)
3. Extra Trees Classifier
4. Decision Tree Classifier

Saves champion model, scaler, class encoder, and detailed evaluation metrics to `backend/models/crop_recommendation/`.
"""

import os
import sys
import json
import urllib.request
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier, ExtraTreesClassifier
from sklearn.tree import DecisionTreeClassifier
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

os.makedirs(MODEL_DIR, exist_ok=True)

# Canonical dataset source URLs
DATASET_URLS = [
    "https://raw.githubusercontent.com/Sadhana-Panthi/agricultural-crop-recommendation/main/Crop_recommendation.csv",
    "https://raw.githubusercontent.com/lk-learner/Crop-Recommendation/main/Crop_recommendation.csv",
    "https://raw.githubusercontent.com/KumarranMahesh/Crop-Recommendation-System/main/Crop_recommendation.csv"
]

FEATURE_COLS = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
TARGET_COL = "label"

def fetch_or_load_dataset() -> pd.DataFrame:
    """Fetches the canonical agricultural crop dataset if not locally cached, and returns DataFrame."""
    if os.path.exists(DATASET_PATH):
        print(f"Loading cached dataset from {DATASET_PATH}...")
        df = pd.read_csv(DATASET_PATH)
        return df

    print("Fetching verified agricultural crop dataset from canonical source...")
    downloaded = False
    for url in DATASET_URLS:
        try:
            print(f"Attempting download from: {url}")
            req = urllib.request.urlopen(url, timeout=10)
            content = req.read().decode('utf-8')
            with open(DATASET_PATH, "w", encoding="utf-8") as f:
                f.write(content)
            downloaded = True
            print(f"Successfully downloaded and saved dataset to {DATASET_PATH}")
            break
        except Exception as e:
            print(f"Failed download from {url}: {e}")

    if not downloaded:
        raise RuntimeError("Unable to download crop recommendation dataset from canonical sources.")

    df = pd.read_csv(DATASET_PATH)
    return df

def preprocess_and_validate(df: pd.DataFrame):
    """
    Validates dataset integrity, checks missing values, validates distributions,
    cleans whitespace, and extracts features and encoded labels.
    """
    print("\n--- 1. DATASET INSPECTION & VALIDATION ---")
    print(f"Initial row count: {len(df)}")
    print(f"Columns present: {list(df.columns)}")

    # Standardize column names (strip whitespace and lower/case consistency)
    df.columns = [c.strip() for c in df.columns]
    
    # Check required columns
    for col in FEATURE_COLS + [TARGET_COL]:
        if col not in df.columns:
            raise ValueError(f"Missing required column: {col}")

    # Inspect missing values
    null_counts = df[FEATURE_COLS + [TARGET_COL]].isnull().sum()
    print("Missing values per column:")
    for col, count in null_counts.items():
        print(f"  - {col}: {count}")

    # Remove any NaN or corrupted rows if present
    df = df.dropna(subset=FEATURE_COLS + [TARGET_COL]).copy()

    # Clean string labels
    df[TARGET_COL] = df[TARGET_COL].astype(str).str.strip().str.lower()

    # Numeric conversions & sanity filtering
    for col in FEATURE_COLS:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    
    df = df.dropna(subset=FEATURE_COLS).copy()

    # Check class distributions
    class_counts = df[TARGET_COL].value_counts()
    print(f"\nTotal unique crop classes: {len(class_counts)}")
    print("Class distribution preview:")
    for cls_name, count in class_counts.items():
        print(f"  • {cls_name:15s}: {count} records")

    # Summary statistics of features
    print("\nFeature Summary Statistics:")
    print(df[FEATURE_COLS].describe().round(2))

    return df

def train_and_evaluate_models(df: pd.DataFrame):
    """
    Benchmarks multiple classifiers using Stratified K-Fold CV,
    selects the champion model, evaluates on a holdout 20% test set,
    and returns model artifacts and metrics.
    """
    print("\n--- 2. MODEL BENCHMARKING & SELECTION ---")
    
    X = df[FEATURE_COLS].values
    y_raw = df[TARGET_COL].astype(str).tolist()

    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y_raw)
    class_names = list(label_encoder.classes_)

    # 80/20 Stratified Train/Test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    print(f"Training set: {len(X_train)} samples | Independent Test set: {len(X_test)} samples")

    # Preprocessing: StandardScaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Candidate models to evaluate
    models = {
        "Random Forest": RandomForestClassifier(
            n_estimators=100, max_depth=16, min_samples_split=2, random_state=42
        ),
        "Extra Trees": ExtraTreesClassifier(
            n_estimators=100, max_depth=16, random_state=42
        ),
        "Gradient Boosting (Hist)": HistGradientBoostingClassifier(
            max_iter=100, learning_rate=0.1, max_depth=6, random_state=42
        ),
        "Decision Tree": DecisionTreeClassifier(
            max_depth=12, min_samples_split=4, random_state=42
        )
    }

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    benchmark_results = {}

    print("\nRunning 5-Fold Stratified Cross-Validation on Training Set:", flush=True)
    for name, model in models.items():
        cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=cv, scoring="accuracy")
        mean_acc = float(np.mean(cv_scores)) * 100.0
        std_acc = float(np.std(cv_scores)) * 100.0
        print(f"  • {name:20s}: Mean CV Accuracy = {mean_acc:.2f}% (±{std_acc:.2f}%)", flush=True)
        benchmark_results[name] = {
            "cv_mean_accuracy_pct": round(mean_acc, 2),
            "cv_std_pct": round(std_acc, 2)
        }

    # Select champion model based on highest CV accuracy
    champion_name = max(benchmark_results, key=lambda k: benchmark_results[k]["cv_mean_accuracy_pct"])
    champion_model = models[champion_name]
    print(f"\n🏆 Champion Model Selected: {champion_name}")

    # Train champion model on full training set
    print(f"Fitting {champion_name} on full training split...")
    champion_model.fit(X_train_scaled, y_train)

    # Train accuracy
    train_preds = champion_model.predict(X_train_scaled)
    train_acc = accuracy_score(y_train, train_preds) * 100.0

    # Test evaluation (unseen holdout test set)
    print("\n--- 3. EVALUATION ON UNSEEN TEST DATASET ---")
    test_preds = champion_model.predict(X_test_scaled)
    test_probs = champion_model.predict_proba(X_test_scaled)

    test_acc = accuracy_score(y_test, test_preds) * 100.0
    macro_prec, macro_rec, macro_f1, _ = precision_recall_fscore_support(y_test, test_preds, average="macro", zero_division=0)
    weighted_prec, weighted_rec, weighted_f1, _ = precision_recall_fscore_support(y_test, test_preds, average="weighted", zero_division=0)

    print(f"Independent Test Accuracy:  {test_acc:.2f}%")
    print(f"Macro Precision:            {macro_prec * 100.0:.2f}%")
    print(f"Macro Recall:               {macro_rec * 100.0:.2f}%")
    print(f"Macro F1-Score:             {macro_f1 * 100.0:.2f}%")
    print(f"Weighted F1-Score:          {weighted_f1 * 100.0:.2f}%")

    # Per-class metrics
    per_cls_prec, per_cls_rec, per_cls_f1, per_cls_sup = precision_recall_fscore_support(  # type: ignore
        y_test, test_preds, average=None, zero_division=0
    )

    per_class_report = {}
    print("\nPer-Crop Performance Breakdown (Test Set):")
    print(f"{'Crop':15s} | {'Precision':10s} | {'Recall':10s} | {'F1-Score':10s} | {'Support':7s}")
    print("-" * 65)
    for i, cls_name in enumerate(class_names):
        p_val = float(per_cls_prec[i] * 100.0)  # type: ignore
        r_val = float(per_cls_rec[i] * 100.0)  # type: ignore
        f_val = float(per_cls_f1[i] * 100.0)  # type: ignore
        s_val = int(per_cls_sup[i])  # type: ignore
        per_class_report[cls_name] = {
            "precision_pct": round(p_val, 2),
            "recall_pct": round(r_val, 2),
            "f1_pct": round(f_val, 2),
            "support": s_val
        }
        print(f"{cls_name:15s} | {p_val:9.2f}% | {r_val:9.2f}% | {f_val:9.2f}% | {s_val:7d}")

    # Confusion matrix
    cm = confusion_matrix(y_test, test_preds).tolist()

    # Feature importances if available
    feature_importances = {}
    if hasattr(champion_model, "feature_importances_"):
        importances = champion_model.feature_importances_
        for f_name, imp in zip(FEATURE_COLS, importances):
            feature_importances[f_name] = round(float(imp * 100.0), 2)
        print("\nFeature Importances:")
        for f_name, imp in sorted(feature_importances.items(), key=lambda x: x[1], reverse=True):
            print(f"  • {f_name:12s}: {imp:.2f}%")

    evaluation_payload = {
        "model_name": champion_name,
        "features": FEATURE_COLS,
        "num_classes": len(class_names),
        "total_samples": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "train_accuracy_pct": round(train_acc, 2),
        "test_accuracy_pct": round(test_acc, 2),
        "macro_precision_pct": round(float(macro_prec * 100.0), 2),
        "macro_recall_pct": round(float(macro_rec * 100.0), 2),
        "macro_f1_pct": round(float(macro_f1 * 100.0), 2),
        "weighted_f1_pct": round(float(weighted_f1 * 100.0), 2),
        "benchmark_comparison": benchmark_results,
        "feature_importances": feature_importances,
        "per_class_performance": per_class_report,
        "confusion_matrix": cm,
        "classes": class_names
    }

    return champion_model, scaler, label_encoder, evaluation_payload

def save_artifacts(model, scaler, label_encoder, eval_report):
    """Saves all model weights, scalers, classes, and evaluation artifacts."""
    print("\n--- 4. SAVING MODEL ARTIFACTS ---")
    
    model_path = os.path.join(MODEL_DIR, "crop_recommendation_model.joblib")
    scaler_path = os.path.join(MODEL_DIR, "crop_recommendation_scaler.joblib")
    classes_path = os.path.join(MODEL_DIR, "crop_recommendation_classes.json")
    eval_path = os.path.join(MODEL_DIR, "crop_recommendation_eval.json")
    features_path = os.path.join(MODEL_DIR, "crop_recommendation_features.json")

    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)

    with open(classes_path, "w", encoding="utf-8") as f:
        json.dump(list(label_encoder.classes_), f, indent=2)

    with open(eval_path, "w", encoding="utf-8") as f:
        json.dump(eval_report, f, indent=2)

    with open(features_path, "w", encoding="utf-8") as f:
        json.dump({
            "features": FEATURE_COLS,
            "target": TARGET_COL,
            "classes": list(label_encoder.classes_)
        }, f, indent=2)

    print(f"✓ Saved Model:              {model_path}")
    print(f"✓ Saved Scaler:             {scaler_path}")
    print(f"✓ Saved Class Mapping:      {classes_path}")
    print(f"✓ Saved Evaluation Report:  {eval_path}")
    print(f"✓ Saved Feature Metadata:   {features_path}")

def main():
    print("=" * 70)
    print("🌱 AGROVISION AI — REAL ML CROP RECOMMENDATION TRAINING PIPELINE")
    print("=" * 70)
    
    df = fetch_or_load_dataset()
    df_clean = preprocess_and_validate(df)
    champion_model, scaler, label_encoder, eval_report = train_and_evaluate_models(df_clean)
    save_artifacts(champion_model, scaler, label_encoder, eval_report)
    
    print("\n" + "=" * 70)
    print("🎉 TRAINING AND MODEL EVALUATION COMPLETED SUCCESSFULLY!")
    print(f"Champion Model: {eval_report['model_name']} with Test Accuracy: {eval_report['test_accuracy_pct']}%")
    print("=" * 70)

if __name__ == "__main__":
    main()
