"""
AgroVision AI — Real ML Model Evaluation Pipeline
Evaluates the trained MobileNetV2 model strictly on the untouched Test Dataset.
Generates Accuracy, Precision, Recall, F1-Scores, Confusion Matrix, and Per-Class Performance.
"""

import os
import sys
import json
import torch
import numpy as np
import matplotlib  # type: ignore
matplotlib.use('Agg')
import matplotlib.pyplot as plt  # type: ignore
import seaborn as sns  # type: ignore
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support, accuracy_score

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset")
MODEL_DIR = os.path.join(BASE_DIR, "models", "crop_health")

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def evaluate():
    print("=" * 70)
    print("🔬 AGROVISION AI — MODEL EVALUATION ON INDEPENDENT TEST SET")
    print(f"Device: {DEVICE}")
    print("=" * 70)

    test_dir = os.path.join(DATASET_DIR, "test")
    model_path = os.path.join(MODEL_DIR, "crop_disease_model.pth")

    if not os.path.exists(test_dir):
        raise FileNotFoundError(f"Test directory not found at {test_dir}")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Trained model not found at {model_path}")

    # Load test data
    test_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    test_dataset = datasets.ImageFolder(test_dir, transform=test_transform)
    test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False, num_workers=0)
    class_names = test_dataset.classes
    num_classes = len(class_names)

    print(f"Loaded {len(test_dataset)} test images across {num_classes} classes.")

    # Load checkpoint
    checkpoint = torch.load(model_path, map_location=DEVICE)
    model = models.mobilenet_v2(weights=None)
    in_features = model.classifier[1].in_features
    model.classifier = torch.nn.Sequential(
        torch.nn.Dropout(p=0.2),
        torch.nn.Linear(in_features, num_classes)
    )
    model.load_state_dict(checkpoint["model_state_dict"])
    model = model.to(DEVICE)
    model.eval()

    y_true = []
    y_pred = []
    y_scores = []

    print("\nRunning inference over test dataset...")
    with torch.no_grad():
        for inputs, labels in test_loader:
            inputs = inputs.to(DEVICE)
            outputs = model(inputs)
            probs = torch.softmax(outputs, dim=1)
            _, preds = torch.max(outputs, 1)

            y_true.extend(labels.cpu().numpy())
            y_pred.extend(preds.cpu().numpy())
            y_scores.extend(probs.cpu().numpy())

    y_true = np.array(y_true)
    y_pred = np.array(y_pred)
    y_scores = np.array(y_scores)

    # 1. Overall Metrics
    test_accuracy = accuracy_score(y_true, y_pred) * 100.0
    prec_macro, rec_macro, f1_macro, _ = precision_recall_fscore_support(y_true, y_pred, average="macro", zero_division=0)
    prec_weighted, rec_weighted, f1_weighted, _ = precision_recall_fscore_support(y_true, y_pred, average="weighted", zero_division=0)

    # 2. Per-Class Metrics
    prec_per_cls, rec_per_cls, f1_per_cls, support_per_cls = precision_recall_fscore_support(y_true, y_pred, average=None, zero_division=0)  # type: ignore
    
    per_class_results = {}
    weak_classes = []

    for idx, name in enumerate(class_names):
        p = float(prec_per_cls[idx]) * 100.0  # type: ignore
        r = float(rec_per_cls[idx]) * 100.0  # type: ignore
        f1 = float(f1_per_cls[idx]) * 100.0  # type: ignore
        sup = int(support_per_cls[idx])  # type: ignore
        
        per_class_results[name] = {
            "precision": round(p, 2),
            "recall": round(r, 2),
            "f1_score": round(f1, 2),
            "test_samples": sup
        }
        if f1 < 85.0:
            weak_classes.append({
                "class_name": name,
                "f1_score": round(f1, 2),
                "precision": round(p, 2),
                "recall": round(r, 2)
            })

    # Sort weak classes by lowest F1
    weak_classes.sort(key=lambda x: x["f1_score"])

    # 3. Confusion Matrix
    cm = confusion_matrix(y_true, y_pred)
    
    # Save Confusion Matrix plot
    plt.figure(figsize=(18, 16))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Greens',
                xticklabels=[c.replace("___", "\n") for c in class_names],
                yticklabels=[c.replace("___", "\n") for c in class_names])
    plt.title("AgroVision AI — Crop Disease Model Confusion Matrix (Test Set)", fontsize=16, pad=20)
    plt.xlabel("Predicted Class", fontsize=12)
    plt.ylabel("True Class", fontsize=12)
    plt.xticks(rotation=90, fontsize=8)
    plt.yticks(rotation=0, fontsize=8)
    plt.tight_layout()
    cm_plot_path = os.path.join(MODEL_DIR, "confusion_matrix.png")
    plt.savefig(cm_plot_path, dpi=200)
    plt.close()

    # 4. Save JSON Report
    report = {
        "model_architecture": "MobileNetV2 Transfer Learning",
        "dataset": "PlantVillage Benchmark",
        "total_test_samples": len(test_dataset),
        "metrics": {
            "test_accuracy_pct": round(float(test_accuracy), 2),
            "macro_precision_pct": round(float(prec_macro) * 100.0, 2),
            "macro_recall_pct": round(float(rec_macro) * 100.0, 2),
            "macro_f1_score_pct": round(float(f1_macro) * 100.0, 2),
            "weighted_precision_pct": round(float(prec_weighted) * 100.0, 2),
            "weighted_recall_pct": round(float(rec_weighted) * 100.0, 2),
            "weighted_f1_score_pct": round(float(f1_weighted) * 100.0, 2)
        },
        "weak_classes_f1_below_85": weak_classes,
        "per_class_performance": per_class_results,
        "confusion_matrix_shape": list(cm.shape)
    }

    report_path = os.path.join(MODEL_DIR, "evaluation_report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    cm_json_path = os.path.join(MODEL_DIR, "confusion_matrix.json")
    with open(cm_json_path, "w") as f:
        json.dump({"class_names": class_names, "matrix": cm.tolist()}, f, indent=2)

    print("\n" + "=" * 70)
    print("📊 FINAL MODEL TEST EVALUATION RESULTS:")
    print(f"  • Final Test Accuracy:    {test_accuracy:.2f}%")
    print(f"  • Macro F1-Score:         {f1_macro * 100.0:.2f}%")
    print(f"  • Macro Precision:        {prec_macro * 100.0:.2f}%")
    print(f"  • Macro Recall:           {rec_macro * 100.0:.2f}%")
    print(f"  • Weighted F1-Score:      {f1_weighted * 100.0:.2f}%")
    print(f"  • Confusion Matrix Plot:  {cm_plot_path}")
    print(f"  • Full JSON Report:       {report_path}")
    print("=" * 70)

    if weak_classes:
        print(f"\n⚠️  Weak Classes (F1 < 85%):")
        for wc in weak_classes:
            print(f"  - {wc['class_name']}: F1={wc['f1_score']}%, Precision={wc['precision']}%, Recall={wc['recall']}%")
    else:
        print("\n✨ All classes achieved F1 >= 85.0% on the independent test set!")

if __name__ == "__main__":
    evaluate()
