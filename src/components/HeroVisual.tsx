import React from 'react';
import { useTheme } from '../context/ThemeContext';

export const HeroVisual: React.FC = () => {
  const { theme, reducedMotion } = useTheme();

  return (
    <div
      className="interactive-frame group relative w-full aspect-[4/3] max-w-[540px] mx-auto rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden p-6 shadow-[var(--shadow-soft)] flex flex-col justify-between cursor-pointer"
      aria-label="Illustration: Real-time hazard detection in 3 zones with priority speech"
    >
      {/* Top Device Status Bar */}
      <div className="flex items-center justify-between text-xs font-mono text-[var(--ink-muted)] border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--status-success)] group-hover:scale-125 transition-transform" />
          <span className="font-semibold uppercase tracking-wider text-[var(--ink)]">On-Device CNN</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="tabular-data">128×128 RGB</span>
          <span>·</span>
          <span className="tabular-data text-[var(--accent)] font-bold">4.2 FPS</span>
        </div>
      </div>

      {/* SVG Stylized Camera Viewport with 3 Zones and Animated Detection Boxes */}
      <div className="relative my-auto w-full aspect-video rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface-subtle)] overflow-hidden group-hover:border-[var(--accent)] transition-colors">
        <svg
          viewBox="0 0 480 270"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeOpacity="0.05" />
            </pattern>
          </defs>

          {/* Grid background */}
          <rect width="480" height="270" fill="url(#gridPattern)" className="text-[var(--ink)]" />

          {/* Three Vertical Zones (Left / Center / Right) */}
          <line x1="160" y1="0" x2="160" y2="270" stroke="currentColor" strokeDasharray="4 4" strokeOpacity="0.15" />
          <line x1="320" y1="0" x2="320" y2="270" stroke="currentColor" strokeDasharray="4 4" strokeOpacity="0.15" />

          {/* Zone Labels */}
          <text x="80" y="22" textAnchor="middle" className="text-[10px] font-mono fill-[var(--ink-muted)]">
            ZONE 1 · LEFT
          </text>
          <text x="240" y="22" textAnchor="middle" className="text-[10px] font-mono fill-[var(--accent)] font-bold">
            ZONE 2 · CENTER
          </text>
          <text x="400" y="22" textAnchor="middle" className="text-[10px] font-mono fill-[var(--ink-muted)]">
            ZONE 3 · RIGHT
          </text>

          {/* Pedestrian Road Geometry (Stylized pavement lines) */}
          <path
            d="M 120 270 L 210 110 L 270 110 L 360 270"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.1"
            strokeWidth="1.5"
          />

          {/* HAZARD 1: Pothole detected in Center Zone (Animated Bounding Box) */}
          <g className={reducedMotion ? '' : 'animate-pulse'}>
            <rect
              x="185"
              y="135"
              width="110"
              height="70"
              rx="4"
              fill="var(--status-danger)"
              fillOpacity="0.08"
              stroke="var(--status-danger)"
              strokeWidth="1.5"
            />
            {/* Tag label */}
            <rect x="185" y="115" width="105" height="18" rx="2" fill="var(--status-danger)" />
            <text x="190" y="128" fill="#FFFFFF" className="text-[9px] font-mono font-bold tracking-tight">
              POTHOLE · 88%
            </text>
          </g>

          {/* HAZARD 2: Stairs detected ahead on Right edge */}
          <g>
            <rect
              x="345"
              y="95"
              width="90"
              height="80"
              rx="4"
              fill="var(--status-warning)"
              fillOpacity="0.06"
              stroke="var(--status-warning)"
              strokeWidth="1"
            />
            <rect x="345" y="78" width="95" height="16" rx="2" fill="var(--status-warning)" />
            <text x="350" y="89" fill="#FFFFFF" className="text-[9px] font-mono font-bold">
              STAIRS · 92%
            </text>
          </g>
        </svg>
      </div>

      {/* Spoken Alert & Real Audio Waveform Bar */}
      <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono font-bold uppercase text-[var(--accent)] tracking-wider">
            Spoken:
          </span>
          <span className="text-sm font-semibold text-[var(--ink)]">
            "Pothole, center"
          </span>
        </div>

        {/* Live Audio Waveform Animation (CSS keyframes) */}
        <div className="flex items-center gap-1 h-5" aria-hidden="true">
          {[12, 18, 8, 20, 14, 16, 9].map((height, i) => (
            <span
              key={i}
              className="w-1 bg-[var(--accent)] rounded-full transition-all"
              style={{
                height: `${height}px`,
                opacity: 0.85,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
