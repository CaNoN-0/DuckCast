/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Swords, ThumbsUp, Flame, Clock, ExternalLink, ShieldCheck } from 'lucide-react';
import { PredictionMarket, PredictionBattle } from '../../types/market';
import { INITIAL_PREDICTION_BATTLES } from '../../services/pantaService';
import { socialApi, SocialBattle, getViewerId } from '../../services/socialApi';
import { shortenSolanaAddress } from '../../solana/config';
import { walletAvatar } from '../../utils/walletAvatar';
import { HalftoneBackground } from './HalftoneBackground';

interface PredictionBattlesSectionProps {
  onSelectMarket: (marketId: string) => void;
  onShowNotification: (msg: string) => void;
  allMarkets: PredictionMarket[];
  /** Live mode: battles are derived from position-verified theses on real Panta markets. */
  liveMode?: boolean;
  viewerWallet?: string | null;
}

function toBattle(b: SocialBattle, market?: PredictionMarket): PredictionBattle {
  const side = (t: SocialBattle['yes']) => ({
    username: shortenSolanaAddress(t.wallet),
    handle: t.position ? `${t.position.shares.toFixed(1)} ${t.side} shares` : 'signed thesis',
    avatar: walletAvatar(t.wallet),
    stakedUsdc: Math.round((t.position?.estValueUsdc ?? 0) * 100) / 100,
    entryProb: t.side === 'YES' ? market?.yesProbability ?? 50 : market?.noProbability ?? 50,
    thesis: t.text,
    backingVotes: t.reactions.agree
  });
  return {
    id: b.id,
    marketId: b.marketId,
    marketQuestion: market?.question || b.marketTitle,
    category: market?.category || 'Other',
    userYes: side(b.yes),
    userNo: side(b.no),
    totalBattlePotUsdc: Math.round(b.potUsdc * 100) / 100,
    status: 'active',
    timeRemaining: market?.timeRemaining || '—'
  };
}

