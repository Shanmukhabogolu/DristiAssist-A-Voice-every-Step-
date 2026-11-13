"""
Training pipeline CLI for DrishtiAssist Keras CNN.
Trains the four notebook variants, records metrics, selects the best variant
by validation accuracy, and generates artifacts/model_info.json.
"""
import argparse
import datetime
import json
import os
import sys
import time
from pathlib import Path
from typing import Dict, Any

import numpy as np
import tensorflow as tf
from tensorflow.keras.callbacks import (
    EarlyStopping,
    ReduceLROnPlateau,
    ModelCheckpoint,
)

from .config import (
    ARTIFACTS_DIR,
    TRAIN_DIR,
    TEST_DIR,
    COLOR_MODE,
    INPUT_SHAPE,
    BATCH_SIZE,
    DEFAULT_EPOCHS,
    VARIANTS,
    SEED,
)
from .data import generate_sample_dataset, get_data_generators, compute_class_weights
from .models import build_cnn_model
from .evaluate import evaluate_model_on_test


def train_all_variants(
    epochs: int = DEFAULT_EPOCHS,
    filter_set: str = "standard",
    quick_cpu: bool = False,
) -> Dict[str, Any]:
    """
    Executes training across all 4 notebook variants.
    """
    tf.random.set_seed(SEED)
    np.random.seed(SEED)

    # 1. Ensure dataset exists; if not, generate sample dataset matching Alzheimer 4-class taxonomy
    if not TRAIN_DIR.exists() or not any(TRAIN_DIR.iterdir()):
        print("Dataset directory empty. Generating synthetic 4-class dataset in /data/train & /data/test...")
        sample_result = generate_sample_dataset(
            train_count_per_class=120 if not quick_cpu else 40,
            test_count_per_class=30 if not quick_cpu else 15,
        )
        print("Generated sample dataset:", sample_result)

    # 2. Get data generators
    print(f"Loading data generators: target_size=(128, 128), color_mode={COLOR_MODE}, batch_size={BATCH_SIZE}")
    train_gen, val_gen, test_gen, class_indices = get_data_generators()
    class_names = list(class_indices.keys())
    num_classes = len(class_names)
    print(f"Detected {num_classes} classes: {class_names}")

    # Compute balanced class weights
    class_weights = compute_class_weights(train_gen)
    print("Computed class weights:", class_weights)

    variant_results = {}
    best_val_acc = -1.0
    best_variant_name = None
    best_model_obj = None

    effective_epochs = 15 if quick_cpu else epochs

    for variant in VARIANTS:
        print("\n" + "=" * 60)
        print(f"Training Variant: {variant.upper()} (Filters: {filter_set})")
        print("=" * 60)

        model = build_cnn_model(
            variant=variant,
            num_classes=num_classes,
            input_shape=INPUT_SHAPE,
            filter_set=filter_set,
        )
        total_params = int(model.count_params())
        trainable_params = int(np.sum([tf.keras.backend.count_params(w) for w in model.trainable_weights]))
        print(f"Model parameters: {total_params:,} total, {trainable_params:,} trainable")

        checkpoint_path = ARTIFACTS_DIR / f"{variant}_best.weights.h5"

        callbacks = [
            EarlyStopping(
                monitor="val_loss",
                patience=5 if quick_cpu else 8,
                restore_best_weights=True,
                verbose=1,
            ),
            ReduceLROnPlateau(
                monitor="val_loss",
                factor=0.5,
                patience=3,
                min_lr=1e-6,
                verbose=1,
            ),
            ModelCheckpoint(
                filepath=str(checkpoint_path),
                monitor="val_accuracy",
                save_best_only=True,
                save_weights_only=True,
                verbose=0,
            ),
        ]

        start_time = time.time()
        train_gen.reset()
        val_gen.reset()

        history = model.fit(
            train_gen,
            validation_data=val_gen,
            epochs=effective_epochs,
            class_weight=class_weights,
            callbacks=callbacks,
            verbose=1,
        )
        training_duration = round(time.time() - start_time, 2)

        # Save model file
        model_save_path = ARTIFACTS_DIR / f"{variant}.keras"
        model.save(model_save_path)

        # Save training history curves
        history_dict = {k: [float(v) for v in vals] for k, vals in history.history.items()}
        with open(ARTIFACTS_DIR / f"{variant}_history.json", "w") as f:
            json.dump(history_dict, f, indent=2)

        # Evaluate on test set
        print(f"\nEvaluating {variant} on test set...")
        eval_metrics = evaluate_model_on_test(model, test_gen, class_names)
        print(f"Test Accuracy: {eval_metrics['test_accuracy'] * 100:.2f}% | Test Loss: {eval_metrics['test_loss']:.4f}")

        final_val_acc = float(max(history.history.get("val_accuracy", [0.0])))

        variant_summary = {
            "variant": variant,
            "total_params": total_params,
            "trainable_params": trainable_params,
            "training_time_seconds": training_duration,
            "epochs_trained": len(history.history["loss"]),
            "best_val_accuracy": round(final_val_acc, 4),
            "test_accuracy": eval_metrics["test_accuracy"],
            "test_loss": eval_metrics["test_loss"],
            "macro_f1": eval_metrics["macro_avg"]["f1_score"],
            "per_class_metrics": eval_metrics["per_class_metrics"],
            "confusion_matrix": eval_metrics["confusion_matrix"],
            "history": history_dict,
        }

        variant_results[variant] = variant_summary

        with open(ARTIFACTS_DIR / f"{variant}_metrics.json", "w") as f:
            json.dump(variant_summary, f, indent=2)

        if final_val_acc > best_val_acc:
            best_val_acc = final_val_acc
            best_variant_name = variant
            best_model_obj = model

    print("\n" + "=" * 60)
    print(f"Selection Result: Best Variant by Validation Accuracy is '{best_variant_name}' ({best_val_acc * 100:.2f}%)")
    print("=" * 60)

    # Save best model to artifacts/best_model.keras
    best_model_path = ARTIFACTS_DIR / "best_model.keras"
    best_model_obj.save(best_model_path)

    # Also mirror to backend/artifacts
    backend_art_dir = Path(__file__).resolve().parent.parent / "backend" / "artifacts"
    backend_art_dir.mkdir(parents=True, exist_ok=True)
    best_model_obj.save(backend_art_dir / "best_model.keras")

    best_variant_data = variant_results[best_variant_name]

    # Write master model_info.json
    dataset_counts = {
        "train_samples": int(train_gen.samples),
        "val_samples": int(val_gen.samples),
        "test_samples": int(test_gen.samples),
        "num_classes": num_classes,
        "classes": class_names,
    }

    model_info = {
        "model_name": "DrishtiAssist-Keras-CNN",
        "best_variant": best_variant_name,
        "input_shape": list(INPUT_SHAPE),
        "color_mode": COLOR_MODE,
        "num_classes": num_classes,
        "class_names": class_names,
        "test_accuracy": best_variant_data["test_accuracy"],
        "test_loss": best_variant_data["test_loss"],
        "total_parameters": best_variant_data["total_params"],
        "trainable_parameters": best_variant_data["trainable_params"],
        "per_class_metrics": best_variant_data["per_class_metrics"],
        "confusion_matrix": best_variant_data["confusion_matrix"],
        "trained_date": datetime.datetime.utcnow().isoformat() + "Z",
        "tensorflow_version": tf.__version__,
        "dataset_counts": dataset_counts,
        "variants_comparison": {
            v: {
                "val_accuracy": data["best_val_accuracy"],
                "test_accuracy": data["test_accuracy"],
                "test_loss": data["test_loss"],
                "macro_f1": data["macro_f1"],
                "params": data["total_params"],
                "training_time": data["training_time_seconds"],
            }
            for v, data in variant_results.items()
        },
    }

    with open(ARTIFACTS_DIR / "model_info.json", "w") as f:
        json.dump(model_info, f, indent=2)

    with open(backend_art_dir / "model_info.json", "w") as f:
        json.dump(model_info, f, indent=2)

    # Write all variants metrics together for frontend /api/metrics
    with open(ARTIFACTS_DIR / "all_variants_metrics.json", "w") as f:
        json.dump(variant_results, f, indent=2)
    with open(backend_art_dir / "all_variants_metrics.json", "w") as f:
        json.dump(variant_results, f, indent=2)

    return model_info


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train DrishtiAssist CNN variants")
    parser.add_argument("--epochs", type=int, default=DEFAULT_EPOCHS, help="Number of training epochs")
    parser.add_argument("--filter-set", type=str, default="standard", choices=["standard", "lite"])
    parser.add_argument("--quick-cpu", action="store_true", help="Fast training profile on CPU")
    args = parser.parse_args()

    info = train_all_variants(
        epochs=args.epochs,
        filter_set=args.filter_set,
        quick_cpu=args.quick_cpu,
    )
    print("\nTraining completed successfully.")
    print("Master Model Info:", json.dumps(info, indent=2))
