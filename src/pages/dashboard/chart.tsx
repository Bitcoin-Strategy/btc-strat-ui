import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type WheelEvent,
} from 'react';
import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card } from '../../components/ui';
import {
  usePriceHistory,
  type ChartDataPoint,
} from '../../hooks/use-price-history';
import { useReportedError } from '../../hooks/use-reported-error';

type VisibleRange = {
  startIndex: number;
  endIndex: number;
};

type TooltipData = {
  payload: ChartDataPoint;
};

type ChartMouseState = {
  activeTooltipIndex?: unknown;
};

type BrushChangeState = {
  startIndex?: number;
  endIndex?: number;
};

const MIN_VISIBLE_POINTS = 20;
const ZOOM_IN_MULTIPLIER = 0.8;
const ZOOM_OUT_MULTIPLIER = 1.25;
const PAN_WHEEL_STEP = 4;

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getFullRange = (totalPoints: number): VisibleRange => {
  if (totalPoints === 0) {
    return { startIndex: 0, endIndex: 0 };
  }

  return {
    startIndex: 0,
    endIndex: totalPoints - 1,
  };
};

const getActiveIndex = (activeTooltipIndex: unknown): number | null => {
  if (
    typeof activeTooltipIndex !== 'number' ||
    !Number.isFinite(activeTooltipIndex)
  ) {
    return null;
  }

  return Math.floor(activeTooltipIndex);
};

const formatYAxisValue = (value: number) => {
  const absValue = Math.abs(value);

  if (absValue > 0 && absValue < 0.00001) {
    return value.toExponential(1);
  }

  if (absValue >= 1_000_000) {
    return (value / 1_000_000).toFixed(1) + 'M';
  }
  if (absValue >= 1_000) {
    return (value / 1_000).toFixed(1) + 'K';
  }

  if (absValue < 1) {
    return value.toFixed(6);
  }

  return value.toFixed(2);
};

const formatChartTime = (timestamp: number) =>
  new Date(timestamp * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  });

const CustomTooltip = ({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: TooltipData[];
  currency: string;
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div
      className="rounded-lg border border-gray-700 bg-[#151A21] p-3 shadow-lg"
      style={{ minWidth: '180px' }}
    >
      <p className="mb-2 text-xs text-gray-400">
        {formatChartTime(data.timestamp)} UTC
      </p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center text-sm">
            <span className="bg-orange mr-2 h-2 w-2 rounded-full" />
            <span className="text-gray-300">NAV:</span>
          </span>
          <span className="text-orange ml-2 font-mono text-sm font-semibold">
            {data.nav.toPrecision(8)} {currency}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center text-sm">
            <span className="bg-green mr-2 h-2 w-2 rounded-full" />
            <span className="text-gray-300">Market:</span>
          </span>
          <span className="text-green ml-2 font-mono text-sm font-semibold">
            {data.price === null
              ? 'Unavailable'
              : `${data.price.toPrecision(8)} ${currency}`}
          </span>
        </div>
      </div>
    </div>
  );
};