export function PredictionBattlesSection({
  onSelectMarket,
  onShowNotification,
  allMarkets,
  liveMode = false,
  viewerWallet
}: PredictionBattlesSectionProps) {
  const [battles, setBattles] = useState<PredictionBattle[]>(liveMode ? [] : INITIAL_PREDICTION_BATTLES);
  const [thesisIds, setThesisIds] = useState<Record<string, { YES: string; NO: string }>>({});
  const [userVoted, setUserVoted] = useState<Record<string, 'YES' | 'NO'>>({});
  const [loaded, setLoaded] = useState(!liveMode);

  useEffect(() => {
    if (!liveMode) {
      setBattles(INITIAL_PREDICTION_BATTLES);
      setLoaded(true);
      return;
    }
    let cancelled = false;
    socialApi
      .battles()
      .then(({ items }) => {
        if (cancelled) return;
        setBattles(items.map((b) => toBattle(b, allMarkets.find((m) => m.id === b.marketId))));
        setThesisIds(Object.fromEntries(items.map((b) => [b.id, { YES: b.yes.id, NO: b.no.id }])));
        setUserVoted(
          Object.fromEntries(
            items
              .map((b) => [b.id, b.yes.viewerReacted.agree ? 'YES' : b.no.viewerReacted.agree ? 'NO' : null] as const)
              .filter(([, v]) => v !== null)
          ) as Record<string, 'YES' | 'NO'>
        );
      })
      .catch(() => setBattles([]))
      .finally(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
    // allMarkets changes every refresh; battles only need to be refetched when the mode changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveMode]);

  const handleVote = async (battleId: string, side: 'YES' | 'NO', challengerHandle: string) => {
    if (userVoted[battleId]) {
      onShowNotification(`You already backed ${userVoted[battleId]} in this battle.`);
      return;
    }

    if (liveMode) {
      const ids = thesisIds[battleId];
      if (!ids) return;
      try {
        await socialApi.react(ids[side], 'agree', getViewerId(viewerWallet));
      } catch (err) {
        onShowNotification((err as Error).message || 'Could not record your vote.');
        return;
      }
    }

    setBattles((prev) =>
      prev.map((b) => {
        if (b.id !== battleId) return b;
        return {
          ...b,
          userYes: {
            ...b.userYes,
            backingVotes: side === 'YES' ? b.userYes.backingVotes + 1 : b.userYes.backingVotes
          },
          userNo: {
            ...b.userNo,
            backingVotes: side === 'NO' ? b.userNo.backingVotes + 1 : b.userNo.backingVotes
          }
        };
      })
    );

    setUserVoted((prev) => ({ ...prev, [battleId]: side }));
    onShowNotification(`Backed ${challengerHandle}'s ${side} thesis.`);
  };

  if (liveMode && loaded && battles.length === 0) {
    return (
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 sm:p-6 shadow-xs mb-8 relative overflow-hidden">
        <HalftoneBackground opacity={0.06} className="pointer-events-none" />
        <div className="relative z-10 flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#09090B] flex items-center justify-center text-white shadow-2xs shrink-0">
            <Swords className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-display text-[#09090B] tracking-tight">Prediction Battles</h2>
            <p className="text-xs text-neutral-600 mt-1 max-w-xl">
              Battles form automatically when two forecasters holding <strong>verified Panta positions</strong> post opposing,
              wallet-signed theses on the same market. Buy a side on any market below and post your thesis to start one.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 sm:p-6 shadow-xs mb-8 relative overflow-hidden">
      <HalftoneBackground opacity={0.06} className="pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#09090B] flex items-center justify-center text-white shadow-2xs">
              <Swords className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-display text-[#09090B] tracking-tight">
              Prediction Battles
            </h2>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-mono-tabular">
              {liveMode ? 'Head-to-Head' : 'Examples'}
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {liveMode ? (
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Opposing theses from forecasters with verified Panta positions. Back the strongest argument.
              </span>
            ) : (
              'Example battles (demo data). In live mode, battles are built from position-verified theses.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono-tabular text-neutral-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Settles in Native Solana USDC</span>
        </div>
      </div>

      {/* Battles Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        {battles.map((battle) => {
          const matchingMarket = allMarkets.find((m) => m.id === battle.marketId);
          const hasVoted = userVoted[battle.id];
          const totalVotes = battle.userYes.backingVotes + battle.userNo.backingVotes;
          const yesPercent = totalVotes > 0 ? Math.round((battle.userYes.backingVotes / totalVotes) * 100) : 50;
          const noPercent = 100 - yesPercent;

          return (
            <div
              key={battle.id}
              className="bg-neutral-50/70 border border-neutral-200/80 hover:border-neutral-300 rounded-xl p-4 sm:p-5 transition-all shadow-2xs flex flex-col justify-between"
            >
              {/* Question & Category Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-200/80 text-neutral-700">
                    {battle.category}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono-tabular text-[11px] text-neutral-500">
                    <Clock className="w-3 h-3 text-neutral-400" />
                    <span>{battle.timeRemaining}</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-[#09090B] font-display line-clamp-2 mb-3">
                  {battle.marketQuestion}
                </h3>

                {/* Consensus Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-[11px] font-mono-tabular font-bold mb-1">
                    <span className="text-emerald-700">YES Backers: {yesPercent}%</span>
                    <span className="text-rose-700">NO Backers: {noPercent}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${yesPercent}%` }} />
                    <div className="bg-rose-500 h-full transition-all duration-300" style={{ width: `${noPercent}%` }} />
                  </div>
                </div>

                {/* Head-to-Head Challengers Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {/* Challenger YES */}
                  <div className={`p-3 rounded-xl border transition-all ${
                    hasVoted === 'YES' 
                      ? 'bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-400' 
                      : 'bg-white border-neutral-200/80'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={battle.userYes.avatar}
                          alt={battle.userYes.username}
                          className="w-6 h-6 rounded-full object-cover border border-neutral-300"
                        />
                        <div className="leading-tight">
                          <span className="text-xs font-bold text-[#09090B] block">{battle.userYes.username}</span>
                          <span className="text-[10px] text-neutral-400">{battle.userYes.handle}</span>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
                        YES {battle.userYes.entryProb}%
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-600 line-clamp-3 italic mb-2.5 leading-snug">
                      "{battle.userYes.thesis}"
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs font-mono-tabular">
                      <span className="text-[10px] text-neutral-500">{liveMode ? "Holds ~" : "Staked "}${battle.userYes.stakedUsdc.toLocaleString()}</span>
                      <button
                        type="button"
                        onClick={() => handleVote(battle.id, 'YES', battle.userYes.handle)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          hasVoted === 'YES'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        <ThumbsUp className="w-2.5 h-2.5" />
                        <span>Back YES ({battle.userYes.backingVotes})</span>
                      </button>
                    </div>
                  </div>

                  {/* Challenger NO */}
                  <div className={`p-3 rounded-xl border transition-all ${
                    hasVoted === 'NO' 
                      ? 'bg-rose-50/80 border-rose-400 ring-1 ring-rose-400' 
                      : 'bg-white border-neutral-200/80'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={battle.userNo.avatar}
                          alt={battle.userNo.username}
                          className="w-6 h-6 rounded-full object-cover border border-neutral-300"
                        />
                        <div className="leading-tight">
                          <span className="text-xs font-bold text-[#09090B] block">{battle.userNo.username}</span>
                          <span className="text-[10px] text-neutral-400">{battle.userNo.handle}</span>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800">
                        NO {battle.userNo.entryProb}%
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-600 line-clamp-3 italic mb-2.5 leading-snug">
                      "{battle.userNo.thesis}"
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs font-mono-tabular">
                      <span className="text-[10px] text-neutral-500">{liveMode ? "Holds ~" : "Staked "}${battle.userNo.stakedUsdc.toLocaleString()}</span>
                      <button
                        type="button"
                        onClick={() => handleVote(battle.id, 'NO', battle.userNo.handle)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          hasVoted === 'NO'
                            ? 'bg-rose-600 text-white'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        <Flame className="w-2.5 h-2.5" />
                        <span>Back NO ({battle.userNo.backingVotes})</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Trade Action */}
              <div className="pt-3 border-t border-neutral-200/70 flex items-center justify-between">
                <span className="text-[11px] text-neutral-500 font-mono-tabular">
                  Pot: <strong className="text-neutral-900">${battle.totalBattlePotUsdc.toLocaleString()} USDC</strong>
                </span>

                <button
                  type="button"
                  onClick={() => onSelectMarket(battle.marketId)}
                  className="px-3.5 py-1.5 bg-[#09090B] hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Trade Market on Panta</span>
                  <ExternalLink className="w-3 h-3 text-emerald-400" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
