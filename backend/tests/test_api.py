"""
Unit and integration tests for FastAPI backend endpoints.
"""
import io
import pytest
from PIL import Image
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    assert "model_name" in data


def test_classes_endpoint():
    res = client.get("/api/classes")
    assert res.status_code == 200
    data = res.json()
    assert "classes" in data
    assert len(data["classes"]) >= 2


def test_model_info_endpoint():
    res = client.get("/api/model")
    assert res.status_code == 200
    data = res.json()
    assert "test_accuracy" in data
    assert "total_parameters" in data


def test_predict_invalid_file_type():
    res = client.post(
        "/api/predict",
        files={"file": ("test.txt", b"Invalid content", "text/plain")},
    )
    assert res.status_code == 400
    assert "Unsupported image format" in res.json()["detail"]


def test_predict_valid_image():
    # Create valid 128x128 synthetic JPEG in memory
    img = Image.new("RGB", (128, 128), color=(100, 120, 140))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    res = client.post(
        "/api/predict",
        files={"file": ("brain_slice.jpg", buf.getvalue(), "image/jpeg")},
    )
    # 200 if model loaded or 503 if training in progress
    assert res.status_code in [200, 503]
    if res.status_code == 200:
        data = res.json()
        assert "label" in data
        assert "confidence" in data
        assert "top3" in data
        assert len(data["top3"]) >= 1
        assert "inference_time_ms" in data


def test_feedback_submission():
    payload = {
        "prediction_id": "test_pred_123",
        "predicted_label": "NonDemented",
        "confidence": 0.85,
        "was_correct": True,
        "note": "Verified by technician",
    }
    res = client.post("/api/feedback", json=payload)
    assert res.status_code == 201
    assert res.json()["status"] == "success"
