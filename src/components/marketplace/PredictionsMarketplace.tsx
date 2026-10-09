import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Flame,
  Radio,
  Clock,
  Sparkles,
  TrendingUp,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpDown,
  Home,
  X,
  Filter,
  Swords
} from 'lucide-react';
import {
  PredictionMarket,
  MarketCategory,
  MarketSortOption,
  MarketQuickFilter,
  UserPredictionActivity
} from '../../types/market';
import { MOCK_USER_ACTIVITIES, MOCK_LEADERBOARD } from '../../data/mockMarkets';
import { useMarkets } from '../../context/MarketsContext';
import { MarketSourceBanner, PoweredByPanta } from '../panta/PoweredByPanta';
import { socialApi } from '../../services/socialApi';
import { pantaApi } from '../../services/pantaApi';
import { pantaToPredictionMarket } from '../../services/pantaAdapter';
import { walletAvatar } from '../../utils/walletAvatar';
import { MarketCard } from './MarketCard';
import { HighlightsSection } from './HighlightsSection';
import { CommunitySection } from './CommunitySection';
import { LeaderboardSection } from './LeaderboardSection';
import { CreatePredictionModal } from './CreatePredictionModal';
import { MarketDetailPage } from './MarketDetailPage';
import { PredictionBattlesSection } from './PredictionBattlesSection';
import { MenuButton } from '../navigation/MenuDrawer';
import { shortenSolanaAddress } from '../../solana/config';

interface PredictionsMarketplaceProps {
  onBackToHome: () => void;
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
  onOpenMenu?: () => void;
}

// Display order; only categories that actually have markets are shown.
const CATEGORY_ORDER: MarketCategory[] = [
  'Crypto',
  'Sports',
  'Politics',
  'Finance',
  'Technology',
  'Business',
  'Entertainment',
  'Culture',
  'World',
  'Science',
  'Gaming',
  'Social',
  'Other'
];

const QUICK_FILTERS: MarketQuickFilter[] = [
  'All Markets',
  'Live',
  'Ending Today',
  'Ending This Week',
  'High Volume',
  'New'
];

