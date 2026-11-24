/*
 * Accessible spring-animated Button component using central accent theme tokens.
 */

import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'nova-btn-primary border border-transparent',
  secondary:
    'nova-surface text-[var(--nova-text)] hover:bg-slate-200/60 dark:hover:bg-slate-800/70',
  ghost:
    'bg-transparent text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] hover:bg-slate-200/50 dark:hover:bg-slate-800/50 border border-transparent',
  danger: 'bg-rose-600 text-white hover:bg-rose-500 border border-transparent',
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'min-h-[36px] px-3 py-1.5 text-xs',
  md: 'min-h-[42px] px-4 py-2 text-sm',
  lg: 'min-h-[48px] px-6 py-2.5 text-sm',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.015 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 450, damping: 28 }}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap shrink-0 transition-colors nova-accent-ring disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
