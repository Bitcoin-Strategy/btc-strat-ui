import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

interface InfoBoxProps {
  variant?: 'info' | 'warning' | 'error' | 'success';
  children: ReactNode;
  className?: string;
}

export function InfoBox({
  variant = 'info',
  children,
  className,
}: InfoBoxProps) {
  const variants = {
    info: 'border-blue-500/20 bg-blue-500/10 text-blue-200',
    warning: 'border-orange-500/20 bg-orange-500/10 text-orange-200',
    error: 'border-red/20 bg-red/10 text-red-200',
    success: 'border-green/20 bg-green/10 text-green-200',
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-3 text-xs',
        variants[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
