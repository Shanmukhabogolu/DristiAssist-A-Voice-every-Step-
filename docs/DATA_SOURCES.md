# DrishtiAssist Live Walk Assist: Data Sources, Taxonomy & Download Plan

This document defines the data acquisition plan, dataset directory taxonomy, licensing compliance, and data harmonization procedures for **Model A (Ground-Surface Classifier)** and **Model B (YOLO Object Detector)**.

---

## 1. Class Taxonomy Specification

### Model A: Ground-Surface CNN (128x128x3 RGB)
Classifies the ground patch immediately ahead of the user to confirm surface walking conditions:
1. `clear_path`: Smooth walkable pavement, tiled corridor, or packed dirt without holes or abrupt drop-offs.
2. `pothole`: Road craters, asphalt depressions, and unpaved divots ($> 5\text{ cm}$ depth).
3. `open_drain`: Uncovered storm drains, open roadside masonry culverts, and sewer trenches.
4. `stairs`: Downward and upward steps, curb drops, and elevation transitions lacking tactile indicators.
5. `rough_or_debris`: Construction gravel, broken bricks, scattered rubble, or irregular road edges.
6. `wet_or_slippery`: Standing rainwater puddles, oil slicks, or algae-covered wet stone.

### Model B: YOLO Hazard & Obstacle Detector (640x480 RGB)
Detects bounding boxes with normalized coordinates `[class_id, x_center, y_center, width, height]` across 9 target classes:
- `0: pothole` (Ground crater / asphalt cavity)
- `1: open_drain` (Exposed trench / gutter gap)
- `2: stairs` (Flight of stairs / step drops)
- `3: pole` (Utility pole, electrical pylon, bollard)
- `4: street_light` (Lamppost, overhead luminaire pillar)
- `5: vehicle` (Auto-rickshaw, car, bus, truck, motorcycle, bicycle, e-rickshaw)
- `6: animal` (Stray cattle, stray dogs, goats on walkway)
- `7: person` (Pedestrian, vendor, crowd in walking corridor)
- `8: barrier` (Construction barricade, road construction tape, concrete jersey barrier)

---

## 2. Benchmark Data Sources & Licenses

| Source | Target Classes | Size / Format | License | Usage & Compliance Notes |
| :--- | :--- | :--- | :--- | :--- |
| **RDD2022 (Road Damage Dataset)** | `pothole`, `rough_or_debris` | XML / Pascal VOC (India, Japan, Czech) | **CC BY-SA 4.0** | Contains real Indian road damage captures (India subset). Permitted for open research & commercial models with attribution. |
| **Indian Driving Dataset (IDD)** | `vehicle`, `person`, `animal`, `pole` | Box annotations on Indian urban/suburban roads | **Research / Non-Commercial (CC BY-NC 4.0)** | Highly representative of Indian mixed traffic, auto-rickshaws, cattle, and chaotic sidewalks. Academic and humanitarian research use. |
| **Mapillary Vistas / Cityscapes** | `pole`, `street_light`, `barrier` | Semantic masks & polygon instances | **CC BY-NC-SA 4.0 / Custom Research** | High-precision utility poles, bollards, and lampposts under varying lighting conditions. |
| **COCO / Open Images V7** | `vehicle`, `animal`, `person` | YOLO / JSON bounding boxes | **CC BY 4.0** | Baseline pre-training weights for standard vehicle and pedestrian classes. |
| **User Chest-Height Walking Footage** | All 9 classes in target orientation | MP4 / MOV extracted at 2 fps | **Proprietary / User-Owned (Apache-2.0 in-app)** | **Most valuable data:** Captured with phone held at sternum level ($1.2\text{ m}$ elevation), matching true field perspective. Annotated via CVAT or Label Studio. |

---

## 3. Directory Layout on Disk

Place raw and processed data in the `/data` directory:

```
/data/
├── ground_crops/                    # Model A Training Crops (128x128)
│   ├── clear_path/
│   ├── pothole/
│   ├── open_drain/
│   ├── stairs/
│   ├── rough_or_debris/
│   └── wet_or_slippery/
│
├── yolo_hazards/                    # Model B Object Detection (YOLO format)
│   ├── data.yaml                    # YOLO dataset descriptor
│   ├── images/
│   │   ├── train/                   # 640x480 JPEG images
│   │   └── val/
│   └── labels/
│       ├── train/                   # Normalised YOLO .txt box annotations
│       └── val/
│
└── raw_sources/                     # Downloaded archives (gitignored)
    ├── rdd2022/
    ├── idd/
    └── user_walks/                  # Your chest-height walking videos (.mp4)
```

---

## 4. Manual Download Plan & Instructions

If you have access to these datasets, place them in `/data/raw_sources/`:

1. **Your Chest-Height Walking Videos (Highest Priority)**:
   - Place your walking `.mp4` video files into `/data/raw_sources/user_walks/`.
   - Run: `python3 ml/datasets/prepare.py --extract-videos` (extracts frames at 2 fps).
   - Annotate in CVAT or Label Studio with the 9 Model B classes and export as "YOLO 1.1".

2. **RDD2022 (India Subset)**:
   - Download from: [https://crddc2022.sekilab.global/](https://crddc2022.sekilab.global/)
   - Extract `India.tar.gz` to `/data/raw_sources/rdd2022/`.
   - Run: `python3 ml/datasets/prepare.py --convert-rdd` to map D00/D10/D20/D40 to `pothole` and `rough_or_debris`.

3. **Roboflow Universe Pothole & Road Hazard Sets**:
   - Download YOLOv8 PyTorch format from Roboflow Universe.
   - Extract directly into `/data/yolo_hazards/`.

---

## 5. Automated Seed Generator for Immediate Testing

When external downloads have not yet been placed on disk, the repository includes a synthetic procedural seed generator (`python3 ml/datasets/prepare.py --seed`) that outputs valid ground crop arrays and annotated YOLO scene pairs. This ensures the entire path-safety engine, unit tests, and Web Worker pipelines are fully functional and verifiable end-to-end.
