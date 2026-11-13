import React, { useEffect, useRef } from 'react';
import { X, ArrowRight, Sun, Moon, Eye, Pause, Play, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SupportedLanguage } from '../types';
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../tokens/tokens';
import { Button } from './ui/Button';

interface NavItem {
  id: string;
  path: string;
  labelEn: string;
  labelHi: string;
  labelTe: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tabId: string, path: string) => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  onOpenApp: () => void;
  navItems: NavItem[];
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export const MobileMenuSheet: React.FC<Props> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  language,
  setLanguage,
  onOpenApp,
  navItems,
  triggerRef,
}) => {
  const { theme, setTheme, reducedMotion, setReducedMotion } = useTheme();
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap & Escape key & focus return to trigger
  useEffect(() => {
    if (!isOpen) return;

    // Focus close button on open
    requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }

      if (e.key === 'Tab' && sheetRef.current) {
        const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    onClose();
    // Return focus to menu trigger button
    if (triggerRef?.current) {
      setTimeout(() => {
        triggerRef.current?.focus();
      }, 50);
    }
  };

  const getLabel = (item: NavItem) => {
    if (language === 'te') return item.labelTe;
    if (language === 'hi') return item.labelHi;
    return item.labelEn;
  };

  const isHi = language === 'hi';
  const isTe = language === 'te';

  // Duration: 250ms standard, 100ms on reduced motion
  const animDuration = reducedMotion ? 0.1 : 0.25;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[var(--z-modal)] flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
          aria-label={isTe ? 'మెనూ' : isHi ? 'नेविगेशन मेनू' : 'Navigation Menu'}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: animDuration }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Full-Height Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: animDuration, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-sm ml-auto h-full bg-[var(--surface)] border-l border-[var(--border)] flex flex-col z-10 shadow-2xl"
          >
            {/* Header: Title and Close button */}
            <div className="h-16 px-6 border-b border-[var(--border)] flex items-center justify-between shrink-0">
              <span className="font-heading font-bold text-lg text-[var(--ink)]">
                {isTe ? 'నావిగేషన్' : isHi ? 'नेविगेशन' : 'Navigation'}
              </span>
              <button
                ref={closeButtonRef}
                onClick={handleClose}
                className="p-2 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition cursor-pointer"
                aria-label={isTe ? 'మూసివేయి' : isHi ? 'बंद करें' : 'Close menu'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Navigation Links (7 links, 56px tall touch target, 18px text per spec) */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              <nav aria-label="Mobile Navigation Links">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <a
                      key={item.id}
                      href={item.path}
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectTab(item.id, item.path);
                        handleClose();
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      className={`relative flex items-center min-h-[56px] px-4 rounded-xl text-[18px] font-medium transition cursor-pointer ${
                        isActive
                          ? 'bg-[var(--accent-tint)] text-[var(--accent)] font-semibold'
                          : 'text-[var(--ink)] hover:bg-[var(--surface-subtle)]'
                      }`}
                    >
                      {/* Left accent bar for active item */}
                      {isActive && (
                        <motion.span
                          layoutId="active-mobile-bar"
                          className="absolute left-0 top-2 bottom-2 w-1.5 bg-[var(--accent)] rounded-r"
                          transition={{ duration: 0.2 }}
                        />
                      )}
                      <span className="tracking-wide">{getLabel(item)}</span>
                    </a>
                  );
                })}
              </nav>

              <div className="my-4 border-t border-[var(--border-subtle)]" />

              {/* Language Switcher inside Sheet */}
              <div className="px-2 space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--ink-muted)] block font-semibold">
                  {isTe ? 'భాష ఎంచుకోండి' : isHi ? 'भाषा चुनें' : 'Language'}
                </span>
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)]">
                  {(['en', 'hi', 'te'] as SupportedLanguage[]).map((langKey) => {
                    const isSelected = language === langKey;
                    const labels = { en: 'EN', hi: 'हिंदी', te: 'తెలుగు' };
                    return (
                      <button
                        key={langKey}
                        onClick={() => setLanguage(langKey)}
                        className={`h-9 rounded-lg text-xs font-semibold cursor-pointer transition ${
                          isSelected
                            ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm font-bold'
                            : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                        }`}
                        aria-pressed={isSelected}
                      >
                        {labels[langKey]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Appearance inside Sheet */}
              <div className="px-2 pt-4 space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--ink-muted)] block font-semibold">
                  {isTe ? 'రూపం & థీమ్' : isHi ? 'दिखावट एवं थीम' : 'Appearance'}
                </span>
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)]">
                  {(['light', 'classic', 'contrast'] as AppTheme[]).map((tKey) => {
                    const isSelected = theme === tKey;
                    const labels = {
                      light: isTe ? 'లైట్' : isHi ? 'लाइट' : 'Light',
                      classic: isTe ? 'క్లాసిక్' : isHi ? 'क्लासिक' : 'Classic',
                      contrast: isTe ? 'కంట్రాస్ట్' : isHi ? 'कंट्रास्ट' : 'Contrast',
                    };
                    return (
                      <button
                        key={tKey}
                        onClick={() => setTheme(tKey)}
                        className={`h-9 rounded-lg text-xs font-semibold cursor-pointer transition ${
                          isSelected
                            ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm font-bold'
                            : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                        }`}
                        aria-pressed={isSelected}
                      >
                        {labels[tKey]}
                      </button>
                    );
                  })}
                </div>

                {/* Pause Animations Toggle */}
                <button
                  onClick={() => setReducedMotion(!reducedMotion)}
                  className="w-full flex items-center justify-between p-3 mt-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--ink)] cursor-pointer"
                  aria-pressed={reducedMotion}
                >
                  <div className="flex items-center gap-2">
                    {reducedMotion ? <Play className="w-4 h-4 text-[var(--accent)]" /> : <Pause className="w-4 h-4" />}
                    <span>{isTe ? 'యానిమేషన్లు ఆపండి' : isHi ? 'एनीमेशन रोकें' : 'Pause animations'}</span>
                  </div>
                  <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                    {reducedMotion ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            </div>

            {/* Pinned Bottom Action: "Open the app" */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)] shrink-0">
              <Button
                size="lg"
                className="w-full justify-center"
                hasArrow
                onClick={() => {
                  onClose();
                  onOpenApp();
                }}
              >
                {isTe ? 'యాప్ తెరవండి' : isHi ? 'ऐप खोलें' : 'Open the app'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