export function PredictionsMarketplace({
  onBackToHome,
  connectedWallet,
  onOpenWalletModal,
  onOpenMenu
}: PredictionsMarketplaceProps) {
  // State
  const { markets, source, upsertMarket, refresh } = useMarkets();
  const liveMode = source === 'panta';
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory>('All');
  const [communityActivities, setCommunityActivities] = useState<UserPredictionActivity[]>([]);

  const CATEGORIES = useMemo<MarketCategory[]>(() => {
    const present = new Set(markets.map((m) => m.category));
    return ['All', ...CATEGORY_ORDER.filter((c) => present.has(c))];
  }, [markets]);

  // Live community feed: recent wallet-signed theses on Panta markets
  useEffect(() => {
    if (!liveMode) return;
    let cancelled = false;
    socialApi
      .recentTheses()
      .then(({ items }) => {
        if (cancelled) return;
        setCommunityActivities(
          items.slice(0, 6).map((t) => {
            const market = markets.find((m) => m.id === t.marketId);
            return {
              id: t.id,
              username: `${t.wallet.slice(0, 4)}…${t.wallet.slice(-4)}`,
              handle: t.position ? `${t.position.shares.toFixed(1)} ${t.side} shares` : 'signed',
              avatar: walletAvatar(t.wallet),
              side: t.side,
              probability: market ? (t.side === 'YES' ? market.yesProbability : market.noProbability) : 50,
              question: market?.question || t.marketTitle,
              marketId: t.marketId,
              time: new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              comment: t.text,
              amount: t.position?.estValueUsdc != null ? `$${t.position.estValueUsdc.toFixed(2)}` : undefined
            };
          })
        );
      })
      .catch(() => setCommunityActivities([]));
    return () => {
      cancelled = true;
    };
    // Refetch when switching into live mode, not on every price refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveMode]);
  const [activeCenterNav, setActiveCenterNav] = useState<'Markets' | 'Battles' | 'Live' | 'Trending' | 'New' | 'Ending Soon'>('Markets');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<MarketSortOption>('Trending');
  const [quickFilter, setQuickFilter] = useState<MarketQuickFilter>('All Markets');

  // Secondary filter dropdowns
  const [probFilter, setProbFilter] = useState<'all' | 'high' | 'low' | 'tossup'>('all');
  const [volFilter, setVolFilter] = useState<'all' | '1m' | '3m' | '5m'>('all');
  const [endDateFilter, setEndDateFilter] = useState<'all' | '24h' | '7d' | '30d'>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Detail & Modals
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);
  const [initialDetailSide, setInitialDetailSide] = useState<'YES' | 'NO'>('YES');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [duckImageError, setDuckImageError] = useState(false);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Center Nav Selection
  const handleSelectCenterNav = (item: 'Markets' | 'Battles' | 'Live' | 'Trending' | 'New' | 'Ending Soon') => {
    setActiveCenterNav(item);
    if (item === 'Markets') {
      setQuickFilter('All Markets');
    } else if (item === 'Battles') {
      showNotification('Prediction Battles: Community-backed head-to-head theses');
    } else if (item === 'Live') {
      setQuickFilter('Live');
    } else if (item === 'Trending') {
      setQuickFilter('All Markets');
      setSortBy('Trending');
    } else if (item === 'New') {
      setQuickFilter('New');
      setSortBy('Newest');
    } else if (item === 'Ending Soon') {
      setQuickFilter('Ending Today');
      setSortBy('Ending Soon');
    }
  };

  // Filter & Sort Logic
  const filteredAndSortedMarkets = useMemo(() => {
    return markets
      .filter((m) => {
        // Category filter
        if (selectedCategory !== 'All' && m.category !== selectedCategory) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchQuestion = m.question.toLowerCase().includes(q);
          const matchCategory = m.category.toLowerCase().includes(q);
          const matchTopic = m.topic.toLowerCase().includes(q);
          const matchSource = m.source.toLowerCase().includes(q);
          const matchThesis = m.theses.some(t => t.text.toLowerCase().includes(q) || t.author.toLowerCase().includes(q));
          if (!matchQuestion && !matchCategory && !matchTopic && !matchSource && !matchThesis) {
            return false;
          }
        }

        // Quick filter
        if (quickFilter === 'Live' && !m.isLive) return false;
        if (quickFilter === 'Ending Today' && !m.isEndingToday) return false;
        if (quickFilter === 'Ending This Week' && !m.isEndingThisWeek && !m.isEndingToday) return false;
        if (quickFilter === 'High Volume' && !m.isHighVolume) return false;
        if (quickFilter === 'New' && !m.isNew) return false;

        // Probability filter
        if (probFilter === 'high' && m.yesProbability < 70) return false;
        if (probFilter === 'low' && m.yesProbability > 30) return false;
        if (probFilter === 'tossup' && (m.yesProbability < 40 || m.yesProbability > 60)) return false;

        // Volume filter
        if (volFilter === '1m' && m.volumeNumeric < 1_000) return false;
        if (volFilter === '3m' && m.volumeNumeric < 10_000) return false;
        if (volFilter === '5m' && m.volumeNumeric < 100_000) return false;

        // End Date filter
        if (endDateFilter === '24h' && m.timeMinutes > 1440) return false;
        if (endDateFilter === '7d' && m.timeMinutes > 10080) return false;
        if (endDateFilter === '30d' && m.timeMinutes > 43200) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'Trending') {
          // Live & trending first
          if (a.isLive && !b.isLive) return -1;
          if (!a.isLive && b.isLive) return 1;
          if (a.isTrending && !b.isTrending) return -1;
          if (!a.isTrending && b.isTrending) return 1;
          return b.traders - a.traders;
        }
        if (sortBy === 'Highest Volume') {
          return b.volumeNumeric - a.volumeNumeric;
        }
        if (sortBy === 'Ending Soon') {
          return a.timeMinutes - b.timeMinutes;
        }
        if (sortBy === 'Newest') {
          if (a.isNew && !b.isNew) return -1;
          if (!a.isNew && b.isNew) return 1;
          return b.volumeNumeric - a.volumeNumeric;
        }
        return 0;
      });
  }, [
    markets,
    selectedCategory,
    searchQuery,
    quickFilter,
    sortBy,
    probFilter,
    volFilter,
    endDateFilter
  ]);

  // Handle Card Click
  const handleOpenMarketDetail = (market: PredictionMarket, side: 'YES' | 'NO' = 'YES') => {
    setSelectedMarket(market);
    setInitialDetailSide(side);
  };

  // Live mode: the modal created + registered the market on Panta; pull it into the feed and open it.
  const handlePantaMarketCreated = async (marketId: string) => {
    showNotification('Market created on Panta! Loading it from the catalog…');
    try {
      // Fetch directly: a brand-new zero-volume market may not be in the feed's top markets yet.
      const { market, trades, priceHistory } = await pantaApi.market(marketId);
      const mapped = pantaToPredictionMarket(market, { trades, history: priceHistory });
      upsertMarket({ ...mapped, isNew: true });
      handleOpenMarketDetail(mapped);
    } catch {
      refresh();
    }
  };

  // Demo mode only: add a local, clearly-unpublished sample market
  const handleCreateMarket = (newMarketData: Partial<PredictionMarket>) => {
    const created: PredictionMarket = {
      id: `custom-${Date.now()}`,
      question: newMarketData.question || 'Untitled Market',
      category: newMarketData.category || 'Crypto',
      topic: newMarketData.topic || 'General',
      yesProbability: newMarketData.yesProbability || 50,
      noProbability: 100 - (newMarketData.yesProbability || 50),
      yesPriceCents: newMarketData.yesProbability || 50,
      noPriceCents: 100 - (newMarketData.yesProbability || 50),
      volume: '$10K',
      volumeNumeric: 10000,
      traders: 1,
      timeRemaining: '7d 0h',
      timeMinutes: 10080,
      sparkline: [50, newMarketData.yesProbability || 50],
      chartHistory: {
        '1H': [{ time: '0m', probability: 50 }, { time: '60m', probability: newMarketData.yesProbability || 50 }],
        '6H': [{ time: '0h', probability: 50 }, { time: '6h', probability: newMarketData.yesProbability || 50 }],
        '1D': [{ time: '0h', probability: 50 }, { time: '24h', probability: newMarketData.yesProbability || 50 }],
        '1W': [{ time: 'D1', probability: 50 }, { time: 'D7', probability: newMarketData.yesProbability || 50 }],
        '24H': [{ time: '0h', probability: 50 }, { time: '24h', probability: newMarketData.yesProbability || 50 }],
        '7D': [{ time: 'D1', probability: 50 }, { time: 'D7', probability: newMarketData.yesProbability || 50 }],
        '30D': [{ time: 'W1', probability: 50 }, { time: 'W4', probability: newMarketData.yesProbability || 50 }],
        'ALL': [{ time: 'Start', probability: 50 }, { time: 'Now', probability: newMarketData.yesProbability || 50 }]
      },
      isNew: true,
      resolutionDate: newMarketData.resolutionDate || 'In 7 days',
      resolutionCriteria: newMarketData.resolutionCriteria || 'Standard public verification',
      source: newMarketData.source || 'Public Feed',
      liquidity: '$25K',
      commentsCount: 0,
      theses: newMarketData.theses || [],
      recentActivity: []
    };

    upsertMarket(created);
    showNotification('Demo market added locally (not published on-chain).');
  };

  // Update market when refreshed from Panta or a thesis is added in the detail view
  const handleMarketUpdated = (updated: PredictionMarket) => {
    upsertMarket(updated);
    setSelectedMarket(updated);
  };

  // If a Market Detail is open, render the dedicated market view!
  if (selectedMarket) {
    return (
      <MarketDetailPage
        market={selectedMarket}
        allMarkets={markets}
        onBackToMarketplace={() => setSelectedMarket(null)}
        onSelectRelatedMarket={(rm) => setSelectedMarket(rm)}
        connectedWallet={connectedWallet}
        onOpenWalletModal={onOpenWalletModal}
        initialSide={initialDetailSide}
        onMarketUpdated={handleMarketUpdated}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#09090B] flex flex-col antialiased selection:bg-emerald-500/15 selection:text-emerald-950">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#09090B] text-white px-4 py-2.5 rounded-xl text-xs font-medium shadow-md border border-neutral-700 flex items-center gap-2 animate-in fade-in duration-150">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP NAVIGATION: Persistent DuckCast Navigation Bar with Entrance Animation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/90 shadow-2xs transition-all duration-300 animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: DuckCast Logo + Home Return */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onBackToHome}
              className="flex items-center gap-2 group cursor-pointer"
              title="Return to DuckCast Home"
            >
              <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 -mr-0.5">
                {!duckImageError ? (
                  <img
                    src="/src/assets/images/duckcast_mascot_illustration_1790877735628.jpg"
                    alt="DuckCast duck emblem"
                    referrerPolicy="no-referrer"
                    onError={() => setDuckImageError(true)}
                    className="w-8 h-8 sm:w-9 sm:h-9 object-contain mix-blend-multiply select-none pointer-events-none group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-200"
                  />
                ) : (
                  <svg
                    viewBox="0 0 64 64"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-7 h-7 sm:w-8 sm:h-8"
                    aria-label="DuckCast minimalist duck emblem"
                  >
                    <path
                      d="M21 44C15.5 44 12 40.2 12 35.5C12 31.2 15.2 28.5 19.5 28.5C21.2 28.5 22.8 28.9 24 29.5C24.4 22.5 29.2 18 35.5 18C41.2 18 45.5 22.1 45.5 27.6C45.5 30.1 44.5 32.3 43 33.9C45.2 35.4 46.5 37.8 46.5 40.5C46.5 42.8 44.8 44 42 44H21Z"
                      stroke="#09090B"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M45.5 26.5H51.5C52.6 26.5 53.5 27.4 53.5 28.5C53.5 29.6 52.6 30.5 51.5 30.5H45"
                      stroke="#10B981"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="38.5" cy="25.5" r="1.5" fill="#09090B" />
                    <path
                      d="M24 36.5C27.5 38 32 37.5 34.5 35"
                      stroke="#09090B"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </div>

              <div className="flex flex-col">
                <span className="text-[18px] font-bold font-display tracking-[-0.03em] text-[#09090B]">
                  DuckCast
                </span>
                <span className="text-[10px] text-neutral-500 font-bold -mt-1 hidden sm:block uppercase tracking-wider">
                  Predictions
                </span>
              </div>
            </button>

            {/* Back to Home Button - Changed from Landing to Home */}
            <button
              type="button"
              onClick={onBackToHome}
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-[#09090B] px-2.5 py-1.5 rounded-[10px] hover:bg-neutral-100 transition-all cursor-pointer ml-1"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
          </div>

          {/* Center Navigation: Squircle Border Radius */}
          <nav className="hidden lg:flex items-center gap-1 bg-neutral-100/90 p-1 rounded-[16px] border border-neutral-200/60">
            {(['Markets', 'Battles', 'Live', 'Trending', 'New', 'Ending Soon'] as const).map((tab) => {
              const isActive = activeCenterNav === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleSelectCenterNav(tab)}
                  className={`px-3.5 py-1.5 rounded-[12px] text-xs font-bold tracking-tight transition-all cursor-pointer inline-flex items-center gap-1.5 hover:-translate-y-0.5 ${
                    isActive
                      ? 'bg-white text-[#09090B] shadow-2xs'
                      : 'text-neutral-600 hover:text-[#09090B]'
                  }`}
                >
                  {tab === 'Battles' && <Swords className="w-3 h-3 text-amber-500" />}
                  {tab === 'Live' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                  {tab === 'Trending' && <Flame className="w-3 h-3 text-amber-500" />}
                  {tab === 'Ending Soon' && <Clock className="w-3 h-3 text-purple-500" />}
                  <span>{tab}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Search & Connect Wallet */}
          <div className="flex items-center gap-2.5">
            {/* Quick search input trigger for desktop header */}
            <div className="relative hidden xl:block w-[240px]">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (!searchQuery.trim()) {
                      showNotification('Enter a market or topic to search.');
                    } else {
                      showNotification(`Searching DuckCast · Finding markets related to "${searchQuery}"`);
                      setTimeout(() => {
                        if (filteredAndSortedMarkets.length > 0) {
                          showNotification(`Search complete · Showing results for "${searchQuery}"`);
                        } else {
                          showNotification(`No markets found · We couldn't find any markets matching "${searchQuery}"`);
                        }
                      }, 350);
                    }
                  }
                }}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 text-xs font-medium bg-neutral-100 border border-neutral-200/80 rounded-lg focus:outline-none focus:bg-white focus:border-emerald-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    showNotification('Search cleared');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Connect Wallet Button */}
            {connectedWallet ? (
              <button
                type="button"
                onClick={onOpenWalletModal}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white text-[#09090B] text-xs font-bold rounded-lg border border-neutral-200 hover:border-neutral-300 shadow-2xs transition-colors cursor-pointer"
              >
                <span className="font-mono-tabular">{connectedWallet.shortAddress || shortenSolanaAddress(connectedWallet.address)}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenWalletModal}
                className="inline-flex items-center justify-center px-4 py-2 bg-[#09090B] hover:bg-neutral-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <span>Connect Wallet</span>
              </button>
            )}

            {onOpenMenu && (
              <MenuButton onClick={onOpenMenu} />
            )}
          </div>
        </div>

        {/* CATEGORY NAVIGATION: Directly below main navigation */}
        <div className="border-t border-neutral-200/70 bg-white">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 no-scrollbar scroll-smooth">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-[12px] text-xs font-bold tracking-tight whitespace-nowrap transition-all duration-200 cursor-pointer hover:-translate-y-0.5 ${
                      isSelected
                        ? 'bg-[#09090B] text-white shadow-xs'
                        : 'text-neutral-600 hover:text-[#09090B] hover:bg-neutral-100'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 w-full space-y-6">
        {/* SEARCH: Large search field near top of marketplace */}
        <div className="w-full">
          <div className="relative w-full max-w-3xl mx-auto shadow-xs">
            <Search className="w-5 h-5 text-neutral-400 absolute left-4.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (!searchQuery.trim()) {
                    showNotification('Enter a market or topic to search.');
                  } else {
                    showNotification(`Searching DuckCast · Finding markets related to "${searchQuery}"`);
                    setTimeout(() => {
                      if (filteredAndSortedMarkets.length > 0) {
                        showNotification(`Search complete · Showing results for "${searchQuery}"`);
                      } else {
                        showNotification(`No markets found · We couldn't find any markets matching "${searchQuery}"`);
                      }
                    }, 350);
                  }
                }
              }}
              placeholder="Search markets, events, topics, or users..."
              className="w-full pl-12 pr-10 py-3.5 text-sm sm:text-base font-semibold bg-white border border-neutral-200/90 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-[#09090B] placeholder-neutral-400 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  showNotification('Search cleared');
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* DATA SOURCE: live Panta markets vs labelled demo data */}
        <MarketSourceBanner />

        {/* HIGHLIGHTS SECTION: Trending, Live, Highest Volume, Ending Soon */}
        <HighlightsSection
          markets={markets}
          onSelectMarket={(m) => handleOpenMarketDetail(m)}
          onFilterChange={(flt) => setQuickFilter(flt)}
        />

        {/* PREDICTION BATTLES: Signature DuckCast Social Feature */}
        <PredictionBattlesSection
          allMarkets={markets}
          onSelectMarket={(mId) => {
            const found = markets.find((m) => m.id === mId);
            if (found) handleOpenMarketDetail(found);
          }}
          onShowNotification={showNotification}
          liveMode={liveMode}
          viewerWallet={connectedWallet?.address}
        />

        {/* MAIN MARKETPLACE HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2 pb-1 border-b border-neutral-200/80">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display tracking-[-0.03em] text-[#09090B]">
                Predictions
              </h1>
              <span className="text-xs font-mono-tabular font-extrabold bg-neutral-200/90 text-neutral-800 px-2 py-0.5 rounded-md">
                {filteredAndSortedMarkets.length}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-neutral-600 mt-1">
              {liveMode
                ? 'Live Panta markets on Solana. Every trade is signed by your wallet and settles in USDC.'
                : 'Trade on events happening around the world.'}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
            {/* Sorting Control */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-600 bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
              <span className="font-bold">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as MarketSortOption)}
                className="bg-transparent text-[#09090B] font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="Trending">Trending</option>
                <option value="Highest Volume">Highest Volume</option>
                <option value="Ending Soon">Ending Soon</option>
                <option value="Newest">Newest</option>
              </select>
            </div>

            {/* Create Prediction Button */}
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#09090B] hover:bg-neutral-800 text-white text-xs font-extrabold tracking-tight rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Create Prediction</span>
            </button>
          </div>
        </div>

        {/* MARKET FILTERS: Quick Filters & Filter Area Underneath Header */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Quick Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {QUICK_FILTERS.map((qf) => {
                const isActive = quickFilter === qf;
                return (
                  <button
                    key={qf}
                    type="button"
                    onClick={() => setQuickFilter(qf)}
                    className={`px-3.5 py-1.5 rounded-[12px] text-xs font-bold tracking-tight whitespace-nowrap transition-all duration-200 cursor-pointer hover:-translate-y-0.5 ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-2xs'
                        : 'bg-white text-neutral-600 hover:text-[#09090B] border border-neutral-200/80 hover:border-neutral-300'
                    }`}
                  >
                    {qf === 'Live' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1.5 animate-pulse" />
                    )}
                    {qf}
                  </button>
                );
              })}
            </div>

            {/* Toggle Advanced Filters */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-tight border transition-colors cursor-pointer self-start sm:self-auto ${
                showAdvancedFilters
                  ? 'bg-neutral-100 text-[#09090B] border-neutral-300'
                  : 'bg-white text-neutral-600 border-neutral-200/80 hover:text-[#09090B]'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter by criteria</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Advanced Filter Controls Drawer */}
          {showAdvancedFilters && (
            <div className="p-4 bg-white border border-neutral-200/90 rounded-xl shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-4 animate-in fade-in">
              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as MarketCategory)}
                  className="w-full text-xs p-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Probability
                </label>
                <select
                  value={probFilter}
                  onChange={(e) => setProbFilter(e.target.value as any)}
                  className="w-full text-xs p-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="all">Any Probability</option>
                  <option value="high">&gt; 70% Yes (High conviction)</option>
                  <option value="low">&lt; 30% Yes (Underdog)</option>
                  <option value="tossup">40% - 60% (Competitive)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Volume
                </label>
                <select
                  value={volFilter}
                  onChange={(e) => setVolFilter(e.target.value as any)}
                  className="w-full text-xs p-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="all">Any Volume</option>
                  <option value="1m">&gt; $1K Volume</option>
                  <option value="3m">&gt; $10K Volume</option>
                  <option value="5m">&gt; $100K Volume</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  End Date
                </label>
                <select
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value as any)}
                  className="w-full text-xs p-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="all">All Dates</option>
                  <option value="24h">Ending in &lt; 24h</option>
                  <option value="7d">Ending in &lt; 7 Days</option>
                  <option value="30d">Ending in &lt; 30 Days</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* MARKET LIST: Main marketplace cards grid */}
        {filteredAndSortedMarkets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAndSortedMarkets.map((market) => (
              <MarketCard
                key={market.id}
                market={market}
                onSelectMarket={(m, side) => handleOpenMarketDetail(m, side || 'YES')}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3 text-neutral-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#09090B] mb-1">
              No matching prediction markets found
            </h3>
            <p className="text-xs text-neutral-500 mb-4 max-w-sm mx-auto">
              Try adjusting your search query, clearing filters, or create a brand new prediction.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setQuickFilter('All Markets');
                  setProbFilter('all');
                  setVolFilter('all');
                  setEndDateFilter('all');
                }}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="px-4 py-2 bg-[#09090B] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                + Create Market
              </button>
            </div>
          </div>
        )}

        {/* COMMUNITY SECTION: live = wallet-signed theses on Panta markets; demo = samples */}
        {(!liveMode || communityActivities.length > 0) && (
          <CommunitySection
            activities={liveMode ? communityActivities : MOCK_USER_ACTIVITIES}
            onSelectMarketById={(mId) => {
              const found = markets.find((m) => m.id === mId);
              if (found) handleOpenMarketDetail(found);
            }}
          />
        )}

        {/* LEADERBOARD SECTION (sample data; hidden when showing live Panta markets) */}
        {!liveMode && <LeaderboardSection users={MOCK_LEADERBOARD} />}
      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-neutral-200/80 bg-white py-6">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-[#09090B]">DuckCast Marketplace</span>
            <span>· Predict. Explain. Compete.</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBackToHome}
              className="hover:text-[#09090B] font-semibold transition-colors cursor-pointer"
            >
              Return Home
            </button>
            <span>·</span>
            <PoweredByPanta />
          </div>
        </div>
      </footer>

      {/* CREATE PREDICTION MODAL */}
      <CreatePredictionModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreateMarket={handleCreateMarket}
        liveMode={liveMode}
        onPantaMarketCreated={handlePantaMarketCreated}
        onOpenWalletModal={onOpenWalletModal}
      />
    </div>
  );
}
