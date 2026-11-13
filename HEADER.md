# DrishtiAssist Header Navigation Architecture (`HEADER.md`)

## 1. Zero-Clipping Guarantee
Across all viewport widths from **320px to 2560px**, no navigation link or action control in DrishtiAssist is ever clipped, truncated with ellipsis, obscured, or hidden behind an accidental overflow container. At **1024px and wider**, all seven core routes are directly rendered and visible in the header without being pushed into a "More" dropdown.

---

## 2. The Seven Core Routes
The application provides real `<a href="...">` links with `aria-current="page"` and translations across English, Hindi (हिंदी), and Telugu (తెలుగు):

| Route Path | English | Hindi (हिंदी) | Telugu (తెలుగు) |
| :--- | :--- | :--- | :--- |
| `/` | Home | होम | హోమ్ |
| `/how-it-works` | How it works | कार्यप्रणाली | ఎలా పనిచేస్తుంది |
| `/safe-map` | Safe Map | सुरक्षित नक्शा | రక్షిత మ్యాప్ |
| `/assistant` | AI Assistant | AI सहायक | AI సహాయకుడు |
| `/model-card` | Model Card | मॉडल कार्ड | మోడల్ వివరాలు |
| `/schools` | For Schools | विद्यालय | పాఠశాలలు |
| `/dashboard` | Dashboard | डैशबोर्ड | డాష్‌బోర్డ్ |

---

## 3. Responsive Layout Strategy

### Layout A: Desktop & Ultrawide (1280px to 2560px)
- **Structure**: Single row CSS Grid with `grid-template-columns: auto minmax(0, 1fr) auto` and `gap: 24px`.
- **Container**: Max width expanded to `1440px` (and `1600px` on 2xl) rather than a rigid 1100px clamp, providing comfortable breathing room for wide Telugu/Hindi typography and high-density screens.
- **Brand Logo (Left)**: Width capped at `≤ 260px`. Monogram emblem is `40px × 40px`, wordmark is `22px` font size in the display face, and the sub-tagline `"A VOICE FOR EVERY STEP"` is set at `10px` uppercase.
- **Navigation (Center)**: All seven links rendered horizontally with `15px` font size (`14px` on Indic scripts if required), weight `500` (or `600` when active), sentence case, and `20px` gap (`24px` at 1440px+). Unboxed styling with no mechanical prefix digits.
- **Actions (Right)**:
  1. Segmented Language Switcher (`EN | हिंदी | తెలుగు`), `36px` tall.
  2. Appearance Popover (Theme + Motion toggle), icon-only at 1280–1439px with accessible `aria-label`, icon + label at 1440px and wider, red dot removed.
  3. Primary `"Open the app"` CTA button, `40px` tall, single-line with `white-space: nowrap !important`.

### Layout B: Compact Desktop & Tablet Landscape (1024px to 1279px)
- **Problem Solved**: On 1024–1279px displays (e.g. iPad Pro landscape, smaller laptops), placing the logo, 7 full links, language switcher, appearance button, and primary CTA on a single row risks horizontal crowding or truncation.
- **Two-Row Sticky Header**:
  - **Row 1 (`56px`)**: Top utility bar containing the Logo on the left and utility actions (Segmented Language Switcher, Appearance Popover, and `"Open the app"` CTA) on the right.
  - **Row 2 (`44px`)**: Dedicated navigation bar spanning `max-width: 1100px` centered with a subtle top border (`border-t border-[var(--border-subtle)]`). All seven links are evenly spaced across the entire width.
- **Sticky Scroll Dynamics**: The full header sticks to the top of the viewport. On scrolling past `80px`, Row 1 collapses unnecessary vertical padding and hides the sub-tagline, while **Row 2 nav links remain visible and accessible at all times**.

### Layout C: Mobile & Tablet Portrait (320px to 1023px)
- **Header**: Compact `56px–64px` bar showing the Logo emblem and wordmark on the left (tagline suppressed on narrow viewports), and a prominent `44px × 44px` accessible `"Menu"` button on the right with a hamburger icon and text label.
- **Full-Height Menu Sheet (`MobileMenuSheet.tsx`)**:
  - Opens with a smooth `250ms` slide and fade (`100ms` when `prefers-reduced-motion` is active).
  - All seven links stacked vertically with `56px` minimum touch target, `18px` text, and a left accent indicator bar (`1.5px` solid `var(--accent)`) on the active link.
  - Below navigation links: full-width 3-segment language selector (`EN | हिंदी | తెలుగు`) and appearance controls (Light, Classic, Contrast, and Pause Animations).
  - Pinned at bottom: full-width `"Open the app"` CTA.
  - Accessible focus management: focus is trapped inside the sheet, pressing `Escape` closes the sheet, clicking the backdrop or close button closes the sheet, document body scroll is locked, and focus returns to the `"Menu"` trigger upon closing.

---

## 4. Active Link Indicator & Micro-Interactions
- **Visual State**: Active link uses font weight `600`, color `var(--accent)`, and an animated underline hairline (`2px` rounded).
- **Motion**: Underline position transitions between routes using Framer Motion `layoutId="active-nav-underline-desktop"` with a spring curve (`stiffness: 380, damping: 30`).
- **Focus Rings**: Focus visible styles provide `2px` ring with `2px` offset (`outline: 2px solid var(--accent); outline-offset: 2px`), with `4px` vertical padding on nav links so focus rings are never clipped by container boundaries.

---

## 5. Page Transitions & Progress Hairline
- All route transitions are wrapped inside `<PageTransition currentKey={activeTab}>`.
- **Directional Slide**: Routes slide forward (`+24px` from right) when navigating to later tabs, and backward (`-24px` from left) when navigating to earlier tabs.
- **Timing**: Crossfade exit `150ms`, enter `350ms` with easing `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Progress Hairline**: A `2px` accent line at `fixed top-0 left-0 right-0 h-[2px] bg-[var(--accent)] z-[100]` sweeps across the viewport during route transitions to provide instant feedback.
- **Persistent Header/Footer**: The header and footer sit outside `<PageTransition>`, preventing any visual flash, jump, or remount.
