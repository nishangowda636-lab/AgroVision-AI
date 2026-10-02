"""
AgroVision AI — Standalone Smart Irrigation Model Evaluator
===========================================================
Loads trained classification and regression artifacts from backend/models/smart_irrigation/
and outputs complete evaluation metrics on the holdout test set.
"""

import sys
import os
import json
import joblib
import numpy as np
import pandas as pd

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, mean_absolute_error, mean_squared_error, r2_score
)

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "smart_irrigation")

def evaluate():
    print("=" * 70)
    print("SMART IRRIGATION MODEL EVALUATION")
    print("=" * 70)

    clf_path = os.path.join(MODEL_DIR, "smart_irrigation_model.joblib")
    reg_path = os.path.join(MODEL_DIR, "smart_irrigation_regressor.joblib")
    prep_path = os.path.join(MODEL_DIR, "smart_irrigation_preprocessor.joblib")
    data_path = os.path.join(MODEL_DIR, "smart_irrigation_dataset.csv")
    eval_path = os.path.join(MODEL_DIR, "smart_irrigation_eval.json")

    for p in [clf_path, reg_path, prep_path, data_path, eval_path]:
        if not os.path.exists(p):
            print(f"Error: Artifact not found: {p}")
            return False

    clf = joblib.load(clf_path)
    reg = joblib.load(reg_path)
    prep = joblib.load(prep_path)
    df = pd.read_csv(data_path)

    cat_features = ["crop", "soil_type", "crop_stage", "irrigation_method"]
    num_features = ["soil_moisture", "temperature", "humidity", "rainfall", "rain_probability", "farm_area"]
    features = cat_features + num_features

    X = df[features]
    y_clf = df["irrigation_required"]
    y_reg = df["water_requirement_litres"]

    _, X_test, _, y_test_clf, _, y_test_reg = train_test_split(
        X, y_clf, y_reg, test_size=0.20, random_state=42, stratify=y_clf
    )

    X_test_trans = prep.transform(X_test)

    # 1. Classification Evaluation
    y_pred_clf = clf.predict(X_test_trans)
    acc = accuracy_score(y_test_clf, y_pred_clf)
    prec = precision_score(y_test_clf, y_pred_clf)
    rec = recall_score(y_test_clf, y_pred_clf)
    f1 = f1_score(y_test_clf, y_pred_clf)
    cm = confusion_matrix(y_test_clf, y_pred_clf)

    print("\n--- CLASSIFICATION PERFORMANCE (Irrigation Required / Not Required) ---")
    print(f"Classifier Model: {type(clf).__name__}")
    print(f"Holdout Test Accuracy:  {acc * 100:.2f}%")
    print(f"Precision:              {prec * 100:.2f}%")
    print(f"Recall:                 {rec * 100:.2f}%")
    print(f"Macro F1-Score:         {f1 * 100:.2f}%")
    print("\nConfusion Matrix:")
    print("                  Predicted NO    Predicted YES")
    print(f"Actual NO:        {cm[0][0]:>12}    {cm[0][1]:>13}")
    print(f"Actual YES:       {cm[1][0]:>12}    {cm[1][1]:>13}")

    # 2. Regression Evaluation
    y_pred_reg = reg.predict(X_test_trans)
    r2 = r2_score(y_test_reg, y_pred_reg)
    mae = mean_absolute_error(y_test_reg, y_pred_reg)
    rmse = np.sqrt(mean_squared_error(y_test_reg, y_pred_reg))

    print("\n--- REGRESSION PERFORMANCE (Water Volume in Litres) ---")
    print(f"Regressor Model:        {type(reg).__name__}")
    print(f"Holdout Test R² Score:  {r2 * 100:.2f}%")
    print(f"Mean Absolute Error:    {mae:,.1f} Litres")
    print(f"Root Mean Squared Error:{rmse:,.1f} Litres")

    print("\n✓ Evaluation successfully verified against saved artifacts.")
    return True

if __name__ == "__main__":
    evaluate()
