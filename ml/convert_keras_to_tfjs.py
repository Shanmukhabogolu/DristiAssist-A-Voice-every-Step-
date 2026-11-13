#!/usr/bin/env python3
"""
DrishtiAssist ML Pipeline: Keras to TensorFlow.js Model Conversion Script

Usage:
    python ml/convert_keras_to_tfjs.py --keras_path hazard_cnn.keras --output_dir public/model/

Or run via CLI:
    tensorflowjs_converter --input_format=keras hazard_cnn.keras frontend/public/model/
"""

import os
import sys
import argparse
import json

LABELS = [
    "clear_path",
    "pothole",
    "open_drain",
    "stairs",
    "pole",
    "vehicle",
    "person",
    "animal"
]

def create_hazard_cnn_model():
    """
    Defines the baseline 128x128 RGB Hazard CNN architecture:
    - Input: (128, 128, 3) normalized [0, 1]
    - Depthwise & Conv2D feature extractors
    - Dropout regularization (0.3)
    - Output: 8 classes with Softmax
    """
    try:
        import tensorflow as tf
        from tensorflow.keras import layers, models

        model = models.Sequential([
            layers.Input(shape=(128, 128, 3)),
            layers.Conv2D(16, (3, 3), activation='relu', padding='same'),
            layers.MaxPooling2D((2, 2)),
            layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
            layers.MaxPooling2D((2, 2)),
            layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(0.25),
            layers.Flatten(),
            layers.Dense(64, activation='relu'),
            layers.Dropout(0.3),
            layers.Dense(8, activation='softmax', name='hazard_output')
        ])

        model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        return model
    except ImportError:
        print("TensorFlow not installed. Please install with: pip install tensorflow tensorflowjs")
        return None

def convert_model(keras_path: str, output_dir: str):
    os.makedirs(output_dir, exist_ok=True)

    # Save labels.json in output directory
    labels_file = os.path.join(output_dir, "labels.json")
    with open(labels_file, "w", encoding="utf-8") as f:
        json.dump(LABELS, f, indent=2)
    print(f"Saved {labels_file}")

    print(f"Executing conversion command:")
    cmd = f"tensorflowjs_converter --input_format=keras --quantization_bytes=2 {keras_path} {output_dir}"
    print(f"$ {cmd}")

    ret = os.system(cmd)
    if ret == 0:
        print(f"Successfully converted {keras_path} to TF.js format in {output_dir}")
    else:
        print(f"Note: Run `pip install tensorflowjs` to convert live .keras files.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert Keras Hazard CNN to TensorFlow.js")
    parser.add_argument("--keras_path", default="hazard_cnn.keras", help="Path to input .keras model file")
    parser.add_argument("--output_dir", default="public/model", help="Path to TF.js target directory")
    args = parser.parse_args()

    convert_model(args.keras_path, args.output_dir)
