/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Clock,
  Users,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  Flame,
  Lightbulb,
  Check,
  ArrowRight,
  ExternalLink,
  Share2
} from 'lucide-react';
import { PredictionMarket, MarketThesis } from '../data/marketsData';
import { HalftoneBackground } from './marketplace/HalftoneBackground';

interface MarketDetailModalProps {
  market: PredictionMarket;
  initialSide?: 'YES' | 'NO';
  onClose: () => void;
  onTradeExecuted: (marketId: string, side: 'YES' | 'NO', amount: number, thesis?: string) => void;
  userBalance: number;
  connectedAddress?: string;
  onOpenConnectModal?: () => void;
}

export function MarketDetailModal({
  market,
  initialSide = 'YES',
  onClose,
  onTradeExecuted,
  userBalance,
  connectedAddress,
  onOpenConnectModal
}: MarketDetailModalProps) {
  const [selectedSide, setSelectedSide] = useState<'YES' | 'NO'>(initialSide);
  const [stakeAmount, setStakeAmount] = useState('50');
  const [thesisText, setThesisText] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1D' | '1W' | '1M' | 'ALL'>('1W');
  const [thesesList, setThesesList] = useState<MarketThesis[]>(market.theses);
  const [tradeSuccessToast, setTradeSuccessToast] = useState<string | null>(null);

  // Financial calculations
  const numericAmount = parseFloat(stakeAmount) || 0;
  const pricePerShare = selectedSide === 'YES' ? market.yesProbability / 100 : market.noProbability / 100;
  const estimatedShares = pricePerShare > 0 ? Math.floor(numericAmount / pricePerShare) : 0;
  const potentialPayout = estimatedShares * 1; // $1 per share at 100%
  const potentialProfit = Math.max(0, potentialPayout - numericAmount);
  const returnPercentage = numericAmount > 0 ? Math.round((potentialProfit / numericAmount) * 100) : 0;

  const handleExecuteTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) return;

    onTradeExecuted(market.id, selectedSide, numericAmount, thesisText.trim() || undefined);

    if (thesisText.trim()) {
      const newThesis: MarketThesis = {
        id: `thesis-${Date.now()}`,
        author: 'you.duck',
        side: selectedSide,
        summary: thesisText.trim(),
        staked: `$${numericAmount.toLocaleString()}`,
        reactions: { insightful: 1, bullish: 1, fire: 1 },
        timeAgo: 'Just now'
      };
      setThesesList([newThesis, ...thesesList]);
      setThesisText('');
    }

    setTradeSuccessToast(
      `Order filled: Bought ${estimatedShares.toLocaleString()} ${selectedSide} contracts for $${numericAmount.toLocaleString()}`
    );

    setTimeout(() => {
      setTradeSuccessToast(null);
    }, 3000);
  };

  const handleReactThesis = (thesisId: string, reactionType: 'insightful' | 'bullish' | 'fire') => {
    setThesesList((prev) =>
      prev.map((t) => {
        if (t.id === thesisId) {
          return {
            ...t,
            reactions: {
              ...t.reactions,
              [reactionType]: t.reactions[reactionType] + 1
            }
          };
        }
        return t;
      })
    );
  };

  // Generate chart coordinates
  const chartPoints = [
    { label: 'Mon', yes: market.yesProbability - 8 },
    { label: 'Tue', yes: market.yesProbability - 5 },
    { label: 'Wed', yes: market.yesProbability - 2 },
    { label: 'Thu', yes: market.yesProbability - 6 },
    { label: 'Fri', yes: market.yesProbability - 1 },
    { label: 'Sat', yes: market.yesProbability + 1 },
    { label: 'Now', yes: market.yesProbability }
  ];

  const svgWidth = 500;
  const svgHeight = 140;
  const polylinePoints = chartPoints
    .map((pt, i) => {
      const x = (i / (chartPoints.length - 1)) * (svgWidth - 40) + 20;
      const y = svgHeight - (pt.yes / 100) * (svgHeight - 30) - 15;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="bg-white border border-neutral-200 rounded-2xl w-full max-w-[960px] max-h-[92vh] flex flex-col shadow-xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Alert */}
        {tradeSuccessToast && (
          <div className="bg-[#09090B] text-white px-4 py-2 text-xs font-medium flex items-center justify-between z-30">
            <span className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#10b981]" />
              {tradeSuccessToast}
            </span>
            <button onClick={() => setTradeSuccessToast(null)} className="text-neutral-400 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between gap-4 shrink-0 bg-white">
          <div className="flex items-center gap-2 text-xs text-[#64748b]">
            <span className="font-semibold text-[#09090B]">{market.category}</span>
            <span aria-hidden="true">·</span>
            <span>{market.topic}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 font-mono-tabular">
              <Clock className="w-3 h-3 text-[#94a3b8]" />
              {market.timeRemaining}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText?.(window.location.href)}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
              title="Share Market"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Two Column (Left: Context & Chart, Right: Trading Panel) */}
        <div className="overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (Content, Chart, Theses, Rules) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Title */}
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                {market.iconImage ? (
                  <img
                    src={market.iconImage}
                    alt={market.topic}
                    className="w-7 h-7 rounded-full object-cover shrink-0 border border-neutral-100"
                  />
                ) : (
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${market.iconBg}`}
                  >
                    {market.iconSymbol}
                  </span>
                )}
                {market.isLive && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE SESSION
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-[#09090B] leading-snug">
                {market.question}
              </h2>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-4 gap-2.5 p-3 bg-[#f8fafc] border border-neutral-200/70 rounded-xl text-center">
              <div>
                <span className="text-[11px] text-[#64748b] block">Volume</span>
                <span className="font-mono-tabular font-semibold text-xs sm:text-sm text-[#09090B]">
                  {market.volume}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#64748b] block">Liquidity</span>
                <span className="font-mono-tabular font-semibold text-xs sm:text-sm text-[#09090B]">
                  {market.liquidity}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#64748b] block">Traders</span>
                <span className="font-mono-tabular font-semibold text-xs sm:text-sm text-[#09090B]">
                  {market.tradersCount.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#64748b] block">Resolves</span>
                <span className="font-mono-tabular font-semibold text-xs sm:text-sm text-[#09090B] truncate block">
                  {market.timeRemaining}
                </span>
              </div>
            </div>

            {/* Probability Movement Graph */}
            <div className="border border-neutral-200 rounded-xl p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold font-mono-tabular text-[#09090B]">
                    {market.yesProbability}%
                  </span>
                  <span className="text-xs font-semibold text-[#10b981] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Implied Yes
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-full text-[11px]">
                  {(['1D', '1W', '1M', 'ALL'] as const).map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => setSelectedTimeframe(tf)}
                      className={`px-2.5 py-0.5 rounded-full font-medium transition-colors cursor-pointer ${
                        selectedTimeframe === tf
                          ? 'bg-white text-[#09090B] shadow-xs'
                          : 'text-[#64748b] hover:text-[#09090B]'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart SVG */}
              <div className="w-full overflow-hidden">
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-28 sm:h-32">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Grid horizontal lines */}
                  <line x1="0" y1={svgHeight * 0.25} x2={svgWidth} y2={svgHeight * 0.25} stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="0" y1={svgHeight * 0.5} x2={svgWidth} y2={svgHeight * 0.5} stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="0" y1={svgHeight * 0.75} x2={svgWidth} y2={svgHeight * 0.75} stroke="#f1f5f9" strokeDasharray="3 3" />

                  {/* Area fill */}
                  <polygon
                    fill="url(#chartGrad)"
                    points={`20,${svgHeight} ${polylinePoints} ${svgWidth - 20},${svgHeight}`}
                  />

                  {/* Line */}
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polylinePoints}
                  />

                  {/* Data points */}
                  {chartPoints.map((pt, i) => {
                    const x = (i / (chartPoints.length - 1)) * (svgWidth - 40) + 20;
                    const y = svgHeight - (pt.yes / 100) * (svgHeight - 30) - 15;
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="3.5"
                        fill="#10b981"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Resolution Criteria */}
            <div className="border border-neutral-200 rounded-xl p-4 bg-white space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#09090B]">
                <ShieldCheck className="w-4 h-4 text-[#10b981]" />
                <span>Resolution Criteria</span>
              </div>
              <p className="text-xs text-[#475569] leading-relaxed">
                {market.resolutionCriteria}
              </p>
              {market.sourceUrl && (
                <a
                  href={market.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#10b981] hover:underline pt-1"
                >
                  <span>Official Oracle Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Prediction Theses ("Why do you think so?") */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-[#09090B]">
                  Community Theses ({thesesList.length})
                </h4>
                <span className="text-xs text-[#64748b]">Peer analysis & rationale</span>
              </div>

              <div className="space-y-3">
                {thesesList.map((thesis) => (
                  <div
                    key={thesis.id}
                    className="p-3.5 border border-neutral-200 rounded-xl bg-white space-y-2 hover:border-neutral-300 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#09090B]">@{thesis.author}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            thesis.side === 'YES'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-neutral-100 text-neutral-800 border border-neutral-200'
                          }`}
                        >
                          Backed {thesis.side}
                        </span>
                        <span className="text-neutral-400 font-mono-tabular">{thesis.staked}</span>
                      </div>
                      <span className="text-[11px] text-neutral-400">{thesis.timeAgo}</span>
                    </div>

                    <p className="text-xs text-[#334155] leading-relaxed italic">
                      “{thesis.summary}”
                    </p>

                    {/* Reactions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleReactThesis(thesis.id, 'insightful')}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-[#475569] transition-colors cursor-pointer"
                      >
                        <Lightbulb className="w-3 h-3 text-amber-500" />
                        <span>{thesis.reactions.insightful}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReactThesis(thesis.id, 'bullish')}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-[#475569] transition-colors cursor-pointer"
                      >
                        <ThumbsUp className="w-3 h-3 text-blue-500" />
                        <span>{thesis.reactions.bullish}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReactThesis(thesis.id, 'fire')}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-[#475569] transition-colors cursor-pointer"
                      >
                        <Flame className="w-3 h-3 text-rose-500" />
                        <span>{thesis.reactions.fire}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Clean Trading Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#fcfdfd] border border-neutral-200 rounded-2xl p-5 shadow-xs sticky top-0">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
                <span className="text-sm font-semibold text-[#09090B]">Trading Terminal</span>
                <span className="text-xs text-[#64748b]">
                  Available: <strong className="font-mono-tabular text-[#09090B]">${userBalance.toLocaleString()}</strong>
                </span>
              </div>

              <form onSubmit={handleExecuteTrade} className="space-y-4">
                {/* YES / NO Outcome Tabs */}
                <div>
                  <label className="text-xs font-medium text-[#475569] block mb-1.5">
                    Select Position
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedSide('YES')}
                      className={`relative overflow-hidden py-3 px-3 rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 cursor-pointer group/side ${
                        selectedSide === 'YES'
                          ? 'border-[#10b981] bg-emerald-50/80 shadow-xs'
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                      }`}
                    >
                      <HalftoneBackground opacity={selectedSide === 'YES' ? 0.20 : 0.12} fill="#059669" className="group-hover/side:opacity-28 group-hover/side:scale-108 transition-all duration-300" />
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800">YES</span>
                        <span className="font-mono-tabular text-sm font-bold text-emerald-700">
                          {market.yesProbability}%
                        </span>
                      </div>
                      <span className="relative z-10 text-[11px] text-[#64748b] block mt-0.5">
                        Payout $1.00 if true
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedSide('NO')}
                      className={`relative overflow-hidden py-3 px-3 rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 cursor-pointer group/side ${
                        selectedSide === 'NO'
                          ? 'border-[#09090B] bg-neutral-100 shadow-xs'
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                      }`}
                    >
                      <HalftoneBackground opacity={selectedSide === 'NO' ? 0.20 : 0.12} fill="#71717A" className="group-hover/side:opacity-28 group-hover/side:scale-108 transition-all duration-300" />
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="text-xs font-bold text-[#09090B]">NO</span>
                        <span className="font-mono-tabular text-sm font-bold text-[#09090B]">
                          {market.noProbability}%
                        </span>
                      </div>
                      <span className="relative z-10 text-[11px] text-[#64748b] block mt-0.5">
                        Payout $1.00 if false
                      </span>
                    </button>
                  </div>
                </div>

                {/* Amount Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="modal-amount-input" className="text-xs font-medium text-[#475569]">
                      Amount ($)
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[10, 25, 50, 100, 250].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setStakeAmount(preset.toString())}
                          className="text-[10px] px-2.5 py-0.5 bg-neutral-100 hover:bg-neutral-200 text-[#475569] rounded-full font-mono-tabular cursor-pointer transition-colors"
                        >
                          +${preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono-tabular text-neutral-400">
                      $
                    </span>
                    <input
                      id="modal-amount-input"
                      type="number"
                      min="1"
                      step="1"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 text-sm font-mono-tabular font-semibold bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-[#10b981] transition-colors"
                    />
                  </div>
                </div>

                {/* Order Summary Calculations */}
                <div className="p-3 bg-neutral-50 border border-neutral-200/60 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between text-[#64748b]">
                    <span>Estimated Shares</span>
                    <span className="font-mono-tabular font-medium text-[#09090B]">
                      {estimatedShares.toLocaleString()} contracts
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#64748b]">
                    <span>Potential Payout</span>
                    <span className="font-mono-tabular font-semibold text-[#09090B]">
                      ${potentialPayout.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-200/50">
                    <span className="font-medium text-[#09090B]">Potential Profit</span>
                    <span className="font-mono-tabular font-bold text-emerald-600">
                      +${potentialProfit.toLocaleString()} ({returnPercentage}%)
                    </span>
                  </div>
                </div>

                {/* Optional Thesis Text Box */}
                <div>
                  <label htmlFor="modal-thesis-input" className="text-xs font-medium text-[#475569] block mb-1">
                    Why do you think so? <span className="font-normal text-neutral-400">(optional)</span>
                  </label>
                  <textarea
                    id="modal-thesis-input"
                    rows={2}
                    value={thesisText}
                    onChange={(e) => setThesisText(e.target.value)}
                    placeholder="Share your prediction thesis with the community..."
                    className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-[#10b981] placeholder:text-neutral-400"
                  />
                </div>

                {/* Submit Trade Button */}
                {!connectedAddress ? (
                  <button
                    type="button"
                    onClick={onOpenConnectModal}
                    className="w-full py-3 px-4 rounded-xl text-white font-medium text-sm transition-all duration-150 cursor-pointer shadow-sm flex items-center justify-center gap-2 bg-[#09090B] hover:bg-[#18181b]"
                  >
                    <span>Connect Wallet to Trade</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className={`w-full py-3 px-4 rounded-xl text-white font-medium text-sm transition-all duration-150 cursor-pointer shadow-sm flex items-center justify-center gap-2 ${
                      selectedSide === 'YES'
                        ? 'bg-[#10b981] hover:bg-[#059669]'
                        : 'bg-[#09090B] hover:bg-[#18181b]'
                    }`}
                  >
                    <span>
                      Buy {selectedSide} for ${numericAmount.toLocaleString()}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </form>

              {/* Recent Trades Stream */}
              <div className="mt-5 pt-4 border-t border-neutral-100">
                <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider block mb-2">
                  Recent Market Trades
                </span>
                <div className="space-y-1.5">
                  {market.recentTrades.map((trade) => (
                    <div
                      key={trade.id}
                      className="flex items-center justify-between text-[11px] text-[#64748b] py-1"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold font-mono-tabular ${
                            trade.type === 'YES' ? 'text-emerald-600' : 'text-[#09090B]'
                          }`}
                        >
                          {trade.type}
                        </span>
                        <span className="font-mono-tabular text-[#09090B]">{trade.total}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono-tabular">
                        <span>{trade.user}</span>
                        <span>·</span>
                        <span>{trade.timeAgo}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
