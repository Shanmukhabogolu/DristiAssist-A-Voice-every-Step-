import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { SupportedLanguage } from '../types';

interface BrandHeaderBandProps {
  title: string;
  subtitle: string;
  serifPrefix?: string;
  language: SupportedLanguage;
  onRefresh?: () => Promise<void> | void;
  refreshLabel?: string;
  isLoading?: boolean;
  variant?: 'charcoal' | 'transparent';
}

export const BrandHeaderBand: React.FC<BrandHeaderBandProps> = ({
  title,
  subtitle,
  serifPrefix,
  language,
  onRefresh,
  refreshLabel = 'Refresh Data',
  isLoading = false,
  variant = 'transparent',
}) => {
  const isHi = language === 'hi';
  const isTe = language === 'te';

  const [isRotating, setIsRotating] = useState(false);

  const handleRefreshClick = async () => {
    setIsRotating(true);
    setTimeout(() => setIsRotating(false), 450);
    if (onRefresh) {
      await onRefresh();
    }
  };

  const isTransparent = variant === 'transparent';

  return (
    <header
      className={`brand-header-band ${
        isTransparent ? 'brand-header-band-transparent' : 'border-b border-black/10'
      }`}
    >
      <div className="layout-container">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <h1 className="brand-band-heading animate-band-heading">
              {serifPrefix && !isHi && !isTe && (
                <span className="brand-band-serif-mark">{serifPrefix}</span>
              )}
              <span>{title}</span>
            </h1>
            <p className="brand-band-subtitle animate-band-subtitle">
              {subtitle}
            </p>
          </div>

          {onRefresh && (
            <div className="animate-band-subtitle shrink-0">
              <button
                onClick={handleRefreshClick}
                disabled={isLoading}
                className="brand-refresh-btn"
                aria-label={refreshLabel}
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isLoading
                      ? 'animate-spin'
                      : isRotating
                      ? 'rotate-180-once'
                      : ''
                  }`}
                  aria-hidden="true"
                />
                <span>{isLoading ? (isHi ? 'ताज़ा हो रहा है...' : 'Refreshing...') : refreshLabel}</span>
              </button>
            </div>
          )}
        </div>

        {/* 1px bottom rule drawn from left to right at 40% opacity */}
        <div className="brand-band-rule animate-band-rule" aria-hidden="true" />
      </div>
    </header>
  );
};
