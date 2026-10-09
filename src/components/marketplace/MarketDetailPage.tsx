import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  ThumbsUp,
  Flame,
  Lightbulb,
  Check,
  ExternalLink,
  Info,
  Sparkles,
  Brain,
  Loader2,
  Trophy,
  BadgeCheck
} from 'lucide-react';
import { PredictionMarket } from '../../types/market';
import { MarketDetailChart } from './MarketDetailChart';
import { HalftoneBackground } from './HalftoneBackground';
import { shortenSolanaAddress, getSolscanTxUrl, getSolscanAccountUrl } from '../../solana/config';
import { formatUsdc, validatePredictionAmount } from '../../solana/usdc';
import {
  executePantaBuy,
  executePantaClaim,
  PredictionTransactionRecord,
  TransactionStep,
  UserRejectedError
} from '../../payments/predictionTransaction';
import { pantaApi, PantaPosition, PantaQuote, describePantaError } from '../../services/pantaApi';
import { pantaToPredictionMarket, formatRelativeTime } from '../../services/pantaAdapter';
import { socialApi, SocialThesis, getViewerId } from '../../services/socialApi';
import { useSolanaWallet } from '../../wallet/WalletContext';
import { walletAvatar } from '../../utils/walletAvatar';
import { PoweredByPanta } from '../panta/PoweredByPanta';
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

interface ThesisView {
  id: string;
  author: string;
  handle: string;
  avatar?: string;
  side: 'YES' | 'NO';
  text: string;
  staked?: string;
  timestamp: string;
  reactions: { agree: number; fire: number; insightful: number };
  userReacted: { [key: string]: boolean };
  verified: boolean;
  signed: boolean;
}

const TX_STEPS: Array<{ step: TransactionStep; label: string }> = [
  { step: 'quoting', label: 'Quote' },
  { step: 'building', label: 'Build' },
  { step: 'waiting_approval', label: 'Sign' },
  { step: 'submitting', label: 'Submit' },
  { step: 'confirming', label: 'Confirm' }
];
const BUSY_STEPS: TransactionStep[] = ['quoting', 'building', 'waiting_approval', 'submitting', 'confirming'];

