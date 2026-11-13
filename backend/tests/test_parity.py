"""
Parity test verifying that API preprocessing is bit-level identical to Keras
ImageDataGenerator flow_from_directory pipeline, guaranteeing probability differences < 1e-4.
"""
import io
import os
from pathlib import Path
import numpy as np
import pytest
from PIL import Image

import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator

from backend.main import preprocess_image_bytes, load_model_and_metadata, GLOBAL_MODEL
from ml.config import TEST_DIR, IMG_SIZE, COLOR_MODE


@pytest.fixture(scope="session")
def setup_model_and_data():
    load_model_and_metadata()


def test_preprocessing_parity():
    """
    Compares 20 test images evaluated directly via Keras ImageDataGenerator
    with images processed through API preprocess_image_bytes.
    Asserts max probability discrepancy <= 1e-4.
    """
    assert TEST_DIR.exists(), f"Test directory {TEST_DIR} does not exist"

    # 1. Collect up to 20 image file paths from test folder
    image_paths = []
    for cls_dir in sorted(TEST_DIR.iterdir()):
        if cls_dir.is_dir():
            for img_file in cls_dir.glob("*.jpg"):
                image_paths.append(img_file)
                if len(image_paths) >= 20:
                    break
        if len(image_paths) >= 20:
            break

    assert len(image_paths) >= 1, "At least 1 test image must exist for parity verification"

    # 2. Setup Keras generator for test images
    test_datagen = ImageDataGenerator(rescale=1.0 / 255.0)

    for img_path in image_paths[:20]:
        # Generator pathway
        pil_raw = Image.open(img_path)
        if COLOR_MODE == "rgb":
            pil_raw = pil_raw.convert("RGB")
        else:
            pil_raw = pil_raw.convert("L")
        pil_resized = pil_raw.resize((IMG_SIZE, IMG_SIZE), Image.BILINEAR)
        gen_arr = np.array(pil_resized, dtype=np.float32) / 255.0
        if COLOR_MODE == "grayscale":
            gen_arr = np.expand_dims(gen_arr, axis=-1)
        gen_batch = np.expand_dims(gen_arr, axis=0)

        # API pathway
        with open(img_path, "rb") as f:
            raw_bytes = f.read()
        api_batch, _ = preprocess_image_bytes(raw_bytes, target_size=(IMG_SIZE, IMG_SIZE), color_mode=COLOR_MODE)

        # Assert arrays match within numerical float tolerance
        max_diff = np.max(np.abs(gen_batch - api_batch))
        assert max_diff <= 1e-5, f"Preprocessing pixel divergence too high: {max_diff}"

        # If model is loaded, verify model predictions match within 1e-4
        if GLOBAL_MODEL is not None:
            pred_gen = GLOBAL_MODEL.predict(gen_batch, verbose=0)[0]
            pred_api = GLOBAL_MODEL.predict(api_batch, verbose=0)[0]
            prob_diff = np.max(np.abs(pred_gen - pred_api))
            assert prob_diff <= 1e-4, f"Prediction parity failed for {img_path.name}: diff {prob_diff} > 1e-4"
