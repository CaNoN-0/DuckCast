import React from 'react';
import { TrendingUp, TrendingDown, ArrowRight, Zap } from 'lucide-react';
import { PredictionMarket } from '../../types/market';
import { SparklineChart } from './SparklineChart';
import { HalftoneBackground } from './HalftoneBackground';

interface BiggestMoversSectionProps {
  markets: PredictionMarket[];
  onSelectMarket: (market: PredictionMarket) => void;
}

export function BiggestMoversSection({ markets, onSelectMarket }: BiggestMoversSectionProps) {
  // Sort by absolute 24h change magnitude
  const sortedMovers = [...markets]
    .sort((a, b) => Math.abs(b.change24h ?? 0) - Math.abs(a.change24h ?? 0))
    .slice(0, 6);

  if (sortedMovers.length === 0) return null;

  return (
    <div className="bg-white border border-neutral-200/90 rounded-xl p-4 sm:p-5 shadow-xs mb-6 relative overflow-hidden">
      <HalftoneBackground opacity={0.06} />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-display text-[#09090B] tracking-tight">
                  Biggest Movers
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-mono-tabular">
                  24h Volatility
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-medium">
                Markets with the highest probability swings in the last 24 hours.
              </p>
            </div>
          </div>
        </div>

        {/* Mover Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {sortedMovers.map((m) => {
            const change = m.change24h ?? 0;
            const isPos = change >= 0;
            const label = m.shortLabel || m.topic || m.question.slice(0, 16);

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectMarket(m)}
                className={`relative overflow-hidden p-3 rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 cursor-pointer flex flex-col justify-between group ${
                  isPos
                    ? 'bg-emerald-50/40 hover:bg-emerald-50/80 border-emerald-200/80 hover:border-emerald-300'
                    : 'bg-rose-50/40 hover:bg-rose-50/80 border-rose-200/80 hover:border-rose-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-bold text-neutral-500 truncate max-w-[85px]">
                      {m.category}
                    </span>
                    <span className="text-[10px] font-mono-tabular text-neutral-400">
                      {m.yesProbability}% YES
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-[13px] font-extrabold text-[#09090B] font-display line-clamp-1 group-hover:text-emerald-700 transition-colors mb-2">
                    {label}
                  </h3>
                </div>

                <div className="pt-2 border-t border-neutral-200/40 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs font-black font-mono-tabular tracking-tight ${
                      isPos ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {isPos ? (
                      <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                    )}
                    <span>{isPos ? `+${change}%` : `${change}%`}</span>
                  </span>

                  <SparklineChart
                    data={m.sparkline}
                    width={48}
                    height={18}
                    color={isPos ? '#10B981' : '#EF4444'}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
