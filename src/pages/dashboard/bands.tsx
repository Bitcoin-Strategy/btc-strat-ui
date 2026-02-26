import { Layers } from 'lucide-react';

import { Card } from '../../components/ui';
import { useGetBands } from '../../hooks/use-get-bands';
import { smartFormatter } from '../../lib';

export function Bands() {
  const { bands, isLoading, error } = useGetBands();

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="mb-6 text-lg font-bold text-white">Premium Bands</h3>
        <div className="text-muted text-sm">Loading bands...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h3 className="mb-6 text-lg font-bold text-white">Premium Bands</h3>
        <div className="text-muted text-sm">Error loading bands</div>
      </Card>
    );
  }

  if (!bands || bands.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="mb-6 text-lg font-bold text-white">Premium Bands</h3>
        <div className="text-muted text-sm">No bands configured</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center gap-2">
        <Layers size={20} className="text-orange" />
        <h3 className="text-lg font-bold text-white">Premium Bands</h3>
      </div>
      <div className="space-y-4">
        {bands.map((band, index) => {
          const premiumMinPct = band.premiumMinBps / 100;
          const premiumMaxPct = band.premiumMaxBps / 100;
          const sellBpsPerWindow = band.sellBpsPerWindow / 100;

          return (
            <div
              key={index}
              className="border-border bg-dark rounded-lg border p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-muted text-xs font-medium uppercase">
                  Band {index + 1}
                </span>
                <span className="font-mono text-sm text-white">
                  {smartFormatter(premiumMinPct)}% -{' '}
                  {smartFormatter(premiumMaxPct)}%
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted">Premium Range</span>
                  <span className="font-mono text-white">
                    {smartFormatter(premiumMinPct)}% to{' '}
                    {smartFormatter(premiumMaxPct)}%
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted">Sell Rate per Window</span>
                  <span className="font-mono text-white">
                    {smartFormatter(sellBpsPerWindow)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
