import { Info, TrendingDown, TrendingUp } from 'lucide-react';
import type { ElementType } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui';
import { formatter } from '../../lib';

interface StatCardProps {
  title: string;
  value: string;
  /** One line, or several stacked. */
  subValue?: string | string[];
  icon: ElementType;
  trend?: number;
  infoTooltip?: string;
}

export function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  trend,
  infoTooltip,
}: StatCardProps) {
  let subLines: string[] = [];
  if (Array.isArray(subValue)) subLines = subValue;
  else if (subValue) subLines = [subValue];
  return (
    <div className="border-border bg-card hover:border-orange/30 group cursor-default rounded-xl border p-5 transition-all">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="border-border bg-dark group-hover:border-orange/50 rounded-lg border p-2 transition-colors">
          <Icon className="text-muted group-hover:text-orange" size={20} />
        </div>
        {trend && (
          <span className="bg-green/10 text-green flex items-center rounded-full px-2 py-1 text-xs font-bold">
            {trend > 0 ? (
              <>
                <TrendingUp size={12} className="mr-1" /> +
              </>
            ) : (
              <>
                <TrendingDown size={12} className="mr-1" /> -
              </>
            )}
            {formatter.format(trend)}$
          </span>
        )}
      </div>
      <div className="text-muted mb-1 flex items-center gap-1.5 text-sm font-medium">
        {title}
        {infoTooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info
                  size={14}
                  className="text-muted hover:text-orange cursor-help transition-colors"
                />
              </TooltipTrigger>
              <TooltipContent className="border-border bg-card max-w-xs border">
                <p className="text-xs leading-relaxed text-white">
                  {infoTooltip}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {/* NAV has 16 decimals, so it wraps on phones. */}
      <div className="break-all font-mono text-xl font-bold text-white sm:text-2xl">
        {value}
      </div>
      {subLines.map((line) => (
        <div
          key={line}
          className="text-muted mt-1 break-all text-xs sm:text-sm"
        >
          {line}
        </div>
      ))}
    </div>
  );
}
