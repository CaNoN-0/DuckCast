/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Clock, Users, ArrowUpRight, ArrowDownRight, Radio } from 'lucide-react';
import { PredictionMarket } from '../data/marketsData';
import { HalftoneBackground } from './marketplace/HalftoneBackground';

interface MarketCardProps {
  market: PredictionMarket;
  onSelectMarket: (market: PredictionMarket) => void;
  onQuickTrade: (market: PredictionMarket, side: 'YES' | 'NO') => void;
}

export function MarketCard({ market, onSelectMarket, onQuickTrade }: MarketCardProps) {
  // Generate simple SVG path for sparkline
  const minVal = Math.min(...market.recentSparkline);
  const maxVal = Math.max(...market.recentSparkline);
  const range = maxVal - minVal || 1;
  const width = 80;
  const height = 24;

  const points = market.recentSparkline
    .map((val, idx) => {
      const x = (idx / (market.recentSparkline.length - 1)) * width;
      const y = height - ((val - minVal) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  const isUp = market.recentSparkline[market.recentSparkline.length - 1] >= market.recentSparkline[0];

  return (
    <div
      onClick={() => onSelectMarket(market)}
      className="group prediction-tab-card bg-white border border-neutral-200 rounded-xl p-4.5 cursor-pointer flex flex-col justify-between relative overflow-hidden"
    >
      <HalftoneBackground opacity={0.14} className="group-hover:opacity-26 halftone-breathe-anim transition-all duration-500" />
      <div className="relative z-10">
        {/* Header: Category & Live / Time */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5">
            {market.iconImage ? (
              <img
                src={market.iconImage}
                alt={market.topic}
                className="w-5 h-5 rounded-full object-cover shrink-0 border border-neutral-100"
              />
            ) : (
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${market.iconBg}`}
              >
                {market.iconSymbol}
              </span>
            )}
            <span className="text-[11px] font-medium text-[#475569]">
              {market.category}
            </span>
            <span aria-hidden="true" className="text-neutral-300">·</span>
            <span className="text-[11px] text-[#64748b]">
              {market.topic}
            </span>
          </div>

          {market.isLive ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#64748b] font-mono-tabular">
              <Clock className="w-3 h-3 text-[#94a3b8]" />
              {market.timeRemaining}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-[14px] sm:text-[15px] font-medium text-[#09090B] leading-snug line-clamp-2 group-hover:text-[#10b981] transition-colors mb-3">
          {market.question}
        </h3>

        {/* Mini Sparkline + Probability Indicator */}
        <div className="flex items-center justify-between gap-2 mb-3.5 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold font-mono-tabular text-[#09090B] tracking-tight">
              {market.yesProbability}%
            </span>
            <span className="text-xs font-semibold text-[#10b981] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
              Yes
            </span>
            <span className="text-xs font-medium text-neutral-400 font-mono-tabular">
              / {market.noProbability}% No
            </span>
          </div>

          {/* Sparkline chart */}
          <div className="flex items-center gap-1" title="Recent probability movement">
            <svg width={width} height={height} className="overflow-visible">
              <polyline
                fill="none"
                stroke={isUp ? '#10b981' : '#ef4444'}
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
            </svg>
            {isUp ? (
              <ArrowUpRight className="w-3 h-3 text-[#10b981]" />
            ) : (
              <ArrowDownRight className="w-3 h-3 text-[#ef4444]" />
            )}
          </div>
        </div>

        {/* Probability Bar */}
        <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden flex mb-3.5">
          <div
            className="h-full bg-[#10b981] transition-all duration-300"
            style={{ width: `${market.yesProbability}%` }}
          />
          <div
            className="h-full bg-neutral-300 transition-all duration-300"
            style={{ width: `${market.noProbability}%` }}
          />
        </div>
      </div>

      {/* Footer: Volume, Traders & Yes/No Quick Buttons */}
      <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-[11px] text-[#64748b]">
          <span className="font-mono-tabular font-medium text-[#334155]">
            {market.volume}
          </span>
          <span aria-hidden="true" className="text-neutral-300">·</span>
          <span className="inline-flex items-center gap-1 font-mono-tabular">
            <Users className="w-3 h-3 text-[#94a3b8]" />
            {market.tradersCount.toLocaleString()}
          </span>
        </div>

        {/* Yes / No buttons */}
        <div className="flex items-center gap-1.5 relative z-10" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onQuickTrade(market, 'YES')}
            className="relative overflow-hidden px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50/90 hover:bg-emerald-100/90 border border-emerald-200 hover:border-emerald-300 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 cursor-pointer whitespace-nowrap group/btn text-emerald-900"
          >
            <HalftoneBackground opacity={0.16} fill="#059669" className="group-hover/btn:opacity-30 group-hover/btn:scale-110 transition-all duration-300" />
            <span className="relative z-10">Yes {market.yesProbability}%</span>
          </button>
          <button
            type="button"
            onClick={() => onQuickTrade(market, 'NO')}
            className="relative overflow-hidden px-2.5 py-1 text-xs font-semibold rounded-md bg-neutral-50/90 hover:bg-neutral-100/90 border border-neutral-200 hover:border-neutral-300 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 cursor-pointer whitespace-nowrap group/btn text-neutral-800"
          >
            <HalftoneBackground opacity={0.16} fill="#71717A" className="group-hover/btn:opacity-30 group-hover/btn:scale-110 transition-all duration-300" />
            <span className="relative z-10">No {market.noProbability}%</span>
          </button>
        </div>
      </div>
    </div>
  );
}
