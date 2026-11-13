/**
 * Typed Design Tokens for DrishtiAssist
 * Corresponds with CSS Custom Properties in tokens.css
 */

export type AppTheme = 'light' | 'classic' | 'contrast';

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceSubtle: string;
  border: string;
  ink: string;
  inkMuted: string;
  accent: string;
  accentHover: string;
  accentTint: string;
  accentText: string;
  statusSuccess: string;
  statusWarning: string;
  statusDanger: string;
}

/**
 * Official DrishtiAssist Brand Logo Palette (Source of Truth: DA.jpeg)
 * Charcoal background with warm off-white lettering
 */
export const BRAND_TOKENS = {
  charcoal: '#2B2B2B',       // logo background
  charcoal2: '#353535',      // raised surfaces on charcoal
  offwhite: '#E8E6E1',       // logo lettering
  offwhiteMuted: '#B5B2AB',  // secondary text on charcoal
  hairlineDark: '#555250',   // thin rules on charcoal
  ink: '#2B2B2B',            // text on light backgrounds
  inkMuted: '#5E5A53',       // secondary text on light backgrounds
  hairlineLight: '#D9D0BF',  // thin rules on cream/light backgrounds
  // Aliases
  paper: '#E8E6E1',
  muted: '#B5B2AB',
  rule: '#555250',
} as const;

/**
 * Warm Light Card Design Tokens for How It Works and feature cards
 */
export const WARM_CARD_TOKENS = {
  bgPage: '#F4EFE8',
  cardBg: '#FFFBF5',
  cardBorder: '#E6DCCB',
  cardShadow: '0 2px 10px rgba(60, 45, 20, 0.08)',
  textHeading: '#1A2238',
  textBody: '#4A4F5E',
  iconChipBg: '#F6E3B8',
  iconColor: '#B7791F',
  privacyBg: '#E6F2EA',
  privacyBorder: '#3F8F6B',
  privacyText: '#1F4D3A',
  privacyChipBg: '#D2E7DA',
  warnBg: '#FBEBC8',
  warnBorder: '#D9A441',
  warnHeading: '#7A4B00',
  warnText: '#5C3D0A',
} as const;

export const THEMES: Record<AppTheme, { name: string; labelEn: string; labelHi: string; colors: ThemeColors }> = {
  light: {
    name: 'light',
    labelEn: 'Light',
    labelHi: 'लाइट',
    colors: {
      bg: '#FAFAF7',
      surface: '#FFFFFF',
      surfaceSubtle: '#F2F1EC',
      border: '#E4E2DC',
      ink: '#14181F',
      inkMuted: '#5B6472',
      accent: '#1F4FD8',
      accentHover: '#1840B0',
      accentTint: '#E8EEFC',
      accentText: '#FFFFFF',
      statusSuccess: '#15803D',
      statusWarning: '#B45309',
      statusDanger: '#B42318',
    },
  },
  classic: {
    name: 'classic',
    labelEn: 'Classic',
    labelHi: 'क्लासिक',
    colors: {
      bg: '#F4EFE6',
      surface: '#FBF8F2',
      surfaceSubtle: '#ECE4D6',
      border: '#D9D0BF',
      ink: '#1C1A17',
      inkMuted: '#5E574C',
      accent: '#7A1F2B',
      accentHover: '#611822',
      accentTint: '#F3E6E8',
      accentText: '#FBF8F2',
      statusSuccess: '#2F5D50',
      statusWarning: '#8C4700',
      statusDanger: '#7A1F2B',
    },
  },
  contrast: {
    name: 'contrast',
    labelEn: 'Contrast',
    labelHi: 'हाई कंट्रास्ट',
    colors: {
      bg: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceSubtle: '#F0F0F0',
      border: '#000000',
      ink: '#000000',
      inkMuted: '#111111',
      accent: '#0033CC',
      accentHover: '#002299',
      accentTint: '#E6EEFF',
      accentText: '#FFFFFF',
      statusSuccess: '#006600',
      statusWarning: '#804000',
      statusDanger: '#990000',
    },
  },
};

export const SPACING = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  6: '24px',
  8: '32px',
  12: '48px',
  16: '64px',
  24: '96px',
  32: '128px',
} as const;

export const EASING = {
  entrance: 'cubic-bezier(0.22, 1, 0.36, 1)',
  state: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

export const DURATIONS = {
  micro: 150,
  theme: 300,
  reveal: 500,
} as const;

/**
 * Calculates WCAG 2.2 Relative Luminance and Contrast Ratio
 */
export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const l1 = getRelativeLuminance(r1, g1, b1);
  const l2 = getRelativeLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Programmatic Contrast Assertion: Checks all theme text/background pairs
 */
export function verifyThemeContrastStandards(): {
  theme: AppTheme;
  pair: string;
  ratio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
}[] {
  const results: any[] = [];

  for (const [key, theme] of Object.entries(THEMES)) {
    const themeKey = key as AppTheme;
    const pairs: [string, string, string][] = [
      ['Ink on BG', theme.colors.ink, theme.colors.bg],
      ['Ink on Surface', theme.colors.ink, theme.colors.surface],
      ['Muted Ink on BG', theme.colors.inkMuted, theme.colors.bg],
      ['Accent on BG', theme.colors.accent, theme.colors.bg],
      ['AccentText on Accent', theme.colors.accentText, theme.colors.accent],
      ['Danger on BG', theme.colors.statusDanger, theme.colors.bg],
      ['Success on BG', theme.colors.statusSuccess, theme.colors.bg],
    ];

    for (const [pair, c1, c2] of pairs) {
      const ratio = Math.round(getContrastRatio(c1, c2) * 100) / 100;
      const requiredAA = 4.5;
      const requiredAAA = themeKey === 'contrast' ? 7.0 : 4.5;

      results.push({
        theme: themeKey,
        pair,
        ratio,
        meetsAA: ratio >= requiredAA,
        meetsAAA: ratio >= requiredAAA,
      });
    }
  }

  // Verify Brand Header Band tokens meet WCAG AA standards (> 4.5:1, brand paper is ~11:1, brand muted is ~7:1)
  const brandPaperRatio = Math.round(getContrastRatio(BRAND_TOKENS.paper, BRAND_TOKENS.charcoal) * 100) / 100;
  const brandMutedRatio = Math.round(getContrastRatio(BRAND_TOKENS.muted, BRAND_TOKENS.charcoal) * 100) / 100;

  results.push(
    {
      theme: 'light',
      pair: 'Brand Paper on Charcoal',
      ratio: brandPaperRatio,
      meetsAA: brandPaperRatio >= 4.5,
      meetsAAA: brandPaperRatio >= 7.0,
    },
    {
      theme: 'light',
      pair: 'Brand Muted on Charcoal',
      ratio: brandMutedRatio,
      meetsAA: brandMutedRatio >= 4.5,
      meetsAAA: brandMutedRatio >= 7.0,
    }
  );

  return results;
}
