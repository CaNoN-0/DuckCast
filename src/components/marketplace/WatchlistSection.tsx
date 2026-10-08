import React from 'react';
import { Bookmark, Clock, ArrowRight, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { PredictionMarket } from '../../types/market';
import { SparklineChart } from './SparklineChart';
import { HalftoneBackground } from './HalftoneBackground';

interface WatchlistSectionProps {
  markets: PredictionMarket[];
  bookmarkedIds: string[];
  onSelectMarket: (market: PredictionMarket) => void;
  onRemoveBookmark: (marketId: string) => void;
  onExploreMarkets: () => void;
}

export function WatchlistSection({
  markets,
  bookmarkedIds,
  onSelectMarket,
  onRemoveBookmark,
  onExploreMarkets
}: WatchlistSectionProps) {
  const watchlistedMarkets = markets.filter((m) => bookmarkedIds.includes(m.id));

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Bookmark className="w-4 h-4 fill-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold font-display text-[#09090B]">
                Your Watchlist
              </h1>
              <span className="text-xs font-mono-tabular font-bold bg-neutral-200/90 text-neutral-800 px-2 py-0.5 rounded-md">
                {watchlistedMarkets.length} saved
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-medium">
              Real-time monitoring of your bookmarked prediction markets.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onExploreMarkets}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Explore all markets</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      {watchlistedMarkets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlistedMarkets.map((m) => {
            const change = m.change24h ?? 0;
            const isPos = change >= 0;

            return (
              <div
                key={m.id}
                onClick={() => onSelectMarket(m)}
                className="group relative bg-white border border-neutral-200/90 rounded-xl p-4.5 cursor-pointer flex flex-col justify-between overflow-hidden shadow-xs hover:border-emerald-500/50 transition-all duration-200"
              >
                <HalftoneBackground opacity={0.12} />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                      {m.category}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-neutral-400 font-mono-tabular flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-400" />
                        {m.timeRemaining}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveBookmark(m.id);
                        }}
                        className="text-neutral-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                        title="Remove from Watchlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm sm:text-[15px] font-bold text-[#09090B] font-display line-clamp-2 mb-3 group-hover:text-emerald-700 transition-colors">
                    {m.question}
                  </h3>
                </div>

                <div className="relative z-10 pt-2 border-t border-neutral-100 mt-auto">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black font-display text-[#09090B]">
                          {m.yesProbability}%
                        </span>
                        <span className="text-[11px] font-bold text-neutral-400 uppercase">
                          YES
                        </span>
                        <span
                          className={`text-[11px] font-mono-tabular font-bold ml-1 ${
                            isPos ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isPos ? `+${change}%` : `${change}%`}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono-tabular">
                        Vol: {m.volume}
                      </div>
                    </div>

                    <SparklineChart data={m.sparkline} width={76} height={24} />
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectMarket(m)}
                    className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>View Market & Trade</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty Watchlist State */
        <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center shadow-xs max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-500">
            <Bookmark className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold font-display text-[#09090B] mb-1.5">
            Your Watchlist is empty
          </h2>
          <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
            Bookmark prediction markets using the bookmark icon on any market card to keep track of real-time odds, price movements, and resolution timings in one place.
          </p>
          <button
            type="button"
            onClick={onExploreMarkets}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#09090B] hover:bg-neutral-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <span>Explore Prediction Markets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
