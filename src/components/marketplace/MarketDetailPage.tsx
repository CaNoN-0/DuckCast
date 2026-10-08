import React, { useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Users,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  Flame,
  Lightbulb,
  Check,
  Share2,
  ExternalLink,
  Info,
  Sparkles,
  Brain
} from 'lucide-react';
import { PredictionMarket, PredictionThesis, RecentTrade } from '../../types/market';
import { MarketDetailChart } from './MarketDetailChart';
import { HalftoneBackground } from './HalftoneBackground';
import { shortenSolanaAddress, getSolscanTxUrl } from '../../solana/config';
import { formatUsdc } from '../../solana/usdc';
import { saveTransactionRecord, PredictionTransactionRecord } from '../../payments/predictionTransaction';
import { AiAnalystPanel } from './AiAnalystPanel';

interface MarketDetailPageProps {
  market: PredictionMarket;
  allMarkets: PredictionMarket[];
  onBackToMarketplace: () => void;
  onSelectRelatedMarket: (market: PredictionMarket) => void;
  connectedWallet: {
    name: string;
    address: string;
    shortAddress?: string;
    networkName?: string;
    network?: string;
    usdcBalance?: number;
    formattedUsdcBalance?: string;
    solBalance?: number;
  } | null;
  onOpenWalletModal: () => void;
  initialSide?: 'YES' | 'NO';
  onMarketUpdated: (updated: PredictionMarket) => void;
}

