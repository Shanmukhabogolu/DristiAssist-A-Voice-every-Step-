# DrishtiAssist Accessibility Audit & Screen-Reader Verification Checklist

**Standard:** WCAG 2.2 Level AA Compliance  
**Target User Cohort:** Blind and low-vision pedestrians in India using Android (TalkBack) and iOS (VoiceOver).

---

## 1. Automated & Semantic Structure Compliance

| Criterion | Implementation | Status |
| :--- | :--- | :--- |
| **1.3.1 Info and Relationships** | Native landmarks (`<header>`, `<main id="main-content">`, `<footer>`, `<nav>`, `<section>`). Correct heading hierarchy without level skips. | **PASS** |
| **2.1.1 Keyboard Accessible** | Every interactive control is operable via Tab and Shift+Tab. Skip-to-content link provided at DOM root. | **PASS** |
| **2.4.7 Focus Visible** | Global high-visibility focus ring (`outline: 3px solid #f59e0b; outline-offset: 3px;`). | **PASS** |
| **2.5.5 Target Size (Enhanced)** | Primary Start/Stop button $\ge 72\text{px}$. All auxiliary buttons $\ge 56\text{px}$ touch targets. | **PASS** |
| **4.1.3 Status Messages** | Real-time speech announcements mirrored inside `aria-live="assertive"` and `aria-atomic="true"` regions. | **PASS** |
| **1.4.3 Contrast (Minimum)** | High-contrast dark theme with 14:1 text-to-background ratio. Dedicated yellow-on-black High Contrast mode (`.high-contrast`). | **PASS** |
| **2.3.3 Animation from Interactions** | Respects `prefers-reduced-motion: reduce` by zeroing transition durations. | **PASS** |

---

## 2. Manual Screen-Reader Test Checklist

### A. Android TalkBack Verification (Chrome on Android 11+)
1. **Launch:** Swipe right from screen top. TalkBack announces: *"DrishtiAssist, On-Device AI, heading level 1"*.
2. **Safety Disclaimer:** TalkBack reads: *"Critical Safety Notice: Assistive aid only. This app does not replace a white cane or guide."*
3. **Primary Action:** One double-tap on *"Start Hazard Detection, button"* immediately initiates camera stream and speaks confirmation.
4. **Live Radar:** When navigating to the 3-zone radar, TalkBack reads zone name, hazard label, and confidence score.
5. **Speech Mirror:** Live spoken alerts are mirrored in assertive live region and announced without requiring manual focus traversal.

### B. Apple VoiceOver Verification (iOS Safari)
1. **Rotor Navigation:** Landmarks rotor identifies Header, Main Content, Tools, and Footer.
2. **Audio Ducking:** VoiceOver voice volume gracefully ducks or pauses when camera hazard audio cue chirps.
3. **PWA Install Prompt:** VoiceOver user receives spoken 3-step modal instructions for *"Add to Home Screen"*.

### C. NVDA / JAWS Desktop Verification (Windows Chrome/Edge)
1. **Skip Link:** Pressing `Tab` upon page load focuses *"Skip to main content"* link with visible amber styling.
2. **Voice Commands:** Speech recognition commands (*"Start"*, *"Stop"*, *"Read"*, *"Describe"*) work seamlessly without hands touching the keyboard.
3. **Feedback Submission:** Post-alert feedback buttons (*"Correct"*, *"Wrong"*) announce state change upon activation.

---

## 3. Physical Mobility & Cane Safety Rules
- **Non-Reliance Principle:** Audio announcements serve as early warning (1.5 - 3 meters ahead).
- **Ground Truth:** The pedestrian must physically verify curbs, elevation drops, and steps using their cane tip before stepping.
- **Auditory Transparency:** Users should wear open-ear bone-conduction headphones (e.g. Shokz) so environmental traffic sounds remain unblocked.
