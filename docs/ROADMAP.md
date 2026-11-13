# DrishtiAssist Engineering Roadmap (`ROADMAP.md`)

## 1. Safe Walking Map (Deferred Feature)
- **Status**: Moved to Roadmap / Coming Soon.
- **Reason**: In accordance with the honest data principle, the Safe Walking Map feature has been decoupled from the primary navigation and active routes until real GIS geodata, verified accessible pedestrian routes, and physical road hazard waypoint databases across target municipalities in India are collected and validated.
- **Planned Work**:
  - Integration with OpenStreetMap pedestrian sidewalks layer.
  - Crowdsourced geo-tagged hazard points (potholes, open drains, roadwork) verified by municipality partners.
  - Low-bandwidth offline vector tile caching for high-latency mobile conditions.

## 2. On-Device TFLite / WebAssembly Inference Mode
- **Status**: Planned (Export tool ready in `/ml/export.py`).
- **Description**: While the primary architecture currently executes server-side inference on FastAPI with full Grad-CAM explainability, an optional client-side offline mode using TensorFlow Lite / ONNX WebAssembly will be evaluated for devices with hardware acceleration.
