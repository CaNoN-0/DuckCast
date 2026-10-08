import React, { useState } from 'react';
import {
  User,
  Wallet,
  Trophy,
  Award,
  TrendingUp,
  Clock,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Edit3,
  Bookmark,
  ArrowLeft,
  ChevronRight,
  Flame,
  ShieldCheck,
  Zap,
  Target,
  FileText,
  ThumbsUp,
  Percent,
  DollarSign,
  Banknote
} from 'lucide-react';
import { PredictionMarket } from '../../types/market';
import { HalftoneBackground } from '../marketplace/HalftoneBackground';
import { MenuButton } from '../navigation/MenuDrawer';
import { UserProfileData, DEFAULT_PROFILE } from '../../types/profile';
import { shortenSolanaAddress, getSolscanTxUrl, getSolscanAccountUrl } from '../../solana/config';
import { formatUsdc } from '../../solana/usdc';
import { INITIAL_MOCK_PAYOUTS, getPayoutSummary, UsdcPayoutRecord } from '../../payments/payoutService';

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
  // If not connected, show clean wallet connection gate
  if (!connectedWallet) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-[#09090B] flex flex-col items-center justify-center p-6 antialiased">
        <div className="w-full max-w-md bg-white border border-neutral-200/90 rounded-[20px] p-8 shadow-sm text-center relative overflow-hidden">
          <HalftoneBackground opacity={0.14} />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-[16px] bg-neutral-100 border border-neutral-200 flex items-center justify-center mb-5 text-neutral-700 shadow-2xs">
              <User className="w-8 h-8 text-neutral-800" />
            </div>

            <h2 className="text-2xl font-bold font-display text-[#09090B] mb-2 tracking-tight">
              Connect your wallet to view your profile
            </h2>

            <p className="text-sm text-neutral-600 mb-6 leading-relaxed max-w-sm">
              Your profile displays your on-chain prediction track record, active positions, reputation score, achievements, and theses.
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

  // State for profile tabs
  const [activeTab, setActiveTab] = useState<'positions' | 'history' | 'theses' | 'reputation' | 'watchlist' | 'payouts'>('positions');
  const [payouts] = useState<UsdcPayoutRecord[]>(INITIAL_MOCK_PAYOUTS);
  const [copied, setCopied] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [username, setUsername] = useState(userProfile.username);
  const [bio, setBio] = useState(userProfile.bio);
  const [avatarIndex, setAvatarIndex] = useState(0);

  const copyAddress = () => {
    navigator.clipboard.writeText(connectedWallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const AVATAR_OPTIONS = [
    '/src/assets/images/duckcast_mascot_illustration_1790877735628.jpg',
    '/src/assets/images/dara_avatar_1791030355835.jpg',
    '/src/assets/images/crypto_avatar_1791030371504.jpg',
    '/src/assets/images/techbae_avatar_1791030339680.jpg'
  ];

  // Mock Active Positions
  const activePositions = [
    {
      id: 'pos-1',
      question: 'Will Bitcoin surpass $100k before December 31, 2026?',
      category: 'Crypto',
      side: 'YES' as const,
      shares: 1450,
      entryProb: 52,
      currentProb: 64,
      invested: '$754.00',
      currentValue: '$928.00',
      pnl: '+$174.00',
      pnlPercent: '+23.1%',
      isPositive: true
    },
    {
      id: 'pos-2',
      question: 'Will OpenAI release GPT-5 with autonomous agents by Q3 2026?',
      category: 'Technology',
      side: 'YES' as const,
      shares: 820,
      entryProb: 68,
      currentProb: 78,
      invested: '$557.60',
      currentValue: '$639.60',
      pnl: '+$82.00',
      pnlPercent: '+14.7%',
      isPositive: true
    },
    {
      id: 'pos-3',
      question: 'Will the Federal Reserve cut interest rates at the next FOMC meeting?',
      category: 'Business',
      side: 'NO' as const,
      shares: 950,
      entryProb: 38,
      currentProb: 31,
      invested: '$361.00',
      currentValue: '$418.00',
      pnl: '+$57.00',
      pnlPercent: '+15.8%',
      isPositive: true
    },
    {
      id: 'pos-4',
      question: 'Will Ethereum spot ETF weekly net inflows reach $1B this month?',
      category: 'Crypto',
      side: 'YES' as const,
      shares: 500,
      entryProb: 44,
      currentProb: 39,
      invested: '$220.00',
      currentValue: '$195.00',
      pnl: '-$25.00',
      pnlPercent: '-11.4%',
      isPositive: false
    }
  ];

  // Mock Resolved Prediction History
  const historyItems = [
    {
      id: 'hist-1',
      question: 'Will SpaceX Starship complete orbital flight test 4 successfully?',
      category: 'Technology',
      side: 'YES' as const,
      outcome: 'WON' as const,
      shares: 1200,
      payout: '$1,200.00',
      profit: '+$480.00',
      date: 'Resolved 3 days ago'
    },
    {
      id: 'hist-2',
      question: 'Will Apple announce an open-source multimodal model at WWDC?',
      category: 'Technology',
      side: 'NO' as const,
      outcome: 'WON' as const,
      shares: 800,
      payout: '$800.00',
      profit: '+$312.00',
      date: 'Resolved 1 week ago'
    },
    {
      id: 'hist-3',
      question: 'Will crude oil touch $90/barrel before July 2026?',
      category: 'Business',
      side: 'YES' as const,
      outcome: 'LOST' as const,
      shares: 400,
      payout: '$0.00',
      profit: '-$184.00',
      date: 'Resolved 2 weeks ago'
    },
    {
      id: 'hist-4',
      question: 'Will Solana TVL exceed $8B before end of Q2?',
      category: 'Crypto',
      side: 'YES' as const,
      outcome: 'WON' as const,
      shares: 1500,
      payout: '$1,500.00',
      profit: '+$645.00',
      date: 'Resolved 3 weeks ago'
    }
  ];

  // Mock Theses Published
  const myTheses = [
    {
      id: 'th-1',
      question: 'Will Bitcoin surpass $100k before December 31, 2026?',
      side: 'YES' as const,
      staked: '$750',
      agreeCount: 42,
      fireCount: 28,
      text: 'Institutional inflows from sovereign wealth funds coupled with post-halving supply shock create structural buy-pressure not present in previous cycles. MicroStrategy and ETF accumulation absorbs 3x daily mined coins.',
      date: 'Posted 4 days ago'
    },
    {
      id: 'th-2',
      question: 'Will OpenAI release GPT-5 with autonomous agents by Q3 2026?',
      side: 'YES' as const,
      staked: '$500',
      agreeCount: 36,
      fireCount: 19,
      text: 'Strawberry/o1 reasoning paradigm unlocks the necessary benchmark delta. Compute clusters dedicated to reinforcement learning on verifiers have been scaling for 9 months.',
      date: 'Posted 1 week ago'
    }
  ];

  // Mock Achievements
  const achievements = [
    {
      id: 'ach-1',
      title: 'Oracle Forecaster',
      description: 'Maintained above 75% accuracy over 50+ predictions',
      icon: Trophy,
      tier: 'Gold',
      unlockedAt: 'Unlocked Oct 2026'
    },
    {
      id: 'ach-2',
      title: '5x Win Streak',
      description: 'Successfully called 5 consecutive market resolutions',
      icon: Flame,
      tier: 'Gold',
      unlockedAt: 'Unlocked Sep 2026'
    },
    {
      id: 'ach-3',
      title: 'Diamond Hands',
      description: 'Held position through a 40%+ market swing to victory',
      icon: ShieldCheck,
      tier: 'Silver',
      unlockedAt: 'Unlocked Aug 2026'
    },
    {
      id: 'ach-4',
      title: 'Early Predictor',
      description: 'Participated in the first 100 on-chain DuckCast markets',
      icon: Zap,
      tier: 'Silver',
      unlockedAt: 'Unlocked Founding Season'
    },
    {
      id: 'ach-5',
      title: 'Thesis Champion',
      description: 'Authored a thesis that received over 40 community endorsements',
      icon: Award,
      tier: 'Bronze',
      unlockedAt: 'Unlocked Oct 2026'
    }
  ];

  // Watchlist items (using allMarkets or sample)
  const watchlistMarkets = allMarkets.length > 0 ? allMarkets.slice(0, 4) : [];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#09090B] flex flex-col antialiased selection:bg-emerald-500/15 selection:text-emerald-950">
      {/* Top Header with smooth entrance animation and clean navigation without file path slashes */}
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

            {onOpenMenu && (
              <MenuButton onClick={onOpenMenu} />
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
        {/* Profile Hero Card */}
        <div className="relative overflow-hidden bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
          <HalftoneBackground opacity={0.16} className="pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Left: Avatar + Details */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[20px] overflow-hidden border-2 border-neutral-900 bg-neutral-100 shadow-md">
                  <img
                    src={userProfile.avatarUrl || AVATAR_OPTIONS[avatarIndex]}
                    alt={userProfile.username || username}
                    className="w-full h-full object-cover select-none"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/src/assets/images/duckcast_mascot_illustration_1790877735628.jpg';
                    }}
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-white text-[10px]" title="Online On-Chain">
                  ✓
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#09090B] tracking-tight">
                    {userProfile.username || username}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[9px] text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-300">
                    <Trophy className="w-3 h-3 text-emerald-700" />
                    <span>#14 Global</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[9px] text-xs font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200">
                    Tier: Master Forecaster
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500 font-mono-tabular">
                  <span>{connectedWallet.name}</span>
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
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Verified On-Chain
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-neutral-600 mt-2.5 max-w-xl leading-relaxed">
                  {userProfile.bio || bio}
                </p>
              </div>
            </div>

            {/* Right: Quick Highlights Pill */}
            <div className="flex md:flex-col items-end gap-2 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-neutral-100">
              <button
                type="button"
                onClick={() => setEditModalOpen(true)}
                className="w-full md:w-auto px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Edit Profile</span>
              </button>
              <div className="text-[11px] text-neutral-500 font-medium">
                Member since Season 1
              </div>
            </div>
          </div>

          {/* Key Metric Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mt-8 pt-6 border-t border-neutral-100">
            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/90 shadow-2xs">
              <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>USDC Balance</span>
                <span className="text-[9px] bg-emerald-200/70 text-emerald-900 px-1 py-0.2 rounded font-extrabold">Solana</span>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-950 font-display font-mono-tabular">
                {connectedWallet.formattedUsdcBalance || formatUsdc(connectedWallet.usdcBalance || 0)}
              </div>
              <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">Native SPL Token</div>
            </div>

            <div className="p-3 bg-neutral-50/80 rounded-xl border border-neutral-200/80">
              <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Win Rate
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-display font-mono-tabular">
                76.5%
              </div>
              <div className="text-[10px] text-neutral-500 mt-0.5">Top 2.1% Predictors</div>
            </div>

            <div className="p-3 bg-neutral-50/80 rounded-xl border border-neutral-200/80">
              <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Net Profit
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 font-display font-mono-tabular">
                +$14,820
              </div>
              <div className="text-[10px] text-emerald-600 font-bold mt-0.5">+32.4% ROI</div>
            </div>

            <div className="p-3 bg-neutral-50/80 rounded-xl border border-neutral-200/80">
              <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Volume Traded
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-neutral-900 font-display font-mono-tabular">
                $58,400
              </div>
              <div className="text-[10px] text-neutral-500 mt-0.5">52 Predictions</div>
            </div>

            <div className="p-3 bg-neutral-50/80 rounded-xl border border-neutral-200/80">
              <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Reputation Score
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-purple-700 font-display font-mono-tabular">
                94 / 100
              </div>
              <div className="text-[10px] text-neutral-500 mt-0.5">Tier 5 Forecaster</div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 bg-neutral-50/80 rounded-xl border border-neutral-200/80">
              <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Global Rank
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-amber-600 font-display font-mono-tabular">
                #14
              </div>
              <div className="text-[10px] text-neutral-500 mt-0.5">Of 24,800 Traders</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation with Squircle Border Radius */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-neutral-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('positions')}
            className={`px-4 py-2 rounded-[13px] text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center gap-1.5 hover:-translate-y-0.5 ${
              activeTab === 'positions'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Active Positions ({activePositions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-[13px] text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center gap-1.5 hover:-translate-y-0.5 ${
              activeTab === 'history'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Prediction History ({historyItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payouts')}
            className={`px-4 py-2 rounded-[13px] text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center gap-1.5 hover:-translate-y-0.5 ${
              activeTab === 'payouts'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>USDC Payouts ({payouts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('theses')}
            className={`px-4 py-2 rounded-[13px] text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center gap-1.5 hover:-translate-y-0.5 ${
              activeTab === 'theses'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Theses ({myTheses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reputation')}
            className={`px-4 py-2 rounded-[13px] text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center gap-1.5 hover:-translate-y-0.5 ${
              activeTab === 'reputation'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Reputation & Achievements</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('watchlist')}
            className={`px-4 py-2 rounded-[13px] text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center gap-1.5 hover:-translate-y-0.5 ${
              activeTab === 'watchlist'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-100'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Watchlist ({watchlistMarkets.length})</span>
          </button>
        </div>

        {/* Tab 1: Active Positions */}
        {activeTab === 'positions' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-800">
                Open Positions in Current Markets
              </h3>
              <span className="text-xs font-semibold text-neutral-500">
                Total Unrealized: <strong className="text-emerald-700">+$288.00 (+15.2%)</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {activePositions.map((pos) => (
                <div
                  key={pos.id}
                  className="relative overflow-hidden bg-white border border-neutral-200/90 hover:border-neutral-300 rounded-xl p-4 sm:p-5 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <HalftoneBackground opacity={0.08} className="group-hover:opacity-16 transition-opacity" />

                  <div className="relative z-10 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                        {pos.category}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                        pos.side === 'YES'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                      }`}>
                        Position: {pos.side}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-[#09090B] font-display">
                      {pos.question}
                    </h4>

                    <div className="flex items-center gap-4 text-xs text-neutral-500 font-mono-tabular mt-2">
                      <span>Shares: <strong className="text-neutral-800">{pos.shares.toLocaleString()}</strong></span>
                      <span>Entry: <strong className="text-neutral-800">{pos.entryProb}%</strong></span>
                      <span>Current Odds: <strong className="text-emerald-700">{pos.currentProb}%</strong></span>
                    </div>
                  </div>

                  <div className="relative z-10 flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                    <div className="text-left sm:text-right font-mono-tabular">
                      <div className="text-[11px] text-neutral-500">Current Value</div>
                      <div className="text-base font-extrabold text-[#09090B]">{pos.currentValue}</div>
                      <div className={`text-xs font-bold ${pos.isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {pos.pnl} ({pos.pnlPercent})
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onNavigateToPredictions}
                      className="px-3.5 py-2 bg-neutral-100 hover:bg-[#09090B] hover:text-white text-neutral-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Trade
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Prediction History */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-800">
                Resolved Market Results
              </h3>
              <span className="text-xs text-neutral-500 font-mono-tabular">
                Lifetime Realized: <strong className="text-emerald-700 font-bold">+$14,820</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {historyItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-neutral-200/90 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        item.outcome === 'WON'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-neutral-200 text-neutral-700'
                      }`}>
                        {item.outcome === 'WON' ? '✓ RESOLVED WON' : '✕ RESOLVED LOST'}
                      </span>
                      <span className="text-[10px] text-neutral-400">{item.date}</span>
                    </div>

                    <h4 className="text-sm font-bold text-[#09090B] font-display">
                      {item.question}
                    </h4>

                    <div className="text-xs text-neutral-500 font-mono-tabular mt-1.5">
                      Side: <strong className="text-neutral-800">{item.side}</strong> · Shares: {item.shares.toLocaleString()}
                    </div>
                  </div>

                  <div className="text-left sm:text-right font-mono-tabular">
                    <div className="text-[11px] text-neutral-500">Payout</div>
                    <div className="text-base font-extrabold text-[#09090B]">{item.payout}</div>
                    <div className={`text-xs font-bold ${item.outcome === 'WON' ? 'text-emerald-700' : 'text-neutral-500'}`}>
                      {item.profit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Theses */}
        {activeTab === 'theses' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-neutral-800">
              Published Theses & Research Backing
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myTheses.map((th) => (
                <div
                  key={th.id}
                  className="bg-white border border-neutral-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Backed {th.side} with {th.staked}
                      </span>
                      <span className="text-[11px] text-neutral-400">{th.date}</span>
                    </div>

                    <h4 className="text-sm font-bold text-[#09090B] mb-2 font-display">
                      {th.question}
                    </h4>

                    <p className="text-xs text-neutral-600 leading-relaxed bg-neutral-50/80 p-3 rounded-lg border border-neutral-100">
                      “{th.text}”
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-4 border-t border-neutral-100 text-xs font-mono-tabular text-neutral-600">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                        <ThumbsUp className="w-3.5 h-3.5" /> {th.agreeCount} agreed
                      </span>
                      <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                        <Flame className="w-3.5 h-3.5" /> {th.fireCount} insightful
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={onNavigateToPredictions}
                      className="text-xs font-bold text-neutral-700 hover:text-black underline cursor-pointer"
                    >
                      View Market
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Reputation & Achievements */}
        {activeTab === 'reputation' && (
          <div className="space-y-6">
            {/* Reputation breakdown */}
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-neutral-100">
                <div>
                  <h3 className="text-base font-bold font-display text-[#09090B]">
                    On-Chain Reputation Metrics
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Calculated from accuracy, volume, streak, and thesis community consensus.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-purple-700 font-mono-tabular">94</span>
                  <span className="text-xs font-bold text-neutral-500">/ 100 Score</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="text-xs text-neutral-500 font-medium mb-1">Accuracy Weight (40%)</div>
                  <div className="text-lg font-bold text-neutral-900 font-mono-tabular">76.5% Wins</div>
                  <div className="w-full bg-neutral-200 h-2 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '76.5%' }} />
                  </div>
                </div>

                <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="text-xs text-neutral-500 font-medium mb-1">Volume Staked (30%)</div>
                  <div className="text-lg font-bold text-neutral-900 font-mono-tabular">$58,400 Total</div>
                  <div className="w-full bg-neutral-200 h-2 rounded-full mt-2 overflow-hidden">
                    <div className="bg-purple-600 h-full rounded-full" style={{ width: '88%' }} />
                  </div>
                </div>

                <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="text-xs text-neutral-500 font-medium mb-1">Thesis Consensus (30%)</div>
                  <div className="text-lg font-bold text-neutral-900 font-mono-tabular">91% Consensus</div>
                  <div className="w-full bg-neutral-200 h-2 rounded-full mt-2 overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: '91%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Achievements Badges */}
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs">
              <h3 className="text-base font-bold font-display text-[#09090B] mb-4">
                Earned Badges & Milestones
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {achievements.map((ach) => {
                  const Icon = ach.icon;
                  return (
                    <div
                      key={ach.id}
                      className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 hover:bg-neutral-50 transition-colors flex items-start gap-3.5"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center shrink-0 text-amber-500 shadow-2xs">
                        <Icon className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-[#09090B]">{ach.title}</h4>
                          <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            {ach.tier}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-600 mt-1 leading-snug">
                          {ach.description}
                        </p>
                        <span className="text-[10px] text-neutral-400 font-mono-tabular mt-1.5 block">
                          {ach.unlockedAt}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Watchlist */}
        {activeTab === 'watchlist' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-800">
                Starred Prediction Markets
              </h3>
              <button
                type="button"
                onClick={onNavigateToPredictions}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
              >
                Browse All Markets →
              </button>
            </div>

            {watchlistMarkets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {watchlistMarkets.map((m) => (
                  <div
                    key={m.id}
                    className="relative overflow-hidden bg-white border border-neutral-200/90 hover:border-neutral-300 rounded-xl p-5 shadow-xs flex flex-col justify-between"
                  >
                    <HalftoneBackground opacity={0.08} />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
                        <span className="font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                          {m.category}
                        </span>
                        <span className="font-mono-tabular">{m.volume} Vol</span>
                      </div>

                      <h4 className="text-sm font-bold text-[#09090B] font-display line-clamp-2 mb-3">
                        {m.question}
                      </h4>
                    </div>

                    <div className="relative z-10 flex items-center justify-between pt-3 border-t border-neutral-100">
                      <div className="font-mono-tabular">
                        <span className="text-xs text-neutral-500">YES Odds: </span>
                        <span className="text-sm font-extrabold text-emerald-700">{m.yesProbability}%</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectMarket) onSelectMarket(m);
                          onNavigateToPredictions();
                        }}
                        className="px-3 py-1.5 bg-[#09090B] hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Trade Market
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-xl border border-neutral-200 text-neutral-500 text-sm">
                No markets currently in your watchlist. Star markets in the Predictions feed to track them here.
              </div>
            )}
          </div>
        )}

        {/* Tab 6: USDC Payouts & Settlement Records */}
        {activeTab === 'payouts' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-neutral-800">
                  USDC Payout & Settlement Records
                </h3>
                <p className="text-xs text-neutral-500">
                  Automated on-chain prediction payouts delivered directly to your Solana wallet.
                </p>
              </div>
              <span className="text-xs font-mono-tabular font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Primary Currency: Native Solana USDC
              </span>
            </div>

            {/* Payout Summary Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-white border border-neutral-200/90 rounded-xl shadow-2xs">
                <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">
                  Total Winnings
                </div>
                <div className="text-lg font-extrabold text-emerald-700 font-mono-tabular">
                  +{formatUsdc(getPayoutSummary(payouts).totalWinningsUsdc)}
                </div>
                <div className="text-[10px] text-neutral-500">Native USDC on Solana</div>
              </div>

              <div className="p-3.5 bg-white border border-neutral-200/90 rounded-xl shadow-2xs">
                <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">
                  Total Withdrawn
                </div>
                <div className="text-lg font-extrabold text-neutral-900 font-mono-tabular">
                  {formatUsdc(getPayoutSummary(payouts).totalWithdrawnUsdc)}
                </div>
                <div className="text-[10px] text-neutral-500">Delivered to wallet</div>
              </div>

              <div className="p-3.5 bg-white border border-neutral-200/90 rounded-xl shadow-2xs">
                <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">
                  Completed Payouts
                </div>
                <div className="text-lg font-extrabold text-emerald-700 font-mono-tabular">
                  {getPayoutSummary(payouts).completedPayoutsCount}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold">100% On-Chain Settled</div>
              </div>

              <div className="p-3.5 bg-white border border-neutral-200/90 rounded-xl shadow-2xs">
                <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">
                  Pending Payouts
                </div>
                <div className="text-lg font-extrabold text-amber-600 font-mono-tabular">
                  {getPayoutSummary(payouts).pendingPayoutsCount}
                </div>
                <div className="text-[10px] text-neutral-500">Awaiting market resolution</div>
              </div>
            </div>

            {/* Payouts List */}
            <div className="grid grid-cols-1 gap-3 pt-1">
              {payouts.map((pay) => (
                <div
                  key={pay.id}
                  className="bg-white border border-neutral-200/90 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
                        pay.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : pay.status === 'processing'
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        {pay.status === 'completed' ? '✓ Completed' : pay.status === 'processing' ? 'Processing' : 'Pending Resolution'}
                      </span>
                      <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 font-mono-tabular">
                        Side: {pay.position}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-[#09090B] font-display">
                      {pay.marketTitle}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-neutral-500 font-mono-tabular mt-1.5 flex-wrap">
                      <span>Date: <strong className="text-neutral-800">{pay.date}</strong></span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <span>Transaction:</span>
                        <a
                          href={pay.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-0.5 underline underline-offset-2"
                        >
                          <span>{shortenSolanaAddress(pay.signature)}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-100 font-mono-tabular">
                    <div className="text-[11px] text-neutral-500 uppercase tracking-wider">Payout Amount</div>
                    <div className="text-xl font-extrabold text-emerald-700 font-display">
                      +{formatUsdc(pay.usdcAmount)} USDC
                    </div>
                    <div className="text-[10px] text-neutral-400">Mint: EPjFWdd5...TDt1v</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setEditModalOpen(false)}
        >
          <div
            className="bg-white border border-neutral-200 rounded-2xl w-full max-w-md p-6 shadow-xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <HalftoneBackground opacity={0.08} />

            <div className="relative z-10">
              <h3 className="text-lg font-bold font-display text-[#09090B] mb-1">
                Edit Profile
              </h3>
              <p className="text-xs text-neutral-500 mb-4">
                Update your public DuckCast forecaster persona.
              </p>

              {/* Avatar Selector */}
              <div className="mb-4">
                <label className="text-xs font-bold text-neutral-700 block mb-2">
                  Choose Avatar
                </label>
                <div className="flex items-center gap-3">
                  {AVATAR_OPTIONS.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarIndex(idx)}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        avatarIndex === idx
                          ? 'border-emerald-500 ring-2 ring-emerald-200 scale-105'
                          : 'border-neutral-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="Avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Username Input */}
              <div className="mb-4">
                <label className="text-xs font-bold text-neutral-700 block mb-1.5">
                  Display Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-semibold text-[#09090B] focus:outline-none focus:border-neutral-900"
                  maxLength={30}
                />
              </div>

              {/* Bio Input */}
              <div className="mb-6">
                <label className="text-xs font-bold text-neutral-700 block mb-1.5">
                  Forecaster Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-medium text-[#09090B] focus:outline-none focus:border-neutral-900 resize-none"
                  maxLength={180}
                />
              </div>

              {/* Actions */}
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
                    const newAvatar = AVATAR_OPTIONS[avatarIndex];
                    if (onUpdateProfile) {
                      onUpdateProfile({ username, bio, avatarUrl: newAvatar });
                    }
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
