import { Check } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui';
import type { RouteStep } from '../../hooks/use-bond-route';
import { cn } from '../../lib/utils';

/** Explains the one-off permission prompts before a stablecoin route starts. */
export function SetupDialog({
  open,
  onOpenChange,
  onConfirm,
  steps,
  assetSymbol,
  btcSymbol,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  steps: RouteStep[];
  assetSymbol: string;
  btcSymbol: string;
}) {
  const oneTime = steps.filter((step) => step.oneTime);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            {steps.length} transactions this first time
          </DialogTitle>
          <DialogDescription className="text-muted">
            {oneTime.length} are one-off approvals. After that, bonding with{' '}
            {assetSymbol} is two: swap, then bond.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-2">
          {steps.map((step, index) => (
            <li key={step.id} className="flex items-start gap-3 text-sm">
              <span
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold',
                  step.oneTime
                    ? 'border-orange text-orange'
                    : 'border-border text-muted',
                )}
              >
                {index + 1}
              </span>
              <span className="text-white">
                {step.label}
                {step.oneTime && (
                  <span className="text-muted ml-2 text-[11px]">one-off</span>
                )}
              </span>
            </li>
          ))}
        </ol>

        <p className="text-muted text-[11px]">
          Approvals go to Uniswap, not this protocol. Between the swap and the
          bond your {btcSymbol} sits in your wallet.
        </p>

        <button
          type="button"
          onClick={onConfirm}
          className="bg-orange hover:bg-orange/90 flex w-full items-center justify-center gap-2 rounded-lg py-3 font-bold text-black transition-all"
        >
          <Check size={16} />
          Start
        </button>
      </DialogContent>
    </Dialog>
  );
}
