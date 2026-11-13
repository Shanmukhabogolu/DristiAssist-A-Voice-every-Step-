import React, { useState, useEffect } from 'react';
import { AppSettings } from './types';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Navigation } from './components/Navigation';
import { HomeView } from './components/HomeView';
import { AssistScreen } from './components/AssistScreen';
import { WalkAssistScreen } from './components/WalkAssistScreen';
import { HowItWorksView } from './components/HowItWorksView';
import { InstallGuideView } from './components/InstallGuideView';
import { NgoSchoolView } from './components/NgoSchoolView';
import { ModelCardView } from './components/ModelCardView';
import { AdminDashboard } from './components/AdminDashboard';
import { DesignStyleGuide } from './components/DesignStyleGuide';
import { SettingsModal } from './components/SettingsModal';
import { SafeWalkingMap } from './components/SafeWalkingMap';
import { AIAssistantHub } from './components/AIAssistantHub';
import { PageTransition } from './components/PageTransition';
import { ShieldAlert, Mail, Pause, Play, Heart } from 'lucide-react';

function AppContent() {
  const getTabFromPath = (path: string): string => {
    switch (path) {
      case '/': return 'home';
      case '/how-it-works': return 'how-it-works';
      case '/walk': return 'walk';
      case '/assist': return 'walk';
      case '/safe-map':
      case '/maps': return 'maps';
      case '/assistant': return 'assistant';
      case '/model-card': return 'model-card';
      case '/schools':
      case '/ngo-schools': return 'ngo-schools';
      case '/dashboard':
      case '/admin': return 'admin';
      case '/install': return 'install';
      case '/design': return 'design';
      default: return 'home';
    }
  };

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return getTabFromPath(window.location.pathname);
    }
    return 'home';
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(false);
  const [isOpeningApp, setIsOpeningApp] = useState<boolean>(false);
  const [showCircularReveal, setShowCircularReveal] = useState<boolean>(false);
  const [revealCoords, setRevealCoords] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [ariaAnnouncement, setAriaAnnouncement] = useState<string>('');
  const { theme, setTheme, reducedMotion, setReducedMotion } = useTheme();

  // Persistent settings state
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('drishti_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      language: 'en',
      confidenceThreshold: 0.60,
      cooldownSeconds: 4,
      speechRate: 1.05,
      speechPitch: 1.0,
      speechVolume: 1.0,
      enableSpatialAudio: true,
      enableHaptics: true,
      keepScreenAwake: true,
      highContrastTheme: false,
      batterySaverCameraOff: false,
      alwaysListenVoiceCommands: false,
      useSimulationStream: false,
      simulationPreset: 'pothole',
    };
  });

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('drishti_settings', JSON.stringify(updated));
      return updated;
    });
  };

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const tab = getTabFromPath(window.location.pathname);
      setActiveTab(tab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    document.documentElement.lang = settings.language;
  }, [settings.language]);

  useEffect(() => {
    const handleQuotaExceeded = () => {
      setIsQuotaExceeded(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  // Signature "Open the app" hero sequence (Section 2.2)
  const handleOpenApp = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (isOpeningApp) return;

    // Calculate click coordinates for circular reveal
    if (e && 'clientX' in e && e.clientX && e.clientY) {
      setRevealCoords({ x: e.clientX, y: e.clientY });
    } else if (typeof window !== 'undefined') {
      setRevealCoords({ x: window.innerWidth - 80, y: 32 });
    }

    if (reducedMotion) {
      setActiveTab('walk');
      if (typeof window !== 'undefined') {
        window.history.pushState({ tabId: 'walk' }, '', '/walk');
      }
      setAriaAnnouncement('Walk Assist ready');
      return;
    }

    // Step 1 (0-120ms): Press-in, label becomes "Opening...", button progress line starts
    setIsOpeningApp(true);

    // Step 2 (120-250ms): Circular reveal begins in charcoal brand colour
    setTimeout(() => {
      setShowCircularReveal(true);
    }, 120);

    // Step 3 (250-650ms): Resolve into Walk Assist screen
    setTimeout(() => {
      setActiveTab('walk');
      if (typeof window !== 'undefined') {
        window.history.pushState({ tabId: 'walk' }, '', '/walk');
      }
    }, 360);

    // Step 4: Finish transition, announce "Walk Assist ready"
    setTimeout(() => {
      setShowCircularReveal(false);
      setIsOpeningApp(false);
      setAriaAnnouncement('Walk Assist ready');
    }, 650);
  };

  const navigateToTab = (tabId: string, path?: string) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined' && path) {
      window.history.pushState({ tabId }, '', path);
    }
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--ink)] transition-colors duration-[var(--duration-theme)] overflow-x-hidden">
      
      {/* Aria-Live region for screen-reader announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {ariaAnnouncement}
      </div>

      {/* WCAG 2.2 AA Skip to Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-[var(--accent)] focus:text-[var(--accent-text)] focus:font-bold focus:rounded-[var(--radius-input)] focus:shadow-xl focus:outline-none"
      >
        {settings.language === 'hi'
          ? 'सीधे मुख्य सामग्री पर जाएं'
          : settings.language === 'te'
          ? 'ప్రధాన విషయానికి వెళ్లండి'
          : 'Skip to main content'}
      </a>

      {/* Top Bar Navigation (CSS Grid, responsive, no horizontal overflow) */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={settings.language}
        setLanguage={(lang) => updateSettings({ language: lang })}
        onOpenApp={handleOpenApp}
        isOpeningApp={isOpeningApp}
      />

      {/* Full-viewport Circular Reveal Transition for "Open the app" signature animation */}
      {showCircularReveal && (
        <div
          className="fixed inset-0 z-[var(--z-toast)] pointer-events-none transition-all duration-300"
          style={{
            backgroundColor: 'var(--brand-charcoal, #2B2B2B)',
            clipPath: `circle(150% at ${revealCoords.x}px ${revealCoords.y}px)`,
            transition: 'clip-path 450ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          aria-hidden="true"
        />
      )}

      {/* Sticky Google Maps Quota Banner */}
      {isQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-16 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Main Content Area with Directional Route Transitions */}
      <main
        id="main-content"
        className={`flex-1 w-full transition-opacity duration-200 ${
          isOpeningApp && !showCircularReveal ? 'opacity-60' : 'opacity-100'
        }`}
        tabIndex={-1}
      >
        <PageTransition currentKey={activeTab}>
          {activeTab === 'home' && (
            <HomeView
              language={settings.language}
              onOpenApp={handleOpenApp}
              onNavigateTab={navigateToTab}
            />
          )}
          {(activeTab === 'walk' || activeTab === 'assist') && (
            <WalkAssistScreen
              settings={settings}
              updateSettings={updateSettings}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          )}
          {activeTab === 'how-it-works' && (
            <HowItWorksView language={settings.language} />
          )}
          {activeTab === 'maps' && (
            <div className="layout-container py-12 max-w-3xl">
              <div className="card-warm p-8 rounded-2xl space-y-4">
                <span className="text-xs font-mono font-bold text-[var(--icon-color)] uppercase tracking-wider">
                  Roadmap Milestone
                </span>
                <h2 className="text-2xl font-bold text-[var(--text-heading)]">
                  Safe Walking Map (Deferred to docs/ROADMAP.md)
                </h2>
                <p className="text-sm text-[var(--text-body)] leading-relaxed">
                  In accordance with our zero-invented-data policy, the GIS-based safe walking map has been moved to our product roadmap. It will launch once municipal GIS tactile paving survey datasets are verified with local urban authorities.
                </p>
                <button
                  onClick={() => navigateToTab('how-it-works', '/how-it-works')}
                  className="px-4 py-2 rounded-lg bg-[var(--brand-charcoal)] text-[var(--brand-offwhite)] text-xs font-bold hover:bg-[var(--brand-charcoal-2)] transition"
                >
                  Explore CNN Architecture & How It Works →
                </button>
              </div>
            </div>
          )}
          {activeTab === 'assistant' && (
            <AIAssistantHub language={settings.language} />
          )}
          {activeTab === 'install' && (
            <InstallGuideView language={settings.language} />
          )}
          {activeTab === 'ngo-schools' && (
            <NgoSchoolView language={settings.language} />
          )}
          {activeTab === 'model-card' && (
            <ModelCardView language={settings.language} />
          )}
          {activeTab === 'design' && (
            <DesignStyleGuide />
          )}
          {activeTab === 'admin' && (
            <AdminDashboard language={settings.language} />
          )}
        </PageTransition>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        updateSettings={updateSettings}
      />

      {/* Professional Product Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-12 px-4 text-xs text-[var(--ink-muted)]">
        <div className="layout-container space-y-8">
          
          {/* Brand Intro with Official Logo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-[var(--border)] bg-[#1e2022] shadow-sm shrink-0">
                <img
                  src="/assets/aistudio/DA_d64034e2.jpeg"
                  alt="DrishtiAssist Logo: DA - A Voice For Every Step"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="font-heading font-extrabold text-lg text-[var(--ink)] block tracking-tight">
                  DrishtiAssist
                </span>
                <span className="font-mono text-xs text-[var(--accent)] font-semibold tracking-wider uppercase block">
                  A Voice For Every Step
                </span>
              </div>
            </div>
            <p className="text-xs text-[var(--ink-muted)] max-w-md leading-relaxed">
              Accessible, on-device road hazard detection and voice guidance for blind and low-vision pedestrians across India.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pb-8 border-b border-[var(--border-subtle)]">
            <div className="space-y-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--ink)] block">
                Product
              </span>
              <ul className="space-y-2 text-xs">
                <li>
                  <button onClick={() => navigateToTab('walk', '/walk')} className="hover:text-[var(--ink)] cursor-pointer">
                    Open Walk Assistant (/walk)
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('install')} className="hover:text-[var(--ink)] cursor-pointer">
                    Install PWA (Offline)
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('design')} className="hover:text-[var(--ink)] cursor-pointer">
                    Living Style Guide (/design)
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--ink)] block">
                Research
              </span>
              <ul className="space-y-2 text-xs">
                <li>
                  <button onClick={() => setActiveTab('model-card')} className="hover:text-[var(--ink)] cursor-pointer">
                    Model Card & Recall
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('how-it-works')} className="hover:text-[var(--ink)] cursor-pointer">
                    Architecture Diagram
                  </button>
                </li>
                <li>
                  <span className="tabular-data">CNN Size: 3.1 MB</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--ink)] block">
                Institutions
              </span>
              <ul className="space-y-2 text-xs">
                <li>
                  <button onClick={() => setActiveTab('ngo-schools')} className="hover:text-[var(--ink)] cursor-pointer">
                    For Blind Schools & NGOs
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('admin')} className="hover:text-[var(--ink)] cursor-pointer">
                    Quality Telemetry
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--ink)] block">
                Trust & Standards
              </span>
              <ul className="space-y-2 text-xs">
                <li>WCAG 2.2 AA / AAA</li>
                <li>India DPDP Act 2023</li>
                <li>License: Apache-2.0</li>
                <li>Version: v1.2.0</li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar: Disclaimer, Motion Control, Region, Email */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            
            <div className="flex items-center gap-2 text-left">
              <ShieldAlert className="w-4 h-4 text-[var(--status-warning)] shrink-0" aria-hidden="true" />
              <span>
                {settings.language === 'hi'
                  ? 'दृष्टि असिस्ट एक सहायक उपकरण है। मार्ग की शारीरिक पुष्टि के लिए हमेशा अपनी सफेद छड़ी आगे चलाएं।'
                  : 'Assistive aid only. Always sweep your white cane forward for tactile ground confirmation.'}
              </span>
            </div>

            <div className="flex items-center gap-4 shrink-0 font-mono text-[11px]">
              
              {/* Visible "Pause animations" toggle as requested by Section 5 */}
              <button
                onClick={() => setReducedMotion(!reducedMotion)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--ink)] cursor-pointer"
                aria-pressed={reducedMotion}
              >
                {reducedMotion ? <Play className="w-3 h-3 text-[var(--accent)]" /> : <Pause className="w-3 h-3" />}
                <span>{reducedMotion ? 'Play motion' : 'Pause animations'}</span>
              </button>

              <span>Haryana, India</span>
              <span>·</span>
              <a
                href="mailto:shanmukhabogolu@gmail.com"
                className="hover:text-[var(--accent)] transition flex items-center gap-1"
              >
                <Mail className="w-3 h-3" />
                <span>Contact</span>
              </a>
            </div>

          </div>

        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
