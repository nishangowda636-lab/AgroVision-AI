"""
AgroVision AI — PyTorch Real ML Model Training Pipeline
Model: MobileNetV2 (Transfer Learning from ImageNet)
Task: Multi-Crop Identification & Disease/Health Classification
"""

import os
import sys
import time
import json
import torch
import torch.nn as nn
import torch.optim as optim
from typing import Dict, Any, List
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset")
MODEL_DIR = os.path.join(BASE_DIR, "models", "crop_health")

os.makedirs(MODEL_DIR, exist_ok=True)

# Hyperparameters
NUM_EPOCHS = 6
BATCH_SIZE = 32
LEARNING_RATE = 1e-3
WEIGHT_DECAY = 1e-4
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def get_data_transforms():
    """Returns training and validation transforms with data augmentation."""
    train_transform = transforms.Compose([
        transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    return train_transform, val_transform

def train_model():
    print("=" * 70)
    print("🧠 AGROVISION AI — TRAINING REAL ML CROP HEALTH & DISEASE MODEL")
    print(f"Device: {DEVICE} | Architecture: MobileNetV2 | Epochs: {NUM_EPOCHS} | Batch: {BATCH_SIZE}")
    print("=" * 70)

    train_dir = os.path.join(DATASET_DIR, "train")
    val_dir = os.path.join(DATASET_DIR, "val")

    if not os.path.exists(train_dir) or not os.path.exists(val_dir):
        raise FileNotFoundError("Dataset directories not found. Run dataset_downloader.py first.")

    train_tf, val_tf = get_data_transforms()

    train_dataset = datasets.ImageFolder(train_dir, transform=train_tf)
    val_dataset = datasets.ImageFolder(val_dir, transform=val_tf)

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0, pin_memory=True)

    class_names = train_dataset.classes
    num_classes = len(class_names)
    print(f"Loaded {len(train_dataset)} training images and {len(val_dataset)} validation images across {num_classes} classes.")

    # Save class mapping
    class_to_idx = train_dataset.class_to_idx
    with open(os.path.join(MODEL_DIR, "class_indices.json"), "w") as f:
        json.dump(class_to_idx, f, indent=2)

    # Initialize MobileNetV2 with pretrained weights
    print("\nLoading MobileNetV2 pretrained backbone...")
    weights = models.MobileNet_V2_Weights.DEFAULT
    model = models.mobilenet_v2(weights=weights)

    # Replace classifier head for crop disease classification
    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.2),
        nn.Linear(in_features, num_classes)
    )
    model = model.to(DEVICE)

    criterion = nn.CrossEntropyLoss(label_smoothing=0.05)
    optimizer = optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=NUM_EPOCHS, eta_min=1e-5)

    best_val_acc = 0.0
    best_val_loss = float("inf")
    best_model_path = os.path.join(MODEL_DIR, "crop_disease_model.pth")

    history: Dict[str, Any] = {
        "epochs": [],
        "train_loss": [],
        "train_acc": [],
        "val_loss": [],
        "val_acc": [],
        "learning_rates": []
    }

    start_time = time.time()

    for epoch in range(1, NUM_EPOCHS + 1):
        epoch_start = time.time()
        
        # Training Phase
        model.train()
        running_train_loss = 0.0
        running_train_correct = 0
        total_train = 0

        for inputs, labels in train_loader:
            inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)
            optimizer.zero_grad()

            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_train_loss += loss.item() * inputs.size(0)
            _, preds = torch.max(outputs, 1)
            running_train_correct += torch.sum(preds == labels.data).item()
            total_train += inputs.size(0)

        scheduler.step()

        epoch_train_loss = running_train_loss / total_train
        epoch_train_acc = (running_train_correct / total_train) * 100.0

        # Validation Phase
        model.eval()
        running_val_loss = 0.0
        running_val_correct = 0
        total_val = 0

        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)
                outputs = model(inputs)
                loss = criterion(outputs, labels)

                running_val_loss += loss.item() * inputs.size(0)
                _, preds = torch.max(outputs, 1)
                running_val_correct += torch.sum(preds == labels.data).item()
                total_val += inputs.size(0)

        epoch_val_loss = running_val_loss / total_val
        epoch_val_acc = (running_val_correct / total_val) * 100.0
        epoch_duration = time.time() - epoch_start
        current_lr = optimizer.param_groups[0]['lr']

        history["epochs"].append(epoch)
        history["train_loss"].append(round(epoch_train_loss, 4))
        history["train_acc"].append(round(epoch_train_acc, 2))
        history["val_loss"].append(round(epoch_val_loss, 4))
        history["val_acc"].append(round(epoch_val_acc, 2))
        history["learning_rates"].append(round(current_lr, 6))

        print(f"Epoch [{epoch:02d}/{NUM_EPOCHS:02d}] ({epoch_duration:.1f}s) "
              f"| Train Loss: {epoch_train_loss:.4f} | Train Acc: {epoch_train_acc:.2f}% "
              f"| Val Loss: {epoch_val_loss:.4f} | Val Acc: {epoch_val_acc:.2f}% | LR: {current_lr:.6f}")

        # Checkpoint Best Model
        if epoch_val_acc > best_val_acc or (epoch_val_acc == best_val_acc and epoch_val_loss < best_val_loss):
            best_val_acc = epoch_val_acc
            best_val_loss = epoch_val_loss
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_acc": best_val_acc,
                "val_loss": best_val_loss,
                "class_names": class_names,
                "num_classes": num_classes,
                "architecture": "MobileNetV2"
            }, best_model_path)
            print(f"  --> Saved new best checkpoint: Val Acc = {best_val_acc:.2f}%")

    total_training_time = time.time() - start_time
    history["total_training_time_seconds"] = round(total_training_time, 2)
    history["best_val_acc"] = round(best_val_acc, 2)
    history["best_val_loss"] = round(best_val_loss, 4)

    # Save training history
    with open(os.path.join(MODEL_DIR, "training_history.json"), "w") as f:
        json.dump(history, f, indent=2)

    print("\n" + "=" * 70)
    print(f"✅ TRAINING COMPLETE in {total_training_time:.1f}s")
    print(f"Best Validation Accuracy: {best_val_acc:.2f}% | Best Validation Loss: {best_val_loss:.4f}")
    print(f"Saved trained weights: {best_model_path}")
    print("=" * 70)

if __name__ == "__main__":
    train_model()
