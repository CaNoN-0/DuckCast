import React, { useState } from 'react';
import { Trophy, Award, TrendingUp, CheckCircle2, Flame, User } from 'lucide-react';
import { LeaderboardUser } from '../../types/market';

interface LeaderboardSectionProps {
  users: LeaderboardUser[];
}

type LeaderboardTimeframe = 'Today' | 'This Week' | 'This Month' | 'All Time';

export function LeaderboardSection({ users }: LeaderboardSectionProps) {
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>('This Week');

  return (
    <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <div>
            <h2 className="text-base font-bold font-display tracking-tight text-[#09090B]">
              Top Predictors Leaderboard
            </h2>
            <p className="text-xs text-neutral-500">
              Ranked by verified predictive profit and historical accuracy.
            </p>
          </div>
        </div>

        {/* Timeframe Filter Tabs with Squircle Border Radius */}
        <div className="inline-flex items-center p-1 bg-neutral-100 rounded-[14px] text-xs font-bold self-start sm:self-auto">
          {(['Today', 'This Week', 'This Month', 'All Time'] as LeaderboardTimeframe[]).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-[11px] transition-all cursor-pointer whitespace-nowrap ${
                timeframe === tf
                  ? 'bg-white text-[#09090B] shadow-2xs'
                  : 'text-neutral-500 hover:text-[#09090B]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Rankings List */}
      <div className="divide-y divide-neutral-100">
        {users.map((u) => {
          const isCurrent = u.isCurrentUser;

          return (
            <div
              key={u.username}
              className={`py-3 px-2.5 flex items-center justify-between gap-3 rounded-xl transition-colors ${
                isCurrent
                  ? 'bg-emerald-50/80 border border-emerald-300/80 shadow-2xs my-1'
                  : 'hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-6 text-center text-xs font-black font-mono-tabular shrink-0 ${
                    u.rank === 1
                      ? 'text-amber-500'
                      : u.rank === 2
                      ? 'text-slate-500'
                      : u.rank === 3
                      ? 'text-amber-700'
                      : isCurrent
                      ? 'text-emerald-700'
                      : 'text-neutral-400'
                  }`}
                >
                  #{u.rank}
                </span>

                <img
                  src={u.avatar}
                  alt={u.username}
                  className={`w-8 h-8 rounded-full object-cover shrink-0 ${
                    isCurrent ? 'ring-2 ring-emerald-500' : 'ring-1 ring-neutral-200'
                  }`}
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[13px] font-bold text-[#09090B] truncate">
                      {u.username}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white px-1.5 py-0.2 rounded-full font-mono-tabular">
                        YOU
                      </span>
                    )}
                    <span className="text-[11px] font-medium text-neutral-400 font-mono-tabular hidden sm:inline">
                      {u.handle}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {u.badges.map((b) => (
                      <span
                        key={b}
                        className="text-[9px] font-bold bg-white/80 border border-neutral-200/80 text-neutral-700 px-1.5 py-0.2 rounded uppercase tracking-wider"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats: Profit, Accuracy, Predictions, Win Streak */}
              <div className="flex items-center gap-4 sm:gap-6 text-right font-mono-tabular shrink-0">
                <div className="hidden md:block">
                  <span className="text-[10px] text-neutral-400 block font-semibold uppercase tracking-wider">
                    Predictions
                  </span>
                  <span className="text-xs font-bold text-neutral-800">
                    {u.predictions || 42}
                  </span>
                </div>

                <div className="hidden sm:block">
                  <span className="text-[10px] text-neutral-400 block font-semibold uppercase tracking-wider">
                    Win Streak
                  </span>
                  <span className="text-xs font-bold text-amber-600 inline-flex items-center gap-0.5">
                    <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                    {u.winStreak || 5}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-neutral-400 block font-semibold uppercase tracking-wider">
                    Accuracy
                  </span>
                  <span className="text-xs font-black text-emerald-800">
                    {u.accuracy}
                  </span>
                </div>

                <div className="min-w-[70px]">
                  <span className="text-[10px] text-neutral-400 block font-semibold uppercase tracking-wider">
                    Profit
                  </span>
                  <span className="text-xs font-black text-emerald-600">
                    {u.pnl}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
