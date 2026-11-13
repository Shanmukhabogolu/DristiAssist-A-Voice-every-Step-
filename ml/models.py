"""
Model architectures reproducing faithfully the 4 CNN variants from
Copy_of_CNN_Model_Building_1.ipynb with configurable filter sets and input shapes.
"""
from typing import Tuple, List
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (
    Conv2D,
    MaxPooling2D,
    Flatten,
    Dense,
    Dropout,
    BatchNormalization,
    Activation,
    SpatialDropout2D,
)
from tensorflow.keras import regularizers
from tensorflow.keras.optimizers import Adam

from .config import FILTER_SETS, INPUT_SHAPE


def build_cnn_model(
    variant: str = "baseline",
    num_classes: int = 4,
    input_shape: Tuple[int, int, int] = INPUT_SHAPE,
    filter_set: str = "standard",
) -> Sequential:
    """
    Constructs and compiles one of the four CNN variants defined in the notebook.

    Args:
        variant: One of ["baseline", "batch_norm", "l1_reg", "bn_l2_spatial_dropout"]
        num_classes: Number of categorical output classes
        input_shape: (height, width, channels) e.g. (128, 128, 3) or (128, 128, 1)
        filter_set: "standard" ([256, 64, 256, 128, 256]) or "lite" ([32, 64, 128, 128, 256])

    Returns:
        Compiled Keras Sequential model.
    """
    filters: List[int] = FILTER_SETS.get(filter_set, FILTER_SETS["standard"])
    model = Sequential()

    if variant == "baseline":
        # 1. Baseline Model
        for i, f in enumerate(filters):
            if i == 0:
                model.add(Conv2D(f, (3, 3), activation="relu", input_shape=input_shape, name=f"conv_{i+1}"))
            else:
                model.add(Conv2D(f, (3, 3), activation="relu", name=f"conv_{i+1}"))
            model.add(MaxPooling2D(pool_size=(2, 2), name=f"pool_{i+1}"))

        model.add(Flatten(name="flatten"))
        model.add(Dense(128, activation="relu", name="dense_1"))
        model.add(Dropout(0.2, name="dropout_1"))
        model.add(Dense(64, activation="relu", name="dense_2"))
        model.add(Dense(num_classes, activation="softmax", name="output_classes"))

        model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])

    elif variant == "batch_norm":
        # 2. With Batch Normalization
        for i, f in enumerate(filters):
            if i == 0:
                model.add(Conv2D(f, (3, 3), activation="relu", input_shape=input_shape, name=f"conv_{i+1}"))
            else:
                model.add(Conv2D(f, (3, 3), activation="relu", name=f"conv_{i+1}"))
            model.add(BatchNormalization(name=f"bn_{i+1}"))
            model.add(MaxPooling2D(pool_size=(2, 2), name=f"pool_{i+1}"))

        model.add(Flatten(name="flatten"))
        model.add(Dense(128, activation="relu", name="dense_1"))
        model.add(BatchNormalization(name="bn_dense_1"))
        model.add(Dropout(0.2, name="dropout_1"))
        model.add(Dense(64, activation="relu", name="dense_2"))
        model.add(BatchNormalization(name="bn_dense_2"))
        model.add(Dense(num_classes, activation="softmax", name="output_classes"))

        model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])

    elif variant == "l1_reg":
        # 3. With L1 Regularization (0.001)
        for i, f in enumerate(filters):
            if i == 0:
                model.add(
                    Conv2D(
                        f,
                        (3, 3),
                        activation="relu",
                        input_shape=input_shape,
                        kernel_regularizer=regularizers.l1(0.001),
                        name=f"conv_{i+1}",
                    )
                )
            else:
                model.add(
                    Conv2D(
                        f,
                        (3, 3),
                        activation="relu",
                        kernel_regularizer=regularizers.l1(0.001),
                        name=f"conv_{i+1}",
                    )
                )
            model.add(MaxPooling2D(pool_size=(2, 2), name=f"pool_{i+1}"))

        model.add(Flatten(name="flatten"))
        model.add(
            Dense(
                128,
                activation="relu",
                kernel_regularizer=regularizers.l1(0.001),
                name="dense_1",
            )
        )
        model.add(Dropout(0.2, name="dropout_1"))
        model.add(
            Dense(
                64,
                activation="relu",
                kernel_regularizer=regularizers.l1(0.001),
                name="dense_2",
            )
        )
        model.add(Dense(num_classes, activation="softmax", name="output_classes"))

        model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])

    elif variant == "bn_l2_spatial_dropout":
        # 4. With Batch Normalization, L2 Regularization (0.001), SpatialDropout2D (0.15) & Dropout (0.5)
        for i, f in enumerate(filters):
            if i == 0:
                model.add(
                    Conv2D(
                        f,
                        (3, 3),
                        input_shape=input_shape,
                        kernel_regularizer=regularizers.l2(0.001),
                        name=f"conv_{i+1}",
                    )
                )
            else:
                model.add(
                    Conv2D(
                        f,
                        (3, 3),
                        kernel_regularizer=regularizers.l2(0.001),
                        name=f"conv_{i+1}",
                    )
                )
            model.add(BatchNormalization(name=f"bn_{i+1}"))
            model.add(Activation("relu", name=f"act_{i+1}"))
            model.add(MaxPooling2D(pool_size=(2, 2), name=f"pool_{i+1}"))
            model.add(SpatialDropout2D(0.15, name=f"spatial_drop_{i+1}"))

        model.add(Flatten(name="flatten"))
        model.add(
            Dense(
                128,
                kernel_regularizer=regularizers.l2(0.001),
                name="dense_1",
            )
        )
        model.add(BatchNormalization(name="bn_dense_1"))
        model.add(Activation("relu", name="act_dense_1"))
        model.add(Dropout(0.5, name="dropout_1"))

        model.add(
            Dense(
                64,
                kernel_regularizer=regularizers.l2(0.001),
                name="dense_2",
            )
        )
        model.add(BatchNormalization(name="bn_dense_2"))
        model.add(Activation("relu", name="act_dense_2"))
        model.add(Dropout(0.5, name="dropout_2"))

        model.add(Dense(num_classes, activation="softmax", name="output_classes"))

        # Notebook compiles this variant with Adam(learning_rate=0.0004)
        model.compile(
            optimizer=Adam(learning_rate=0.0004),
            loss="categorical_crossentropy",
            metrics=["accuracy"],
        )

    else:
        raise ValueError(f"Unknown model variant: {variant}. Must be one of {VARIANTS}")

    return model
