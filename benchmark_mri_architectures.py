"""
Benchmark Deep Architectures for Sports MSK & MRI Classification:
Compares DenseNet-121, ResNet-50, and EfficientNet-B0 on sports joint dataset.
"""
import os
import time
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from torchvision.models import densenet121, DenseNet121_Weights, resnet50, ResNet50_Weights, efficientnet_b0, EfficientNet_B0_Weights
from sklearn.metrics import accuracy_score, precision_recall_fscore_support

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "dataset", "processed", "mri_training")
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def get_loaders(img_size=224):
    tf_train = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomRotation(degrees=10),
        transforms.ColorJitter(brightness=0.15, contrast=0.15),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    tf_val = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    # Filter only knee and extremity sports data (clean sports cohort)
    ds_train = datasets.ImageFolder(os.path.join(DATA_DIR, "train"), transform=tf_train)
    ds_val = datasets.ImageFolder(os.path.join(DATA_DIR, "val"), transform=tf_val)
    
    # Keep only non-spine sports joint images
    train_indices = [i for i, (p, _) in enumerate(ds_train.samples) if not os.path.basename(p).startswith('spine')]
    val_indices = [i for i, (p, _) in enumerate(ds_val.samples) if not os.path.basename(p).startswith('spine')]
    
    sub_train = torch.utils.data.Subset(ds_train, train_indices)
    sub_val = torch.utils.data.Subset(ds_val, val_indices)
    
    loader_train = DataLoader(sub_train, batch_size=16, shuffle=True, num_workers=0)
    loader_val = DataLoader(sub_val, batch_size=16, shuffle=False, num_workers=0)
    
    return loader_train, loader_val, ds_train.classes

def evaluate_model(model_name, epochs=8):
    train_loader, val_loader, classes = get_loaders()
    num_classes = len(classes)
    
    if model_name == "DenseNet121":
        model = densenet121(weights=DenseNet121_Weights.IMAGENET1K_V1)
        in_f = model.classifier.in_features
        model.classifier = nn.Sequential(nn.Dropout(0.3), nn.Linear(in_f, num_classes))
    elif model_name == "ResNet50":
        model = resnet50(weights=ResNet50_Weights.IMAGENET1K_V2)
        in_f = model.fc.in_features
        model.fc = nn.Sequential(nn.Dropout(0.3), nn.Linear(in_f, num_classes))
    else:
        model = efficientnet_b0(weights=EfficientNet_B0_Weights.IMAGENET1K_V1)
        in_f = model.classifier[1].in_features
        model.classifier = nn.Sequential(nn.Dropout(0.3), nn.Linear(in_f, num_classes))
        
    model.to(DEVICE)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=1e-4, weight_decay=1e-2)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)
    
    best_acc = 0.0
    best_f1 = 0.0
    t0 = time.time()
    
    for ep in range(1, epochs + 1):
        model.train()
        for x, y in train_loader:
            x, y = x.to(DEVICE), y.to(DEVICE)
            optimizer.zero_grad()
            out = model(x)
            loss = criterion(out, y)
            loss.backward()
            optimizer.step()
        scheduler.step()
        
        # Val
        model.eval()
        preds, targets = [], []
        with torch.no_grad():
            for x, y in val_loader:
                x, y = x.to(DEVICE), y.to(DEVICE)
                p = model(x).argmax(1)
                preds.extend(p.cpu().numpy())
                targets.extend(y.cpu().numpy())
                
        acc = accuracy_score(targets, preds)
        _, _, f1, _ = precision_recall_fscore_support(targets, preds, average='macro', zero_division=0)
        if acc > best_acc:
            best_acc = acc
            best_f1 = f1
            
    elapsed = round(time.time() - t0, 1)
    print(f"[{model_name}] ({elapsed}s) -> Best Accuracy: {best_acc*100:.2f}%, Macro-F1: {best_f1*100:.2f}%")
    return best_acc, best_f1, model

if __name__ == '__main__':
    print(f"Evaluating architectures on {DEVICE}...")
    for m in ["EfficientNet-B0", "DenseNet121", "ResNet50"]:
        evaluate_model(m, epochs=7)
