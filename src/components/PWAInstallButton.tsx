import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { SupportedLanguage } from '../types';
import { Download, HelpCircle, X } from 'lucide-react';

interface Props {
  language?: SupportedLanguage;
}

export const PWAInstallButton: React.FC<Props> = ({ language = 'en' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const getInstallLabel = () => {
    if (language === 'te') return 'యాప్ ఇన్‌స్టాల్ చేయండి';
    if (language === 'hi') return 'ऐप इंस्टॉल करें';
    return 'Install App';
  };

  const getIosLabel = () => {
    if (language === 'te') return 'iOS పై చేర్చండి';
    if (language === 'hi') return 'iOS पर जोड़ें';
    return 'Add to iOS';
  };

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="btn-micro flex items-center gap-2 rounded-[var(--radius-input)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] font-semibold px-3 py-1.5 text-xs shadow-[var(--shadow-soft)] transition whitespace-nowrap shrink-0 cursor-pointer"
        aria-label={getInstallLabel()}
      >
        <Download className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{getInstallLabel()}</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="btn-micro flex items-center gap-1.5 rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition whitespace-nowrap shrink-0 cursor-pointer"
          aria-label={getIosLabel()}
        >
          <HelpCircle className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />
          <span>{getIosLabel()}</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-guide-title"
            className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <div className="w-full max-w-sm rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] p-6 shadow-2xl text-[var(--ink)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <h3 id="ios-guide-title" className="text-base font-bold text-[var(--ink)]">
                  {language === 'te' ? 'iPhone / iPad పై ఇన్‌స్టాల్' : language === 'hi' ? 'iPhone / iPad पर इंस्टॉल' : 'Install on iPhone / iPad'}
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-[var(--ink-muted)] leading-relaxed">
                <p>1. Tap the <strong>Share</strong> button in Safari toolbar.</p>
                <p>2. Scroll down and tap <strong>Add to Home Screen</strong>.</p>
                <p>3. Tap <strong>Add</strong>. DrishtiAssist will now open full-screen offline.</p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-[var(--radius-input)] bg-[var(--accent)] py-2 text-xs sm:text-sm font-bold text-[var(--accent-text)] cursor-pointer"
              >
                {language === 'te' ? 'సరే' : language === 'hi' ? 'समझ आ गया' : 'Got it'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
