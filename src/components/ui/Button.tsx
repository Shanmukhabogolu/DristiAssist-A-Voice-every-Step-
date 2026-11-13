import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Check, ArrowRight } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon-only' | 'link-style';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isSuccess?: boolean;
  successText?: string;
  hasArrow?: boolean;
  icon?: React.ReactNode;
  'aria-label'?: string;
  enableHaptics?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isSuccess: controlledSuccess,
      successText = 'Done',
      hasArrow = false,
      icon,
      disabled,
      className = '',
      onClick,
      enableHaptics = true,
      ...props
    },
    ref
  ) => {
    const [internalSuccess, setInternalSuccess] = useState(false);
    const showSuccess = controlledSuccess !== undefined ? controlledSuccess : internalSuccess;

    const sizeClasses = {
      sm: 'text-xs px-3 h-9 min-h-[36px]',
      md: 'text-sm px-5 h-12 min-h-[48px]',
      lg: 'text-base px-6 h-14 min-h-[56px] font-semibold',
    }[size];

    const iconOnlySizes = {
      sm: 'w-9 h-9 min-h-[36px] p-0',
      md: 'w-12 h-12 min-h-[48px] p-0',
      lg: 'w-14 h-14 min-h-[56px] p-0',
    }[size];

    // Style tokens per brand and theme
    const variantClasses = {
      primary:
        'btn-primary bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-text)] border border-transparent shadow-[var(--shadow-soft)]',
      secondary:
        'btn-secondary bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--ink)] border border-[var(--border)] shadow-[var(--shadow-soft)]',
      ghost:
        'btn-ghost bg-transparent hover:bg-[var(--surface-subtle)] text-[var(--ink)] border border-transparent',
      danger:
        'btn-danger bg-[var(--status-danger)] hover:bg-[var(--status-danger)]/90 text-white border border-transparent',
      'icon-only':
        'btn-icon bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--ink)] border border-[var(--border)]',
      'link-style':
        'btn-link bg-transparent text-[var(--accent)] hover:text-[var(--accent-hover)] underline underline-offset-4 border-transparent p-0 h-auto min-h-0',
    }[variant];

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isLoading) {
        e.preventDefault();
        return;
      }

      // Haptic feedback on touch devices for primary actions
      if (
        enableHaptics &&
        variant === 'primary' &&
        typeof navigator !== 'undefined' &&
        'vibrate' in navigator
      ) {
        try {
          navigator.vibrate(10);
        } catch (_) {}
      }

      if (onClick) {
        onClick(e);
      }
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        onClick={handleClick}
        className={`btn-universal group relative inline-flex items-center justify-center gap-2 font-medium cursor-pointer rounded-[var(--radius-input)] disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none select-none overflow-hidden transition-all duration-150 [white-space:nowrap] ${
          variant === 'icon-only' ? iconOnlySizes : sizeClasses
        } ${variantClasses} ${className}`}
        {...props}
      >
        {/* Loading spinner replaces arrow or precedes content */}
        {isLoading && (
          <Loader2
            className="w-4 h-4 animate-spin shrink-0 text-current"
            aria-hidden="true"
          />
        )}

        {/* Success checkmark */}
        {showSuccess && !isLoading && (
          <Check className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
        )}

        {/* Custom icon */}
        {!isLoading && !showSuccess && icon && (
          <span className="shrink-0">{icon}</span>
        )}

        {/* Button label */}
        <span className="truncate whitespace-nowrap">
          {showSuccess ? successText : children}
        </span>

        {/* Trailing arrow with 4px translate on hover */}
        {hasArrow && !isLoading && !showSuccess && (
          <ArrowRight
            className="btn-arrow-icon w-4 h-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden="true"
          />
        )}

        {/* 2px progress hairline along the bottom edge during loading */}
        {isLoading && (
          <span className="btn-progress-line" aria-hidden="true" />
        )}

        {/* Screen-reader live announcement for success state */}
        {showSuccess && (
          <span className="sr-only" role="status" aria-live="polite">
            {successText}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
