/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Search,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  Check,
  Activity,
  BarChart2,
  UserCheck
} from 'lucide-react';

export interface MarketItem {
  id: string;
  question: string;
  category: string;
  topic: string;
  yesProbability: number;
  volume: string;
  timeRemaining: string;
  iconBg: string;
  iconSymbol: string;
  iconImage?: string;
  description?: string;
  topThesis?: {
    author: string;
    side: 'YES' | 'NO';
    summary: string;
    staked?: string;
  };
}

export interface VolumeRankingItem {
  rank: number;
  name: string;
  volume: string;
  change: string;
  iconBg: string;
  iconSymbol: string;
  iconImage?: string;
}

export interface FollowedUserCard {
  id: string;
  username: string;
  handle: string;
  avatar: string;
  timePosted: string;
  isFollowing: boolean;
  question: string;
  category: string;
  topic: string;
  probability: number;
  volume: string;
}

const INITIAL_TRENDING_MARKETS: MarketItem[] = [
  {
    id: 'trend-1',
    question: 'Will BTC move above $120K before Friday?',
    category: 'Crypto',
    topic: 'BTC',
    yesProbability: 78,
    volume: '₦12.4M',
    timeRemaining: '2d 14h',
    iconBg: 'bg-amber-50 text-amber-600',
    iconSymbol: '₿',
    iconImage: '/btc.png',
    description: 'Market resolves to YES if Binance spot BTC/USDT price prints ≥ $120,000.00 before Friday 23:59 UTC.',
    topThesis: {
      author: 'satoshiduck',
      side: 'YES',
      summary: 'ETF institutional inflows hit record volume for 4 straight days, creating severe supply squeeze on OTC desks.',
      staked: '₦850K'
    }
  },
  {
    id: 'trend-2',
    question: 'Will ETH stay above $4,000 by 10 PM?',
    category: 'Crypto',
    topic: 'ETH',
    yesProbability: 62,
    volume: '₦8.7M',
    timeRemaining: '11h 23m',
    iconBg: 'bg-indigo-50 text-indigo-600',
    iconSymbol: 'Ξ',
    iconImage: '/eth.png',
    description: 'Resolves YES if spot ETH remains at or above $4,000.00 at 22:00 UTC cutoff.',
    topThesis: {
      author: 'defi_chick',
      side: 'YES',
      summary: 'Strong bids resting at $3,980-$4,010 range on Coinbase orderbooks with negative funding rate.',
      staked: '₦420K'
    }
  },
  {
    id: 'trend-3',
    question: 'Will Team A score before halftime?',
    category: 'Sports',
    topic: 'Football',
    yesProbability: 71,
    volume: '₦5.2M',
    timeRemaining: '1h 42m',
    iconBg: 'bg-emerald-50 text-emerald-600',
    iconSymbol: '⚽',
    iconImage: '/soccer.svg',
    description: 'Official match clock event. Resolves YES once Team A scores an official goal before 45:00 + stoppage.',
    topThesis: {
      author: 'pitch_tactics',
      side: 'YES',
      summary: 'Team A is averaging 2.4 expected goals in the first 30 minutes in their last five home fixtures.',
      staked: '₦310K'
    }
  },
  {
    id: 'trend-4',
    question: 'Will this X post hit 10K views?',
    category: 'Social',
    topic: 'X',
    yesProbability: 49,
    volume: '₦1.8M',
    timeRemaining: '6h 17m',
    iconBg: 'bg-black text-white',
    iconSymbol: '𝕏',
    iconImage: '/x-logo.svg',
    description: 'Post analytics view counter as displayed publicly by X platform at the target expiry timestamp.',
    topThesis: {
      author: 'viral_hunter',
      side: 'NO',
      summary: 'Algorithm saturation dropped the impressions rate after hour 2; retweet acceleration has plateaued.',
      staked: '₦150K'
    }
  },
  {
    id: 'trend-5',
    question: 'Will this crypto project announce its TGE this week?',
    category: 'Crypto',
    topic: 'TGE',
    yesProbability: 33,
    volume: '₦3.6M',
    timeRemaining: '3d 6h',
    iconBg: 'bg-teal-50 text-teal-600',
    iconSymbol: '✦',
    iconImage: '/token.svg',
    description: 'Official announcement from team verified Twitter/X or blog with clear token generation event date.',
    topThesis: {
      author: 'insider_quack',
      side: 'NO',
      summary: 'Smart contract audit report GitHub commit showed two unresolved high severity findings awaiting re-test.',
      staked: '₦280K'
    }
  }
];

