import { cn } from '../../lib/utils';

interface VestingStatCardProps {
  label: string;
  value: string;
  subValue: string;
  variant?: 'default' | 'highlight';
}

export function VestingStatCard({
  label,
  value,
  subValue,
  variant = 'default',
}: VestingStatCardProps) {
  return (
    <div
      className={cn(
        'border-border bg-card rounded-xl border p-4',
        variant === 'highlight' && 'relative overflow-hidden',
      )}
    >
      {variant === 'highlight' && (
        <div className="bg-green/10 absolute right-0 top-0 -mr-8 -mt-8 h-16 w-16 rounded-full"></div>
      )}
      <div className="text-muted mb-1 text-xs font-bold uppercase">{label}</div>
      <div
        className={cn(
          'font-mono text-2xl',
          variant === 'highlight' ? 'text-green' : 'text-white',
        )}
      >
        {value}
      </div>
      <div className="text-muted mt-1 text-xs">{subValue}</div>
    </div>
  );
}
