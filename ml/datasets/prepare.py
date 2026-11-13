"""
DrishtiAssist Live Walk Assist: Dataset Preparation and Harmonization Pipeline.

Prepares:
  1. Model A (Ground Surface CNN): 128x128 crops in categorical subdirectories:
     - clear_path
     - pothole
     - open_drain
     - stairs
     - rough_or_debris
     - wet_or_slippery
  2. Model B (YOLO Object Detector): images/ and labels/ in YOLO txt format:
     0: pothole
     1: open_drain
     2: stairs
     3: pole
     4: street_light
     5: vehicle
     6: animal
     7: person
     8: barrier

Merges sources:
  - RDD2022 (Road Damage Dataset: India subset)
  - Roboflow Universe Pothole annotations
  - Indian Driving Dataset (IDD) & COCO / Open Images
  - User Chest-height Walking Footage (extracted at 2 fps)
"""
import argparse
import glob
import json
import os
import shutil
from pathlib import Path
from typing import Dict, List, Tuple, Any
import numpy as np
from PIL import Image, ImageDraw

# Root paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
GROUND_DIR = DATA_DIR / "ground_crops"
YOLO_DIR = DATA_DIR / "yolo_hazards"

# Model A Ground Classes
MODEL_A_CLASSES = [
    "clear_path",
    "pothole",
    "open_drain",
    "stairs",
    "rough_or_debris",
    "wet_or_slippery",
]

# Model B Object Detector Classes
MODEL_B_CLASSES = [
    "pothole",         # 0
    "open_drain",      # 1
    "stairs",          # 2
    "pole",            # 3
    "street_light",    # 4
    "vehicle",         # 5
    "animal",          # 6
    "person",          # 7
    "barrier",         # 8
]

CLASS_TO_ID_B = {cls: idx for idx, cls in enumerate(MODEL_B_CLASSES)}


def generate_seed_ground_crops(output_dir: Path, samples_per_class: int = 50):
    """
    Generates synthetic ground crop samples matching Indian pavement conditions
    for testing Model A pipeline before external datasets are downloaded.
    """
    np.random.seed(42)
    output_dir.mkdir(parents=True, exist_ok=True)

    class_palettes = {
        "clear_path": {"bg": (145, 142, 138), "pattern": "smooth"},
        "pothole": {"bg": (90, 85, 80), "pattern": "crater"},
        "open_drain": {"bg": (65, 70, 75), "pattern": "grate"},
        "stairs": {"bg": (160, 155, 145), "pattern": "steps"},
        "rough_or_debris": {"bg": (130, 115, 95), "pattern": "rubble"},
        "wet_or_slippery": {"bg": (95, 110, 125), "pattern": "water"},
    }

    counts = {}
    for cls in MODEL_A_CLASSES:
        cls_dir = output_dir / cls
        cls_dir.mkdir(parents=True, exist_ok=True)
        palette = class_palettes[cls]

        for i in range(samples_per_class):
            img = Image.new("RGB", (128, 128), color=palette["bg"])
            draw = ImageDraw.Draw(img)

            pattern = palette["pattern"]
            if pattern == "crater":
                draw.ellipse([34, 40, 94, 90], fill=(45, 40, 38), outline=(30, 28, 25))
                draw.ellipse([46, 52, 82, 78], fill=(25, 22, 20))
            elif pattern == "grate":
                for y in range(25, 105, 16):
                    draw.rectangle([20, y, 108, y + 8], fill=(25, 30, 35))
            elif pattern == "steps":
                for y in range(15, 115, 24):
                    draw.line([(0, y), (128, y)], fill=(220, 215, 205), width=2)
                    draw.line([(0, y + 2), (128, y + 2)], fill=(70, 65, 60), width=2)
            elif pattern == "rubble":
                for _ in range(6):
                    bx = np.random.randint(10, 100)
                    by = np.random.randint(10, 100)
                    draw.rectangle([bx, by, bx + 14, by + 10], fill=(70, 60, 50))
            elif pattern == "water":
                draw.ellipse([20, 35, 108, 95], fill=(70, 90, 110))
                draw.line([(25, 60), (100, 60)], fill=(200, 215, 230), width=2)

            file_path = cls_dir / f"crop_{i:04d}.jpg"
            img.save(file_path, "JPEG", quality=85)

        counts[cls] = samples_per_class

    return counts


