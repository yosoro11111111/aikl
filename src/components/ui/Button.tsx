'use client';

import { motion } from 'framer-motion';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from './cn';

type Variant = 'glass' | 'primary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon';

export type ButtonProps = Omit<ComponentProps<typeof motion.button>, 'children'> & {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
};

const base =
  'ui-focus-ring inline-flex select-none items-center justify-center gap-2 font-medium transition-[transform,background-color,color,box-shadow,border-color] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm rounded-[var(--radius-sm)]',
  md: 'h-10 px-4 text-sm rounded-[var(--radius-md)]',
  lg: 'h-12 px-5 text-base rounded-[var(--radius-lg)]',
  icon: 'h-11 w-11 rounded-[var(--radius-pill)]',
};

const variants: Record<Variant, string> = {
  glass:
    'ui-glass text-[hsl(var(--surface-foreground))] hover:bg-[hsl(var(--surface)/0.92)]',
  primary:
    'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] shadow-[0_10px_25px_rgba(236,72,153,0.28)] hover:shadow-[0_14px_30px_rgba(236,72,153,0.35)]',
  ghost:
    'bg-transparent text-[hsl(var(--surface-foreground))] hover:bg-[hsl(var(--surface)/0.12)]',
  danger:
    'bg-red-500/80 text-white hover:bg-red-600/90 shadow-[0_10px_25px_rgba(239,68,68,0.28)]',
};

export function Button({
  className,
  variant = 'glass',
  size = 'md',
  leftIcon,
  rightIcon,
  children,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={cn(base, sizes[size], variants[variant], className)}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </motion.button>
  );
}

