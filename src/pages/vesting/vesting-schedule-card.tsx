import type { VestingPosition } from './types';

export function VestingScheduleCard({ vest }: { vest: VestingPosition }) {
  return (
    <div className="border-border bg-card flex flex-col items-center gap-6 rounded-xl border p-5 md:flex-row">
      <div className="w-full flex-1">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="font-bold text-white">{vest.series}</span>
          <span className="text-muted text-xs">
            {vest.start} → {vest.end}
          </span>
        </div>
        <div className="bg-dark mb-2 h-2 w-full overflow-hidden rounded-full">
          <div
            className="bg-orange h-full rounded-full transition-all duration-1000"
            style={{ width: `${vest.progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between gap-3 text-xs">
          <span className="text-green font-mono">
            {vest.claimed.toFixed(2)} Unlocked
          </span>
          <span className="text-muted font-mono">
            {(vest.total - vest.claimed).toFixed(2)} Locked
          </span>
        </div>
      </div>
      <div className="min-w-[100px] text-center">
        <div className="font-mono text-2xl font-bold text-white">
          {vest.progress}%
        </div>
        <div className="text-muted text-xs">Completed</div>
      </div>
    </div>
  );
}