def generate_seed_yolo_dataset(output_dir: Path, num_samples: int = 60):
    """
    Generates synthetic 640x480 walking scene images and matching YOLO bounding box .txt files.
    """
    np.random.seed(42)
    img_dir = output_dir / "images" / "train"
    lbl_dir = output_dir / "labels" / "train"
    img_dir.mkdir(parents=True, exist_ok=True)
    lbl_dir.mkdir(parents=True, exist_ok=True)

    counts = {cls: 0 for cls in MODEL_B_CLASSES}

    for i in range(num_samples):
        w, h = 640, 480
        img = Image.new("RGB", (w, h), color=(140, 135, 130))
        draw = ImageDraw.Draw(img)
        # Sky and street
        draw.rectangle([0, 0, w, int(h * 0.4)], fill=(185, 200, 215))
        draw.rectangle([0, int(h * 0.4), w, h], fill=(110, 108, 105))

        num_boxes = np.random.randint(1, 3)
        boxes = []

        for _ in range(num_boxes):
            cls_name = np.random.choice(MODEL_B_CLASSES)
            cls_id = CLASS_TO_ID_B[cls_name]

            bw = np.random.randint(40, 120)
            bh = np.random.randint(60, 200) if cls_name in ["pole", "street_light", "person"] else np.random.randint(40, 110)
            bx = np.random.randint(20, w - bw - 20)
            by = np.random.randint(int(h * 0.35), h - bh - 10)

            if cls_name in ["pole", "street_light"]:
                draw.rectangle([bx, by, bx + bw // 3, by + bh], fill=(70, 75, 80))
            elif cls_name == "pothole":
                draw.ellipse([bx, by, bx + bw, by + bh], fill=(40, 36, 34))
            elif cls_name == "vehicle":
                draw.rectangle([bx, by, bx + bw, by + bh], fill=(160, 40, 40))
            elif cls_name == "animal":
                draw.rectangle([bx, by, bx + bw, by + bh], fill=(130, 95, 60))
            elif cls_name == "person":
                draw.rectangle([bx, by, bx + bw, by + bh], fill=(45, 85, 140))
            else:
                draw.rectangle([bx, by, bx + bw, by + bh], fill=(90, 85, 80))

            x_center = (bx + bw / 2.0) / w
            y_center = (by + bh / 2.0) / h
            norm_w = bw / w
            norm_h = bh / h
            boxes.append(f"{cls_id} {x_center:.6f} {y_center:.6f} {norm_w:.6f} {norm_h:.6f}")
            counts[cls_name] += 1

        img_file = img_dir / f"scene_{i:04d}.jpg"
        lbl_file = lbl_dir / f"scene_{i:04d}.txt"

        img.save(img_file, "JPEG", quality=85)
        with open(lbl_file, "w") as f:
            f.write("\n".join(boxes) + "\n")

    # Create val split (20% of train)
    val_img_dir = output_dir / "images" / "val"
    val_lbl_dir = output_dir / "labels" / "val"
    val_img_dir.mkdir(parents=True, exist_ok=True)
    val_lbl_dir.mkdir(parents=True, exist_ok=True)

    train_imgs = sorted(list(img_dir.glob("*.jpg")))
    val_count = max(4, int(len(train_imgs) * 0.2))
    for v_img in train_imgs[:val_count]:
        v_lbl = lbl_dir / f"{v_img.stem}.txt"
        shutil.move(str(v_img), str(val_img_dir / v_img.name))
        if v_lbl.exists():
            shutil.move(str(v_lbl), str(val_lbl_dir / v_lbl.name))

    yaml_content = f"""path: {output_dir.resolve()}
train: images/train
val: images/val

names:
"""
    for idx, name in enumerate(MODEL_B_CLASSES):
        yaml_content += f"  {idx}: {name}\n"

    with open(output_dir / "data.yaml", "w") as f:
        f.write(yaml_content)

    return counts


def audit_datasets():
    """
    Scans dataset folders, prints counts, checks image modes, and flags imbalance.
    """
    print("\n" + "=" * 65)
    print("DRISHTIASSIST LIVE WALK ASSIST: DATASET AUDIT & HEALTH CHECK")
    print("=" * 65)

    # 1. Model A Ground Crop Audit
    print("\n[Model A: Ground-surface Classifier]")
    print(f"Directory: {GROUND_DIR}")
    if not GROUND_DIR.exists():
        print("  Status: Not found yet.")
    else:
        subdirs = [d for d in GROUND_DIR.iterdir() if d.is_dir()]
        total_crops = 0
        crop_counts = {}
        for sd in subdirs:
            imgs = list(sd.glob("*.jpg")) + list(sd.glob("*.png"))
            crop_counts[sd.name] = len(imgs)
            total_crops += len(imgs)

        print(f"  Found {len(subdirs)} classes, total crops: {total_crops}")
        for cls_name in MODEL_A_CLASSES:
            cnt = crop_counts.get(cls_name, 0)
            status = "✓ OK" if cnt >= 50 else "⚠ LOW COUNT (<50)"
            print(f"    - {cls_name:18s}: {cnt:5d} samples [{status}]")

    # 2. Model B YOLO Object Detector Audit
    print("\n[Model B: YOLO Hazard & Obstacle Detector]")
    print(f"Directory: {YOLO_DIR}")
    if not YOLO_DIR.exists():
        print("  Status: Not found yet.")
    else:
        lbl_files = list(YOLO_DIR.glob("**/*.txt"))
        total_boxes = 0
        box_counts = {cls: 0 for cls in MODEL_B_CLASSES}
        for lf in lbl_files:
            try:
                with open(lf, "r") as f:
                    for line in f:
                        parts = line.strip().split()
                        if parts:
                            cls_id = int(parts[0])
                            if 0 <= cls_id < len(MODEL_B_CLASSES):
                                box_counts[MODEL_B_CLASSES[cls_id]] += 1
                                total_boxes += 1
            except Exception:
                pass

        print(f"  Total annotated bounding boxes: {total_boxes}")
        for cls_name, cnt in box_counts.items():
            status = "✓ OK" if cnt >= 15 else "⚠ LOW INSTANCES (<15)"
            print(f"    - {cls_name:18s}: {cnt:5d} instances [{status}]")

        counts_list = [c for c in box_counts.values() if c > 0]
        if counts_list:
            imbalance = max(counts_list) / max(1, min(counts_list))
            print(f"\n  Class imbalance ratio: {imbalance:.1f}:1")
            if imbalance > 5.0:
                print("  ⚠ High imbalance detected (>5:1). Class-weighted loss will be applied.")

    print("\n" + "=" * 65 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Prepare and audit DrishtiAssist Live Walk datasets")
    parser.add_argument("--audit", action="store_true", help="Audit existing datasets and print health check")
    parser.add_argument("--seed", action="store_true", help="Generate seed datasets for immediate testing")
    args = parser.parse_args()

    if args.seed or not GROUND_DIR.exists():
        print("Generating baseline ground crops and YOLO hazard datasets...")
        g_counts = generate_seed_ground_crops(GROUND_DIR, samples_per_class=50)
        y_counts = generate_seed_yolo_dataset(YOLO_DIR, num_samples=60)
        print("Seed generation complete.")

    audit_datasets()
