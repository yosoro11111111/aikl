'use client';

import { motion, type MotionProps } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from './cn';

export type PanelProps = MotionProps & {
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function Panel({
  title,
  subtitle,
  right,
  children,
  className,
  contentClassName,
  ...props
}: PanelProps) {
  return (
    <motion.div
      className={cn('ui-glass rounded-[var(--radius-lg)]', className)}
      {...props}
    >
      {(title || subtitle || right) && (
        <div className="flex items-start gap-3 px-4 pt-4">
          <div className="min-w-0">
            {title && <div className="font-semibold text-gray-900 dark:text-gray-100">{title}</div>}
            {subtitle && (
              <div className="text-xs text-gray-600 dark:text-gray-300/80">{subtitle}</div>
            )}
          </div>
          {right && <div className="ml-auto flex-shrink-0">{right}</div>}
        </div>
      )}
      <div className={cn('px-4 pb-4 pt-3', contentClassName)}>{children}</div>
    </motion.div>
  );
}

