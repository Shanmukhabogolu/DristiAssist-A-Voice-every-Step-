import React from 'react';
import { Camera, Cpu, Sliders, Volume2, ArrowRight } from 'lucide-react';

export const ArchitectureDiagram: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Camera Capture',
      spec: 'getUserMedia 640×480',
      note: 'Partitioned into 3 vertical thirds',
      icon: Camera,
    },
    {
      num: '02',
      title: 'On-Device CNN',
      spec: '128×128 RGB · 3.1 MB',
      note: '4.2 inferences/sec (WebGL / WASM)',
      icon: Cpu,
    },
    {
      num: '03',
      title: 'Priority Engine',
      spec: '4s cooldown · 60% threshold',
      note: 'Danger interruption hierarchy',
      icon: Sliders,
    },
    {
      num: '04',
      title: 'Spoken Audio',
      spec: 'Web Speech & Stereo Panner',
      note: 'English (en-IN) & Hindi (hi-IN)',
      icon: Volume2,
    },
  ];

  return (
    <div className="w-full rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-[var(--shadow-soft)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className="interactive-frame group p-5 rounded-[var(--radius-input)] bg-[var(--surface-subtle)] border border-[var(--border)] flex flex-col justify-between min-h-[170px] cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-[var(--accent)] tracking-wider">
                    {step.num}
                  </span>
                  <div className="w-8 h-8 rounded-[var(--radius-input)] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--ink)]">
                    <Icon className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
                  </div>
                </div>

                <h3 className="text-base font-bold text-[var(--ink)] mb-1">
                  {step.title}
                </h3>
                <span className="font-mono text-xs text-[var(--ink-muted)] block tabular-data">
                  {step.spec}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
                <span className="text-xs text-[var(--ink-muted)] leading-tight block">
                  {step.note}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Architecture Footnote with Trust Guarantee */}
      <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-[var(--ink-muted)] gap-2">
        <span>Processing latency: ~68ms per frame [measured on Pixel 6a]</span>
        <span className="text-[var(--status-success)] font-semibold">
          ✓ 100% on-device · Zero network transmission of video
        </span>
      </div>
    </div>
  );
};