const BIGGEST_VOLUME_ITEMS: VolumeRankingItem[] = [
  { rank: 1, name: 'BTC > $120K (Fri)', volume: '₦12.4M', change: '18%', iconBg: 'bg-amber-50 text-amber-600', iconSymbol: '₿', iconImage: '/btc.png' },
  { rank: 2, name: 'ETH > $4K (10 PM)', volume: '₦8.7M', change: '12%', iconBg: 'bg-indigo-50 text-indigo-600', iconSymbol: 'Ξ', iconImage: '/eth.png' },
  { rank: 3, name: 'Team A score (HT)', volume: '₦5.2M', change: '9%', iconBg: 'bg-emerald-50 text-emerald-600', iconSymbol: '⚽', iconImage: '/soccer.svg' },
  { rank: 4, name: 'X post 10K views', volume: '₦1.8M', change: '6%', iconBg: 'bg-black text-white', iconSymbol: '𝕏', iconImage: '/x-logo.svg' },
  { rank: 5, name: 'TGE this week', volume: '₦3.6M', change: '4%', iconBg: 'bg-teal-50 text-teal-600', iconSymbol: '✦', iconImage: '/token.svg' }
];

const INITIAL_FOLLOWED_USERS: FollowedUserCard[] = [
  {
    id: 'fol-1',
    username: 'TechBae',
    handle: '@techbae',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
    timePosted: '2h ago',
    isFollowing: true,
    question: 'Will SOL hit $250 before September ends?',
    category: 'Crypto',
    topic: 'SOL',
    probability: 76,
    volume: '₦2.1M'
  },
  {
    id: 'fol-2',
    username: 'DaraTrades',
    handle: '@daratrades',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
    timePosted: '4h ago',
    isFollowing: true,
    question: 'Will Apple announce a new AI feature this week?',
    category: 'Tech',
    topic: 'AAPL',
    probability: 58,
    volume: '₦1.3M'
  },
  {
    id: 'fol-3',
    username: 'MissCrypto',
    handle: '@misscrypto',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=80',
    timePosted: '6h ago',
    isFollowing: true,
    question: 'Will this project announce its TGE this week?',
    category: 'Crypto',
    topic: 'TGE',
    probability: 34,
    volume: '₦980K'
  }
];

interface OpenPredictionsPageProps {
  onBackToHome: () => void;
  connectedWallet: { name: string; address: string } | null;
  onOpenWalletModal: () => void;
}

