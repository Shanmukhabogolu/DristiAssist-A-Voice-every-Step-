# DrishtiAssist: Accessible On-Device Real-Time Hazard Detection & Scene Reader

**DrishtiAssist** is an assistive Progressive Web App (PWA) designed for blind and low-vision pedestrians in India. By pointing a smartphone camera forward at chest height, users receive short, real-time spoken and 3D spatial audio alerts warning of walking hazards such as potholes, open drains, stairs, poles, approaching vehicles, animals, and obstacles—in both **English** (`en-IN`) and **Hindi** (`hi-IN`).

---

## Key Features

1. **100% On-Device Neural Network (Zero Cloud Video):**
   - Core hazard CNN runs directly inside the client browser using **TensorFlow.js** with WebGL acceleration (3–5 inferences/sec).
   - No camera video feeds are ever streamed, uploaded, or stored in the cloud.
2. **Three-Zone Spatial Hazard Radar:**
   - Captures forward frames and slices them into **Left**, **Ahead (Center)**, and **Right** vertical bands.
   - Slices are scaled to 128x128 RGB and classified into 8 classes: `clear_path`, `pothole`, `open_drain`, `stairs`, `pole`, `vehicle`, `person`, `animal`.
3. **Priority Alert Engine & Cooldown:**
   - Danger classes (pothole, open drain, stairs, pole, vehicle) outrank animal, which outranks person.
   - Danger alerts immediately interrupt any ongoing speech.
   - Limits alerts to at most 2 per cycle; prevents duplicate spam via a 4-second cooldown.
   - Below 60% confidence, announces *"Not sure, use your cane carefully"* (*"निश्चित नहीं, अपनी छड़ी का ध्यान से उपयोग करें"*).
4. **3D Spatial Audio & Haptics:**
   - Web Audio API StereoPannerNode pans sound left or right matching the hazard position.
   - Mobile haptic vibration patterns alert the user silently to immediate dangers.
5. **Hands-Free Voice Commands:**
   - Always-listening speech recognition supports: *"Start"*, *"Stop"*, *"Read"*, *"Describe"*, *"Repeat"*, *"Louder"*, *"Quieter"*, *"Hindi"*, *"English"*, *"Correct"*, *"Wrong"*, and *"Help"*.
6. **On-Demand Sign Reading (OCR):**
   - Lazy-loads Tesseract.js in English and Hindi to read street signs, shop boards, and notices aloud.
7. **Consented Cloud Scene Description (Gemini 2.5 Flash):**
   - On explicit voice or tap consent, sends a single snapshot to Google Gemini to describe the forward walking surface and layout in 1–2 concise sentences.
8. **Installable PWA & 100% Offline Support:**
   - Works without internet connection after initial load; keeps screen awake using the Screen Wake Lock API.
9. **Accessibility First (WCAG 2.2 AA):**
   - TalkBack, VoiceOver, and NVDA screen-reader tested with ARIA live regions, skip links, huge 72px touch targets, and a high-contrast yellow-on-black mode.

---

## Project Structure (Monorepo)

```
├── frontend / root
│   ├── public/
│   │   ├── icon.svg
│   │   ├── pwa-192x192.png, pwa-512x512.png
│   │   └── model/
│   │       ├── labels.json (8 hazard classes)
│   │       ├── model.json (TF.js CNN layers)
│   │       └── weights.bin
│   ├── src/
│   │   ├── components/
│   │   │   ├── AssistScreen.tsx (Flagship camera & radar screen)
│   │   │   ├── Navigation.tsx (Top Bar contract)
│   │   │   ├── SettingsModal.tsx (Voice tuning, sensitivity)
│   │   │   ├── HowItWorksView.tsx
│   │   │   ├── InstallGuideView.tsx
│   │   │   ├── NgoSchoolView.tsx
│   │   │   ├── ModelCardView.tsx
│   │   │   └── AdminDashboard.tsx
│   │   ├── services/
│   │   │   ├── alertPriorityEngine.ts
│   │   │   ├── audioEngine.ts
│   │   │   ├── speechEngine.ts
│   │   │   ├── tfInference.ts
│   │   │   └── ocrService.ts
│   │   ├── i18n/translations.ts (English & Hindi bilingual)
│   │   ├── tests/priorityEngine.test.ts (12/12 unit tests)
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── server.ts (Full-stack Express server with Gemini API proxy)
├── backend/
│   ├── main.py (FastAPI REST service with OpenAPI docs)
│   ├── models.py (SQLAlchemy PostgreSQL models)
│   ├── schemas.py (Pydantic schemas)
│   ├── database.py
│   ├── seed.py (Admin user seed script)
│   └── requirements.txt
├── ml/
│   ├── convert_keras_to_tfjs.py (Keras to TF.js conversion script)
│   └── MODEL_CARD.md
├── docs/
│   ├── ACCESSIBILITY_AUDIT.md (Screen reader TalkBack/VoiceOver checklist)
│   ├── API_DOCUMENTATION.md
│   └── USER_GUIDE.md
├── tests/
│   └── e2e_playwright_test.ts (Playwright test with fake camera stream)
└── docker-compose.yml
```

---

## Local Development & Setup

### 1. Run the Full-Stack Application
```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Run Priority Engine Unit Tests
```bash
npx tsx src/tests/priorityEngine.test.ts
```

### 3. Model Conversion (Keras to TensorFlow.js)
```bash
tensorflowjs_converter --input_format=keras hazard_cnn.keras public/model/
```

### 4. Run with Docker Compose
```bash
docker-compose up --build
```

---

## Critical Safety Notice
> **ASSISTIVE AID ONLY:** DrishtiAssist is designed solely to enhance situational awareness. It does not replace a white cane or a guide dog. Pedestrians must always sweep their white cane forward to physically confirm ground elevation, drop-offs, and steps before proceeding.

---

**Primary Region:** Haryana, India  
**Contact:** [shanmukhabogolu@gmail.com](mailto:shanmukhabogolu@gmail.com)  
**License:** Apache-2.0
