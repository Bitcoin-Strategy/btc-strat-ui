import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

interface DarkBoxProps {
  children: ReactNode;
  className?: string;
}

export function DarkBox({ children, className }: DarkBoxProps) {
  return (
    <div className={cn('bg-dark rounded-lg p-4', className)}>{children}</div>
  );
}
