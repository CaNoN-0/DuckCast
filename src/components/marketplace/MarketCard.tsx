import React from 'react';
import { Users, Clock, Flame, Radio } from 'lucide-react';
import { PredictionMarket } from '../../types/market';
import { SparklineChart } from './SparklineChart';
import { HalftoneBackground } from './HalftoneBackground';

interface MarketCardProps {
  market: PredictionMarket;
  onSelectMarket: (market: PredictionMarket, side?: 'YES' | 'NO') => void;
}

export function MarketCard({ market, onSelectMarket }: MarketCardProps) {
  const isHighProb = market.yesProbability >= 50;

  return (
    <div
      onClick={() => onSelectMarket(market)}
      className="group prediction-tab-card relative bg-white border border-neutral-200/90 rounded-xl p-4.5 cursor-pointer flex flex-col justify-between overflow-hidden"
    >
      {/* Halftone SVG Corner Dot Matrix Background - clearly visible, animated on hover */}
      <HalftoneBackground
        opacity={0.14}
        className="group-hover:opacity-26 halftone-breathe-anim transition-all duration-500"
      />

      {/* Top Header: Category, Live / Trending Badge, Time */}
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded tracking-tight">
              {market.category}
            </span>

            {market.isLive && (
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-50 border border-emerald-300/80 px-2 py-0.5 rounded tracking-tight">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </span>
            )}

            {market.isTrending && market.trendingDelta && !market.isLive && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50/80 px-1.5 py-0.5 rounded font-mono-tabular">
                <Flame className="w-3 h-3 text-emerald-600" />
                <span>
                  {market.trendingFrom && market.trendingTo
                    ? `${market.trendingFrom}% → ${market.trendingTo}%`
                    : market.trendingDelta}
                </span>
                <span className="font-extrabold text-[10px]">({market.trendingDelta})</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-500 font-mono-tabular shrink-0">
            <Clock className="w-3 h-3 text-neutral-400" />
            <span>{market.timeRemaining}</span>
          </div>
        </div>

        {/* Prediction Question */}
        <h3 className="text-[15px] sm:text-[16px] font-bold text-[#09090B] font-display leading-[1.3] group-hover:text-emerald-700 transition-colors line-clamp-2 min-h-[42px] mb-3">
          {market.question}
        </h3>
      </div>

      {/* Middle: Probability & Sparkline Chart */}
      <div className="pt-1 pb-3 border-t border-neutral-100 mt-auto">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[26px] font-extrabold tracking-tight text-[#09090B] font-display">
                {market.yesProbability}%
              </span>
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                chance
              </span>
            </div>
            <div className="text-[11px] font-semibold text-neutral-400 font-mono-tabular">
              {market.noProbability}% NO
            </div>
          </div>

          {/* Mini probability sparkline */}
          <div className="flex flex-col items-end">
            <SparklineChart data={market.sparkline} width={76} height={26} />
            <span className="text-[10px] font-semibold text-neutral-400 font-mono-tabular mt-0.5">
              trend
            </span>
          </div>
        </div>

        {/* Probability bar */}
        <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${market.yesProbability}%` }}
          />
          <div
            className="bg-neutral-300 h-full rounded-full transition-all duration-300"
            style={{ width: `${market.noProbability}%` }}
          />
        </div>
      </div>

      {/* Stats bar: Volume & Traders */}
      <div className="flex items-center justify-between text-[11px] font-medium text-neutral-600 pt-2 pb-3 border-t border-neutral-100 font-mono-tabular">
        <div>
          <span className="text-neutral-400 font-normal">Vol: </span>
          <span className="font-bold text-[#09090B]">{market.volume}</span>
        </div>
        <div className="flex items-center gap-1 font-semibold">
          <Users className="w-3 h-3 text-neutral-400" />
          <span>{market.traders.toLocaleString()} traders</span>
        </div>
      </div>

      {/* Bottom Buttons: Yes / No with percentage */}
      <div className="grid grid-cols-2 gap-2 pt-1 relative z-10" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onSelectMarket(market, 'YES')}
          className="relative overflow-hidden flex items-center justify-between px-3 py-2 bg-emerald-50/90 hover:bg-emerald-100/90 border border-emerald-300/80 hover:border-emerald-400 rounded-[14px] text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 cursor-pointer group/btn"
        >
          <HalftoneBackground opacity={0.16} fill="#059669" className="group-hover/btn:opacity-30 group-hover/btn:scale-110 transition-all duration-300" />
          <span className="relative z-10 text-[12px] font-black text-emerald-900 tracking-tight font-display transition-transform duration-200 group-hover/btn:translate-x-0.5">
            YES
          </span>
          <span className="relative z-10 text-[12px] font-bold text-emerald-800 font-mono-tabular transition-transform duration-200 group-hover/btn:-translate-x-0.5">
            {market.yesProbability}%
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectMarket(market, 'NO')}
          className="relative overflow-hidden flex items-center justify-between px-3 py-2 bg-rose-50/90 hover:bg-rose-100/90 border border-rose-300/80 hover:border-rose-400 rounded-[14px] text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 cursor-pointer group/btn"
        >
          <HalftoneBackground opacity={0.16} fill="#E11D48" className="group-hover/btn:opacity-30 group-hover/btn:scale-110 transition-all duration-300" />
          <span className="relative z-10 text-[12px] font-black text-rose-900 tracking-tight font-display transition-transform duration-200 group-hover/btn:translate-x-0.5">
            NO
          </span>
          <span className="relative z-10 text-[12px] font-bold text-rose-800 font-mono-tabular transition-transform duration-200 group-hover/btn:-translate-x-0.5">
            {market.noProbability}%
          </span>
        </button>
      </div>
    </div>
  );
}
