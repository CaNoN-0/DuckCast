import React from 'react';
import { X, Bookmark, ArrowUpRight } from 'lucide-react';
import { PredictionMarket } from '../../types/market';
import { HalftoneBackground } from '../marketplace/HalftoneBackground';

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  markets: PredictionMarket[];
  onSelectMarket: (market: PredictionMarket) => void;
  onNavigateToPredictions: () => void;
}

export function WatchlistModal({
  isOpen,
  onClose,
  markets,
  onSelectMarket,
  onNavigateToPredictions
}: WatchlistModalProps) {
  if (!isOpen) return null;

  const watchlistItems = markets.slice(0, 6);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white border border-neutral-200 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-base font-bold font-display text-[#09090B]">
                Your Watchlist
              </h3>
              <p className="text-xs text-neutral-500">
                Starred markets and live price movements.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-black rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {watchlistItems.map((m) => (
            <div
              key={m.id}
              onClick={() => {
                onSelectMarket(m);
                onClose();
              }}
              className="relative overflow-hidden p-4 rounded-xl border border-neutral-200/90 hover:border-neutral-400 bg-white hover:bg-neutral-50/60 transition-all cursor-pointer flex items-center justify-between gap-4 group"
            >
              <HalftoneBackground opacity={0.06} className="group-hover:opacity-12" />
              <div className="relative z-10 flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-bold mb-1">
                  <span className="bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-700">{m.category}</span>
                  <span>{m.volume} Vol</span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-[#09090B] font-display truncate">
                  {m.question}
                </h4>
              </div>

              <div className="relative z-10 flex items-center gap-3 shrink-0">
                <div className="text-right font-mono-tabular">
                  <span className="text-xs font-black text-emerald-700 block">{m.yesProbability}% YES</span>
                  <span className="text-[11px] text-neutral-400">{m.noProbability}% NO</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onNavigateToPredictions();
              onClose();
            }}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
          >
            Browse All Markets →
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
