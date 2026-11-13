"""
Evaluation and Explainability module for DrishtiAssist Keras CNN.
Computes test metrics, confusion matrix, per-class precision/recall, and Grad-CAM overlays.
"""
import base64
import io
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np
from PIL import Image

import tensorflow as tf
from tensorflow.keras.models import Model

from .config import ARTIFACTS_DIR, IMG_SIZE, COLOR_MODE


def evaluate_model_on_test(
    model: tf.keras.Model,
    test_generator,
    class_names: List[str],
) -> Dict[str, Any]:
    """
    Evaluates a trained model on the test dataset, computing confusion matrix,
    per-class precision/recall/F1, and overall accuracy.
    """
    test_generator.reset()
    loss, accuracy = model.evaluate(test_generator, verbose=0)

    test_generator.reset()
    y_pred_probs = model.predict(test_generator, verbose=0)
    y_pred = np.argmax(y_pred_probs, axis=1)
    y_true = test_generator.classes

    num_classes = len(class_names)
    cm = np.zeros((num_classes, num_classes), dtype=int)
    for t, p in zip(y_true, y_pred):
        cm[t, p] += 1

    per_class = {}
    for i, name in enumerate(class_names):
        tp = cm[i, i]
        fp = cm[:, i].sum() - tp
        fn = cm[i, :].sum() - tp
        support = int(cm[i, :].sum())

        precision = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
        recall = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
        f1 = float(2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0

        per_class[name] = {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "support": support,
        }

    macro_precision = float(np.mean([m["precision"] for m in per_class.values()]))
    macro_recall = float(np.mean([m["recall"] for m in per_class.values()]))
    macro_f1 = float(np.mean([m["f1_score"] for m in per_class.values()]))

    results = {
        "test_loss": round(float(loss), 4),
        "test_accuracy": round(float(accuracy), 4),
        "confusion_matrix": cm.tolist(),
        "class_names": class_names,
        "per_class_metrics": per_class,
        "macro_avg": {
            "precision": round(macro_precision, 4),
            "recall": round(macro_recall, 4),
            "f1_score": round(macro_f1, 4),
        },
        "total_test_samples": int(len(y_true)),
    }

    # Generate and save confusion matrix visual image (using PIL to guarantee zero external failure)
    save_confusion_matrix_image(cm, class_names, ARTIFACTS_DIR / "confusion_matrix.png")

    return results


def save_confusion_matrix_image(cm: np.ndarray, class_names: List[str], output_path: Path):
    """
    Renders an accessible heatmap confusion matrix using PIL and saves as PNG.
    """
    from PIL import ImageDraw, ImageFont

    cell_size = 90
    n = len(class_names)
    margin_left = 130
    margin_top = 80
    width = margin_left + n * cell_size + 40
    height = margin_top + n * cell_size + 60

    img = Image.new("RGB", (width, height), color=(250, 248, 245))
    draw = ImageDraw.Draw(img)

    max_val = max(1, cm.max())

    # Title
    draw.text((margin_left, 20), "Test Confusion Matrix", fill=(30, 30, 30))

    # Column headers (Predicted)
    draw.text((margin_left + (n * cell_size) // 3, 45), "Predicted Class", fill=(80, 80, 80))
    for j, name in enumerate(class_names):
        short_name = name[:9]
        draw.text((margin_left + j * cell_size + 10, 62), short_name, fill=(50, 50, 50))

    # Rows (Actual)
    for i, name in enumerate(class_names):
        short_name = name[:12]
        draw.text((15, margin_top + i * cell_size + 35), short_name, fill=(50, 50, 50))
        for j in range(n):
            val = cm[i, j]
            # Heat color (higher = deeper cobalt)
            intensity = val / max_val
            r = int(240 - intensity * 200)
            g = int(245 - intensity * 160)
            b = int(255 - intensity * 40)
            text_color = (255, 255, 255) if intensity > 0.55 else (30, 30, 30)

            x0 = margin_left + j * cell_size
            y0 = margin_top + i * cell_size
            x1 = x0 + cell_size
            y1 = y0 + cell_size

            draw.rectangle([x0, y0, x1, y1], fill=(r, g, b), outline=(210, 205, 195))
            draw.text((x0 + 35, y0 + 35), str(val), fill=text_color)

    img.save(output_path, "PNG")


def compute_gradcam(
    model: tf.keras.Model,
    img_array: np.ndarray,
    target_class_idx: Optional[int] = None,
    last_conv_layer_name: Optional[str] = None,
) -> np.ndarray:
    """
    Computes Grad-CAM (Gradient-weighted Class Activation Mapping) for an input image.

    Args:
        model: Trained Keras model
        img_array: Preprocessed image batch array (1, 128, 128, channels) normalized [0, 1]
        target_class_idx: Class index to explain (defaults to model's top prediction)
        last_conv_layer_name: Name of the last convolutional layer

    Returns:
        heatmap: 2D numpy array (128, 128) with values in range [0, 1]
    """
    if last_conv_layer_name is None:
        # Find the last Conv2D layer in the model
        for layer in reversed(model.layers):
            if isinstance(layer, tf.keras.layers.Conv2D):
                last_conv_layer_name = layer.name
                break

    if last_conv_layer_name is None:
        raise ValueError("Could not find any Conv2D layer in the model for Grad-CAM.")

    # Create a sub-model that outputs both the last conv activations and final predictions
    grad_model = Model(
        inputs=model.inputs,
        outputs=[model.get_layer(last_conv_layer_name).output, model.output],
    )

    with tf.GradientTape() as tape:
        conv_outputs, predictions = grad_model(img_array)
        if target_class_idx is None:
            target_class_idx = tf.argmax(predictions[0])
        loss = predictions[:, target_class_idx]

    # Compute gradients of top predicted class with respect to the output feature map
    grads = tape.gradient(loss, conv_outputs)

    # Global average pooling of gradients along spatial dimensions (height, width)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    # Weighted combination of feature maps
    conv_outputs = conv_outputs[0]
    heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)

    # Apply ReLU to keep only features that positively correlate with the class
    heatmap = tf.maximum(heatmap, 0) / (tf.math.reduce_max(heatmap) + 1e-10)
    return heatmap.numpy()


def generate_gradcam_overlay_base64(
    original_pil: Image.Image,
    heatmap: np.ndarray,
    alpha: float = 0.45,
) -> str:
    """
    Overlays a Grad-CAM heatmap on top of the original PIL image using a warm colormap,
    returning a base64 encoded PNG data URI.
    """
    # Resize heatmap to match image size
    heatmap_img = Image.fromarray(np.uint8(255 * heatmap)).resize(original_pil.size, Image.BILINEAR)
    heatmap_arr = np.array(heatmap_img) / 255.0

    # Custom Jet / Turbo-like medical colormap: blue -> cyan -> yellow -> red
    color_map = np.zeros((*heatmap_arr.shape, 3), dtype=np.uint8)
    h = heatmap_arr
    color_map[..., 0] = np.uint8(np.clip(255 * (1.5 * h - 0.5), 0, 255))  # Red
    color_map[..., 1] = np.uint8(np.clip(255 * (1.5 - 2 * np.abs(h - 0.5)), 0, 255))  # Green
    color_map[..., 2] = np.uint8(np.clip(255 * (1.5 - 2 * h), 0, 255))  # Blue

    color_heatmap = Image.fromarray(color_map).convert("RGBA")
    base_rgba = original_pil.convert("RGBA")

    # Blend overlay
    overlay = Image.blend(base_rgba, color_heatmap, alpha=alpha)

    buffered = io.BytesIO()
    overlay.save(buffered, format="PNG")
    b64_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64_str}"