export function OpenPredictionsPage({
  onBackToHome,
  connectedWallet,
  onOpenWalletModal
}: OpenPredictionsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [markets, setMarkets] = useState<MarketItem[]>(INITIAL_TRENDING_MARKETS);
  const [followedUsers, setFollowedUsers] = useState<FollowedUserCard[]>(INITIAL_FOLLOWED_USERS);
  const [selectedMarket, setSelectedMarket] = useState<MarketItem | null>(null);

  // Staking / Thesis interaction state
  const [betSide, setBetSide] = useState<'YES' | 'NO'>('YES');
  const [stakeAmount, setStakeAmount] = useState('25000');
  const [thesisInput, setThesisInput] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState<Record<string, boolean>>({});

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [liveRoomsModalOpen, setLiveRoomsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New prediction creation form
  const [newQuestion, setNewQuestion] = useState('');
  const [newCategory, setNewCategory] = useState('Crypto');
  const [newTopic, setNewTopic] = useState('');
  const [newInitialProb, setNewInitialProb] = useState(50);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleToggleFollow = (id: string) => {
    setFollowedUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const next = !u.isFollowing;
          showNotification(next ? `Now following ${u.username}` : `Unfollowed ${u.username}`);
          return { ...u, isFollowing: next };
        }
        return u;
      })
    );
  };

  const handleJoinMarket = (market: MarketItem) => {
    setSelectedMarket(market);
    setBetSide('YES');
    setThesisInput('');
  };

  const handlePlacePrediction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMarket) return;

    setHasSubmitted((prev) => ({ ...prev, [selectedMarket.id]: true }));
    showNotification(`Thesis backed on “${selectedMarket.question.slice(0, 30)}…” for ₦${parseInt(stakeAmount || '0').toLocaleString()}`);

    setMarkets((prev) =>
      prev.map((m) => {
        if (m.id === selectedMarket.id) {
          const shift = betSide === 'YES' ? 1 : -1;
          const nextProb = Math.min(95, Math.max(5, m.yesProbability + shift));
          return {
            ...m,
            yesProbability: nextProb,
            topThesis: thesisInput.trim()
              ? {
                  author: connectedWallet ? connectedWallet.address : 'you.duck',
                  side: betSide,
                  summary: thesisInput.trim(),
                  staked: `₦${parseInt(stakeAmount || '0').toLocaleString()}`
                }
              : m.topThesis
          };
        }
        return m;
      })
    );

    setSelectedMarket(null);
  };

  const handleCreateMarket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    const newMarket: MarketItem = {
      id: `custom-${Date.now()}`,
      question: newQuestion.trim(),
      category: newCategory,
      topic: newTopic.trim() || newCategory,
      yesProbability: newInitialProb,
      volume: '₦50K',
      timeRemaining: '7d 0h',
      iconBg: 'bg-emerald-50 text-emerald-600',
      iconSymbol: '★',
      iconImage: '/token.svg',
      description: 'Community created prediction market on DuckCast.'
    };

    setMarkets([newMarket, ...markets]);
    setNewQuestion('');
    setNewTopic('');
    setCreateModalOpen(false);
    showNotification('Market created successfully and published to DuckCast!');
  };

  const filteredMarkets = markets.filter(
    (m) =>
      m.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full bg-white text-[#09090B] flex flex-col items-center">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#09090B] text-white px-4 py-2.5 rounded-full text-xs shadow-md border border-neutral-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <span className="w-2 h-2 rounded-full bg-[#10b981]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar with Brand, Back & Connect Wallet */}
      <header className="w-full max-w-[1080px] px-4 sm:px-6 pt-5 pb-2 flex items-center justify-between gap-4">
        {/* Left: Brand + Back to Home */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-[#71717A] hover:text-[#09090B] text-xs font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          <span className="text-neutral-300">/</span>

          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="text-[16px] font-semibold tracking-[-0.03em] text-[#09090B]">
              DuckCast
            </span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#09090B] bg-white border border-neutral-200 hover:border-neutral-300 rounded-full transition-colors cursor-pointer"
          >
            <span>+ New Market</span>
          </button>

          <button
            type="button"
            onClick={onOpenWalletModal}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#09090B] text-white text-xs font-medium rounded-full hover:bg-[#18181B] transition-colors cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span>{connectedWallet ? connectedWallet.address : 'Connect Wallet'}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-[1080px] px-4 sm:px-6 pt-2 pb-12 space-y-6">
        {/* Search Bar - Exact Pill Style from Mockup */}
        <div className="w-full max-w-[480px]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search markets, rooms, or users…"
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-[13px] bg-white border border-[#e2e8f0] hover:border-neutral-300 focus:border-[#10b981] rounded-full focus:outline-none transition-all placeholder:text-[#94a3b8] shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Hero Banner - Exact Match to Reference Image */}
        <section className="relative rounded-3xl border border-[#e0f2e9] bg-[#f0faf5] p-6 sm:p-8 md:p-9 overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            {/* Left Content */}
            <div className="max-w-[420px]">
              <span className="inline-block text-[10px] font-bold tracking-wider text-emerald-800 bg-white/90 border border-emerald-200/60 px-3 py-1 rounded-full uppercase mb-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                SOCIAL PREDICTION MARKETS
              </span>

              <h1 className="text-3xl sm:text-[38px] font-bold tracking-[-0.03em] text-[#0f172a] leading-[1.12]">
                Real events. Real people. <br />
                <span className="text-[#10b981]">Real predictions.</span>
              </h1>

              <p className="text-[13px] sm:text-[14px] text-[#475569] leading-relaxed mt-3 mb-6">
                Join rooms, share your takes, challenge friends, and build your track record.
              </p>

              <div>
                <button
                  type="button"
                  onClick={() => setLiveRoomsModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white font-semibold text-xs sm:text-[13px] rounded-full shadow-sm transition-all duration-150 cursor-pointer"
                >
                  <span>Explore Live Rooms</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Side: Standing Duck with Handwritten Annotations from Mockup */}
            <div className="relative flex items-center justify-center shrink-0 pr-4 sm:pr-8 py-2">
              <div className="relative">
                {/* Handwritten annotations */}
                <div className="absolute -top-1 -left-12 sm:-left-16 flex items-center gap-1 font-handwriting text-2xl text-[#1e293b] select-none pointer-events-none rotate-[-6deg]">
                  <span className="text-neutral-400 text-lg">/</span>
                  <span>Predict</span>
                </div>

                <div className="absolute top-12 -right-16 sm:-right-20 font-handwriting text-2xl text-[#1e293b] select-none pointer-events-none rotate-[4deg]">
                  <span>Discuss</span>
                </div>

                <div className="absolute -bottom-1 -right-14 sm:-right-16 font-handwriting text-2xl text-[#1e293b] select-none pointer-events-none flex items-center gap-1 rotate-[-2deg]">
                  <span>Win</span>
                  <span className="text-neutral-400 text-lg tracking-tighter">///</span>
                </div>

                <img
                  src="/2.png"
                  alt="DuckCast mascot"
                  className="w-36 sm:w-44 md:w-48 h-auto object-contain select-none pointer-events-none drop-shadow-xs"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Main Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Trending Predictions */}
          <div className="lg:col-span-8 bg-white border border-[#edf2f7] rounded-3xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
                <h2 className="text-[15px] sm:text-[16px] font-bold tracking-tight text-[#0f172a]">
                  Trending Predictions
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs font-medium text-[#94a3b8] hover:text-[#0f172a] transition-colors cursor-pointer"
              >
                View all
              </button>
            </div>

            {/* List of Prediction Rows */}
            <div className="divide-y divide-neutral-100">
              {filteredMarkets.map((market) => (
                <div
                  key={market.id}
                  className="py-4 first:pt-3.5 last:pb-1 group hover:bg-[#fbfcfd] -mx-2 px-2 rounded-xl transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    {/* Left: Market Icon + Question & Labels */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <img
                        src={market.iconImage}
                        alt={market.topic}
                        className="w-9 h-9 rounded-full object-cover shrink-0 border border-neutral-100 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                      />

                      <div className="space-y-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleJoinMarket(market)}
                          className="text-left font-semibold text-xs sm:text-[13px] text-[#0f172a] hover:text-[#10b981] transition-colors leading-snug line-clamp-2 cursor-pointer"
                        >
                          {market.question}
                        </button>

                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="font-medium text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded">
                            {market.category}
                          </span>
                          <span className="font-medium text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded">
                            {market.topic}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Columns: Probability, Volume, Ends, Join Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-5 sm:gap-7 shrink-0 pl-12 sm:pl-0">
                      {/* Yes Probability */}
                      <div className="text-left sm:text-right min-w-[70px]">
                        <div className="font-bold text-xs sm:text-[13px] text-[#0f172a] font-mono-tabular">
                          {market.yesProbability}%
                        </div>
                        <div className="text-[10px] text-[#94a3b8]">
                          Yes probability
                        </div>
                      </div>

                      {/* Volume */}
                      <div className="text-left sm:text-right min-w-[60px]">
                        <div className="font-bold text-xs sm:text-[13px] text-[#0f172a] font-mono-tabular">
                          {market.volume}
                        </div>
                        <div className="text-[10px] text-[#94a3b8]">
                          Volume
                        </div>
                      </div>

                      {/* Ends */}
                      <div className="text-left sm:text-right min-w-[55px]">
                        <div className="font-bold text-xs sm:text-[13px] text-[#0f172a] font-mono-tabular">
                          {market.timeRemaining}
                        </div>
                        <div className="text-[10px] text-[#94a3b8]">
                          Ends
                        </div>
                      </div>

                      {/* Join Button */}
                      <button
                        type="button"
                        onClick={() => handleJoinMarket(market)}
                        className={`px-4 py-1 text-xs font-semibold rounded-full border transition-all duration-150 cursor-pointer whitespace-nowrap ${
                          hasSubmitted[market.id]
                            ? 'border-[#10b981] bg-[#10b981]/10 text-[#10b981]'
                            : 'border-emerald-400 text-emerald-600 hover:bg-emerald-50 bg-white'
                        }`}
                      >
                        {hasSubmitted[market.id] ? 'Joined ✓' : 'Join'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredMarkets.length === 0 && (
                <div className="py-8 text-center text-xs text-[#94a3b8]">
                  No predictions matched “{searchQuery}”.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Biggest Volume */}
          <div className="lg:col-span-4 bg-white border border-[#edf2f7] rounded-3xl p-5 sm:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#0f172a]" />
                <h2 className="text-[15px] sm:text-[16px] font-bold tracking-tight text-[#0f172a]">
                  Biggest Volume
                </h2>
              </div>
              <button
                type="button"
                onClick={() => showNotification('Viewing all high-volume prediction pairs.')}
                className="text-xs font-medium text-[#94a3b8] hover:text-[#0f172a] transition-colors cursor-pointer"
              >
                View all
              </button>
            </div>

            {/* Numbered List 1 to 5 */}
            <div className="divide-y divide-neutral-100 mt-0.5">
              {BIGGEST_VOLUME_ITEMS.map((item) => (
                <div
                  key={item.rank}
                  className="py-3.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-semibold text-xs text-[#94a3b8] w-3">
                      {item.rank}
                    </span>
                    <img
                      src={item.iconImage}
                      alt={item.name}
                      className="w-7 h-7 rounded-full object-cover shrink-0 border border-neutral-100 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                    />
                    <span className="font-semibold text-[#0f172a] truncate">
                      {item.name}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-xs text-[#0f172a] font-mono-tabular">
                      {item.volume}
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-600 flex items-center justify-end gap-0.5">
                      <span>▲</span>
                      <span>{item.change}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* "Followed by You" Section - Exact Match to Mockup */}
        <section className="space-y-3.5 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#0f172a]" />
              <h2 className="text-[15px] sm:text-[16px] font-bold tracking-tight text-[#0f172a]">
                Followed by You
              </h2>
            </div>
            <button
              type="button"
              onClick={() => showNotification('Showing all followed traders')}
              className="text-xs font-medium text-[#94a3b8] hover:text-[#0f172a] cursor-pointer"
            >
              View all
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {followedUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white border border-[#edf2f7] rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-neutral-300 transition-all flex flex-col justify-between gap-3"
              >
                {/* User Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-7 h-7 rounded-full object-cover border border-neutral-200"
                    />
                    <div>
                      <div className="text-xs font-bold text-[#0f172a] leading-tight">
                        {user.username}
                      </div>
                      <div className="text-[10px] text-[#94a3b8]">
                        {user.timePosted}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleFollow(user.id)}
                    title={user.isFollowing ? 'Following' : 'Follow'}
                    className="w-5 h-5 rounded-full border border-emerald-400 text-emerald-500 hover:bg-emerald-50 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Prediction Question */}
                <div>
                  <p className="text-xs font-semibold text-[#0f172a] leading-snug line-clamp-2">
                    {user.question}
                  </p>

                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="font-medium text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded text-[10px]">
                      {user.category}
                    </span>
                    <span className="font-medium text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded text-[10px]">
                      {user.topic}
                    </span>
                  </div>
                </div>

                {/* Card Footer: Probability, Volume, Mini Sparkline with Checkmark */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs">
                  <span className="font-bold text-xs text-[#0f172a] font-mono-tabular">
                    {user.probability}% Yes
                  </span>

                  <span className="font-medium text-xs text-[#64748b] font-mono-tabular">
                    {user.volume}
                  </span>

                  {/* Sparkline wave with green checkmark from mockup */}
                  <div className="flex items-center gap-1 text-emerald-500">
                    <svg className="w-7 h-3 stroke-emerald-500 fill-none" viewBox="0 0 28 12">
                      <path d="M1 9 C 5 4, 10 11, 15 6 C 20 1, 24 7, 27 3" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    <Check className="w-3 h-3 text-emerald-500 stroke-[2.5]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom Section: Wide Light Mint Banner with Duck */}
        <section className="rounded-3xl border border-[#e0f2e9] bg-[#f0faf5] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Mascot Duck on left */}
            <img
              src="/no-background-duck.png"
              alt="DuckCast mascot"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain select-none pointer-events-none shrink-0"
            />

            {/* Handwritten text beside duck */}
            <div className="font-handwriting text-2xl sm:text-3xl text-[#0f172a] leading-[1.05] select-none -rotate-2">
              Why do you <br />
              think so?
            </div>

            {/* Copy */}
            <div className="space-y-0.5 pl-2 sm:pl-4 border-l border-emerald-200/60 hidden sm:block">
              <h3 className="text-xs sm:text-[13px] font-bold text-[#0f172a]">
                Every prediction starts with a reason.
              </h3>
              <p className="text-xs text-[#64748b]">
                Share your thesis, get reactions, and see if you were right.
              </p>
            </div>
          </div>

          {/* Action Button on Right */}
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#10b981] hover:bg-[#059669] text-white font-semibold text-xs rounded-full shadow-sm transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>Create Prediction</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>
      </main>

      {/* Market Detail / Join Prediction Modal */}
      {selectedMarket && (
        <div
          className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={() => setSelectedMarket(null)}
        >
          <div
            className="bg-white border border-neutral-200 rounded-3xl w-full max-w-[540px] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <img
                  src={selectedMarket.iconImage}
                  alt={selectedMarket.topic}
                  className="w-9 h-9 rounded-full object-cover shrink-0 border border-neutral-100 shadow-xs"
                />
                <div>
                  <div className="text-xs text-[#71717A] flex items-center gap-1.5">
                    <span>{selectedMarket.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedMarket.topic}</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#09090B] mt-0.5 leading-snug">
                    {selectedMarket.question}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMarket(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 py-4 border-b border-neutral-100 text-center">
              <div className="p-2.5 bg-neutral-50 rounded-xl">
                <span className="text-[11px] text-[#71717A] block">Probability</span>
                <span className="font-mono-tabular font-bold text-sm text-[#09090B]">
                  {selectedMarket.yesProbability}% Yes
                </span>
              </div>
              <div className="p-2.5 bg-neutral-50 rounded-xl">
                <span className="text-[11px] text-[#71717A] block">24h Volume</span>
                <span className="font-mono-tabular font-bold text-sm text-[#09090B]">
                  {selectedMarket.volume}
                </span>
              </div>
              <div className="p-2.5 bg-neutral-50 rounded-xl">
                <span className="text-[11px] text-[#71717A] block">Expires In</span>
                <span className="font-mono-tabular font-bold text-sm text-[#09090B]">
                  {selectedMarket.timeRemaining}
                </span>
              </div>
            </div>

            {/* Description & Top Thesis */}
            {selectedMarket.topThesis && (
              <div className="my-4 p-3 bg-[#f8fafc] border border-neutral-100 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between text-[#71717A]">
                  <span className="font-semibold text-[#334155]">
                    Top Thesis by @{selectedMarket.topThesis.author}
                  </span>
                  <span className="font-mono-tabular text-emerald-600 font-bold">
                    Backed {selectedMarket.topThesis.side}
                  </span>
                </div>
                <p className="text-[#475569] italic">
                  “{selectedMarket.topThesis.summary}”
                </p>
              </div>
            )}

            {/* Interactive Form */}
            <form onSubmit={handlePlacePrediction} className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-semibold text-[#334155] block mb-1.5">
                  Pick your side
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBetSide('YES')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      betSide === 'YES'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-[#09090B] border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    YES (${(selectedMarket.yesProbability / 100).toFixed(2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBetSide('NO')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      betSide === 'NO'
                        ? 'bg-[#09090B] text-white border-[#09090B] shadow-xs'
                        : 'bg-white text-[#09090B] border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    NO (${((100 - selectedMarket.yesProbability) / 100).toFixed(2)})
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="stake-val" className="text-xs font-semibold text-[#334155]">
                    Stake Amount (₦)
                  </label>
                  <span className="text-[11px] text-[#71717A]">Est. return: ~₦{(parseInt(stakeAmount || '0') * (betSide === 'YES' ? 1.4 : 1.8)).toLocaleString()}</span>
                </div>
                <input
                  id="stake-val"
                  type="number"
                  min="500"
                  step="500"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono-tabular border border-neutral-200 rounded-xl focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div>
                <label htmlFor="thesis-val" className="text-xs font-semibold text-[#334155] block mb-1">
                  Explain your thesis (optional)
                </label>
                <textarea
                  id="thesis-val"
                  rows={2}
                  value={thesisInput}
                  onChange={(e) => setThesisInput(e.target.value)}
                  placeholder="Why will this happen? Back it up with data or a catalyst..."
                  className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:border-[#10b981] placeholder:text-neutral-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMarket(null)}
                  className="px-4 py-2 text-xs font-medium text-[#71717A] hover:text-[#09090B] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-semibold rounded-full shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Confirm Prediction</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Prediction Modal */}
      {createModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={() => setCreateModalOpen(false)}
        >
          <div
            className="bg-white border border-neutral-200 rounded-3xl w-full max-w-[500px] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                <h3 className="text-base font-bold text-[#09090B]">
                  Create Prediction Market
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMarket} className="space-y-4 pt-4">
              <div>
                <label htmlFor="question-input" className="text-xs font-semibold text-[#334155] block mb-1">
                  Prediction Question
                </label>
                <input
                  id="question-input"
                  required
                  type="text"
                  placeholder="e.g. Will SOL flip BNB in market cap before Q1 ends?"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:border-[#10b981]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cat-select" className="text-xs font-semibold text-[#334155] block mb-1">
                    Category
                  </label>
                  <select
                    id="cat-select"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl bg-white focus:outline-none focus:border-[#10b981]"
                  >
                    <option value="Crypto">Crypto</option>
                    <option value="Sports">Sports</option>
                    <option value="Social">Social</option>
                    <option value="Tech">Tech</option>
                    <option value="Macro">Macro</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="topic-input" className="text-xs font-semibold text-[#334155] block mb-1">
                    Topic Tag
                  </label>
                  <input
                    id="topic-input"
                    type="text"
                    placeholder="e.g. SOL, AAPL"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:border-[#10b981]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="prob-range" className="text-xs font-semibold text-[#334155]">
                    Initial Probability ({newInitialProb}%)
                  </label>
                </div>
                <input
                  id="prob-range"
                  type="range"
                  min="5"
                  max="95"
                  value={newInitialProb}
                  onChange={(e) => setNewInitialProb(parseInt(e.target.value))}
                  className="w-full accent-[#10b981]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#71717A] hover:text-[#09090B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-semibold rounded-full shadow-xs transition-colors cursor-pointer"
                >
                  Publish Market
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Explore Live Rooms Modal */}
      {liveRoomsModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={() => setLiveRoomsModalOpen(false)}
        >
          <div
            className="bg-white border border-neutral-200 rounded-3xl w-full max-w-[500px] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
                <h3 className="text-base font-bold text-[#09090B]">
                  Live Prediction Rooms
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLiveRoomsModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#71717A] mt-2 mb-4">
              Real-time voice & text thesis spaces where forecasters debate probabilities before market locks.
            </p>

            <div className="space-y-2.5">
              {[
                { name: 'Bitcoin $120K Strategy Room', participants: 42, activeThesis: 'Elena: CPI print catalyst' },
                { name: 'Champions League Half-time Analysis', participants: 28, activeThesis: 'Marcus: Defensive sub incoming' },
                { name: 'Q4 AI Benchmark Debate', participants: 19, activeThesis: 'Kaito: Open weights vs frontier RL' }
              ].map((room, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-neutral-200 rounded-2xl hover:border-[#10b981] transition-colors flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-bold text-[#09090B]">{room.name}</h4>
                    <p className="text-[11px] text-[#71717A] mt-0.5">{room.activeThesis}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      showNotification(`Joined room: ${room.name}`);
                      setLiveRoomsModalOpen(false);
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-[#10b981] text-white rounded-full hover:bg-[#059669] transition-colors cursor-pointer shrink-0"
                  >
                    Enter ({room.participants})
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
