"""
Data preparation, augmentation, and generator pipelines reproducing
ImageDataGenerator configurations from Copy_of_CNN_Model_Building_1.ipynb.
Supports dynamic class detection and automatic sample generation.
"""
import json
import os
import shutil
from pathlib import Path
from typing import Tuple, Dict, Any
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator

from .config import (
    TRAIN_DIR,
    TEST_DIR,
    ARTIFACTS_DIR,
    IMG_SIZE,
    COLOR_MODE,
    BATCH_SIZE,
    VAL_SPLIT,
    SEED,
)

ALZHEIMER_CLASSES = [
    "MildDemented",
    "ModerateDemented",
    "NonDemented",
    "VeryMildDemented",
]


def generate_sample_dataset(
    train_count_per_class: int = 100,
    test_count_per_class: int = 25,
    overwrite: bool = False,
) -> Dict[str, Any]:
    """
    Generates synthetic MRI brain slice dataset in /data/train and /data/test
    structured under the Alzheimer 4-class taxonomy, formatted in 128x128 RGB.
    """
    if TRAIN_DIR.exists() and any(TRAIN_DIR.iterdir()) and not overwrite:
        # Check if already populated
        classes = sorted([d.name for d in TRAIN_DIR.iterdir() if d.is_dir()])
        if len(classes) >= 2:
            return {"status": "existing", "classes": classes}

    TRAIN_DIR.mkdir(parents=True, exist_ok=True)
    TEST_DIR.mkdir(parents=True, exist_ok=True)

    np.random.seed(SEED)

    # Class-specific feature parameters (atrophy levels, ventricular enlargement)
    class_specs = {
        "NonDemented": {"ventricle_size": 14, "cortex_shrink": 0, "noise": 0.05, "hue": (180, 195, 205)},
        "VeryMildDemented": {"ventricle_size": 20, "cortex_shrink": 2, "noise": 0.08, "hue": (175, 185, 195)},
        "MildDemented": {"ventricle_size": 28, "cortex_shrink": 5, "noise": 0.12, "hue": (165, 175, 185)},
        "ModerateDemented": {"ventricle_size": 38, "cortex_shrink": 9, "noise": 0.18, "hue": (155, 160, 175)},
    }

    counts = {"train": {}, "test": {}}

    for split, count in [("train", train_count_per_class), ("test", test_count_per_class)]:
        split_dir = TRAIN_DIR if split == "train" else TEST_DIR
        for cls_name, spec in class_specs.items():
            cls_dir = split_dir / cls_name
            cls_dir.mkdir(parents=True, exist_ok=True)
            counts[split][cls_name] = count

            for idx in range(count):
                # Synthesize 128x128 axial brain MRI slice
                img = Image.new("RGB", (IMG_SIZE, IMG_SIZE), color=(10, 12, 16))
                draw = ImageDraw.Draw(img)

                # Outer skull / cranium ellipse
                cx, cy = 64, 64
                rx = 48 - spec["cortex_shrink"] + np.random.randint(-2, 3)
                ry = 54 - spec["cortex_shrink"] + np.random.randint(-2, 3)
                skull_color = (
                    int(spec["hue"][0] * 0.8),
                    int(spec["hue"][1] * 0.8),
                    int(spec["hue"][2] * 0.8),
                )
                draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=skull_color, outline=(230, 235, 240))

                # Cerebral cortex tissue folds
                for r in range(rx - 8, 15, -6):
                    cortex_color = (
                        int(spec["hue"][0] * (0.4 + 0.5 * (r / rx))),
                        int(spec["hue"][1] * (0.4 + 0.5 * (r / rx))),
                        int(spec["hue"][2] * (0.4 + 0.5 * (r / rx))),
                    )
                    draw.ellipse([cx - r, cy - int(r * 1.1), cx + r, cy + int(r * 1.1)], fill=cortex_color)

                # Lateral ventricles (enlarge as dementia progresses)
                v_size = spec["ventricle_size"] + np.random.randint(-2, 3)
                v_gap = 4
                # Left ventricle
                draw.ellipse([cx - v_gap - v_size // 2, cy - v_size, cx - v_gap, cy + v_size // 2], fill=(12, 14, 20))
                # Right ventricle
                draw.ellipse([cx + v_gap, cy - v_size, cx + v_gap + v_size // 2, cy + v_size // 2], fill=(12, 14, 20))

                # Add MRI Gaussian slice blur and sensor noise
                img = img.filter(ImageFilter.GaussianBlur(radius=0.7))

                # Save as RGB JPEG
                file_path = cls_dir / f"slice_{idx:04d}.jpg"
                img.save(file_path, "JPEG", quality=92)

    return {"status": "generated", "counts": counts}


def get_data_generators() -> Tuple[Any, Any, Any, Dict[str, int]]:
    """
    Constructs train, validation, and test ImageDataGenerators using the exact
    hyperparameters specified in Copy_of_CNN_Model_Building_1.ipynb.

    Returns:
        (train_generator, val_generator, test_generator, class_indices)
    """
    # 1. Training generator with exact notebook data augmentation
    train_datagen = ImageDataGenerator(
        rescale=1.0 / 255.0,
        shear_range=0.4,
        zoom_range=0.2,
        width_shift_range=0.2,
        height_shift_range=0.2,
        rotation_range=90,
        horizontal_flip=True,
        fill_mode="nearest",
        validation_split=VAL_SPLIT,
    )

    # 2. Validation generator (rescaling only, same split)
    val_datagen = ImageDataGenerator(
        rescale=1.0 / 255.0,
        validation_split=VAL_SPLIT,
    )

    # 3. Test generator (rescaling only)
    test_datagen = ImageDataGenerator(rescale=1.0 / 255.0)

    train_generator = train_datagen.flow_from_directory(
        directory=str(TRAIN_DIR),
        target_size=(IMG_SIZE, IMG_SIZE),
        color_mode=COLOR_MODE,
        class_mode="categorical",
        batch_size=BATCH_SIZE,
        subset="training",
        shuffle=True,
        seed=SEED,
    )

    val_generator = val_datagen.flow_from_directory(
        directory=str(TRAIN_DIR),
        target_size=(IMG_SIZE, IMG_SIZE),
        color_mode=COLOR_MODE,
        class_mode="categorical",
        batch_size=BATCH_SIZE,
        subset="validation",
        shuffle=False,
        seed=SEED,
    )

    test_generator = test_datagen.flow_from_directory(
        directory=str(TEST_DIR),
        target_size=(IMG_SIZE, IMG_SIZE),
        color_mode=COLOR_MODE,
        class_mode="categorical",
        batch_size=BATCH_SIZE,
        shuffle=False,
        seed=SEED,
    )

    # Save class_indices.json to artifacts directory and backend
    class_indices = train_generator.class_indices
    with open(ARTIFACTS_DIR / "class_indices.json", "w") as f:
        json.dump(class_indices, f, indent=2)

    backend_indices = Path(__file__).resolve().parent.parent / "backend" / "class_indices.json"
    with open(backend_indices, "w") as f:
        json.dump(class_indices, f, indent=2)

    return train_generator, val_generator, test_generator, class_indices


def compute_class_weights(train_generator) -> Dict[int, float]:
    """
    Computes balanced class weights automatically to counteract dataset imbalance.
    """
    classes = train_generator.classes
    num_classes = len(train_generator.class_indices)
    class_counts = np.bincount(classes, minlength=num_classes)
    total_samples = len(classes)

    class_weights = {}
    for idx, count in enumerate(class_counts):
        if count > 0:
            class_weights[idx] = float(total_samples / (num_classes * count))
        else:
            class_weights[idx] = 1.0

    return class_weights
