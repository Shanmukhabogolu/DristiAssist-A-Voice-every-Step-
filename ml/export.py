"""
Export utility for DrishtiAssist Keras CNN.
Converts best_model.keras into TensorFlow Lite (.tflite) with dynamic range quantization.
"""
import os
from pathlib import Path
import tensorflow as tf

from .config import ARTIFACTS_DIR


def export_to_tflite(
    model_path: Path = ARTIFACTS_DIR / "best_model.keras",
    output_path: Path = ARTIFACTS_DIR / "model.tflite",
    quantize: bool = True,
) -> Path:
    """
    Exports a trained Keras model to TensorFlow Lite format.
    """
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found at {model_path}")

    print(f"Loading Keras model from {model_path}...")
    model = tf.keras.models.load_model(str(model_path))

    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    if quantize:
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        print("Applied dynamic range quantization optimization.")

    tflite_model = converter.convert()

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(tflite_model)

    size_mb = output_path.stat().st_size / (1024 * 1024)
    print(f"Successfully exported TFLite model to {output_path} ({size_mb:.2f} MB)")
    return output_path


if __name__ == "__main__":
    export_to_tflite()