export function Chart() {
  const { chartData, currency, isLoading, error } = usePriceHistory();
  const chartError = useReportedError('nav chart', error);
  const [visibleRange, setVisibleRange] = useState<VisibleRange>({
    startIndex: 0,
    endIndex: 0,
  });

  const previousLengthRef = useRef(0);
  const hasInteractedWithRangeRef = useRef(false);
  const hoveredIndexRef = useRef<number | null>(null);
  const panStateRef = useRef({ isDragging: false, lastIndex: 0 });

  useEffect(() => {
    const totalPoints = chartData.length;

    if (totalPoints === 0) {
      previousLengthRef.current = 0;
      hasInteractedWithRangeRef.current = false;
      return;
    }

    setVisibleRange((prevRange) => {
      const previousLength = previousLengthRef.current;

      const isRangeUninitialized =
        !hasInteractedWithRangeRef.current &&
        totalPoints > 1 &&
        prevRange.startIndex === 0 &&
        prevRange.endIndex === 0;

      if (isRangeUninitialized) {
        return getFullRange(totalPoints);
      }

      if (previousLength === 0) {
        hasInteractedWithRangeRef.current = false;
        return getFullRange(totalPoints);
      }

      const previousWindowSize = Math.max(
        1,
        prevRange.endIndex - prevRange.startIndex + 1,
      );
      const wasPinnedToRight = prevRange.endIndex >= previousLength - 1;

      if (wasPinnedToRight && totalPoints > previousLength) {
        const wasFullRange =
          prevRange.startIndex === 0 && previousWindowSize >= previousLength;

        if (wasFullRange) {
          return getFullRange(totalPoints);
        }

        const endIndex = totalPoints - 1;
        const startIndex = Math.max(0, endIndex - (previousWindowSize - 1));
        return { startIndex, endIndex };
      }

      const startIndex = clampNumber(prevRange.startIndex, 0, totalPoints - 1);
      const endIndex = clampNumber(
        prevRange.endIndex,
        startIndex,
        totalPoints - 1,
      );
      return { startIndex, endIndex };
    });

    previousLengthRef.current = totalPoints;
  }, [chartData.length]);

  const shiftVisibleRange = useCallback(
    (offset: number) => {
      if (offset === 0 || chartData.length === 0) {
        return;
      }

      hasInteractedWithRangeRef.current = true;
      setVisibleRange((prevRange) => {
        const totalPoints = chartData.length;
        const windowSize = Math.max(
          1,
          prevRange.endIndex - prevRange.startIndex + 1,
        );
        const maxStart = Math.max(0, totalPoints - windowSize);
        const startIndex = clampNumber(
          prevRange.startIndex + offset,
          0,
          maxStart,
        );
        const endIndex = Math.min(totalPoints - 1, startIndex + windowSize - 1);
        return { startIndex, endIndex };
      });
    },
    [chartData.length],
  );

  const zoomVisibleRange = useCallback(
    (direction: 'in' | 'out', anchorIndex?: number) => {
      if (chartData.length <= 1) {
        return;
      }

      hasInteractedWithRangeRef.current = true;
      setVisibleRange((prevRange) => {
        const totalPoints = chartData.length;
        const minVisiblePoints = Math.min(MIN_VISIBLE_POINTS, totalPoints);
        const currentWindowSize = Math.max(
          1,
          prevRange.endIndex - prevRange.startIndex + 1,
        );
        const targetWindowSize = Math.round(
          currentWindowSize *
            (direction === 'in' ? ZOOM_IN_MULTIPLIER : ZOOM_OUT_MULTIPLIER),
        );
        const nextWindowSize = clampNumber(
          targetWindowSize,
          minVisiblePoints,
          totalPoints,
        );

        if (nextWindowSize === currentWindowSize) {
          return prevRange;
        }

        const centeredIndex =
          anchorIndex ??
          Math.round((prevRange.startIndex + prevRange.endIndex) / 2);
        const clampedAnchor = clampNumber(
          centeredIndex,
          prevRange.startIndex,
          prevRange.endIndex,
        );
        const anchorRatio =
          currentWindowSize > 1
            ? (clampedAnchor - prevRange.startIndex) / (currentWindowSize - 1)
            : 0.5;
        const maxStart = Math.max(0, totalPoints - nextWindowSize);
        const startIndex = clampNumber(
          Math.round(clampedAnchor - anchorRatio * (nextWindowSize - 1)),
          0,
          maxStart,
        );
        const endIndex = startIndex + nextWindowSize - 1;

        return { startIndex, endIndex };
      });
    },
    [chartData.length],
  );

  const handleBrushChange = useCallback(
    (nextRange: BrushChangeState) => {
      if (chartData.length === 0) {
        return;
      }

      if (
        typeof nextRange.startIndex !== 'number' ||
        typeof nextRange.endIndex !== 'number'
      ) {
        return;
      }

      const startIndex = clampNumber(
        Math.round(nextRange.startIndex),
        0,
        chartData.length - 1,
      );
      const endIndex = clampNumber(
        Math.round(nextRange.endIndex),
        startIndex,
        chartData.length - 1,
      );

      setVisibleRange((prevRange) => {
        const isLikelyInitEvent =
          !hasInteractedWithRangeRef.current &&
          chartData.length > 1 &&
          startIndex === 0 &&
          endIndex === 0 &&
          prevRange.endIndex !== 0;

        if (isLikelyInitEvent) {
          return prevRange;
        }

        hasInteractedWithRangeRef.current = true;
        return { startIndex, endIndex };
      });
    },
    [chartData.length],
  );

  const handleChartMouseDown = useCallback((state: ChartMouseState) => {
    const activeIndex = getActiveIndex(state.activeTooltipIndex);
    if (activeIndex === null) {
      return;
    }

    panStateRef.current.isDragging = true;
    panStateRef.current.lastIndex = activeIndex;
  }, []);

  const handleChartMouseMove = useCallback(
    (state: ChartMouseState) => {
      const activeIndex = getActiveIndex(state.activeTooltipIndex);
      if (activeIndex === null) {
        return;
      }

      hoveredIndexRef.current = activeIndex;

      if (!panStateRef.current.isDragging) {
        return;
      }

      const delta = activeIndex - panStateRef.current.lastIndex;
      if (delta === 0) {
        return;
      }

      shiftVisibleRange(-delta);
      panStateRef.current.lastIndex = activeIndex;
    },
    [shiftVisibleRange],
  );

  const stopPanning = useCallback(() => {
    panStateRef.current.isDragging = false;
  }, []);

  const handleChartMouseLeave = useCallback(() => {
    panStateRef.current.isDragging = false;
    hoveredIndexRef.current = null;
  }, []);

  const handleChartWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      if (chartData.length <= 1) {
        return;
      }

      const isPanIntent =
        event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY);

      if (!isPanIntent) {
        return;
      }

      event.preventDefault();

      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      if (delta === 0) {
        return;
      }

      const direction = delta > 0 ? 1 : -1;
      const magnitude = Math.max(1, Math.round(Math.abs(delta) / 40));
      shiftVisibleRange(direction * magnitude * PAN_WHEEL_STEP);
    },
    [chartData.length, shiftVisibleRange],
  );

  const zoomIn = useCallback(() => {
    zoomVisibleRange('in', hoveredIndexRef.current ?? undefined);
  }, [zoomVisibleRange]);

  const zoomOut = useCallback(() => {
    zoomVisibleRange('out', hoveredIndexRef.current ?? undefined);
  }, [zoomVisibleRange]);

  const showAllData = useCallback(() => {
    if (chartData.length === 0) {
      return;
    }

    hasInteractedWithRangeRef.current = true;
    setVisibleRange({
      startIndex: 0,
      endIndex: chartData.length - 1,
    });
  }, [chartData.length]);

  const renderChartContent = () => {
    if (isLoading) {
      return (
        <div className="text-muted flex h-full items-center justify-center">
          Loading chart data...
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-red flex h-full items-center justify-center text-center">
          Could not load the chart: {chartError?.detail}
        </div>
      );
    }

    if (chartData.length === 0) {
      // An empty curve is normal before the first Treasury update.
      return (
        <div className="text-muted flex h-full items-center justify-center px-6 text-center text-sm">
          Nothing has moved the Treasury yet. The curve starts at the first
          bond.
        </div>
      );
    }

    return (
      <div
        className="flex h-full w-full cursor-grab flex-col active:cursor-grabbing"
        onWheel={handleChartWheel}
      >
        <div className="mb-2 flex justify-between gap-4 text-xs">
          <span className="text-green">Market ({currency} / STRAT)</span>
          <span className="text-orange">NAV ({currency} / STRAT)</span>
        </div>
        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              onMouseDown={handleChartMouseDown}
              onMouseMove={handleChartMouseMove}
              onMouseUp={stopPanning}
              onMouseLeave={handleChartMouseLeave}
            >
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNav" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F7931A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F7931A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#2A3441"
                vertical={false}
              />
              <XAxis
                dataKey="timestamp"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={formatChartTime}
                stroke="#94A3B8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis
                yAxisId="left"
                stroke="#10B981"
                width={75}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(value) => formatYAxisValue(Number(value))}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#F7931A"
                width={75}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
                tickFormatter={(value) => formatYAxisValue(Number(value))}
              />
              <Tooltip content={<CustomTooltip currency={currency} />} />
              <Area
                yAxisId="left"
                type="linear"
                dataKey="price"
                name="Market"
                stroke="#10B981"
                isAnimationActive={false}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls={false}
                fillOpacity={1}
                fill="url(#colorPrice)"
              />
              <Area
                yAxisId="right"
                type="stepAfter"
                dataKey="nav"
                name="NAV"
                stroke="#F7931A"
                isAnimationActive={false}
                strokeWidth={2}
                dot={{ r: 3 }}
                fillOpacity={1}
                fill="url(#colorNav)"
              />
              <Brush
                dataKey="timestamp"
                tickFormatter={formatChartTime}
                startIndex={visibleRange.startIndex}
                endIndex={visibleRange.endIndex}
                height={24}
                stroke="#64748B"
                fill="#151A21"
                travellerWidth={8}
                onChange={handleBrushChange}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-bold text-white">
          Backing and market price
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            <span className="text-muted flex items-center text-xs">
              <span className="bg-orange mr-2 h-2 w-2 rounded-full" />
              NAV
            </span>
            <span className="text-muted flex items-center text-xs">
              <span className="bg-green mr-2 h-2 w-2 rounded-full" /> Market
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={zoomOut}
              className="text-muted border-border bg-dark rounded border px-2 py-1 text-xs transition-colors hover:text-white"
            >
              -
            </button>
            <button
              type="button"
              onClick={zoomIn}
              className="text-muted border-border bg-dark rounded border px-2 py-1 text-xs transition-colors hover:text-white"
            >
              +
            </button>
            <button
              type="button"
              onClick={showAllData}
              className="text-muted border-border bg-dark rounded border px-2 py-1 text-xs transition-colors hover:text-white"
            >
              ALL
            </button>
          </div>
        </div>
      </div>
      <div className="h-64 w-full sm:h-80">{renderChartContent()}</div>
      {chartData.length > 0 && (
        <p className="text-muted mt-3 text-xs">
          Separate scales. {chartData.length} Treasury snapshots; market quotes
          are sampled at those events. Times are UTC.
          {currency === 'USD' && ' USD values use the current BTC/USD rate.'}
        </p>
      )}
    </Card>
  );
}