function thesisFromSocial(t: SocialThesis): ThesisView {
  return {
    id: t.id,
    author: shortenSolanaAddress(t.wallet),
    handle: t.position ? `${t.position.shares.toFixed(2)} ${t.side} shares on Panta` : 'Wallet-signed · no position yet',
    avatar: walletAvatar(t.wallet),
    side: t.side,
    text: t.text,
    staked: t.position?.estValueUsdc != null ? `~$${t.position.estValueUsdc.toFixed(2)}` : undefined,
    timestamp: formatRelativeTime(Date.parse(t.createdAt) / 1000),
    reactions: t.reactions,
    userReacted: t.viewerReacted,
    verified: Boolean(t.position),
    signed: t.signed
  };
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
  const { signer, refreshBalances } = useSolanaWallet();
  const isLive = Boolean(market.isPanta);
  const canBuyPrimary =
    isLive && market.pantaMarketPhase === 'primary' && !market.resolved && market.timeMinutes > 0 && !market.pricePending;

  // Keep the latest market + callback without re-triggering effects on every parent render
  const marketRef = useRef(market);
  marketRef.current = market;
  const onMarketUpdatedRef = useRef(onMarketUpdated);
  onMarketUpdatedRef.current = onMarketUpdated;

  // Trading panel state
  const [tradeSide, setTradeSide] = useState<'YES' | 'NO'>(initialSide);
  const [amountStr, setAmountStr] = useState<string>(isLive ? '5' : '50');
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [quote, setQuote] = useState<PantaQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [txStep, setTxStep] = useState<TransactionStep>('idle');
  const [txMessage, setTxMessage] = useState('');
  const [lastTx, setLastTx] = useState<PredictionTransactionRecord | null>(null);

  // Positions on this market (live only)
  const [positions, setPositions] = useState<PantaPosition[]>([]);
  const [claimingSide, setClaimingSide] = useState<string | null>(null);

  // AI Analyst state
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);

  // Theses
  const [thesisText, setThesisText] = useState('');
  const [thesisNotice, setThesisNotice] = useState<string | null>(null);
  const [postingThesis, setPostingThesis] = useState(false);
  const [liveTheses, setLiveTheses] = useState<SocialThesis[]>([]);
  const [demoTheses, setDemoTheses] = useState(market.theses || []);

  // Demo-only discussion
  const [comments, setComments] = useState<
    Array<{ id: string; author: string; text: string; time: string; side?: 'YES' | 'NO' }>
  >([]);
  const [newComment, setNewComment] = useState('');

  const walletAddress = connectedWallet?.address;
  const amount = parseFloat(amountStr) || 0;
  const busy = BUSY_STEPS.includes(txStep);

  // ---------------- Live data loading ----------------

  const loadLiveMarket = useCallback(async () => {
    if (!marketRef.current.isPanta) return;
    try {
      const { market: pm, trades, priceHistory } = await pantaApi.market(marketRef.current.id);
      onMarketUpdatedRef.current(pantaToPredictionMarket(pm, { trades, history: priceHistory, previous: marketRef.current }));
    } catch (err) {
      console.warn('[MarketDetail] Live refresh failed:', err);
    }
  }, []);

  const loadPositions = useCallback(async () => {
    if (!marketRef.current.isPanta || !walletAddress) {
      setPositions([]);
      return;
    }
    try {
      const res = await pantaApi.positions(walletAddress);
      setPositions(res.positions.filter((p) => p.marketId === marketRef.current.id && p.sharesNum > 0));
    } catch (err) {
      console.warn('[MarketDetail] Positions unavailable:', err);
    }
  }, [walletAddress]);

  const loadTheses = useCallback(async () => {
    if (!marketRef.current.isPanta) return;
    try {
      const res = await socialApi.theses(marketRef.current.id, getViewerId(walletAddress));
      setLiveTheses(res.items);
    } catch (err) {
      console.warn('[MarketDetail] Theses unavailable:', err);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (!isLive) return;
    loadLiveMarket();
    const t = setInterval(loadLiveMarket, 20_000);
    return () => clearInterval(t);
  }, [isLive, market.id, loadLiveMarket]);

  useEffect(() => {
    loadPositions();
  }, [loadPositions, market.id]);

  useEffect(() => {
    loadTheses();
  }, [loadTheses, market.id]);

  // Live quote preview (debounced; Panta quotes are rate-limited and expire in ~90s)
  useEffect(() => {
    setQuote(null);
    setQuoteError(null);
    if (!canBuyPrimary || !walletAddress || amount < 1 || busy) return;
    const timer = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        setQuote(await pantaApi.quote({ wallet: walletAddress, marketId: market.id, side: tradeSide === 'YES' ? 'yes' : 'no', amountUsdc: amount }));
      } catch (err) {
        setQuoteError(describePantaError(err));
      } finally {
        setQuoteLoading(false);
      }
    }, 700);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canBuyPrimary, walletAddress, market.id, tradeSide, amount]);

  // ---------------- Order preview ----------------

  const currentPriceCents = tradeSide === 'YES' ? market.yesPriceCents : market.noPriceCents;
  const spotPrice = Math.max(0.01, currentPriceCents / 100);
  const feeRate = (market.pantaFeePercent ?? 2) / 100;
  const estFee = quote ? Number(quote.feeUsdc) : amount * feeRate;
  const sharesBought = quote ? Number(quote.shares) : amount > 0 ? Math.max(0, (amount - estFee) / spotPrice) : 0;
  const avgPrice = quote ? Number(quote.avgPrice) : spotPrice;
  const potentialPayout = sharesBought; // each winning share redeems for 1 USDC
  const potentialProfit = Math.max(0, potentialPayout - amount);
  const returnPercentage = amount > 0 ? Math.round((potentialProfit / amount) * 100) : 0;

  // ---------------- Actions ----------------

  const handleExecuteTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedWallet) {
      onOpenWalletModal();
      return;
    }
    if (!canBuyPrimary) {
      setTradeError(isLive ? 'This market is not accepting primary buys right now.' : 'Demo market — connect DuckCast to Panta to trade live.');
      return;
    }
    if (!signer) {
      setTradeError('Your wallet is still connecting. Try again in a moment.');
      return;
    }
    const validation = validatePredictionAmount(amount, connectedWallet.usdcBalance ?? 0, connectedWallet.solBalance ?? 0);
    if (!validation.isValid) {
      setTradeError(validation.error || 'Invalid amount.');
      return;
    }

    setTradeError(null);
    setLastTx(null);
    try {
      const record = await executePantaBuy(
        {
          wallet: connectedWallet.address,
          marketId: market.id,
          marketQuestion: market.question,
          side: tradeSide,
          amountUsdc: amount,
          signer
        },
        (step, message) => {
          setTxStep(step);
          setTxMessage(message || '');
        }
      );
      setLastTx(record);
      refreshBalances();
      loadPositions();
      loadLiveMarket();
      setTimeout(() => setTxStep('idle'), 8000);
    } catch (err) {
      setTxStep('idle');
      setTradeError(err instanceof UserRejectedError ? 'Transaction cancelled in your wallet.' : describePantaError(err));
    }
  };

  const handleClaim = async (position: PantaPosition) => {
    if (!connectedWallet || !signer) {
      onOpenWalletModal();
      return;
    }
    setClaimingSide(position.side);
    setTradeError(null);
    try {
      const record = await executePantaClaim(
        { wallet: connectedWallet.address, marketId: market.id, marketQuestion: market.question, signer },
        (step, message) => {
          setTxStep(step);
          setTxMessage(message || '');
        }
      );
      setLastTx(record);
      refreshBalances();
      loadPositions();
      setTimeout(() => setTxStep('idle'), 8000);
    } catch (err) {
      setTxStep('idle');
      setTradeError(err instanceof UserRejectedError ? 'Claim cancelled in your wallet.' : describePantaError(err));
    } finally {
      setClaimingSide(null);
    }
  };

  const handleAddThesis = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = thesisText.trim();
    if (!text) return;

    if (!isLive) {
      setDemoTheses((prev) => [
        {
          id: `th-user-${Date.now()}`,
          author: connectedWallet ? shortenSolanaAddress(connectedWallet.address) : 'You',
          handle: '@demo',
          side: tradeSide,
          text,
          staked: '—',
          timestamp: 'Just now',
          reactions: { agree: 0, fire: 0, insightful: 0 },
          userReacted: {}
        },
        ...prev
      ]);
      setThesisText('');
      setThesisNotice('Added to this demo market (not saved).');
      setTimeout(() => setThesisNotice(null), 4000);
      return;
    }

    if (!connectedWallet || !signer) {
      onOpenWalletModal();
      return;
    }

    setPostingThesis(true);
    setThesisNotice(null);
    try {
      const item = await socialApi.postThesis({
        marketId: market.id,
        marketTitle: market.question,
        wallet: connectedWallet.address,
        side: tradeSide,
        text,
        signer
      });
      setLiveTheses((prev) => [item, ...prev]);
      setThesisText('');
      setThesisNotice(
        item.position
          ? `Posted with a verified badge: you hold ${item.position.shares.toFixed(2)} ${tradeSide} shares on Panta.`
          : `Posted and wallet-signed. Buy ${tradeSide} shares to earn the verified-position badge.`
      );
      setTimeout(() => setThesisNotice(null), 6000);
    } catch (err) {
      setThesisNotice((err as Error).message || 'Could not post your thesis.');
    } finally {
      setPostingThesis(false);
    }
  };

  const handleReactThesis = async (thesisId: string, reactionType: 'agree' | 'fire' | 'insightful') => {
    if (isLive) {
      try {
        const { item } = await socialApi.react(thesisId, reactionType, getViewerId(walletAddress));
        setLiveTheses((prev) => prev.map((t) => (t.id === thesisId ? item : t)));
      } catch (err) {
        console.warn('[MarketDetail] Reaction failed:', err);
      }
      return;
    }
    setDemoTheses((prev) =>
      prev.map((t) => {
        if (t.id !== thesisId) return t;
        const already = t.userReacted?.[reactionType];
        return {
          ...t,
          reactions: { ...t.reactions, [reactionType]: t.reactions[reactionType] + (already ? -1 : 1) },
          userReacted: { ...(t.userReacted || {}), [reactionType]: !already }
        };
      })
    );
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([
      {
        id: `com-${Date.now()}`,
        author: connectedWallet ? shortenSolanaAddress(connectedWallet.address) : 'You',
        text: newComment.trim(),
        time: 'Just now',
        side: tradeSide
      },
      ...comments
    ]);
    setNewComment('');
  };

  const thesesView: ThesisView[] = isLive
    ? liveTheses.map(thesisFromSocial)
    : demoTheses.map((t) => ({
        id: t.id,
        author: t.author,
        handle: t.handle,
        side: t.side,
        text: t.text,
        staked: t.staked,
        timestamp: t.timestamp,
        reactions: t.reactions,
        userReacted: t.userReacted || {},
        verified: false,
        signed: false
      }));

  // Related markets from same or other categories
  const relatedMarkets = allMarkets
    .filter((m) => m.id !== market.id && (m.category === market.category || m.isTrending))
    .slice(0, 3);

  const presets = isLive ? ['1', '5', '10', '25'] : ['10', '50', '100', '500'];
  const currentStepIndex = TX_STEPS.findIndex((s) => s.step === txStep);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#09090B] pb-16">
      {/* Detail Top Sub-Nav */}
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

      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-6">
        {/* Transaction progress */}
        {txStep !== 'idle' && (
          <div
            className={`mb-6 px-4 py-3 rounded-xl border shadow-xs animate-in fade-in ${
              txStep === 'confirmed'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : txStep === 'failed' || txStep === 'rejected'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-white border-neutral-200 text-neutral-800'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs font-semibold">
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin text-neutral-500 shrink-0" />
              ) : txStep === 'confirmed' ? (
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{txMessage}</span>
              {lastTx && txStep === 'confirmed' && (
                <a
                  href={lastTx.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto inline-flex items-center gap-1 underline underline-offset-2 font-bold"
                >
                  View on Solscan <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            {busy && (
              <div className="flex items-center gap-1.5 mt-2.5 text-[10px] font-bold uppercase tracking-wider font-mono-tabular">
                {TX_STEPS.map((s, i) => (
                  <span
                    key={s.step}
                    className={`px-2 py-0.5 rounded ${
                      i < currentStepIndex ? 'bg-emerald-100 text-emerald-800' : i === currentStepIndex ? 'bg-[#09090B] text-white' : 'bg-neutral-100 text-neutral-400'
                    }`}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            )}
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
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header Card */}
            <div className="bg-white border border-neutral-200/90 rounded-xl p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className="text-xs font-bold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded">{market.category}</span>

                {isLive ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE ON PANTA · {String(market.pantaMarketPhase || 'primary').toUpperCase()}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded">
                    DEMO MARKET
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
                  <span>{market.timeMinutes > 0 ? `Ends in ${market.timeRemaining}` : 'Trading ended'}</span>
                </div>
              </div>

              <div className="flex items-start gap-4 mb-4">
                {market.pantaImage && (
                  <img
                    src={market.pantaImage}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover border border-neutral-200 shrink-0"
                  />
                )}
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#09090B] tracking-[-0.03em] leading-tight">
                  {market.question}
                </h1>
              </div>

              {/* Current Odds */}
              <div className="grid grid-cols-2 gap-3 pt-3 pb-2 border-t border-neutral-100">
                <div className="relative overflow-hidden p-3.5 bg-emerald-50/80 hover:bg-emerald-50 border border-emerald-300/80 hover:border-emerald-400 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs group/odds">
                  <HalftoneBackground opacity={0.16} fill="#059669" className="group-hover/odds:opacity-28 group-hover/odds:scale-105 transition-all duration-300" />
                  <div className="relative z-10 text-[11px] font-black text-emerald-900 uppercase tracking-wider mb-0.5">YES Odds</div>
                  <div className="relative z-10 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-emerald-950 font-display font-mono-tabular">
                      {market.pricePending ? '—' : `${market.yesProbability}%`}
                    </span>
                    <span className="text-xs font-bold text-emerald-800 font-mono-tabular">${(market.yesPriceCents / 100).toFixed(2)} / share</span>
                  </div>
                </div>

                <div className="relative overflow-hidden p-3.5 bg-rose-50/80 hover:bg-rose-50 border border-rose-300/80 hover:border-rose-400 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs group/odds">
                  <HalftoneBackground opacity={0.16} fill="#E11D48" className="group-hover/odds:opacity-28 group-hover/odds:scale-105 transition-all duration-300" />
                  <div className="relative z-10 text-[11px] font-black text-rose-900 uppercase tracking-wider mb-0.5">NO Odds</div>
                  <div className="relative z-10 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-rose-950 font-display font-mono-tabular">
                      {market.pricePending ? '—' : `${market.noProbability}%`}
                    </span>
                    <span className="text-xs font-bold text-rose-800 font-mono-tabular">${(market.noPriceCents / 100).toFixed(2)} / share</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Probability Chart */}
            <MarketDetailChart chartHistory={market.chartHistory} currentProb={market.yesProbability} />
            {isLive && (
              <p className="-mt-4 text-[11px] text-neutral-400 px-1">
                Chart plots Panta spot prices observed by DuckCast over time.
              </p>
            )}

            {/* Market Metadata */}
            <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs">
              <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">Market Specifications & Resolution</h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-neutral-100 font-mono-tabular">
                <div>
                  <span className="text-[11px] text-neutral-400 block">Total Volume</span>
                  <span className="text-sm font-bold text-[#09090B]">{market.volume}</span>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-400 block">{isLive ? 'Mechanism' : 'Liquidity'}</span>
                  <span className="text-sm font-bold text-[#09090B]">{market.liquidity}</span>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-400 block">{isLive ? 'Recent traders' : 'Active Traders'}</span>
                  <span className="text-sm font-bold text-[#09090B]">{market.traders.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-400 block">Resolution Date</span>
                  <span className="text-sm font-bold text-[#09090B]">{market.resolutionDate}</span>
                </div>
              </div>

              <div className="pt-4 space-y-3 text-xs leading-relaxed text-neutral-700">
                <div>
                  <span className="font-bold text-[#09090B] block mb-1">Resolution Criteria:</span>
                  <p className="p-3 bg-neutral-50 border border-neutral-200/70 rounded-lg whitespace-pre-line">{market.resolutionCriteria}</p>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-[11px] text-neutral-500">
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>
                      Oracle Source: <strong className="text-neutral-800">{market.source}</strong>
                    </span>
                  </span>
                  {isLive && (
                    <a
                      href={getSolscanAccountUrl(market.id, 'mainnet-beta')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-neutral-700 hover:text-[#09090B] underline underline-offset-2"
                    >
                      Market account {shortenSolanaAddress(market.id)} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Prediction Theses */}
            <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <h3 className="text-sm font-bold tracking-tight text-[#09090B]">DuckCast Prediction Theses</h3>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {isLive
                      ? 'Wallet-signed arguments. A verified badge means the author holds that side on Panta right now.'
                      : '“Why do you think so?” Back your prediction with reasoned insight.'}
                  </p>
                </div>
                <span className="text-xs font-mono-tabular text-neutral-400">{thesesView.length} published</span>
              </div>

              <form onSubmit={handleAddThesis} className="mb-6 p-4 bg-neutral-50 border border-neutral-200/80 rounded-xl">
                <label className="block text-xs font-semibold text-neutral-700 mb-2">Share your forecast thesis ({tradeSide} side)</label>
                <textarea
                  rows={3}
                  maxLength={600}
                  value={thesisText}
                  onChange={(e) => setThesisText(e.target.value)}
                  placeholder="What do you know that the odds don't reflect yet?"
                  className="w-full p-3 bg-white border border-neutral-200 rounded-lg text-xs text-[#09090B] focus:outline-none focus:border-emerald-500 mb-3"
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-neutral-500">
                    {isLive
                      ? connectedWallet
                        ? `Your wallet will sign this thesis (free, no transaction).`
                        : 'Connect a wallet to post a signed thesis.'
                      : 'Demo market — theses are not saved.'}
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
                      disabled={!thesisText.trim() || postingThesis}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#09090B] hover:bg-neutral-800 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      {postingThesis && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {isLive ? 'Sign & Post' : 'Post Thesis'}
                    </button>
                  </div>
                </div>

                {thesisNotice && (
                  <p className="text-xs font-semibold text-emerald-700 mt-2 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    {thesisNotice}
                  </p>
                )}
              </form>

              <div className="space-y-3.5">
                {thesesView.length === 0 && (
                  <p className="text-xs text-neutral-500 text-center py-4">No theses yet. Be the first to explain your call.</p>
                )}
                {thesesView.map((th) => (
                  <div key={th.id} className="p-4 bg-neutral-50/60 border border-neutral-200/70 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {th.avatar && <img src={th.avatar} alt="" className="w-6 h-6 rounded-full border border-neutral-200" />}
                        <span className="text-xs font-bold text-[#09090B] font-mono-tabular">{th.author}</span>
                        {th.verified && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded" title="Holds this side on Panta">
                            <BadgeCheck className="w-3 h-3" /> Verified position
                          </span>
                        )}
                        <span className="text-[11px] text-neutral-400 truncate">{th.handle}</span>
                        <span className="text-[10px] text-neutral-400 font-mono-tabular shrink-0">· {th.timestamp}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {th.staked && <span className="text-[10px] text-neutral-500 font-mono-tabular">{th.verified ? `Holds ${th.staked}` : `Staked ${th.staked}`}</span>}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono-tabular ${
                            th.side === 'YES' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {th.side}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed text-neutral-800 whitespace-pre-line">{th.text}</p>

                    <div className="flex items-center gap-2 pt-1 border-t border-neutral-200/50">
                      <button
                        type="button"
                        onClick={() => handleReactThesis(th.id, 'agree')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                          th.userReacted?.agree ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/60'
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>{th.reactions.agree} Agree</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReactThesis(th.id, 'fire')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                          th.userReacted?.fire ? 'bg-amber-100 text-amber-800' : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/60'
                        }`}
                      >
                        <Flame className="w-3 h-3 text-amber-500" />
                        <span>{th.reactions.fire} Bullish</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReactThesis(th.id, 'insightful')}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                          th.userReacted?.insightful ? 'bg-purple-100 text-purple-800' : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/60'
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

            {/* Recent Activity & Position / Discussion */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-100">
                  <h3 className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Recent Trades</h3>
                  <span className="text-[11px] text-neutral-400 font-mono-tabular">{isLive ? 'Panta trade tape' : 'Demo feed'}</span>
                </div>

                <div className="divide-y divide-neutral-100 font-mono-tabular text-xs max-h-[280px] overflow-y-auto">
                  {(market.recentActivity || []).length === 0 && <p className="py-4 text-center text-neutral-400">No trades yet.</p>}
                  {(market.recentActivity || []).map((trade) => (
                    <div key={trade.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            trade.side === 'YES' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {trade.side}
                        </span>
                        <span className="text-neutral-500">{trade.user}</span>
                      </div>
                      <div className="text-right">
                        {isLive ? (
                          <a
                            href={getSolscanTxUrl(trade.id, 'mainnet-beta')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-neutral-800 hover:underline"
                          >
                            {trade.amount}
                          </a>
                        ) : (
                          <span className="font-semibold text-neutral-800">{trade.amount}</span>
                        )}
                        <span className="text-[10px] text-neutral-400 block">{trade.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {isLive ? (
                /* Your Panta position on this market */
                <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-100">
                    <h3 className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Your Position</h3>
                    <span className="text-[11px] text-neutral-400 font-mono-tabular">from Panta</span>
                  </div>
                  {!connectedWallet ? (
                    <button type="button" onClick={onOpenWalletModal} className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer">
                      Connect a wallet to see your shares
                    </button>
                  ) : positions.length === 0 ? (
                    <p className="text-xs text-neutral-500">You don't hold shares in this market yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {positions.map((p) => (
                        <div key={p.side} className="p-3 bg-neutral-50 border border-neutral-200/70 rounded-lg text-xs font-mono-tabular">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                p.side === 'yes' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {p.side.toUpperCase()}
                            </span>
                            <span className="font-bold text-[#09090B]">{p.sharesNum.toFixed(2)} shares</span>
                          </div>
                          <div className="flex items-center justify-between mt-1.5 text-neutral-500">
                            <span>
                              {p.valuation === 'settled_win'
                                ? 'Won — redeemable'
                                : p.valuation === 'settled_loss'
                                ? 'Resolved against'
                                : 'Est. value'}
                            </span>
                            <span className="font-bold text-neutral-800">{p.estValueUsdc != null ? formatUsdc(p.estValueUsdc) : '—'}</span>
                          </div>
                          {p.claimable && !p.claimed && (
                            <button
                              type="button"
                              onClick={() => handleClaim(p)}
                              disabled={busy || claimingSide !== null}
                              className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-bold cursor-pointer"
                            >
                              {claimingSide === p.side ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trophy className="w-3.5 h-3.5" />}
                              Claim winnings
                            </button>
                          )}
                          {p.claimed && <p className="mt-2 text-emerald-700 font-semibold">Claimed ✓</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Demo discussion */
                <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-100">
                      <h3 className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Market Discussion</h3>
                      <span className="text-[11px] text-neutral-400 font-mono-tabular">{comments.length} comments</span>
                    </div>
                    <div className="space-y-3 mb-4 max-h-[220px] overflow-y-auto pr-1">
                      {comments.length === 0 && <p className="text-xs text-neutral-400">No remarks yet (demo, not saved).</p>}
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
              )}
            </div>

            {/* Related Markets */}
            {relatedMarkets.length > 0 && (
              <div className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs">
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Related Prediction Markets</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {relatedMarkets.map((rm) => (
                    <div
                      key={rm.id}
                      onClick={() => onSelectRelatedMarket(rm)}
                      className="relative overflow-hidden p-3 bg-neutral-50/70 hover:bg-neutral-100/80 border border-neutral-200/70 rounded-lg cursor-pointer transition-colors flex flex-col justify-between group/rm"
                    >
                      <HalftoneBackground opacity={0.06} className="group-hover/rm:opacity-10 transition-opacity" />
                      <div className="relative z-10">
                        <div className="text-[10px] text-neutral-400 font-medium mb-1">{rm.category}</div>
                        <h4 className="text-xs font-semibold text-[#09090B] line-clamp-2 mb-2">{rm.question}</h4>
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

          {/* Right Column: Order Slip */}
          <div className="lg:col-span-4 sticky top-20">
            <form onSubmit={handleExecuteTrade} className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Order Slip</span>
                <span className="text-xs font-mono-tabular text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                  {isLive ? 'Max slippage 1%' : 'Demo'}
                </span>
              </div>

              <p className="text-xs font-semibold text-[#09090B] line-clamp-2">“{market.question}”</p>

              {/* Side Selector */}
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-neutral-100 rounded-[18px]">
                {(['YES', 'NO'] as const).map((side) => {
                  const active = tradeSide === side;
                  const color = side === 'YES' ? 'emerald' : 'rose';
                  return (
                    <button
                      key={side}
                      type="button"
                      onClick={() => setTradeSide(side)}
                      disabled={busy}
                      className={`relative overflow-hidden py-2.5 px-3 rounded-[14px] text-xs font-black transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 cursor-pointer flex items-center justify-between group/side ${
                        active
                          ? side === 'YES'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-rose-600 text-white shadow-xs'
                          : 'text-neutral-700 hover:text-[#09090B] bg-white/60 hover:bg-white'
                      }`}
                    >
                      <HalftoneBackground
                        opacity={active ? 0.22 : 0.14}
                        fill={active ? '#FFFFFF' : color === 'emerald' ? '#059669' : '#E11D48'}
                        className="group-hover/side:opacity-32 group-hover/side:scale-110 transition-all duration-300"
                      />
                      <span className="relative z-10 font-display tracking-tight text-[13px]">BUY {side}</span>
                      <span className="relative z-10 font-mono-tabular font-bold text-[13px]">
                        {side === 'YES' ? market.yesProbability : market.noProbability}%
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Amount */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label className="font-bold text-neutral-800 tracking-tight">Amount (USDC)</label>
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
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-neutral-400 font-mono-tabular">$</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={amountStr}
                    disabled={busy}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 text-lg font-extrabold bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-emerald-500 font-mono-tabular text-[#09090B]"
                  />
                </div>

                <div className="grid grid-cols-4 gap-1.5 mt-2 font-mono-tabular">
                  {presets.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmountStr(val)}
                      disabled={busy}
                      className={`py-1 text-xs font-bold rounded-full border transition-colors cursor-pointer ${
                        amountStr === val ? 'border-[#09090B] bg-[#09090B] text-white shadow-2xs' : 'border-neutral-200 text-neutral-700 hover:border-neutral-400 bg-white'
                      }`}
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payout breakdown */}
              <div className="p-3.5 bg-neutral-50 border border-neutral-200/80 rounded-xl space-y-2 text-xs font-mono-tabular">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold">
                  <span className={quote ? 'text-emerald-700' : 'text-neutral-400'}>
                    {quote ? 'Live Panta quote' : quoteLoading ? 'Fetching quote…' : 'Estimate from spot price'}
                  </span>
                  {quoteLoading && <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />}
                </div>
                <div className="flex items-center justify-between text-neutral-600">
                  <span>Avg. price per share</span>
                  <span className="font-bold text-[#09090B]">${avgPrice.toFixed(3)}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-600">
                  <span>Protocol fee</span>
                  <span className="font-bold text-[#09090B]">{formatUsdc(estFee)}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-600">
                  <span>Shares received</span>
                  <span className="font-bold text-[#09090B]">{sharesBought.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-700 pt-1.5 border-t border-neutral-200/60">
                  <span className="font-semibold">Payout if {tradeSide} wins</span>
                  <span className="font-black text-[#09090B] text-[13px]">{formatUsdc(potentialPayout)}</span>
                </div>
                <div className="flex items-center justify-between text-emerald-800 font-black">
                  <span>Potential profit</span>
                  <span className="text-[13px]">
                    +{formatUsdc(potentialProfit)} ({returnPercentage}%)
                  </span>
                </div>
                {quoteError && <p className="text-[11px] text-rose-700 font-semibold pt-1">{quoteError}</p>}
              </div>

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

              {/* Action */}
              <div>
                {!connectedWallet ? (
                  <button
                    type="button"
                    onClick={onOpenWalletModal}
                    className="w-full py-3.5 text-sm font-extrabold font-display tracking-tight text-white bg-[#09090B] hover:bg-neutral-800 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center"
                  >
                    Connect Wallet to Trade
                  </button>
                ) : canBuyPrimary ? (
                  <button
                    type="submit"
                    disabled={amount < 1 || busy}
                    className={`w-full py-3.5 text-sm font-extrabold font-display tracking-tight text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2 ${
                      tradeSide === 'YES' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                    {busy ? 'Processing…' : `Buy ${tradeSide} · ${formatUsdc(amount)}`}
                  </button>
                ) : (
                  <div className="w-full py-3 px-3 text-xs font-semibold text-center text-neutral-600 bg-neutral-100 rounded-xl">
                    {!isLive
                      ? 'Demo market — trading disabled'
                      : market.pricePending
                      ? 'Price unavailable right now — try again shortly'
                      : market.pantaMarketPhase === 'secondary'
                      ? (
                        <>
                          This market graduated to Panta's secondary order book.{' '}
                          <a href="https://panta.market" target="_blank" rel="noopener noreferrer" className="underline font-bold">
                            Trade on panta.market
                          </a>
                        </>
                      )
                      : 'This market is closed for new positions.'}
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-col items-center gap-2 text-[11px] text-neutral-400 text-center">
                <span>{isLive ? 'Executed on Panta. You sign every transaction; DuckCast never holds funds.' : 'Sample market for UI preview.'}</span>
                <PoweredByPanta />
              </div>
            </form>
          </div>
        </div>
      </main>

      <AiAnalystPanel
        isOpen={isAiPanelOpen}
        onClose={() => setIsAiPanelOpen(false)}
        market={market}
        userPositionSide={tradeSide}
        onDraftThesisFill={(text) => setThesisText(text)}
        wallet={walletAddress}
      />
    </div>
  );
}
