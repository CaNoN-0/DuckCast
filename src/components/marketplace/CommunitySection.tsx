import React from 'react';
import { MessageSquare, ArrowUpRight } from 'lucide-react';
import { UserPredictionActivity, PredictionMarket } from '../../types/market';

interface CommunitySectionProps {
  activities: UserPredictionActivity[];
  onSelectMarketById: (marketId: string) => void;
}

export function CommunitySection({ activities, onSelectMarketById }: CommunitySectionProps) {
  return (
    <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <h3 className="text-base font-bold font-display tracking-tight text-[#09090B]">
            Community Predictions
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
          Live positions & theses
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {activities.map((act) => (
          <div
            key={act.id}
            onClick={() => onSelectMarketById(act.marketId)}
            className="p-3.5 bg-neutral-50/70 hover:bg-neutral-100/90 border border-neutral-200/70 rounded-lg cursor-pointer transition-colors group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <img
                    src={act.avatar}
                    alt={act.username}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-neutral-200"
                  />
                  <div>
                    <span className="text-[13px] font-bold text-[#09090B] block leading-tight">
                      {act.username}
                    </span>
                    <span className="text-[10px] font-semibold text-neutral-400 font-mono-tabular">
                      {act.time}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-extrabold font-mono-tabular px-2 py-0.5 rounded ${
                    act.side === 'YES'
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-rose-100 text-rose-900'
                  }`}
                >
                  {act.probability}% {act.side}
                </span>
              </div>

              <p className="text-[13px] font-bold font-display text-[#09090B] line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
                “{act.question}”
              </p>
            </div>

            {act.comment && (
              <p className="text-[11px] text-neutral-500 italic mt-2.5 pt-2 border-t border-neutral-200/50 line-clamp-1">
                💬 {act.comment}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
