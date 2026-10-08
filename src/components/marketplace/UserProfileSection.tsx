import React from 'react';
import { UserProfileData, UserPosition } from '../../types/market';
import { Trophy, Target, TrendingUp, Flame, Wallet, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { HalftoneBackground } from './HalftoneBackground';

interface UserProfileSectionProps {
  profile: UserProfileData;
  positions?: UserPosition[];
  onSelectMarketById?: (marketId: string) => void;
}

export function UserProfileSection({
  profile,
  positions = [],
  onSelectMarketById
}: UserProfileSectionProps) {
  return (
    <div className="w-full space-y-6">
      {/* Profile Overview Card */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <HalftoneBackground opacity={0.1} />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-neutral-100">
          <div className="flex items-center gap-4">
            <img
              src={profile.avatar}
              alt={profile.username}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black font-display text-[#09090B]">
                  {profile.username}
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Verified Predictor
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono-tabular mt-0.5">
                <span>{profile.handle}</span>
                <span>·</span>
                <span>{profile.address}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold font-mono-tabular">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>{profile.currentStreak} Win Streak</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold font-mono-tabular">
              <Trophy className="w-4 h-4 text-emerald-600" />
              <span>Rank #14 Globally</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="p-3.5 bg-neutral-50/70 border border-neutral-200/60 rounded-xl">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
              Total Predictions
            </span>
            <span className="text-2xl font-extrabold font-display text-[#09090B]">
              {profile.totalPredictions}
            </span>
            <span className="text-[10px] text-neutral-400 block mt-0.5 font-mono-tabular">Across 6 categories</span>
          </div>

          <div className="p-3.5 bg-neutral-50/70 border border-neutral-200/60 rounded-xl">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
              Accuracy
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold font-display text-emerald-700">
                {profile.accuracy}%
              </span>
              <Target className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-[10px] text-neutral-400 block mt-0.5 font-mono-tabular">Top 5% percentile</span>
          </div>

          <div className="p-3.5 bg-neutral-50/70 border border-neutral-200/60 rounded-xl">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
              Total Profit
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold font-display text-emerald-700 font-mono-tabular">
                +${profile.totalProfit.toLocaleString()}
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-[10px] text-neutral-400 block mt-0.5 font-mono-tabular">Realized PnL</span>
          </div>

          <div className="p-3.5 bg-neutral-50/70 border border-neutral-200/60 rounded-xl">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
              Win Rate
            </span>
            <span className="text-2xl font-extrabold font-display text-[#09090B] font-mono-tabular">
              {profile.winRate}%
            </span>
            <span className="text-[10px] text-neutral-400 block mt-0.5 font-mono-tabular">33 / 42 winning theses</span>
          </div>
        </div>
      </div>

      {/* Open Positions / Active Predictions */}
      {positions.length > 0 && (
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-neutral-500" />
              <h2 className="text-sm font-bold font-display text-[#09090B]">
                Active Positions ({positions.length})
              </h2>
            </div>
            <span className="text-xs font-mono-tabular font-bold text-emerald-700">
              ${positions.reduce((acc, p) => acc + p.currentValue, 0).toFixed(2)} Total Value
            </span>
          </div>

          <div className="divide-y divide-neutral-100 text-xs">
            {positions.map((pos) => (
              <div
                key={pos.id}
                onClick={() => onSelectMarketById && onSelectMarketById(pos.marketId)}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-neutral-50/60 px-2 rounded-lg transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        pos.outcome === 'YES'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {pos.outcome}
                    </span>
                    <span className="font-bold text-[#09090B] hover:text-emerald-700 transition-colors">
                      {pos.question}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono-tabular">
                    {pos.shares} shares @ {pos.avgPrice}¢ · Current: {pos.currentPrice}¢
                  </div>
                </div>

                <div className="text-left sm:text-right font-mono-tabular shrink-0">
                  <span className="font-bold text-[#09090B] block">${pos.currentValue.toFixed(2)}</span>
                  <span className="text-emerald-700 font-extrabold text-[11px]">
                    +${pos.pnl.toFixed(2)} ({pos.pnlPercent}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Predictions History */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-100">
          <h2 className="text-sm font-bold font-display text-[#09090B]">
            Recent Prediction Track Record
          </h2>
          <span className="text-[11px] text-neutral-400 font-mono-tabular">Verifiable on-chain</span>
        </div>

        <div className="divide-y divide-neutral-100 text-xs">
          {profile.recentPredictions.map((pred) => (
            <div
              key={pred.id}
              onClick={() => onSelectMarketById && onSelectMarketById(pred.marketId)}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer hover:bg-neutral-50 px-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                {pred.status === 'Won' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : pred.status === 'Lost' ? (
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                        pred.outcome === 'YES' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {pred.outcome}
                    </span>
                    <span className="font-bold text-[#09090B]">{pred.question}</span>
                  </div>
                  <span className="text-[11px] text-neutral-400 font-mono-tabular block mt-0.5">
                    {pred.timestamp} · Staked {pred.amount}
                  </span>
                </div>
              </div>

              <div className="text-right font-mono-tabular shrink-0 pl-7 sm:pl-0">
                <span
                  className={`text-xs font-black ${
                    pred.pnl.startsWith('+') ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {pred.pnl}
                </span>
                <span className="text-[10px] text-neutral-400 block font-normal">{pred.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
