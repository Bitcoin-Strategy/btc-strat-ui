import { Check, ExternalLink, Loader2 } from 'lucide-react';

import type { RouteStep } from '../../hooks/use-bond-route';
import { explorerTx } from '../../lib/addresses';
import { cn } from '../../lib/utils';

const marker = (
  status: RouteStep['status'],
  isProcessing: boolean,
  index: number,
) => {
  if (status === 'done') return <Check size={12} />;
  if (status === 'active' && isProcessing) {
    return <Loader2 size={12} className="animate-spin" />;
  }
  return index + 1;
};

const markerClass = (status: RouteStep['status']): string => {
  if (status === 'done') return 'border-green bg-green/15 text-green';
  if (status === 'active') return 'border-orange bg-orange/15 text-orange';
  return 'border-border text-muted';
};

const labelClass = (status: RouteStep['status']): string => {
  if (status === 'done') return 'text-muted line-through';
  return status === 'active' ? 'text-white' : 'text-muted';
};

export function RouteSteps({
  steps,
  isProcessing,
}: {
  steps: RouteStep[];
  isProcessing: boolean;
}) {
  return (
    <ol className="space-y-1.5">
      {steps.map((step, index) => {
        return (
          <li key={step.id} className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold',
                markerClass(step.status),
              )}
            >
              {marker(step.status, isProcessing, index)}
            </span>
            <span className={labelClass(step.status)}>{step.label}</span>
            {step.hash && (
              <a
                href={explorerTx(step.hash)}
                target="_blank"
                rel="noreferrer"
                className="text-muted hover:text-orange ml-auto flex items-center gap-1 text-[10px]"
              >
                tx <ExternalLink size={10} />
              </a>
            )}
          </li>
        );
      })}
    </ol>
  );
}
