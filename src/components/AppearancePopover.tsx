import React, { useState, useRef, useEffect } from 'react';
import { Sliders, Sun, Moon, Eye, Pause, Play, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../tokens/tokens';
import { SupportedLanguage } from '../types';

interface Props {
  language: SupportedLanguage;
  showTextMode?: 'auto' | 'always' | 'never';
}

export const AppearancePopover: React.FC<Props> = ({ language, showTextMode = 'auto' }) => {
  const { theme, setTheme, reducedMotion, setReducedMotion } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const themes: { id: AppTheme; labelEn: string; labelHi: string; labelTe: string; icon: React.ReactNode }[] = [
    {
      id: 'light',
      labelEn: 'Light',
      labelHi: 'लाइट (हल्का)',
      labelTe: 'లైట్',
      icon: <Sun className="w-4 h-4 text-amber-500" />,
    },
    {
      id: 'classic',
      labelEn: 'Classic (Editorial)',
      labelHi: 'क्लासिक (संपादकीय)',
      labelTe: 'క్లాసిక్',
      icon: <Moon className="w-4 h-4 text-rose-700" />,
    },
    {
      id: 'contrast',
      labelEn: 'High contrast (AAA)',
      labelHi: 'हाई कंट्रास्ट (AAA)',
      labelTe: 'హై కాంట్రాస్ట్',
      icon: <Eye className="w-4 h-4 text-sky-600" />,
    },
  ];

  const getLabel = (t: typeof themes[0]) => {
    if (language === 'te') return t.labelTe;
    if (language === 'hi') return t.labelHi;
    return t.labelEn;
  };

  const popoverTitle =
    language === 'te' ? 'రూపం & థీమ్' : language === 'hi' ? 'दिखावट एवं थीम' : 'Appearance';

  // Responsive text label visibility: icon only at 1280-1439px, icon + text at 1440px and wider
  const labelClasses =
    showTextMode === 'always'
      ? 'inline whitespace-nowrap'
      : showTextMode === 'never'
      ? 'hidden'
      : 'hidden min-[1440px]:inline whitespace-nowrap';

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button: 36px tall, compact, accessible, no red dot */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title={popoverTitle}
        aria-label={`${popoverTitle}: ${theme}, ${reducedMotion ? 'animations paused' : 'animations on'}`}
        className="h-9 min-h-[36px] px-2.5 sm:px-3 rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--ink)] text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer transition select-none focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
      >
        <Sliders className="w-3.5 h-3.5 text-[var(--ink-muted)] shrink-0" aria-hidden="true" />
        <span className={labelClasses}>{popoverTitle}</span>
      </button>

      {/* Popover Menu Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={popoverTitle}
          className="absolute right-0 mt-2 w-64 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-muted)] px-2 py-1 font-semibold">
            {language === 'te' ? 'థీమ్ ఎంపిక' : language === 'hi' ? 'थीम चयन' : 'Theme Selection'}
          </div>

          {/* Theme Options */}
          <div className="space-y-1 mt-1" role="radiogroup" aria-label="Themes">
            {themes.map((item) => {
              const isSelected = theme === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setTheme(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-[var(--radius-input)] text-xs font-medium cursor-pointer transition ${
                    isSelected
                      ? 'bg-[var(--accent-tint)] text-[var(--accent)] font-bold'
                      : 'hover:bg-[var(--surface-subtle)] text-[var(--ink)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{getLabel(item)}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="my-2 border-t border-[var(--border-subtle)]" />

          {/* Motion Toggle Option */}
          <div className="px-1 pt-1">
            <button
              type="button"
              onClick={() => setReducedMotion(!reducedMotion)}
              className="w-full flex items-center justify-between p-2 rounded-[var(--radius-input)] hover:bg-[var(--surface-subtle)] cursor-pointer text-xs transition"
              aria-pressed={reducedMotion}
            >
              <div className="flex items-center gap-2 text-[var(--ink)]">
                {reducedMotion ? (
                  <Play className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                ) : (
                  <Pause className="w-3.5 h-3.5 text-[var(--ink-muted)] shrink-0" />
                )}
                <span>
                  {language === 'te'
                    ? 'యానిమేషన్లు ఆపండి'
                    : language === 'hi'
                    ? 'एनीमेशन रोकें'
                    : 'Pause animations'}
                </span>
              </div>
              <div
                className={`w-8 h-4 rounded-full transition-colors relative ${
                  reducedMotion ? 'bg-[var(--accent)]' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${
                    reducedMotion ? 'left-4' : 'left-1'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
