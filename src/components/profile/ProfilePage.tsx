import React, { useCallback, useEffect, useState } from 'react';
import {
  User,
  Wallet,
  Trophy,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Edit3,
  Bookmark,
  ArrowLeft,
  Target,
  FileText,
  ThumbsUp,
  Banknote,
  BadgeCheck,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { PredictionMarket } from '../../types/market';
import { HalftoneBackground } from '../marketplace/HalftoneBackground';
import { MenuButton } from '../navigation/MenuDrawer';
import { UserProfileData, DEFAULT_PROFILE } from '../../types/profile';
import { shortenSolanaAddress, getSolscanAccountUrl } from '../../solana/config';
import { formatUsdc } from '../../solana/usdc';
import { pantaApi, PantaPosition, describePantaError } from '../../services/pantaApi';
import { socialApi, SocialThesis } from '../../services/socialApi';
import { formatRelativeTime } from '../../services/pantaAdapter';
import {
  executePantaClaim,
  getStoredTransactions,
  PredictionTransactionRecord,
  UserRejectedError
} from '../../payments/predictionTransaction';
import { useSolanaWallet } from '../../wallet/WalletContext';
import { useMarkets } from '../../context/MarketsContext';
import { PoweredByPanta } from '../panta/PoweredByPanta';

interface ProfilePageProps {
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
  onNavigateToPredictions: () => void;
  onNavigateToHome: () => void;
  allMarkets?: PredictionMarket[];
  onSelectMarket?: (market: PredictionMarket) => void;
  onOpenMenu?: () => void;
  userProfile?: UserProfileData;
  onUpdateProfile?: (updated: Partial<UserProfileData>) => void;
}

type Tab = 'positions' | 'resolved' | 'receipts' | 'theses' | 'watchlist';

const AVATAR_OPTIONS = [
  '/src/assets/images/duckcast_mascot_illustration_1790877735628.jpg',
  '/src/assets/images/dara_avatar_1791030355835.jpg',
  '/src/assets/images/crypto_avatar_1791030371504.jpg',
  '/src/assets/images/techbae_avatar_1791030339680.jpg'
];

const RECEIPT_LABEL: Record<PredictionTransactionRecord['kind'], string> = {
  buy: 'Buy',
  claim: 'Win claim',
  create: 'Market created',
  creator_fees: 'Creator fees'
};

export function ProfilePage({
  connectedWallet,
  onOpenWalletModal,
  onNavigateToPredictions,
  onNavigateToHome,
  allMarkets = [],
  onSelectMarket,
  onOpenMenu,
  userProfile = DEFAULT_PROFILE,
  onUpdateProfile
}: ProfilePageProps) {
  // All hooks run before any early return (React requires a stable hook order).
  const { signer, refreshBalances } = useSolanaWallet();
  const { source } = useMarkets();
  const [activeTab, setActiveTab] = useState<Tab>('positions');
  const [positions, setPositions] = useState<PantaPosition[]>([]);
  const [theses, setTheses] = useState<SocialThesis[]>([]);
  const [receipts, setReceipts] = useState<PredictionTransactionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [claimingMarket, setClaimingMarket] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [username, setUsername] = useState(userProfile.username);
  const [bio, setBio] = useState(userProfile.bio);
  const [avatarIndex, setAvatarIndex] = useState(Math.max(0, AVATAR_OPTIONS.indexOf(userProfile.avatarUrl)));

  const address = connectedWallet?.address;
  const liveMode = source === 'panta';

  const load = useCallback(async () => {
    if (!address) return;
    setReceipts(getStoredTransactions(address));
    setLoading(true);
    setLoadError(null);
    const [pos, th] = await Promise.allSettled([pantaApi.positions(address), socialApi.thesesByWallet(address)]);
    if (pos.status === 'fulfilled') setPositions(pos.value.positions);
    else setLoadError(describePantaError(pos.reason));
    if (th.status === 'fulfilled') setTheses(th.value.items);
    setLoading(false);
  }, [address]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setUsername(userProfile.username);
    setBio(userProfile.bio);
  }, [userProfile.username, userProfile.bio]);

  if (!connectedWallet) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-[#09090B] flex flex-col items-center justify-center p-6 antialiased">
        <div className="w-full max-w-md bg-white border border-neutral-200/90 rounded-[20px] p-8 shadow-sm text-center relative overflow-hidden">
          <HalftoneBackground opacity={0.14} />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-[16px] bg-neutral-100 border border-neutral-200 flex items-center justify-center mb-5 text-neutral-700 shadow-2xs">
              <User className="w-8 h-8 text-neutral-800" />
            </div>
            <h2 className="text-2xl font-bold font-display text-[#09090B] mb-2 tracking-tight">Connect your wallet to view your profile</h2>
            <p className="text-sm text-neutral-600 mb-6 leading-relaxed max-w-sm">
              Your profile shows your Panta positions, resolved results, claimable winnings, transaction receipts and signed theses.
            </p>
            <button
              type="button"
              onClick={onOpenWalletModal}
              className="w-full py-3 px-5 bg-[#09090B] hover:bg-neutral-800 text-white font-bold text-sm rounded-[14px] transition-all shadow-xs hover:shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Connect Wallet</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToHome}
              className="mt-4 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(connectedWallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ---------- Derived, all from real data ----------
  const openPositions = positions.filter((p) => !p.outcome && p.phase !== 'resolved' && p.phase !== 'cancelled');
  const resolvedPositions = positions.filter((p) => p.outcome || p.phase === 'resolved' || p.phase === 'cancelled');
  const portfolioValue = openPositions.reduce((sum, p) => sum + (p.estValueUsdc ?? 0), 0);
  const claimable = resolvedPositions.filter((p) => p.claimable && !p.claimed);
  const claimableValue = claimable.reduce((sum, p) => sum + (p.estValueUsdc ?? p.sharesNum), 0);
  const wins = resolvedPositions.filter((p) => p.valuation === 'settled_win').length;
  const losses = resolvedPositions.filter((p) => p.valuation === 'settled_loss').length;
  const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 1000) / 10 : null;
  const verifiedTheses = theses.filter((t) => t.position).length;
  const watchlistMarkets = allMarkets.slice(0, 4);

  const handleClaim = async (p: PantaPosition) => {
    if (!signer) {
      onOpenWalletModal();
      return;
    }
    setClaimingMarket(p.marketId);
    setNotice(null);
    try {
      const record = await executePantaClaim(
        { wallet: connectedWallet.address, marketId: p.marketId, marketQuestion: p.market?.title || p.marketId, signer },
        () => {}
      );
      setNotice(`Claimed! Transaction ${shortenSolanaAddress(record.signature)} sent to your wallet.`);
      refreshBalances();
      load();
    } catch (err) {
      setNotice(err instanceof UserRejectedError ? 'Claim cancelled in your wallet.' : describePantaError(err));
    } finally {
      setClaimingMarket(null);
    }
  };

  const openMarket = (marketId: string) => {
    const m = allMarkets.find((x) => x.id === marketId);
    if (m && onSelectMarket) onSelectMarket(m);
    onNavigateToPredictions();
  };

  const tabs: Array<{ key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { key: 'positions', label: `Open Positions (${openPositions.length})`, icon: Target },
    { key: 'resolved', label: `Resolved (${resolvedPositions.length})`, icon: Clock },
    { key: 'receipts', label: `Receipts (${receipts.length})`, icon: Banknote },
    { key: 'theses', label: `Theses (${theses.length})`, icon: FileText },
    { key: 'watchlist', label: `Watchlist (${watchlistMarkets.length})`, icon: Bookmark }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#09090B] flex flex-col antialiased selection:bg-emerald-500/15 selection:text-emerald-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/90 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNavigateToPredictions}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-700 hover:text-[#09090B] bg-neutral-100 hover:bg-neutral-200/90 px-3 py-1.5 rounded-[12px] transition-all hover:-translate-x-0.5 cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Predictions</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToHome}
              className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-black px-2.5 py-1.5 rounded-[12px] hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <span>Home</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-100 text-[#09090B] rounded-[12px] text-xs font-medium border border-neutral-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono-tabular font-bold">{connectedWallet.shortAddress || shortenSolanaAddress(connectedWallet.address)}</span>
            </div>
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-100 border border-neutral-200 text-[#09090B] text-xs font-semibold rounded-[12px] transition-colors cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit Profile</span>
            </button>
            {onOpenMenu && <MenuButton onClick={onOpenMenu} />}
          </div>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
          <HalftoneBackground opacity={0.16} className="pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[20px] overflow-hidden border-2 border-neutral-900 bg-neutral-100 shadow-md">
                <img
                  src={userProfile.avatarUrl || AVATAR_OPTIONS[avatarIndex]}
                  alt={userProfile.username}
                  className="w-full h-full object-cover select-none"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = AVATAR_OPTIONS[0];
                  }}
                />
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#09090B] tracking-tight">{userProfile.username}</h1>
                  {verifiedTheses > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[9px] text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-300">
                      <BadgeCheck className="w-3 h-3" />
                      {verifiedTheses} verified {verifiedTheses === 1 ? 'thesis' : 'theses'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500 font-mono-tabular flex-wrap">
                  <span>{connectedWallet.networkName || 'Solana'}</span>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={copyAddress}
                    className="inline-flex items-center gap-1 text-neutral-700 hover:text-black font-semibold cursor-pointer"
                    title="Copy wallet address"
                  >
                    <span>{connectedWallet.shortAddress || shortenSolanaAddress(connectedWallet.address)}</span>
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <span>·</span>
                  <a
                    href={getSolscanAccountUrl(connectedWallet.address, 'mainnet-beta')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline"
                  >
                    Solscan <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-xs sm:text-sm text-neutral-600 mt-2.5 max-w-xl leading-relaxed">{userProfile.bio}</p>
              </div>
            </div>

            <div className="flex md:flex-col items-end gap-2 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-neutral-100">
              <button
                type="button"
                onClick={load}
                disabled={loading}
                className="w-full md:w-auto px-4 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />}
                <span>Refresh from Panta</span>
              </button>
              <PoweredByPanta />
            </div>
          </div>

          {/* Stats — every number below is computed from on-chain / Panta data */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mt-8 pt-6 border-t border-neutral-100">
            <Stat
              label="USDC Balance"
              value={connectedWallet.formattedUsdcBalance || formatUsdc(connectedWallet.usdcBalance || 0)}
              sub="In your wallet"
              highlight
            />
            <Stat label="Portfolio Value" value={formatUsdc(portfolioValue)} sub="Open positions, marked to Panta spot" />
            <Stat label="Open Positions" value={String(openPositions.length)} sub={`${new Set(openPositions.map((p) => p.marketId)).size} markets`} />
            <Stat label="Record" value={wins + losses > 0 ? `${wins}W – ${losses}L` : '—'} sub={winRate !== null ? `${winRate}% win rate` : 'No resolved markets yet'} />
            <Stat
              label="Claimable"
              value={formatUsdc(claimableValue)}
              sub={claimable.length ? `${claimable.length} winning position${claimable.length > 1 ? 's' : ''}` : 'Nothing to claim'}
              accent={claimable.length > 0}
            />
            <Stat label="Theses" value={String(theses.length)} sub={`${verifiedTheses} with verified positions`} />
          </div>

          {(loadError || !liveMode) && (
            <p className="relative z-10 mt-4 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {loadError || 'DuckCast is showing demo markets, so on-chain positions are unavailable.'}
            </p>
          )}
          {notice && (
            <p className="relative z-10 mt-4 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{notice}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-neutral-200 pb-2">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-[13px] text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center gap-1.5 hover:-translate-y-0.5 ${
                activeTab === key ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Open positions */}
        {activeTab === 'positions' && (
          <div className="grid grid-cols-1 gap-3">
            {openPositions.length === 0 && (
              <Empty text="No open positions yet. Pick a market, back a side, and it will show up here." action="Browse markets" onAction={onNavigateToPredictions} />
            )}
            {openPositions.map((p) => {
              const price = p.side === 'yes' ? p.market?.yesPrice : p.market?.noPrice;
              return (
                <div
                  key={`${p.marketId}-${p.side}`}
                  className="relative overflow-hidden bg-white border border-neutral-200/90 hover:border-neutral-300 rounded-xl p-4 sm:p-5 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <HalftoneBackground opacity={0.08} className="group-hover:opacity-16 transition-opacity" />
                  <div className="relative z-10 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded capitalize">{p.category || p.market?.category || 'market'}</span>
                      <SideBadge side={p.side} />
                      <span className="text-[10px] text-neutral-400 capitalize">{p.phase} phase</span>
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-[#09090B] font-display">{p.market?.title || shortenSolanaAddress(p.marketId)}</h4>
                    <div className="flex items-center gap-4 text-xs text-neutral-500 font-mono-tabular mt-2">
                      <span>
                        Shares: <strong className="text-neutral-800">{p.sharesNum.toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong>
                      </span>
                      <span>
                        {p.side.toUpperCase()} price: <strong className="text-emerald-700">{price != null ? `$${price.toFixed(3)}` : '—'}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="relative z-10 flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                    <div className="text-left sm:text-right font-mono-tabular">
                      <div className="text-[11px] text-neutral-500">Est. value</div>
                      <div className="text-base font-extrabold text-[#09090B]">{p.estValueUsdc != null ? formatUsdc(p.estValueUsdc) : '—'}</div>
                      <div className="text-[11px] text-neutral-500">Pays {formatUsdc(p.sharesNum)} if {p.side.toUpperCase()} wins</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openMarket(p.marketId)}
                      className="px-3.5 py-2 bg-neutral-100 hover:bg-[#09090B] hover:text-white text-neutral-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Resolved */}
        {activeTab === 'resolved' && (
          <div className="grid grid-cols-1 gap-3">
            {resolvedPositions.length === 0 && <Empty text="No resolved markets yet. Results and claimable winnings appear here after resolution." />}
            {resolvedPositions.map((p) => {
              const won = p.valuation === 'settled_win';
              return (
                <div
                  key={`${p.marketId}-${p.side}`}
                  className="bg-white border border-neutral-200/90 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded ${
                          won ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : p.outcome ? 'bg-neutral-200 text-neutral-700' : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {won ? '✓ WON' : p.outcome ? '✕ LOST' : p.phase.toUpperCase()}
                      </span>
                      <SideBadge side={p.side} />
                      {p.outcome && <span className="text-[10px] text-neutral-400">Outcome: {p.outcome.toUpperCase()}</span>}
                    </div>
                    <h4 className="text-sm font-bold text-[#09090B] font-display">{p.market?.title || shortenSolanaAddress(p.marketId)}</h4>
                    <div className="text-xs text-neutral-500 font-mono-tabular mt-1.5">
                      Shares: {p.sharesNum.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="text-left sm:text-right font-mono-tabular space-y-1.5">
                    <div className="text-[11px] text-neutral-500">Payout</div>
                    <div className="text-base font-extrabold text-[#09090B]">{formatUsdc(won ? p.sharesNum : 0)}</div>
                    {p.claimable && !p.claimed && (
                      <button
                        type="button"
                        onClick={() => handleClaim(p)}
                        disabled={claimingMarket !== null}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        {claimingMarket === p.marketId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trophy className="w-3.5 h-3.5" />}
                        Claim
                      </button>
                    )}
                    {p.claimed && <div className="text-xs font-bold text-emerald-700">Claimed ✓</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Receipts */}
        {activeTab === 'receipts' && (
          <div className="space-y-3">
            <p className="text-xs text-neutral-500">Transactions you signed through DuckCast in this browser. Every row links to the real transaction on Solscan.</p>
            {receipts.length === 0 && <Empty text="No transactions yet." />}
            {receipts.map((r) => (
              <div key={r.id} className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider bg-neutral-50 text-neutral-700 border-neutral-200">
                      {RECEIPT_LABEL[r.kind]}
                    </span>
                    {r.position && <SideBadge side={r.position === 'YES' ? 'yes' : 'no'} />}
                    <span
                      className={`text-[10px] font-bold ${r.status === 'confirmed' ? 'text-emerald-700' : r.status === 'pending' ? 'text-amber-700' : 'text-rose-700'}`}
                    >
                      {r.status}
                    </span>
                    <span className="text-[10px] text-neutral-400">{formatRelativeTime(Date.parse(r.timestamp) / 1000)}</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#09090B]">{r.marketQuestion}</h4>
                </div>
                <div className="text-left sm:text-right font-mono-tabular text-xs">
                  {r.kind === 'buy' && (
                    <div className="font-bold text-neutral-800">
                      {formatUsdc(r.usdcAmount)} → {r.sharesBought.toFixed(2)} sh
                    </div>
                  )}
                  {r.kind === 'create' && <div className="font-bold text-neutral-800">Fee {formatUsdc(r.usdcAmount)}</div>}
                  <a
                    href={r.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
                  >
                    {shortenSolanaAddress(r.signature)} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Theses */}
        {activeTab === 'theses' && (
          <div className="space-y-3">
            {theses.length === 0 && <Empty text="You haven't posted a thesis yet. Explain your call on any market page." />}
            {theses.map((t) => (
              <div key={t.id} className="bg-white border border-neutral-200/90 rounded-xl p-4 shadow-xs space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <SideBadge side={t.side === 'YES' ? 'yes' : 'no'} />
                  {t.position ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                      <BadgeCheck className="w-3 h-3" /> {t.position.shares.toFixed(2)} shares at posting
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-400">Signed · no position at posting</span>
                  )}
                  <span className="text-[10px] text-neutral-400">{formatRelativeTime(Date.parse(t.createdAt) / 1000)}</span>
                </div>
                <button type="button" onClick={() => openMarket(t.marketId)} className="text-left text-sm font-bold text-[#09090B] hover:text-emerald-700 cursor-pointer">
                  {t.marketTitle || shortenSolanaAddress(t.marketId)}
                </button>
                <p className="text-xs text-neutral-700 leading-relaxed whitespace-pre-line">{t.text}</p>
                <div className="flex items-center gap-3 text-[11px] text-neutral-500 font-mono-tabular">
                  <span className="inline-flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" /> {t.reactions.agree}
                  </span>
                  <span>🔥 {t.reactions.fire}</span>
                  <span>💡 {t.reactions.insightful}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Watchlist */}
        {activeTab === 'watchlist' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-800">Markets to watch</h3>
              <button type="button" onClick={onNavigateToPredictions} className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer">
                Browse All Markets →
              </button>
            </div>
            {watchlistMarkets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {watchlistMarkets.map((m) => (
                  <div key={m.id} className="relative overflow-hidden bg-white border border-neutral-200/90 hover:border-neutral-300 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                    <HalftoneBackground opacity={0.08} />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
                        <span className="font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">{m.category}</span>
                        <span className="font-mono-tabular">{m.volume} Vol</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#09090B] font-display line-clamp-2 mb-3">{m.question}</h4>
                    </div>
                    <div className="relative z-10 flex items-center justify-between pt-3 border-t border-neutral-100">
                      <div className="font-mono-tabular">
                        <span className="text-xs text-neutral-500">YES Odds: </span>
                        <span className="text-sm font-extrabold text-emerald-700">{m.yesProbability}%</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openMarket(m.id)}
                        className="px-3 py-1.5 bg-[#09090B] hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Trade Market
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty text="No markets loaded yet." />
            )}
          </div>
        )}
      </main>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setEditModalOpen(false)}
        >
          <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-md p-6 shadow-xl relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <HalftoneBackground opacity={0.08} />
            <div className="relative z-10">
              <h3 className="text-lg font-bold font-display text-[#09090B] mb-1">Edit Profile</h3>
              <p className="text-xs text-neutral-500 mb-4">Stored in this browser. Your on-chain identity is your wallet.</p>

              <div className="mb-4">
                <label className="text-xs font-bold text-neutral-700 block mb-2">Choose Avatar</label>
                <div className="flex items-center gap-3">
                  {AVATAR_OPTIONS.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarIndex(idx)}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        avatarIndex === idx ? 'border-emerald-500 ring-2 ring-emerald-200 scale-105' : 'border-neutral-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="Avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs font-bold text-neutral-700 block mb-1.5">Display Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-semibold text-[#09090B] focus:outline-none focus:border-neutral-900"
                  maxLength={30}
                />
              </div>

              <div className="mb-6">
                <label className="text-xs font-bold text-neutral-700 block mb-1.5">Forecaster Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-medium text-[#09090B] focus:outline-none focus:border-neutral-900 resize-none"
                  maxLength={180}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-black rounded-[10px] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateProfile?.({ username, bio, avatarUrl: AVATAR_OPTIONS[avatarIndex] });
                    setEditModalOpen(false);
                  }}
                  className="px-5 py-2 bg-[#09090B] hover:bg-neutral-800 text-white text-xs font-bold rounded-[12px] transition-all duration-200 hover:-translate-y-0.5 shadow-xs cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, highlight, accent }: { label: string; value: string; sub: string; highlight?: boolean; accent?: boolean }) {
  return (
    <div className={`p-3 rounded-xl border ${highlight ? 'bg-emerald-50/70 border-emerald-200/90 shadow-2xs' : 'bg-neutral-50/80 border-neutral-200/80'}`}>
      <div className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${highlight ? 'text-emerald-800' : 'text-neutral-500'}`}>{label}</div>
      <div
        className={`text-lg sm:text-xl font-extrabold font-display font-mono-tabular ${
          highlight ? 'text-emerald-950' : accent ? 'text-emerald-700' : 'text-neutral-900'
        }`}
      >
        {value}
      </div>
      <div className={`text-[10px] mt-0.5 ${highlight ? 'text-emerald-700 font-medium' : 'text-neutral-500'}`}>{sub}</div>
    </div>
  );
}

function SideBadge({ side }: { side: 'yes' | 'no' }) {
  return (
    <span
      className={`text-[10px] font-black px-2 py-0.5 rounded border ${
        side === 'yes' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300'
      }`}
    >
      {side.toUpperCase()}
    </span>
  );
}

function Empty({ text, action, onAction }: { text: string; action?: string; onAction?: () => void }) {
  return (
    <div className="p-8 text-center bg-white rounded-xl border border-neutral-200 text-neutral-500 text-sm">
      <p>{text}</p>
      {action && onAction && (
        <button type="button" onClick={onAction} className="mt-3 px-4 py-2 bg-[#09090B] text-white text-xs font-bold rounded-lg cursor-pointer">
          {action}
        </button>
      )}
    </div>
  );
}