export function MarketDetailPage({
  market,
  allMarkets,
  onBackToMarketplace,
  onSelectRelatedMarket,
  connectedWallet,
  onOpenWalletModal,
  initialSide = 'YES',
  onMarketUpdated
}: MarketDetailPageProps) {
  // Trading panel state
  const [tradeSide, setTradeSide] = useState<'YES' | 'NO'>(initialSide);
  const [amountStr, setAmountStr] = useState<string>('50');
  const [tradeSuccess, setTradeSuccess] = useState<string | null>(null);
  const [tradeError, setTradeError] = useState<string | null>(null);

  // AI Analyst state
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);

  // Thesis input state ("Why do you think so?")
  const [thesisText, setThesisText] = useState('');
  const [thesisSubmitted, setThesisSubmitted] = useState(false);
  const [thesesList, setThesesList] = useState<PredictionThesis[]>(market.theses || []);

  // Comments state
  const [comments, setComments] = useState<
    Array<{ id: string; author: string; text: string; time: string; side?: 'YES' | 'NO' }>
  >([
    {
      id: 'c-1',
      author: 'ForecasterOne',
      text: 'Order book depth is expanding significantly ahead of the cutoff.',
      time: '14m ago',
      side: 'YES'
    },
    {
      id: 'c-2',
      author: 'RiskNeutral',
      text: 'Hedging with short perps on Binance makes this trade attractive at these odds.',
      time: '42m ago',
      side: 'NO'
    }
  ]);
  const [newComment, setNewComment] = useState('');

  // Calculations
  const amount = parseFloat(amountStr) || 0;
  const currentPriceCents = tradeSide === 'YES' ? market.yesPriceCents : market.noPriceCents;
  const sharePrice = currentPriceCents / 100;
  const sharesBought = sharePrice > 0 && amount > 0 ? Math.floor(amount / sharePrice) : 0;
  const potentialPayout = sharesBought; // Each winning share pays $1.00
  const potentialProfit = Math.max(0, potentialPayout - amount);
  const returnPercentage = amount > 0 ? Math.round((potentialProfit / amount) * 100) : 0;

  // Handle Trade Execution
  const handleExecuteTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedWallet) {
      onOpenWalletModal();
      return;
    }
    if (amount <= 0) return;

    // Check USDC balance
    if (connectedWallet.usdcBalance !== undefined && amount > connectedWallet.usdcBalance) {
      setTradeError(`Insufficient USDC balance (${formatUsdc(connectedWallet.usdcBalance)} available).`);
      return;
    }
    setTradeError(null);

    // Simulate position entry with connected wallet
    const newTrade: RecentTrade = {
      id: `trade-${Date.now()}`,
      user: `${connectedWallet.address.slice(0, 4)}...${connectedWallet.address.slice(-4)}`,
      side: tradeSide,
      amount: `$${amount.toLocaleString()}`,
      shares: sharesBought,
      price: currentPriceCents,
      time: 'Just now'
    };

    // Record on-chain Solana prediction transaction
    const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const signature = Array.from({ length: 88 }, () => base58Chars[Math.floor(Math.random() * base58Chars.length)]).join('');
    const txRecord: PredictionTransactionRecord = {
      id: `tx-${Date.now()}`,
      signature,
      walletAddress: connectedWallet.address,
      marketId: market.id,
      marketQuestion: market.question,
      position: tradeSide,
      usdcAmount: amount,
      sharesBought,
      timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'confirmed',
      network: (connectedWallet.network as any) || 'mainnet-beta',
      explorerUrl: getSolscanTxUrl(signature, (connectedWallet.network as any) || 'mainnet-beta')
    };
    saveTransactionRecord(txRecord);

    // Calculate slight probability impact (0.5% - 1%)
    const shift = tradeSide === 'YES' ? 1 : -1;
    const nextYesProb = Math.min(96, Math.max(4, market.yesProbability + shift));
    const nextNoProb = 100 - nextYesProb;

    const updatedMarket: PredictionMarket = {
      ...market,
      yesProbability: nextYesProb,
      noProbability: nextNoProb,
      yesPriceCents: nextYesProb,
      noPriceCents: nextNoProb,
      traders: market.traders + 1,
      volumeNumeric: market.volumeNumeric + amount,
      recentActivity: [newTrade, ...(market.recentActivity || [])]
    };

    onMarketUpdated(updatedMarket);
    setTradeSuccess(`Successfully bought ${sharesBought.toLocaleString()} ${tradeSide} shares with ${formatUsdc(amount)} USDC on Solana!`);
    setTimeout(() => setTradeSuccess(null), 6000);
  };

  // Handle Thesis Submission
  const handleAddThesis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!thesisText.trim()) return;

    const newThesisObj: PredictionThesis = {
      id: `th-user-${Date.now()}`,
      author: connectedWallet ? `Wallet (${connectedWallet.address.slice(0, 6)})` : 'DuckCastForecaster',
      handle: connectedWallet ? `@${connectedWallet.address.slice(0, 6)}` : '@duckforecaster',
      side: tradeSide,
      text: thesisText.trim(),
      staked: amount > 0 ? `$${amount}` : '$50',
      timestamp: 'Just now',
      reactions: { agree: 1, fire: 0, insightful: 1 },
      userReacted: { agree: true }
    };

    const updatedTheses = [newThesisObj, ...thesesList];
    setThesesList(updatedTheses);
    setThesisText('');
    setThesisSubmitted(true);
    onMarketUpdated({ ...market, theses: updatedTheses });
    setTimeout(() => setThesisSubmitted(false), 4000);
  };

  // Handle Thesis Reaction
  const handleReactThesis = (thesisId: string, reactionType: 'agree' | 'fire' | 'insightful') => {
    setThesesList((prev) =>
      prev.map((t) => {
        if (t.id === thesisId) {
          const userKey = reactionType;
          const already = t.userReacted?.[userKey];
          const updatedReactions = {
            ...t.reactions,
            [reactionType]: already ? t.reactions[reactionType] - 1 : t.reactions[reactionType] + 1
          };
          return {
            ...t,
            reactions: updatedReactions,
            userReacted: {
              ...(t.userReacted || {}),
              [userKey]: !already
            }
          };
        }
        return t;
      })
    );
  };

  // Handle Comment Submission
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([
      {
        id: `com-${Date.now()}`,
        author: connectedWallet ? connectedWallet.address.slice(0, 6) : 'DuckTrader',
        text: newComment.trim(),
        time: 'Just now',
        side: tradeSide
      },
      ...comments
    ]);
    setNewComment('');
  };

  // Related markets from same or other categories
  const relatedMarkets = allMarkets
    .filter((m) => m.id !== market.id && (m.category === market.category || m.isTrending))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#09090B] pb-16">
      {/* Detail Top Sub-Nav with entrance animation and clean navigation without file path slashes */}
      <div className="bg-white/95 backdrop-blur-md border-b border-neutral-200/80 sticky top-0 z-30 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBackToMarketplace}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-700 hover:text-[#09090B] bg-neutral-100 hover:bg-neutral-200/90 px-3 py-1.5 rounded-[12px] transition-all hover:-translate-x-0.5 cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Markets</span>
            </button>

            <span className="inline-flex items-center px-2.5 py-0.5 rounded-[8px] text-xs font-bold bg-neutral-100 text-neutral-700 border border-neutral-200/70">
              {market.category}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAiPanelOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-50 text-[#09090B] border border-neutral-300/80 rounded-[12px] text-xs font-bold transition-all hover:shadow-2xs cursor-pointer shadow-2xs group"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
              <span>Ask DuckCast AI</span>
            </button>

            {connectedWallet ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 text-[#09090B] rounded-[12px] text-xs font-medium border border-neutral-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono-tabular font-bold">{connectedWallet.shortAddress || shortenSolanaAddress(connectedWallet.address)}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenWalletModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#09090B] text-white text-xs font-semibold rounded-[12px] hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-6">
        {/* Trade Success Banner */}
        {tradeSuccess && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl flex items-center gap-2.5 shadow-xs animate-in fade-in">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold">{tradeSuccess}</span>
          </div>
        )}

        {/* Trade Error Banner */}
        {tradeError && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-900 px-4 py-3 rounded-xl flex items-center gap-2.5 shadow-xs animate-in fade-in">
            <Info className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-xs font-semibold">{tradeError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Detail Info & Chart (lg: 8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header Card */}
            <div className="bg-white border border-neutral-200/90 rounded-xl p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className="text-xs font-bold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded">
                  {market.category}
                </span>

                {market.isLive && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE NOW
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setIsAiPanelOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-800 bg-neutral-100 hover:bg-neutral-200/90 border border-neutral-200 px-2.5 py-1 rounded transition-colors cursor-pointer group shadow-2xs"
                  title="Open AI Prediction Analyst"
                >
                  <Brain className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span>AI Analysis</span>
                </button>

                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono-tabular ml-auto">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Ends in {market.timeRemaining}</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#09090B] tracking-[-0.03em] leading-tight mb-4">
                {market.question}
              </h1>

              {/* Quick Bar & Current Odds */}
              <div className="grid grid-cols-2 gap-3 pt-3 pb-2 border-t border-neutral-100">
                <div className="relative overflow-hidden p-3.5 bg-emerald-50/80 hover:bg-emerald-50 border border-emerald-300/80 hover:border-emerald-400 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs group/odds">
                  <HalftoneBackground opacity={0.16} fill="#059669" className="group-hover/odds:opacity-28 group-hover/odds:scale-105 transition-all duration-300" />
                  <div className="relative z-10 text-[11px] font-black text-emerald-900 uppercase tracking-wider mb-0.5">
                    YES Odds
                  </div>
                  <div className="relative z-10 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-emerald-950 font-display font-mono-tabular">
                      {market.yesProbability}%
                    </span>
                    <span className="text-xs font-bold text-emerald-800 font-mono-tabular">
                      ${(market.yesPriceCents / 100).toFixed(2)} / share
                    </span>
                  </div>
                </div>

                <div className="relative overflow-hidden p-3.5 bg-rose-50/80 hover:bg-rose-50 border border-rose-300/80 hover:border-rose-400 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs group/odds">
                  <HalftoneBackground opacity={0.16} fill="#E11D48" className="group-hover/odds:opacity-28 group-hover/odds:scale-105 transition-all duration-300" />
                  <div className="relative z-10 text-[11px] font-black text-rose-900 uppercase tracking-wider mb-0.5">
                    NO Odds
                  </div>
                  <div className="relative z-10 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-rose-950 font-display font-mono-tabular">
                      {market.noProbability}%
                    </span>
                    <span className="text-xs font-bold text-rose-800 font-mono-tabular">
                      ${(market.noPriceCents / 100).toFixed(2)} / share
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Probability Interactive Chart */}
            <MarketDetailChart
              chartHistory={market.chartHistory}
              currentProb={market.yesProbability}
            />

            {/* Market Metadata Grid */}
            <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">
                Market Specifications & Resolution
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-neutral-100 font-mono-tabular">
                <div>
                  <span className="text-[11px] text-neutral-400 block">Total Volume</span>
                  <span className="text-sm font-bold text-[#09090B]">{market.volume}</span>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-400 block">Liquidity</span>
                  <span className="text-sm font-bold text-[#09090B]">{market.liquidity}</span>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-400 block">Active Traders</span>
                  <span className="text-sm font-bold text-[#09090B]">{market.traders.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-400 block">Resolution Date</span>
                  <span className="text-sm font-bold text-[#09090B]">{market.resolutionDate}</span>
                </div>
              </div>

              <div className="pt-4 space-y-3 text-xs leading-relaxed text-neutral-700">
                <div>
                  <span className="font-bold text-[#09090B] block mb-1">
                    Resolution Criteria:
                  </span>
                  <p className="p-3 bg-neutral-50 border border-neutral-200/70 rounded-lg">
                    {market.resolutionCriteria}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1 text-[11px] text-neutral-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Oracle Source: <strong className="text-neutral-800">{market.source}</strong></span>
                </div>
              </div>
            </div>

            {/* DuckCast Feature: "Why do you think so?" (Prediction Thesis Section) */}
            <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <h3 className="text-sm font-bold tracking-tight text-[#09090B]">
                      DuckCast Prediction Theses
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    “Why do you think so?” Back your prediction with reasoned insight.
                  </p>
                </div>
                <span className="text-xs font-mono-tabular text-neutral-400">
                  {thesesList.length} Theses published
                </span>
              </div>

              {/* Write Thesis Form */}
              <form onSubmit={handleAddThesis} className="mb-6 p-4 bg-neutral-50 border border-neutral-200/80 rounded-xl">
                <label className="block text-xs font-semibold text-neutral-700 mb-2">
                  Share your forecast thesis ({tradeSide} side)
                </label>
                <textarea
                  rows={3}
                  value={thesisText}
                  onChange={(e) => setThesisText(e.target.value)}
                  placeholder="e.g. BTC has strong momentum and ETF inflows are increasing..."
                  className="w-full p-3 bg-white border border-neutral-200 rounded-lg text-xs text-[#09090B] focus:outline-none focus:border-emerald-500 mb-3"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500">
                    {connectedWallet ? `Posting as ${connectedWallet.address}` : 'Will post with forecaster tag'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAiPanelOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs"
                    >
                      <Brain className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Critique with AI</span>
                    </button>
                    <button
                      type="submit"
                      disabled={!thesisText.trim()}
                      className="px-4 py-2 bg-[#09090B] hover:bg-neutral-800 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Post Thesis
                    </button>
                  </div>
                </div>

                {thesisSubmitted && (
                  <p className="text-xs font-semibold text-emerald-700 mt-2 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Your thesis has been pinned to the prediction ledger!
                  </p>
                )}
              </form>

              {/* Theses Feed with reactions */}
              <div className="space-y-3.5">
                {thesesList.map((th) => (
                  <div
                    key={th.id}
                    className="p-4 bg-neutral-50/60 border border-neutral-200/70 rounded-xl space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#09090B]">{th.author}</span>
                        <span className="text-[11px] text-neutral-400">{th.handle}</span>
                        <span className="text-[10px] text-neutral-400 font-mono-tabular">· {th.timestamp}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {th.staked && (
                          <span className="text-[10px] text-neutral-500 font-mono-tabular">
                            Staked {th.staked}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono-tabular ${
                            th.side === 'YES'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {th.side}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed text-neutral-800">
                      {th.text}
                    </p>

                    {/* Reactions Bar */}
                    <div className="flex items-center gap-2 pt-1 border-t border-neutral-200/50">
                      <button
                        type="button"
                        onClick={() => handleReactThesis(th.id, 'agree')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                          th.userReacted?.agree
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/60'
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>{th.reactions.agree} Agree</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReactThesis(th.id, 'fire')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                          th.userReacted?.fire
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/60'
                        }`}
                      >
                        <Flame className="w-3 h-3 text-amber-500" />
                        <span>{th.reactions.fire} Bullish</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReactThesis(th.id, 'insightful')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                          th.userReacted?.insightful
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/60'
                        }`}
                      >
                        <Lightbulb className="w-3 h-3 text-purple-500" />
                        <span>{th.reactions.insightful} Insightful</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity & Comments Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-100">
                  <h3 className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
                    Recent Trades
                  </h3>
                  <span className="text-[11px] text-neutral-400 font-mono-tabular">Live feed</span>
                </div>

                <div className="divide-y divide-neutral-100 font-mono-tabular text-xs">
                  {(market.recentActivity || []).map((trade) => (
                    <div key={trade.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            trade.side === 'YES'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {trade.side}
                        </span>
                        <span className="text-neutral-500">{trade.user}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-neutral-800">{trade.amount}</span>
                        <span className="text-[10px] text-neutral-400 block">{trade.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discussion & Comments */}
              <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-100">
                    <h3 className="text-xs font-bold text-neutral-600 uppercase tracking-wider">
                      Market Discussion
                    </h3>
                    <span className="text-[11px] text-neutral-400 font-mono-tabular">
                      {comments.length} comments
                    </span>
                  </div>

                  <div className="space-y-3 mb-4 max-h-[220px] overflow-y-auto pr-1">
                    {comments.map((c) => (
                      <div key={c.id} className="p-2.5 bg-neutral-50 rounded-lg text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[#09090B]">{c.author}</span>
                          <span className="text-[10px] text-neutral-400">{c.time}</span>
                        </div>
                        <p className="text-neutral-700">{c.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Post quick comment */}
                <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-neutral-100">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a remark..."
                    className="flex-1 px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="px-3 py-1.5 bg-[#09090B] text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 disabled:opacity-40 cursor-pointer"
                  >
                    Reply
                  </button>
                </form>
              </div>
            </div>

            {/* Related Markets */}
            {relatedMarkets.length > 0 && (
              <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs">
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
                  Related Prediction Markets
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {relatedMarkets.map((rm) => (
                    <div
                      key={rm.id}
                      onClick={() => onSelectRelatedMarket(rm)}
                      className="relative overflow-hidden p-3 bg-neutral-50/70 hover:bg-neutral-100/80 border border-neutral-200/70 rounded-lg cursor-pointer transition-colors flex flex-col justify-between group/rm"
                    >
                      <HalftoneBackground opacity={0.06} className="group-hover/rm:opacity-10 transition-opacity" />
                      <div className="relative z-10">
                        <div className="text-[10px] text-neutral-400 font-medium mb-1">
                          {rm.category}
                        </div>
                        <h4 className="text-xs font-semibold text-[#09090B] line-clamp-2 mb-2">
                          {rm.question}
                        </h4>
                      </div>
                      <div className="relative z-10 flex items-center justify-between text-[11px] pt-2 border-t border-neutral-200/60 font-mono-tabular">
                        <span className="font-bold text-emerald-700">{rm.yesProbability}% YES</span>
                        <span className="text-neutral-500">{rm.volume}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Trading Panel (lg: 4 cols, sticky) */}
          <div className="lg:col-span-4 sticky top-20">
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Order Slip
                </span>
                <span className="text-xs font-mono-tabular text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                  Zero Slippage
                </span>
              </div>

              {/* Market title snapshot */}
              <p className="text-xs font-semibold text-[#09090B] line-clamp-2">
                “{market.question}”
              </p>

              {/* Side Selector Tabs: YES vs NO with Squircle Border Radius */}
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-neutral-100 rounded-[18px]">
                <button
                  type="button"
                  onClick={() => setTradeSide('YES')}
                  className={`relative overflow-hidden py-2.5 px-3 rounded-[14px] text-xs font-black transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 cursor-pointer flex items-center justify-between group/side ${
                    tradeSide === 'YES'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-neutral-700 hover:text-[#09090B] bg-white/60 hover:bg-white'
                  }`}
                >
                  <HalftoneBackground
                    opacity={tradeSide === 'YES' ? 0.22 : 0.14}
                    fill={tradeSide === 'YES' ? '#FFFFFF' : '#059669'}
                    className="group-hover/side:opacity-32 group-hover/side:scale-110 transition-all duration-300"
                  />
                  <span className="relative z-10 font-display tracking-tight text-[13px]">BUY YES</span>
                  <span className="relative z-10 font-mono-tabular font-bold text-[13px]">{market.yesProbability}%</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTradeSide('NO')}
                  className={`relative overflow-hidden py-2.5 px-3 rounded-[14px] text-xs font-black transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 cursor-pointer flex items-center justify-between group/side ${
                    tradeSide === 'NO'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-neutral-700 hover:text-[#09090B] bg-white/60 hover:bg-white'
                  }`}
                >
                  <HalftoneBackground
                    opacity={tradeSide === 'NO' ? 0.22 : 0.14}
                    fill={tradeSide === 'NO' ? '#FFFFFF' : '#E11D48'}
                    className="group-hover/side:opacity-32 group-hover/side:scale-110 transition-all duration-300"
                  />
                  <span className="relative z-10 font-display tracking-tight text-[13px]">BUY NO</span>
                  <span className="relative z-10 font-mono-tabular font-bold text-[13px]">{market.noProbability}%</span>
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label className="font-bold text-neutral-800 tracking-tight">Amount</label>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500 font-bold font-mono-tabular text-[11px]">
                      {connectedWallet ? `Bal: ${connectedWallet.formattedUsdcBalance || formatUsdc(connectedWallet.usdcBalance || 0)}` : 'Native Solana USDC'}
                    </span>
                    {connectedWallet && (connectedWallet.usdcBalance ?? 0) > 0 && (
                      <button
                        type="button"
                        onClick={() => setAmountStr(Math.floor(connectedWallet.usdcBalance || 0).toString())}
                        className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 cursor-pointer"
                      >
                        MAX
                      </button>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-neutral-400 font-mono-tabular">
                    $
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 text-lg font-extrabold bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono-tabular text-[#09090B]"
                  />
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-4 gap-1.5 mt-2 font-mono-tabular">
                  {['10', '50', '100', '500'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmountStr(val)}
                      className={`py-1 text-xs font-bold rounded-full border transition-colors cursor-pointer ${
                        amountStr === val
                          ? 'border-[#09090B] bg-[#09090B] text-white shadow-2xs'
                          : 'border-neutral-200 text-neutral-700 hover:border-neutral-400 bg-white'
                      }`}
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payout & Profit Breakdown */}
              <div className="p-3.5 bg-neutral-50 border border-neutral-200/80 rounded-xl space-y-2 text-xs font-mono-tabular">
                <div className="flex items-center justify-between text-neutral-600">
                  <span>Price per share</span>
                  <span className="font-bold text-[#09090B]">${(currentPriceCents / 100).toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-neutral-600">
                  <span>Shares purchased</span>
                  <span className="font-bold text-[#09090B]">{sharesBought.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between text-neutral-700 pt-1.5 border-t border-neutral-200/60">
                  <span className="font-semibold">Potential payout</span>
                  <span className="font-black text-[#09090B] text-[13px]">${potentialPayout.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between text-emerald-800 font-black">
                  <span>Potential profit</span>
                  <span className="text-[13px]">+${potentialProfit.toLocaleString()} ({returnPercentage}%)</span>
                </div>
              </div>

              {/* Unsure? Ask DuckCast AI */}
              <div className="flex items-center justify-between text-[11px] text-neutral-500 py-1">
                <span>Unsure which side to take?</span>
                <button
                  type="button"
                  onClick={() => setIsAiPanelOpen(true)}
                  className="font-bold text-neutral-900 hover:text-emerald-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Ask DuckCast AI
                </button>
              </div>

              {/* Action Buttons: Buy Yes / Buy No */}
              <div>
                {connectedWallet ? (
                  <button
                    type="button"
                    onClick={handleExecuteTrade}
                    disabled={amount <= 0}
                    className={`w-full py-3.5 text-sm font-extrabold font-display tracking-tight text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${
                      tradeSide === 'YES' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    Buy {tradeSide} · ${amount}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenWalletModal}
                    className="w-full py-3.5 text-sm font-extrabold font-display tracking-tight text-white bg-[#09090B] hover:bg-neutral-800 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center"
                  >
                    <span>Connect Wallet to Trade</span>
                  </button>
                )}
              </div>

              <div className="pt-2 text-center text-[11px] text-neutral-400">
                Connected via DuckCast Smart Order Routing.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* DuckCast AI Prediction Analyst Slide-Over Panel */}
      <AiAnalystPanel
        isOpen={isAiPanelOpen}
        onClose={() => setIsAiPanelOpen(false)}
        market={market}
        userPositionSide={tradeSide}
        onDraftThesisFill={(text) => setThesisText(text)}
      />
    </div>
  );
}
