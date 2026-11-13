"""
Configuration for DrishtiAssist Keras CNN Training & Inference Pipeline.
Reproduces settings faithfully from Copy_of_CNN_Model_Building_1.ipynb.
"""
import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.getenv("DATA_DIR", BASE_DIR / "data"))
TRAIN_DIR = DATA_DIR / "train"
TEST_DIR = DATA_DIR / "test"

ARTIFACTS_DIR = Path(os.getenv("ARTIFACTS_DIR", BASE_DIR / "ml" / "artifacts"))
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

# Image pipeline parameters
IMG_SIZE = 128
# COLOR_MODE is configurable: "rgb" (128x128x3) or "grayscale" (128x128x1)
COLOR_MODE = os.getenv("COLOR_MODE", "rgb").lower()
CHANNELS = 3 if COLOR_MODE == "rgb" else 1
INPUT_SHAPE = (IMG_SIZE, IMG_SIZE, CHANNELS)

# Training hyperparameters
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "32"))
DEFAULT_EPOCHS = int(os.getenv("EPOCHS", "50"))
VAL_SPLIT = 0.15
SEED = 42

# Confidence threshold for low_confidence warning
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.60"))

# Architecture filter sets
FILTER_SETS = {
    "standard": [256, 64, 256, 128, 256],
    "lite": [32, 64, 128, 128, 256],
}

# Supported model variants
VARIANTS = [
    "baseline",
    "batch_norm",
    "l1_reg",
    "bn_l2_spatial_dropout",
]
