import React, { useState } from 'react';
import { ChartPoint, MarketTimeframe } from '../../types/market';

interface MarketDetailChartProps {
  chartHistory: {
    '1H'?: ChartPoint[];
    '6H'?: ChartPoint[];
    '1D'?: ChartPoint[];
    '1W'?: ChartPoint[];
    'ALL'?: ChartPoint[];
    '24H'?: ChartPoint[];
    '7D'?: ChartPoint[];
    '30D'?: ChartPoint[];
  };
  currentProb: number;
}

export function MarketDetailChart({ chartHistory, currentProb }: MarketDetailChartProps) {
  const [activeTf, setActiveTf] = useState<MarketTimeframe>('1D');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const getPointsForTf = (tf: MarketTimeframe): ChartPoint[] => {
    if (chartHistory[tf] && chartHistory[tf]!.length > 0) {
      return chartHistory[tf]!;
    }
    if (tf === '1D' && chartHistory['24H']) return chartHistory['24H']!;
    if (tf === '1W' && chartHistory['7D']) return chartHistory['7D']!;
    if (tf === '6H') {
      // synthesize 6H from 1H or 1D if missing
      const base = chartHistory['1H'] || chartHistory['24H'] || [];
      return base.map((p, i) => ({ ...p, time: `${(i + 1) * 20}m` }));
    }
    return chartHistory['ALL'] || chartHistory['1H'] || [];
  };

  const points = getPointsForTf(activeTf);

  const width = 640;
  const height = 220;
  const paddingX = 24;
  const paddingTop = 20;
  const paddingBottom = 28;

  const getCoords = (prob: number, idx: number, total: number) => {
    const x = paddingX + (idx / Math.max(1, total - 1)) * (width - paddingX * 2);
    const y = paddingTop + (1 - prob / 100) * (height - paddingTop - paddingBottom);
    return { x, y };
  };

  const pathD = points.reduce((acc, pt, idx) => {
    const { x, y } = getCoords(pt.probability, idx, points.length);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const areaD = points.length > 0
    ? `${pathD} L ${paddingX + (width - paddingX * 2)} ${height - paddingBottom} L ${paddingX} ${height - paddingBottom} Z`
    : '';

  const activePoint = hoverIndex !== null && points[hoverIndex]
    ? points[hoverIndex]
    : points[points.length - 1];

  const displayedProb = activePoint ? activePoint.probability : currentProb;
  const displayedLabel = activePoint ? activePoint.time : 'Latest';

  return (
    <div className="w-full bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs">
      {/* Chart Header with Active Prob & Timeframe Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-[32px] font-extrabold tracking-[-0.03em] text-[#09090B] font-display font-mono-tabular">
              {displayedProb}%
            </span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md uppercase tracking-wider">
              YES Chance
            </span>
            <span className="text-xs font-bold text-neutral-400 font-mono-tabular">
              ({100 - displayedProb}% NO)
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 font-semibold mt-0.5">
            {hoverIndex !== null ? `Observed at ${displayedLabel}` : 'Market consensus estimate'}
          </p>
        </div>

        {/* Timeframe selector: 1H, 6H, 1D, 1W, ALL */}
        <div className="inline-flex items-center p-1 bg-neutral-100 rounded-full border border-neutral-200/60 self-start sm:self-auto">
          {(['1H', '6H', '1D', '1W', 'ALL'] as MarketTimeframe[]).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => {
                setActiveTf(tf);
                setHoverIndex(null);
              }}
              className={`px-3 py-1 text-[11px] font-bold rounded-full transition-all cursor-pointer ${
                activeTf === tf
                  ? 'bg-white text-[#09090B] shadow-xs'
                  : 'text-neutral-500 hover:text-[#09090B]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart Canvas */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-[180px] sm:h-[220px] overflow-visible"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="probGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[25, 50, 75].map((lvl) => {
            const y = paddingTop + (1 - lvl / 100) * (height - paddingTop - paddingBottom);
            return (
              <g key={lvl}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#F4F4F5"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={width - paddingX + 6}
                  y={y + 3}
                  fontSize="9"
                  fill="#A1A1AA"
                  fontFamily="sans-serif"
                >
                  {lvl}%
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {areaD && <path d={areaD} fill="url(#probGradient)" />}

          {/* Main stroke line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Hover Crosshair & Indicators */}
          {hoverIndex !== null && points[hoverIndex] && (() => {
            const pt = points[hoverIndex];
            const { x, y } = getCoords(pt.probability, hoverIndex, points.length);
            return (
              <g>
                <line
                  x1={x}
                  y1={paddingTop}
                  x2={x}
                  y2={height - paddingBottom}
                  stroke="#10B981"
                  strokeWidth="1.25"
                  strokeDasharray="2 3"
                />
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill="#10B981"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                />
              </g>
            );
          })()}

          {/* Interactive touch/hover zones */}
          {points.map((pt, idx) => {
            const { x } = getCoords(pt.probability, idx, points.length);
            const stepW = (width - paddingX * 2) / Math.max(1, points.length - 1);
            return (
              <rect
                key={idx}
                x={x - stepW / 2}
                y={0}
                width={stepW}
                height={height}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoverIndex(idx)}
                onTouchStart={() => setHoverIndex(idx)}
              />
            );
          })}
        </svg>
      </div>

      {/* Axis Footer */}
      <div className="flex items-center justify-between text-[11px] text-neutral-400 px-2 pt-1 border-t border-neutral-100">
        <span>{points[0]?.time || 'Start'}</span>
        <span className="font-medium text-neutral-500">Historical Probability Trajectory</span>
        <span>{points[points.length - 1]?.time || 'Now'}</span>
      </div>
    </div>
  );
}
