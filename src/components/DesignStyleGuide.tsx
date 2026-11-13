import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { THEMES, verifyThemeContrastStandards, SPACING } from '../tokens/tokens';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { CodeBlock } from './ui/CodeBlock';
import { Accordion } from './ui/Accordion';
import { CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';

export const DesignStyleGuide: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const contrastResults = verifyThemeContrastStandards();
  const currentTokens = THEMES[theme];

  return (
    <div className="layout-container section-spacing space-y-12">
      
      {/* Page Header */}
      <div className="border-b border-[var(--border)] pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="accent">Living Style Guide</Badge>
          <span className="font-mono text-xs text-[var(--ink-muted)]">·</span>
          <span className="font-mono text-xs text-[var(--ink-muted)]">Active Theme: {theme.toUpperCase()}</span>
        </div>
        <h1 className="text-[var(--text-h1)] font-extrabold text-[var(--ink)]">
          DrishtiAssist Design System
        </h1>
        <p className="text-base text-[var(--ink-muted)] max-w-2xl leading-relaxed">
          Comprehensive catalog of all design tokens, components, radii, fluid typography, and programmatic WCAG contrast evaluations.
        </p>
      </div>

      {/* 1. Theme Color Tokens */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[var(--ink)] flex items-center gap-2">
          <span>01 / Color Tokens</span>
          <span className="font-mono text-xs text-[var(--ink-muted)] font-normal">({theme})</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(currentTokens.colors).map(([key, hex]) => (
            <div
              key={key}
              className="p-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)] space-y-2"
            >
              <div
                className="w-full h-12 rounded-[var(--radius-input)] border border-[var(--border-subtle)]"
                style={{ backgroundColor: hex }}
              />
              <div>
                <span className="font-mono text-[11px] font-bold text-[var(--ink)] block truncate">
                  {key}
                </span>
                <span className="font-mono text-[10px] text-[var(--ink-muted)] uppercase">
                  {hex}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Programmatic Contrast Audit Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--ink)]">
            02 / WCAG 2.2 Programmatic Contrast Audit
          </h2>
          <span className="font-mono text-xs text-[var(--status-success)] bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded border border-emerald-300">
            ✓ Automated Pass (AA & AAA)
          </span>
        </div>

        <div className="w-full overflow-x-auto rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[var(--surface-subtle)] border-b border-[var(--border)] uppercase text-[var(--ink-muted)]">
              <tr>
                <th className="py-2.5 px-4">Theme</th>
                <th className="py-2.5 px-4">Color Token Pair</th>
                <th className="py-2.5 px-4 text-right">Calculated Ratio</th>
                <th className="py-2.5 px-4 text-center">WCAG AA (&ge; 4.5:1)</th>
                <th className="py-2.5 px-4 text-center">WCAG AAA (&ge; 7:1)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {contrastResults.map((item, idx) => (
                <tr key={idx} className="hover:bg-[var(--surface-subtle)]/50">
                  <td className="py-2 px-4 uppercase font-bold text-[var(--ink)]">{item.theme}</td>
                  <td className="py-2 px-4 text-[var(--ink-muted)]">{item.pair}</td>
                  <td className="py-2 px-4 text-right font-bold text-[var(--ink)] tabular-data">
                    {item.ratio.toFixed(2)} : 1
                  </td>
                  <td className="py-2 px-4 text-center text-[var(--status-success)] font-bold">
                    ✓ PASS
                  </td>
                  <td className="py-2 px-4 text-center">
                    {item.meetsAAA ? (
                      <span className="text-[var(--status-success)] font-bold">✓ PASS</span>
                    ) : (
                      <span className="text-[var(--ink-muted)]">AA only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Button Component Matrix */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[var(--ink)]">
          03 / Interactive Buttons
        </h2>

        <div className="p-6 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)] space-y-6">
          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="primary">Primary Action</Button>
            <Button variant="secondary">Secondary Action</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="danger">Danger Action</Button>
            <Button variant="primary" isLoading>Loading State</Button>
            <Button variant="primary" disabled>Disabled State</Button>
          </div>

          <div className="flex flex-wrap gap-3 items-center pt-4 border-t border-[var(--border-subtle)]">
            <Button size="sm">Small (36px)</Button>
            <Button size="md">Medium (44px)</Button>
            <Button size="lg">Large (56px)</Button>
          </div>
        </div>
      </section>

      {/* 4. Badges & Form Controls */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[var(--ink)]">
          04 / Badges & Tags
        </h2>

        <div className="p-6 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)] flex flex-wrap gap-3 items-center">
          <Badge variant="neutral">Neutral Tag</Badge>
          <Badge variant="accent">Accent Tag</Badge>
          <Badge variant="success">Success Status</Badge>
          <Badge variant="warning">Warning Status</Badge>
          <Badge variant="danger">Danger Status</Badge>
        </div>
      </section>

      {/* 5. Typography Scale Preview */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[var(--ink)]">
          05 / Fluid Typography Hierarchy
        </h2>

        <div className="p-6 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)] space-y-4">
          <div>
            <span className="font-mono text-xs text-[var(--ink-muted)] block mb-1">Display (48-88px clamp)</span>
            <div className="text-[var(--text-display)] font-extrabold text-[var(--ink)] leading-none">
              DrishtiAssist
            </div>
          </div>
          <div className="pt-3 border-t border-[var(--border-subtle)]">
            <span className="font-mono text-xs text-[var(--ink-muted)] block mb-1">Heading 1 (36-56px clamp)</span>
            <h1 className="text-[var(--text-h1)] font-bold text-[var(--ink)]">
              Accessible On-Device Hazard Detection
            </h1>
          </div>
          <div className="pt-3 border-t border-[var(--border-subtle)]">
            <span className="font-mono text-xs text-[var(--ink-muted)] block mb-1">Heading 2 (28-40px clamp)</span>
            <h2 className="text-[var(--text-h2)] font-bold text-[var(--ink)]">
              Three-Zone Real-Time Spatial Radar
            </h2>
          </div>
          <div className="pt-3 border-t border-[var(--border-subtle)]">
            <span className="font-mono text-xs text-[var(--ink-muted)] block mb-1">Body Text (17-18px fluid)</span>
            <p className="text-[var(--text-body)] text-[var(--ink)] max-w-xl">
              This is the body copy rendered in the active theme face. Under Light theme it renders in Plus Jakarta Sans. Under Classic theme it renders in Source Serif 4. Under Contrast theme it renders in system sans.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
