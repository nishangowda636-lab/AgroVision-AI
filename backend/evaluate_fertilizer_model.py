"""
AgroVision AI — Standalone Fertilizer Recommendation Model Evaluator
=====================================================================
Loads trained fertilizer recommendation artifacts from backend/models/fertilizer/
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
    confusion_matrix, classification_report
)

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "fertilizer")

def evaluate():
    print("=" * 70)
    print("FERTILIZER RECOMMENDATION MODEL EVALUATION")
    print("=" * 70)

    model_path = os.path.join(MODEL_DIR, "fertilizer_model.joblib")
    prep_path = os.path.join(MODEL_DIR, "fertilizer_preprocessor.joblib")
    data_path = os.path.join(MODEL_DIR, "fertilizer_dataset.csv")

    for p in [model_path, prep_path, data_path]:
        if not os.path.exists(p):
            print(f"Error: Artifact not found: {p}")
            return False

    model = joblib.load(model_path)
    prep = joblib.load(prep_path)
    df = pd.read_csv(data_path)

    cat_features = ["crop", "soil_type", "crop_stage"]
    num_features = ["nitrogen", "phosphorus", "potassium", "ph", "temperature", "humidity", "rainfall"]
    features = cat_features + num_features

    X = df[features]
    y = df["fertilizer_label"]

    _, X_test, _, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    X_test_trans = prep.transform(X_test)
    y_pred = model.predict(X_test_trans)

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    print(f"\nClassifier Architecture: {type(model).__name__}")
    print(f"Holdout Test Accuracy:   {acc * 100:.2f}%")
    print(f"Weighted Precision:      {prec * 100:.2f}%")
    print(f"Weighted Recall:         {rec * 100:.2f}%")
    print(f"Weighted F1-Score:       {f1 * 100:.2f}%")

    print("\nDetailed Per-Class Classification Report:")
    print(classification_report(y_test, y_pred, digits=4))

    print("\n✓ Model evaluation verified against production artifacts.")
    return True

if __name__ == "__main__":
    evaluate()
