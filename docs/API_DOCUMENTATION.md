# DrishtiAssist REST API Documentation

Base URL: `http://localhost:3000/api` (Full-Stack) or `http://localhost:8000` (FastAPI backend)

## Endpoints Summary

### 1. Consented Scene Description
- **Endpoint:** `POST /api/describe`
- **Request Body:**
  ```json
  {
    "imageBase64": "data:image/jpeg;base64,...",
    "language": "en",
    "userConsented": true
  }
  ```
- **Response:**
  ```json
  {
    "description": "Clear paved sidewalk ahead with a low curb on the left. Steps are visible 10 meters forward.",
    "model": "gemini-2.5-flash",
    "isFallback": false
  }
  ```
- **Privacy Constraint:** If `userConsented` is false or missing, returns `403 Forbidden`. No image frames are retained on the server.

---

### 2. Post-Alert Verification Feedback
- **Endpoint:** `POST /api/feedback`
- **Request Body:**
  ```json
  {
    "hazardLabel": "pothole",
    "zone": "center",
    "wasCorrect": true,
    "confidence": 0.88,
    "userNote": "Confirmed by cane sweep",
    "language": "en",
    "coarseLocation": "Haryana, India"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "feedback": { "id": "fb-174150..." }
  }
  ```

---

### 3. Opt-in Image Contribution
- **Endpoint:** `POST /api/contributions`
- **Request Body:**
  ```json
  {
    "suggestedLabel": "open_drain",
    "notes": "Uncovered roadside storm drain during monsoon",
    "userConsentConfirmed": true
  }
  ```

---

### 4. Partner Inquiry
- **Endpoint:** `POST /api/partners`
- **Request Body:**
  ```json
  {
    "organizationName": "National Association for the Blind (Haryana)",
    "contactName": "Sunita Sharma",
    "email": "contact@nab-haryana.org",
    "type": "ngo",
    "devicesNeeded": "50 devices",
    "notes": "Training blind school students"
  }
  ```

---

### 5. Admin Operational Telemetry
- **Endpoint:** `GET /api/admin/stats`
- **Response:**
  ```json
  {
    "metrics": {
      "totalAlertsToday": 1420,
      "activeUsersToday": 318,
      "overallAccuracyPercent": 91,
      "languageDistribution": { "hindiPercent": 62, "englishPercent": 38 }
    }
  }
  ```
