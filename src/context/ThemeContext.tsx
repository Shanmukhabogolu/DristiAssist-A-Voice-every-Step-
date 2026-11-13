import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppTheme, THEMES } from '../tokens/tokens';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  reducedMotion: boolean;
  setReducedMotion: (val: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('drishti_theme') as AppTheme;
      if (saved && (saved === 'light' || saved === 'classic' || saved === 'contrast')) {
        return saved;
      }
    }
    return 'light';
  });

  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('drishti_reduced_motion');
      if (saved !== null) {
        return saved === 'true';
      }
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  const setTheme = (nextTheme: AppTheme) => {
    if (nextTheme === theme) return;

    const applyTheme = () => {
      setThemeState(nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('drishti_theme', nextTheme);

      // Update browser theme-color meta tag
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', THEMES[nextTheme].colors.bg);
      }
    };

    // Use View Transitions API if supported for seamless 300ms color crossfade
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as any).startViewTransition(() => {
        applyTheme();
      });
    } else {
      applyTheme();
    }
  };

  const setReducedMotion = (val: boolean) => {
    setReducedMotionState(val);
    if (val) {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    } else {
      document.documentElement.removeAttribute('data-reduced-motion');
    }
    localStorage.setItem('drishti_reduced_motion', String(val));
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, reducedMotion, setReducedMotion }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
