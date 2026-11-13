import React, { useState, useEffect, useRef } from 'react';
import { Globe, Menu } from 'lucide-react';
import { motion } from 'motion/react';
import { SupportedLanguage } from '../types';
import { AppearancePopover } from './AppearancePopover';
import { MobileMenuSheet } from './MobileMenuSheet';
import { SignInModal } from './SignInModal';
import { Button } from './ui/Button';

export interface NavItem {
  id: string;
  path: string;
  labelEn: string;
  labelHi: string;
  labelTe: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', path: '/', labelEn: 'Home', labelHi: 'होम', labelTe: 'హోమ్' },
  { id: 'how-it-works', path: '/how-it-works', labelEn: 'How it works', labelHi: 'कार्यप्रणाली', labelTe: 'ఎలా పనిచేస్తుంది' },
  { id: 'walk', path: '/walk', labelEn: 'Walk Assist', labelHi: 'वॉक असिस्ट', labelTe: 'వాక్ అసిస్ట్' },
  { id: 'model-card', path: '/model-card', labelEn: 'Model Card', labelHi: 'मॉडल कार्ड', labelTe: 'మోడల్ వివరాలు' },
  { id: 'ngo-schools', path: '/schools', labelEn: 'For Schools', labelHi: 'विद्यालय', labelTe: 'పాఠశాలలు' },
  { id: 'admin', path: '/dashboard', labelEn: 'Dashboard', labelHi: 'डैशबोर्ड', labelTe: 'డాష్‌బోర్డ్' },
];

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  onOpenApp: () => void;
  isOpeningApp?: boolean;
}

