import React from 'react';
import { MarketTimelineEvent } from '../../types/market';
import { Clock, TrendingUp, DollarSign, Flag, Sparkles } from 'lucide-react';

interface MarketTimelineProps {
  timeline: MarketTimelineEvent[];
}

export function MarketTimeline({ timeline }: MarketTimelineProps) {
  if (!timeline || timeline.length === 0) return null;

  const getIcon = (type: MarketTimelineEvent['type']) => {
    switch (type) {
      case 'probability':
        return <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />;
      case 'trade':
        return <DollarSign className="w-3.5 h-3.5 text-blue-600" />;
      case 'created':
        return <Sparkles className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-neutral-500" />;
    }
  };

  const getBadgeStyle = (type: MarketTimelineEvent['type'], isNow: boolean) => {
    if (isNow) return 'bg-emerald-600 text-white font-black animate-pulse';
    switch (type) {
      case 'probability':
        return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
      case 'trade':
        return 'bg-blue-50 text-blue-800 border border-blue-200';
      case 'created':
        return 'bg-purple-50 text-purple-800 border border-purple-200';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  return (
    <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-neutral-500" />
          <h3 className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
            Market Timeline
          </h3>
        </div>
        <span className="text-[11px] text-neutral-400 font-mono-tabular">Chronological events</span>
      </div>

      <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-neutral-200">
        {timeline.map((evt, idx) => {
          const isNow = evt.time === 'NOW';
          return (
            <div key={evt.id || idx} className="relative group">
              {/* Dot / Icon */}
              <div
                className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center border-2 bg-white transition-transform group-hover:scale-110 ${
                  isNow ? 'border-emerald-500 ring-4 ring-emerald-500/20' : 'border-neutral-300'
                }`}
              >
                {getIcon(evt.type)}
              </div>

              {/* Content Card */}
              <div className="bg-neutral-50/70 border border-neutral-200/60 rounded-xl p-3 hover:bg-neutral-50 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-mono-tabular px-2 py-0.5 rounded-full ${getBadgeStyle(
                        evt.type,
                        isNow
                      )}`}
                    >
                      {evt.time}
                    </span>
                    <span className="text-xs font-bold text-[#09090B] font-display">
                      {evt.title}
                    </span>
                  </div>
                  {evt.badge && (
                    <span className="text-[10px] font-mono-tabular font-bold bg-white border border-neutral-200 px-1.5 py-0.5 rounded text-neutral-700">
                      {evt.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">{evt.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
