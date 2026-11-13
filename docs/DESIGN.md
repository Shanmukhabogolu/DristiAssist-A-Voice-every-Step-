# DrishtiAssist Design Constitution & System Manual (DESIGN.md)

This document explains the design tokens, visual themes, typography scales, and motion rules governing DrishtiAssist. Any developer contributing to this repository must preserve these constraints.

---

## 1. The Three Visual Themes (`<html data-theme="...">`)

Theme switching applies via CSS Custom Properties on `document.documentElement` (`<html data-theme="light | classic | contrast">`).

### A. Theme: "Light" (Default)
- **Concept:** Modern, airy, restrained studio product aesthetic.
- **Palette:**
  - Background: `#FAFAF7` with subtle 4% opacity dot grid (`var(--bg-pattern-dot)`)
  - Surface: `#FFFFFF`, subtle surface `#F2F1EC`, border `#E4E2DC`
  - Text (Ink): `#14181F`, muted `#5B6472`
  - Accent: `#1F4FD8` (Cobalt); hover `#1840B0`; tint `#E8EEFC`
  - Status: Success `#15803D`, Warning `#B45309`, Danger `#B42318`
- **Typography:** Plus Jakarta Sans / Geist Sans (600 headings, 400 body), JetBrains Mono for telemetry and code. Hindi in Noto Sans Devanagari.
- **Radii:** 8px on cards and inputs, 999px on small badges.

### B. Theme: "Classic"
- **Concept:** Editorial, print-inspired, authoritative, calm.
- **Palette:**
  - Background: `#F4EFE6` (warm cream paper)
  - Surface: `#FBF8F2`, border `#D9D0BF`
  - Text (Ink): `#1C1A17`, muted `#5E574C`
  - Accent: `#7A1F2B` (Oxblood); hover `#611822`; secondary `#2F5D50` (Deep green)
- **Typography:** Source Serif 4 / Newsreader (500–600 headings, 400 body at 18px / 1.7 line height). Hindi in Noto Serif Devanagari.
- **Radii:** 2px or square, 1px rules, double rules for breaks, zero shadows. Numbered sections ("01 /", "02 /").

### C. Theme: "Contrast"
- **Concept:** Maximum legibility meeting WCAG AAA across every token pair.
- **Palette:** Pure `#FFFFFF` background, solid `#000000` text and borders, `#0033CC` links. 3px high-visibility focus rings.
- **Motion:** Zero decorative animations; purely instant transitions.

---

## 2. Token Architecture & Zero-Shift Geometry

All visual properties are defined in `src/tokens/tokens.css` and exported via typed TypeScript constants in `src/tokens/tokens.ts`.
- **Spacing Scale (8px system):** 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px, 128px.
- **Grid Layout:** 12-column grid, max content width 1200px (`.layout-container`), 24px mobile gutters / 32px desktop.
- **Zero Layout Shift:** Dimensions, padding, margins, and line heights remain identical across themes. Switching themes modifies colors and fonts only, never causing layout recalculations or content jumps.
- **Zero-Flash Pre-Paint:** A compact inline script in `<head>` queries `localStorage` before the initial DOM render, preventing theme flickering.

---

## 3. Motion Principles & Accessibility

**Principle:** Motion explains, never decorates. Calm, fast, precise.
- **Easings:**
  - Entrance reveals: `cubic-bezier(0.22, 1, 0.36, 1)`
  - State changes: `cubic-bezier(0.4, 0, 0.2, 1)`
  - *No bounce, spring, or elastic effects.*
- **Durations:**
  - Micro-interactions (hover, press): 150ms
  - Theme transitions: 300ms crossfade
  - Section scroll reveals: 400–500ms
- **Reduced Motion:** Fully honors `prefers-reduced-motion` and includes an explicit *"Pause animations"* toggle in the site footer.
- **Assist Screen Restraint:** The Assist screen contains zero decorative animations to maintain device performance and avoid distracting visually impaired pedestrians.
