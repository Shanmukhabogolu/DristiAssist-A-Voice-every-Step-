import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
}) => {
  const variantStyles = {
    neutral: 'bg-[var(--surface-subtle)] text-[var(--ink-muted)] border border-[var(--border)]',
    accent: 'bg-[var(--accent-tint)] text-[var(--accent)] border border-transparent font-medium',
    success: 'bg-emerald-50 text-[var(--status-success)] border border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 text-[var(--status-warning)] border border-amber-200 dark:border-amber-800',
    danger: 'bg-[var(--status-danger-tint)] text-[var(--status-danger)] border border-red-200',
  }[variant];

  return (
    <span
      className={`inline-flex items-center text-[11px] font-mono tracking-wide px-2 py-0.5 rounded-[var(--radius-tag)] ${variantStyles} ${className}`}
    >
      {children}
    </span>
  );
};