export const Navigation: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  onOpenApp,
  isOpeningApp = false,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('drishti_auth_user');
    }
    return false;
  });

  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Monitor scroll for header compaction beyond 80px
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (tabId: string, path: string, e?: React.MouseEvent) => {
    if (e && (e.metaKey || e.ctrlKey || e.button !== 0)) {
      return; // Allow native middle click or open in new tab
    }
    if (e) e.preventDefault();

    if (tabId === 'admin' && !isSignedIn) {
      setIsSignInOpen(true);
      return;
    }

    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      window.history.pushState({ tabId }, '', path);
    }
  };

  const handleSignInSuccess = () => {
    setIsSignedIn(true);
    setIsSignInOpen(false);
    setActiveTab('admin');
    if (typeof window !== 'undefined') {
      window.history.pushState({ tabId: 'admin' }, '', '/dashboard');
    }
  };

  const getLabel = (item: NavItem) => {
    if (language === 'te') return item.labelTe;
    if (language === 'hi') return item.labelHi;
    return item.labelEn;
  };

  const isHi = language === 'hi';
  const isTe = language === 'te';

  const openAppLabel = isOpeningApp
    ? isTe
      ? 'ఓపెన్ అవుతోంది…'
      : isHi
      ? 'खुल रहा है…'
      : 'Opening…'
    : isTe
    ? 'యాప్ తెరవండి'
    : isHi
    ? 'ऐप खोलें'
    : 'Open the app';

  return (
    <>
      <header
        className={`sticky top-0 z-[var(--z-header)] w-full border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md transition-all duration-200 select-none ${
          isScrolled ? 'shadow-sm' : ''
        }`}
      >
        {/* ====================================================================
            LAYOUT A: 1280px and wider (Single row: logo | nav | actions)
            Container: max-w-[1440px] 2xl:max-w-[1600px] ensures zero clipping
            ==================================================================== */}
        <div className="hidden xl:grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-6 max-w-[1440px] 2xl:max-w-[1600px] w-full mx-auto px-6 h-16 min-[1440px]:h-[72px]">
          
          {/* 1. Logo (≤260px wide: monogram 40px, wordmark 22px, tagline 10px) */}
          <a
            href="/"
            onClick={(e) => handleNavClick('home', '/', e)}
            className="flex items-center gap-3 text-left cursor-pointer group focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded-[var(--radius-input)] p-1 shrink-0 max-w-[260px]"
            aria-label="DrishtiAssist Home"
          >
            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-[var(--border)] bg-[#1e2022] shadow-sm shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <img
                src="/assets/aistudio/DA_d64034e2.jpeg"
                alt="DrishtiAssist Logo: DA"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-[20px] min-[1440px]:text-[22px] tracking-tight leading-none text-[var(--ink)]">
                {isTe ? 'దృష్టి అసిస్ట్' : isHi ? 'दृष्टि असिस्ट' : 'DRISHTIASSIST'}
              </span>
              <span className="font-mono text-[10px] text-[var(--ink-muted)] tracking-wider uppercase mt-1">
                A VOICE FOR EVERY STEP
              </span>
            </div>
          </a>

          {/* 2. Nav: Seven Links, 15px (14px TE/HI), weight 500, sentence case, no clipping/overflow */}
          <nav
            className="flex items-center justify-center gap-5 min-[1440px]:gap-6 px-2 py-1 shrink-0"
            aria-label="Main Navigation"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <a
                  key={item.id}
                  href={item.path}
                  onClick={(e) => handleNavClick(item.id, item.path, e)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative px-2.5 py-1.5 rounded-[var(--radius-input)] ${
                    isTe || isHi ? 'text-[14px]' : 'text-[15px]'
                  } [letter-spacing:0.02em] whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                    isActive
                      ? 'text-[var(--accent)] font-semibold'
                      : 'text-[var(--ink-muted)] hover:text-[var(--ink)] font-medium'
                  }`}
                >
                  <span className="relative z-10">{getLabel(item)}</span>

                  {/* Active Link Sliding Underline Indicator */}
                  {isActive && (
                    <motion.span
                      layoutId="active-nav-underline-desktop"
                      className="absolute bottom-0 left-2.5 right-2.5 h-[2px] bg-[var(--accent)] rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      aria-hidden="true"
                    />
                  )}
                </a>
              );
            })}
          </nav>

          {/* 3. Actions: Segmented Language Control + Appearance + 40px Open the App CTA */}
          <div className="flex items-center gap-3 shrink-0 justify-end">
            
            {/* Segmented language control (EN | हिंदी | తెలుగు), 36px tall */}
            <div
              className="flex items-center h-9 min-h-[36px] rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface-subtle)] p-0.5 text-xs font-mono"
              role="group"
              aria-label="Language selection"
            >
              {(['en', 'hi', 'te'] as SupportedLanguage[]).map((langKey) => {
                const isSelected = language === langKey;
                const labels = { en: 'EN', hi: 'हिंदी', te: 'తెలుగు' };
                return (
                  <button
                    key={langKey}
                    type="button"
                    onClick={() => setLanguage(langKey)}
                    className={`h-7 px-2.5 rounded-[var(--radius-input)] transition cursor-pointer font-medium ${
                      isSelected
                        ? 'bg-[var(--surface)] text-[var(--ink)] font-bold shadow-[var(--shadow-soft)]'
                        : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                    }`}
                    aria-pressed={isSelected}
                  >
                    {labels[langKey]}
                  </button>
                );
              })}
            </div>

            {/* Appearance button (icon only 1280-1439px, icon + text at 1440px+, red dot removed) */}
            <AppearancePopover language={language} showTextMode="auto" />

            {/* Primary "Open the app" CTA (40px tall, single line) */}
            <Button
              size="sm"
              variant="primary"
              hasArrow={!isOpeningApp}
              isLoading={isOpeningApp}
              onClick={onOpenApp}
              className="min-h-[40px] h-10 px-4 text-xs font-bold whitespace-nowrap shrink-0"
            >
              {openAppLabel}
            </Button>
          </div>

        </div>

        {/* ====================================================================
            LAYOUT B: 1024px to 1279px (Two-row sticky header, all 7 links visible)
            Row 1 (56px): Logo left, actions right
            Row 2 (44px): All 7 nav links evenly spaced across max-w-[1100px]
            ==================================================================== */}
        <div className="hidden lg:flex xl:hidden flex-col w-full">
          
          {/* Row 1: Logo (left) | Actions (right) - 56px */}
          <div className="h-14 px-6 flex items-center justify-between border-b border-[var(--border-subtle)]/60">
            {/* Logo */}
            <a
              href="/"
              onClick={(e) => handleNavClick('home', '/', e)}
              className="flex items-center gap-3 text-left cursor-pointer group focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded-[var(--radius-input)] shrink-0"
              aria-label="DrishtiAssist Home"
            >
              <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-[var(--border)] bg-[#1e2022] shadow-sm shrink-0 flex items-center justify-center">
                <img
                  src="/assets/aistudio/DA_d64034e2.jpeg"
                  alt="DrishtiAssist Logo: DA"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-bold text-lg tracking-tight leading-none text-[var(--ink)]">
                  {isTe ? 'దృష్టి అసిస్ట్' : isHi ? 'दृष्टि असिस्ट' : 'DRISHTIASSIST'}
                </span>
                {!isScrolled && (
                  <span className="font-mono text-[9px] text-[var(--ink-muted)] tracking-wider uppercase mt-0.5">
                    A VOICE FOR EVERY STEP
                  </span>
                )}
              </div>
            </a>

            {/* Actions: Language + Appearance + Open App */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Segmented language control */}
              <div
                className="flex items-center h-8 min-h-[32px] rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface-subtle)] p-0.5 text-xs font-mono"
                role="group"
                aria-label="Language selection"
              >
                {(['en', 'hi', 'te'] as SupportedLanguage[]).map((langKey) => {
                  const isSelected = language === langKey;
                  const labels = { en: 'EN', hi: 'हिंदी', te: 'తెలుగు' };
                  return (
                    <button
                      key={langKey}
                      type="button"
                      onClick={() => setLanguage(langKey)}
                      className={`h-6 px-2 rounded-[var(--radius-input)] transition cursor-pointer font-medium ${
                        isSelected
                          ? 'bg-[var(--surface)] text-[var(--ink)] font-bold shadow-[var(--shadow-soft)]'
                          : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                      }`}
                      aria-pressed={isSelected}
                    >
                      {labels[langKey]}
                    </button>
                  );
                })}
              </div>

              {/* Appearance button */}
              <AppearancePopover language={language} showTextMode="never" />

              {/* Open the App Button */}
              <Button
                size="sm"
                variant="primary"
                hasArrow={!isOpeningApp}
                isLoading={isOpeningApp}
                onClick={onOpenApp}
                className="min-h-[36px] h-9 px-3.5 text-xs font-bold whitespace-nowrap shrink-0"
              >
                {openAppLabel}
              </Button>
            </div>
          </div>

          {/* Row 2: All Seven Nav Links spread across max-w-[1100px] - 44px */}
          <div className="h-11 px-6 flex items-center justify-center bg-[var(--surface)]/60">
            <nav
              className="flex items-center justify-between w-full max-w-[1100px] px-2 py-1"
              aria-label="Secondary Bar Navigation"
            >
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <a
                    key={item.id}
                    href={item.path}
                    onClick={(e) => handleNavClick(item.id, item.path, e)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative px-3 py-1 rounded-[var(--radius-input)] ${
                      isTe || isHi ? 'text-[14px]' : 'text-[15px]'
                    } [letter-spacing:0.02em] whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                      isActive
                        ? 'text-[var(--accent)] font-semibold'
                        : 'text-[var(--ink-muted)] hover:text-[var(--ink)] font-medium'
                    }`}
                  >
                    <span className="relative z-10">{getLabel(item)}</span>

                    {isActive && (
                      <motion.span
                        layoutId="active-nav-underline-row2"
                        className="absolute bottom-0 left-3 right-3 h-[2px] bg-[var(--accent)] rounded-full"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        aria-hidden="true"
                      />
                    )}
                  </a>
                );
              })}
            </nav>
          </div>

        </div>

        {/* ====================================================================
            LAYOUT C: Below 1024px (Mobile & Tablet Portrait: 320px to 1023px)
            Header: Logo left (tagline hidden on small screens), 44px Menu button right
            ==================================================================== */}
        <div className="flex lg:hidden items-center justify-between px-4 sm:px-6 h-14 sm:h-16 w-full">
          
          {/* Logo */}
          <a
            href="/"
            onClick={(e) => handleNavClick('home', '/', e)}
            className="flex items-center gap-2.5 text-left cursor-pointer group focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded-[var(--radius-input)] p-1 shrink-0"
            aria-label="DrishtiAssist Home"
          >
            <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-[var(--border)] bg-[#1e2022] shadow-sm shrink-0 flex items-center justify-center">
              <img
                src="/assets/aistudio/DA_d64034e2.jpeg"
                alt="DrishtiAssist Logo: DA"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-base sm:text-lg tracking-tight leading-none text-[var(--ink)]">
                {isTe ? 'దృష్టి అసిస్ట్' : isHi ? 'दृष्टि असिस्ट' : 'DrishtiAssist'}
              </span>
              <span className="hidden sm:inline font-mono text-[9px] text-[var(--ink-muted)] tracking-wider uppercase mt-0.5">
                A Voice For Every Step
              </span>
            </div>
          </a>

          {/* Right: 44px Accessible Menu Button */}
          <div className="flex items-center gap-2">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-sheet"
              aria-label={isTe ? 'మెనూ తెరవండి' : isHi ? 'नेविगेशन मेनू खोलें' : 'Open navigation menu'}
              className="min-h-[44px] min-w-[44px] h-11 px-3.5 rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--ink)] text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition select-none focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              <Menu className="w-5 h-5 text-[var(--ink)] shrink-0" aria-hidden="true" />
              <span>{isTe ? 'మెనూ' : isHi ? 'मेनू' : 'Menu'}</span>
            </button>
          </div>

        </div>

      </header>

      {/* Full-Height Mobile Menu Sheet (below 1024px) */}
      <MobileMenuSheet
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeTab={activeTab}
        onSelectTab={handleNavClick}
        language={language}
        setLanguage={setLanguage}
        onOpenApp={onOpenApp}
        navItems={NAV_ITEMS}
        triggerRef={menuButtonRef}
      />

      {/* Dashboard Sign-In Gate Modal */}
      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onSuccess={handleSignInSuccess}
        language={language}
      />
    </>
  );
};
