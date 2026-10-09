import React, { useState } from 'react';
import { Flame, Radio, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { PredictionMarket } from '../../types/market';

interface HighlightsSectionProps {
  markets: PredictionMarket[];
  onSelectMarket: (market: PredictionMarket) => void;
  onFilterChange: (filter: any) => void;
}

export function HighlightsSection({
  markets,
  onSelectMarket,
  onFilterChange
}: HighlightsSectionProps) {
  const [activeTab, setActiveTab] = useState<'trending' | 'live' | 'volume' | 'ending'>('trending');

  const trendingMarkets = markets.filter((m) => m.isTrending).slice(0, 4);
  const liveMarkets = markets.filter((m) => m.isLive).slice(0, 4);
  const highestVolumeMarkets = [...markets].sort((a, b) => b.volumeNumeric - a.volumeNumeric).slice(0, 4);
  const endingSoonMarkets = [...markets].sort((a, b) => a.timeMinutes - b.timeMinutes).slice(0, 4);

  return (
    <div className="flowing-luminous-border bg-white border border-neutral-200/90 rounded-xl p-4 sm:p-5 shadow-xs mb-6">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-neutral-100/80 p-1 rounded-full border border-neutral-200/50">
          <button
            type="button"
            onClick={() => setActiveTab('trending')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'trending'
                ? 'bg-[#09090B] text-white shadow-xs'
                : 'text-neutral-600 hover:text-[#09090B] hover:bg-neutral-200/50'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Trending</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'live'
                ? 'bg-[#09090B] text-white shadow-xs'
                : 'text-neutral-600 hover:text-[#09090B] hover:bg-neutral-200/50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Markets</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full font-mono-tabular font-bold">
              {markets.filter((m) => m.isLive).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('volume')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'volume'
                ? 'bg-[#09090B] text-white shadow-xs'
                : 'text-neutral-600 hover:text-[#09090B] hover:bg-neutral-200/50'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            <span>Highest Volume</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ending')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ending'
                ? 'bg-[#09090B] text-white shadow-xs'
                : 'text-neutral-600 hover:text-[#09090B] hover:bg-neutral-200/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-purple-500" />
            <span>Ending Soon</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (activeTab === 'live') onFilterChange('Live');
            else if (activeTab === 'volume') onFilterChange('High Volume');
            else if (activeTab === 'ending') onFilterChange('Ending Today');
            else onFilterChange('All Markets');
          }}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 cursor-pointer self-start sm:self-auto tracking-tight"
        >
          <span>View all in category</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Grid of Highlight Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3.5">
        {activeTab === 'trending' &&
          trendingMarkets.map((m) => (
            <div
              key={m.id}
              onClick={() => onSelectMarket(m)}
              className="p-3 bg-neutral-50/70 hover:bg-neutral-100/80 border border-neutral-200/70 rounded-lg cursor-pointer transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-neutral-600 font-bold tracking-tight">{m.category}</span>
                  <span className="inline-flex items-center gap-1 text-emerald-800 font-bold font-mono-tabular bg-emerald-50 px-1.5 py-0.5 rounded">
                    <span>
                      {m.trendingFrom && m.trendingTo
                        ? `${m.trendingFrom}% → ${m.trendingTo}%`
                        : `${m.yesProbability}%`}
                    </span>
                    {m.trendingDelta && <span className="text-[10px] text-emerald-700 font-extrabold">({m.trendingDelta})</span>}
                  </span>
                </div>
                <h4 className="text-[13px] font-bold font-display text-[#09090B] line-clamp-2 leading-snug mb-2">
                  {m.question}
                </h4>
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-600 pt-2 border-t border-neutral-200/60 font-mono-tabular">
                <span>Vol <strong className="text-neutral-900">{m.volume}</strong></span>
                <span className="font-bold text-emerald-700">{m.yesProbability}% Yes</span>
              </div>
            </div>
          ))}

        {activeTab === 'live' &&
          liveMarkets.map((m) => (
            <div
              key={m.id}
              onClick={() => onSelectMarket(m)}
              className="p-3 bg-emerald-50/30 hover:bg-emerald-50/70 border border-emerald-200/70 rounded-lg cursor-pointer transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="inline-flex items-center gap-1 text-emerald-800 font-black bg-white border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] tracking-tight">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                  </span>
                  <span className="text-neutral-600 font-bold font-mono-tabular flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-neutral-400" />
                    {m.timeRemaining} remaining
                  </span>
                </div>
                <h4 className="text-[13px] font-bold font-display text-[#09090B] line-clamp-2 leading-snug mb-2">
                  {m.question}
                </h4>
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-600 pt-2 border-t border-emerald-100 font-mono-tabular">
                <span><strong className="text-neutral-900">{m.volume}</strong> Volume</span>
                <span className="font-extrabold text-emerald-700">{m.yesProbability}% Yes</span>
              </div>
            </div>
          ))}

        {activeTab === 'volume' &&
          highestVolumeMarkets.map((m) => (
            <div
              key={m.id}
              onClick={() => onSelectMarket(m)}
              className="p-3 bg-neutral-50/70 hover:bg-neutral-100/80 border border-neutral-200/70 rounded-lg cursor-pointer transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-neutral-600 font-bold tracking-tight">{m.category}</span>
                  <span className="text-neutral-950 font-extrabold font-mono-tabular bg-white border border-neutral-200 px-1.5 py-0.5 rounded">
                    {m.volume}
                  </span>
                </div>
                <h4 className="text-[13px] font-bold font-display text-[#09090B] line-clamp-2 leading-snug mb-2">
                  {m.question}
                </h4>
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-600 pt-2 border-t border-neutral-200/60 font-mono-tabular">
                <span><strong className="text-neutral-900">{m.traders.toLocaleString()}</strong> traders</span>
                <span className="font-bold text-emerald-700">{m.yesProbability}% YES</span>
              </div>
            </div>
          ))}

        {activeTab === 'ending' &&
          endingSoonMarkets.map((m) => (
            <div
              key={m.id}
              onClick={() => onSelectMarket(m)}
              className="p-3 bg-neutral-50/70 hover:bg-neutral-100/80 border border-neutral-200/70 rounded-lg cursor-pointer transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-neutral-600 font-bold tracking-tight">{m.category}</span>
                  <span className="inline-flex items-center gap-1 text-purple-800 font-black font-mono-tabular bg-purple-50 border border-purple-200/70 px-1.5 py-0.5 rounded text-[11px]">
                    <Clock className="w-3 h-3 text-purple-600" />
                    {m.timeRemaining}
                  </span>
                </div>
                <h4 className="text-[13px] font-bold font-display text-[#09090B] line-clamp-2 leading-snug mb-2">
                  {m.question}
                </h4>
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-600 pt-2 border-t border-neutral-200/60 font-mono-tabular">
                <span>Vol <strong className="text-neutral-900">{m.volume}</strong></span>
                <span className="font-extrabold text-[#09090B]">{m.yesProbability}% YES</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
