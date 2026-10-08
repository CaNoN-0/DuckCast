/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MarketActivityPoint {
  time: string;
  prob: number;
}

export interface TradeOrder {
  id: string;
  user: string;
  type: 'YES' | 'NO';
  shares: number;
  price: number;
  total: string;
  timeAgo: string;
}

export interface MarketThesis {
  id: string;
  author: string;
  side: 'YES' | 'NO';
  summary: string;
  staked: string;
  reactions: { insightful: number; bullish: number; fire: number };
  timeAgo: string;
}

export interface PredictionMarket {
  id: string;
  question: string;
  category: 'Politics' | 'Crypto' | 'Sports' | 'Technology' | 'Culture' | 'Business' | 'World' | 'Science' | 'Gaming' | 'Creators';
  topic: string;
  yesProbability: number;
  noProbability: number;
  volume: string;
  volumeNumeric: number;
  tradersCount: number;
  liquidity: string;
  timeRemaining: string;
  status: 'active' | 'live' | 'ending_soon';
  isLive?: boolean;
  liveCurrentEvent?: string;
  iconBg: string;
  iconSymbol: string;
  iconImage?: string;
  createdDate: string;
  resolutionDate: string;
  resolutionCriteria: string;
  sourceUrl?: string;
  recentSparkline: number[];
  historicalPoints?: MarketActivityPoint[];
  theses: MarketThesis[];
  recentTrades: TradeOrder[];
}

export interface LeaderboardUser {
  rank: number;
  username: string;
  avatarColor: string;
  predictionsCount: number;
  winRate: number;
  totalVolume: string;
  profit: string;
  trackRecordBadge: string;
}

export interface FollowedPerson {
  id: string;
  username: string;
  handle: string;
  avatarColor: string;
  avatarImage?: string;
  timePosted: string;
  isFollowing: boolean;
  question: string;
  category: string;
  probability: number;
  volume: string;
}

export const COMPREHENSIVE_MARKETS: PredictionMarket[] = [
  {
    id: 'm-btc-120k',
    question: 'Will BTC move above $120K before Friday?',
    category: 'Crypto',
    topic: 'Bitcoin',
    yesProbability: 78,
    noProbability: 22,
    volume: '$12.4M',
    volumeNumeric: 12400000,
    tradersCount: 2481,
    liquidity: '$4.8M',
    timeRemaining: '2d 14h',
    status: 'active',
    iconBg: 'bg-amber-50 text-amber-600 border border-amber-200',
    iconSymbol: '₿',
    iconImage: '/btc.png',
    createdDate: 'Oct 01, 2026',
    resolutionDate: 'Friday 23:59 UTC',
    resolutionCriteria: 'Market resolves to YES if Binance spot BTC/USDT price reaches or exceeds $120,000.00 at any time before Friday 23:59:59 UTC.',
    sourceUrl: 'https://binance.com/en/trade/BTC_USDT',
    recentSparkline: [68, 70, 71, 74, 73, 76, 78],
    theses: [
      {
        id: 't-1',
        author: 'satoshiduck',
        side: 'YES',
        summary: 'ETF institutional inflows hit record volume for 4 straight days, creating severe supply squeeze on OTC desks.',
        staked: '$850K',
        reactions: { insightful: 34, bullish: 51, fire: 19 },
        timeAgo: '2h ago'
      },
      {
        id: 't-2',
        author: 'macro_whale',
        side: 'NO',
        summary: 'Heavy sell walls at $118,500 and $119,800 on Coinbase and Deribit options gamma expiration may cap the push.',
        staked: '$420K',
        reactions: { insightful: 18, bullish: 4, fire: 7 },
        timeAgo: '5h ago'
      }
    ],
    recentTrades: [
      { id: 'tr-1', user: '0x94A...11B0', type: 'YES', shares: 450, price: 0.78, total: '$35,100', timeAgo: '1m ago' },
      { id: 'tr-2', user: '0x38F...4E19', type: 'YES', shares: 1200, price: 0.77, total: '$92,400', timeAgo: '4m ago' },
      { id: 'tr-3', user: '0x71C...9A24', type: 'NO', shares: 300, price: 0.22, total: '$6,600', timeAgo: '9m ago' }
    ]
  },
  {
    id: 'm-eth-4k',
    question: 'Will ETH stay above $4,000 by 10 PM?',
    category: 'Crypto',
    topic: 'Ethereum',
    yesProbability: 62,
    noProbability: 38,
    volume: '$8.7M',
    volumeNumeric: 8700000,
    tradersCount: 1824,
    liquidity: '$3.1M',
    timeRemaining: '11h 23m',
    status: 'ending_soon',
    iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-200',
    iconSymbol: 'Ξ',
    iconImage: '/eth.png',
    createdDate: 'Oct 02, 2026',
    resolutionDate: 'Today 22:00 UTC',
    resolutionCriteria: 'Resolves YES if spot ETH remains at or strictly above $4,000.00 at the official 22:00:00 UTC price snapshot on Coinbase.',
    sourceUrl: 'https://coinbase.com/price/ethereum',
    recentSparkline: [55, 58, 64, 61, 59, 63, 62],
    theses: [
      {
        id: 't-3',
        author: 'defi_chick',
        side: 'YES',
        summary: 'Strong bids resting at $3,980-$4,010 range on Coinbase orderbooks with negative funding rate.',
        staked: '$420K',
        reactions: { insightful: 29, bullish: 42, fire: 12 },
        timeAgo: '1h ago'
      }
    ],
    recentTrades: [
      { id: 'tr-4', user: '0x18B...F92', type: 'YES', shares: 600, price: 0.62, total: '$37,200', timeAgo: '2m ago' },
      { id: 'tr-5', user: '0x7A2...11D', type: 'NO', shares: 500, price: 0.38, total: '$19,000', timeAgo: '8m ago' }
    ]
  },
  {
    id: 'm-team-a-score',
    question: 'Will Team A score before halftime?',
    category: 'Sports',
    topic: 'Football',
    yesProbability: 71,
    noProbability: 29,
    volume: '$5.2M',
    volumeNumeric: 5200000,
    tradersCount: 1104,
    liquidity: '$1.9M',
    timeRemaining: '1h 42m',
    status: 'live',
    isLive: true,
    liveCurrentEvent: 'Match min 24 — Team A corner kick series',
    iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    iconSymbol: '⚽',
    createdDate: 'Today',
    resolutionDate: 'Halftime whistle',
    resolutionCriteria: 'Resolves YES once Team A scores an officially awarded goal before 45:00 + first-half added stoppage time.',
    recentSparkline: [62, 65, 69, 73, 70, 71],
    theses: [
      {
        id: 't-4',
        author: 'pitch_tactics',
        side: 'YES',
        summary: 'Team A is averaging 2.4 expected goals in the first 30 minutes in their last five home fixtures.',
        staked: '$310K',
        reactions: { insightful: 17, bullish: 23, fire: 8 },
        timeAgo: '30m ago'
      }
    ],
    recentTrades: [
      { id: 'tr-6', user: '0x88C...33B', type: 'YES', shares: 800, price: 0.71, total: '$56,800', timeAgo: 'Just now' }
    ]
  },
  {
    id: 'm-btc-next-hour',
    question: 'Will BTC remain above $120K for the next hour?',
    category: 'Crypto',
    topic: 'Bitcoin Live',
    yesProbability: 64,
    noProbability: 36,
    volume: '$2.8M',
    volumeNumeric: 2800000,
    tradersCount: 890,
    liquidity: '$1.2M',
    timeRemaining: '52m 10s',
    status: 'live',
    isLive: true,
    liveCurrentEvent: 'Real-time 60-minute window tracking $120,000 threshold',
    iconBg: 'bg-amber-50 text-amber-600 border border-amber-200',
    iconSymbol: '₿',
    iconImage: '/btc.png',
    createdDate: 'Today',
    resolutionDate: '1h Window',
    resolutionCriteria: 'Market resolves to YES if spot BTC maintains ≥ $120,000 across all 1-minute close candles over the designated 60-minute session.',
    recentSparkline: [60, 61, 63, 62, 65, 64],
    theses: [
      {
        id: 't-5',
        author: 'alpha_scalper',
        side: 'YES',
        summary: 'Orderbook delta skew is heavily positive with limit buy absorption at $120,100.',
        staked: '$190K',
        reactions: { insightful: 12, bullish: 15, fire: 5 },
        timeAgo: '15m ago'
      }
    ],
    recentTrades: [
      { id: 'tr-7', user: '0x43F...22A', type: 'YES', shares: 350, price: 0.64, total: '$22,400', timeAgo: '3m ago' }
    ]
  },
  {
    id: 'm-x-post-10k',
    question: 'Will this X post reach 10K views?',
    category: 'Culture',
    topic: 'Viral X',
    yesProbability: 49,
    noProbability: 51,
    volume: '$1.8M',
    volumeNumeric: 1800000,
    tradersCount: 742,
    liquidity: '$650K',
    timeRemaining: '6h 17m',
    status: 'live',
    isLive: true,
    liveCurrentEvent: 'Live counter: 7,420 / 10,000 views',
    iconBg: 'bg-black text-white border border-neutral-800',
    iconSymbol: '𝕏',
    iconImage: '/x-logo.svg',
    createdDate: 'Oct 02, 2026',
    resolutionDate: 'Midnight UTC',
    resolutionCriteria: 'Resolves YES if post public analytics display ≥ 10,000 views counter before expiration timestamp.',
    recentSparkline: [35, 41, 46, 52, 50, 49],
    theses: [
      {
        id: 't-6',
        author: 'viral_hunter',
        side: 'NO',
        summary: 'Algorithm saturation dropped the impressions rate after hour 2; retweet acceleration has plateaued.',
        staked: '$150K',
        reactions: { insightful: 21, bullish: 3, fire: 9 },
        timeAgo: '2h ago'
      }
    ],
    recentTrades: [
      { id: 'tr-8', user: '0x91D...77B', type: 'NO', shares: 400, price: 0.51, total: '$20,400', timeAgo: '6m ago' }
    ]
  },
  {
    id: 'm-crypto-tge',
    question: 'Will this crypto project announce its TGE this week?',
    category: 'Crypto',
    topic: 'Token Launch',
    yesProbability: 33,
    noProbability: 67,
    volume: '$3.6M',
    volumeNumeric: 3600000,
    tradersCount: 1492,
    liquidity: '$1.4M',
    timeRemaining: '3d 6h',
    status: 'active',
    iconBg: 'bg-teal-50 text-teal-600 border border-teal-200',
    iconSymbol: '✦',
    createdDate: 'Oct 01, 2026',
    resolutionDate: 'Sunday 23:59 UTC',
    resolutionCriteria: 'Official announcement from team verified Twitter/X or mirror blog with unambiguous token generation date specified.',
    recentSparkline: [40, 38, 35, 34, 31, 33],
    theses: [
      {
        id: 't-7',
        author: 'insider_quack',
        side: 'NO',
        summary: 'Smart contract audit report GitHub commit showed two unresolved high severity findings awaiting re-test.',
        staked: '$280K',
        reactions: { insightful: 31, bullish: 2, fire: 14 },
        timeAgo: '4h ago'
      }
    ],
    recentTrades: [
      { id: 'tr-9', user: '0x55B...A1C', type: 'NO', shares: 1000, price: 0.67, total: '$67,000', timeAgo: '12m ago' }
    ]
  },
  {
    id: 'm-apple-ai',
    question: 'Will Apple announce a new AI feature this week?',
    category: 'Technology',
    topic: 'Apple Intelligence',
    yesProbability: 58,
    noProbability: 42,
    volume: '$1.3M',
    volumeNumeric: 1300000,
    tradersCount: 920,
    liquidity: '$800K',
    timeRemaining: '4d 12h',
    status: 'active',
    iconBg: 'bg-neutral-100 text-neutral-800 border border-neutral-300',
    iconSymbol: '',
    createdDate: 'Oct 02, 2026',
    resolutionDate: 'Friday 17:00 PT',
    resolutionCriteria: 'Official Apple Newsroom press release or software beta release notes detailing a new generative AI capability.',
    recentSparkline: [52, 54, 57, 56, 59, 58],
    theses: [
      {
        id: 't-8',
        author: 'DaraTrades',
        side: 'YES',
        summary: 'Supply chain beta leaks in iOS developer seeds point to on-device code generation rollout for Xcode.',
        staked: '$210K',
        reactions: { insightful: 19, bullish: 27, fire: 8 },
        timeAgo: '3h ago'
      }
    ],
    recentTrades: [
      { id: 'tr-10', user: '0x21F...88E', type: 'YES', shares: 300, price: 0.58, total: '$17,400', timeAgo: '14m ago' }
    ]
  },
  {
    id: 'm-sol-250',
    question: 'Will SOL hit $250 before September ends?',
    category: 'Crypto',
    topic: 'Solana',
    yesProbability: 76,
    noProbability: 24,
    volume: '$2.1M',
    volumeNumeric: 2100000,
    tradersCount: 1340,
    liquidity: '$1.1M',
    timeRemaining: '5d 8h',
    status: 'active',
    iconBg: 'bg-purple-50 text-purple-600 border border-purple-200',
    iconSymbol: '◎',
    createdDate: 'Sep 28, 2026',
    resolutionDate: 'End of Month',
    resolutionCriteria: 'Resolves YES if spot SOL/USDT reaches $250.00 on major exchanges before monthly close.',
    recentSparkline: [65, 68, 71, 74, 75, 76],
    theses: [
      {
        id: 't-9',
        author: 'TechBae',
        side: 'YES',
        summary: 'DEX daily volume on Solana exceeded all EVM chains combined for the 3rd consecutive week with low gas fees.',
        staked: '$340K',
        reactions: { insightful: 38, bullish: 49, fire: 22 },
        timeAgo: '5h ago'
      }
    ],
    recentTrades: [
      { id: 'tr-11', user: '0x71C...9A24', type: 'YES', shares: 500, price: 0.76, total: '$38,000', timeAgo: '7m ago' }
    ]
  },
  {
    id: 'm-fed-rate-cut',
    question: 'Will the US Federal Reserve cut rates by 50 bps at next meeting?',
    category: 'Politics',
    topic: 'Macro Economics',
    yesProbability: 41,
    noProbability: 59,
    volume: '$14.8M',
    volumeNumeric: 14800000,
    tradersCount: 3120,
    liquidity: '$5.6M',
    timeRemaining: '14d 6h',
    status: 'active',
    iconBg: 'bg-blue-50 text-blue-700 border border-blue-200',
    iconSymbol: '🏛',
    createdDate: 'Sep 24, 2026',
    resolutionDate: 'FOMC Decision Day',
    resolutionCriteria: 'Federal Open Market Committee official statement reducing federal funds target range by 50 basis points or more.',
    recentSparkline: [48, 45, 43, 39, 42, 41],
    theses: [
      {
        id: 't-10',
        author: 'rate_hawk',
        side: 'NO',
        summary: 'Non-farm payroll resilience and sticky core services CPI make an aggressive 50bps cut improbable; 25bps is consensus.',
        staked: '$1.2M',
        reactions: { insightful: 44, bullish: 10, fire: 18 },
        timeAgo: '6h ago'
      }
    ],
    recentTrades: [
      { id: 'tr-12', user: '0x99B...44D', type: 'NO', shares: 2000, price: 0.59, total: '$118,000', timeAgo: '11m ago' }
    ]
  },
  {
    id: 'm-openai-model',
    question: 'Will OpenAI release GPT-5 / Orion publicly before November?',
    category: 'Technology',
    topic: 'Artificial Intelligence',
    yesProbability: 38,
    noProbability: 62,
    volume: '$9.4M',
    volumeNumeric: 9400000,
    tradersCount: 2210,
    liquidity: '$3.7M',
    timeRemaining: '28d 0h',
    status: 'active',
    iconBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    iconSymbol: '🤖',
    createdDate: 'Oct 01, 2026',
    resolutionDate: 'Nov 01, 2026 00:00 UTC',
    resolutionCriteria: 'Public release with general access for Plus or API users of OpenAI next frontier model named GPT-5 or Orion.',
    recentSparkline: [44, 42, 40, 37, 39, 38],
    theses: [
      {
        id: 't-11',
        author: 'ai_watcher',
        side: 'NO',
        summary: 'Safety evaluations and red-teaming partner agreements extend compute testing timelines into December.',
        staked: '$620K',
        reactions: { insightful: 28, bullish: 5, fire: 9 },
        timeAgo: '4h ago'
      }
    ],
    recentTrades: [
      { id: 'tr-13', user: '0x33A...21F', type: 'NO', shares: 800, price: 0.62, total: '$49,600', timeAgo: '20m ago' }
    ]
  },
  {
    id: 'm-champions-league',
    question: 'Will Real Madrid advance to the Champions League semifinals?',
    category: 'Sports',
    topic: 'UEFA Champions League',
    yesProbability: 82,
    noProbability: 18,
    volume: '$6.5M',
    volumeNumeric: 6500000,
    tradersCount: 1650,
    liquidity: '$2.3M',
    timeRemaining: '19d 4h',
    status: 'active',
    iconBg: 'bg-amber-50 text-amber-700 border border-amber-200',
    iconSymbol: '🏆',
    createdDate: 'Sep 29, 2026',
    resolutionDate: 'Leg 2 Match Clock',
    resolutionCriteria: 'Official aggregate score result determined by UEFA match officials after regular time or extra time / penalties.',
    recentSparkline: [78, 79, 81, 80, 83, 82],
    theses: [
      {
        id: 't-12',
        author: 'bernabeu_boy',
        side: 'YES',
        summary: 'Squad depth and return of key center-backs from injury gives them massive aggregate advantage at home.',
        staked: '$500K',
        reactions: { insightful: 22, bullish: 35, fire: 14 },
        timeAgo: '8h ago'
      }
    ],
    recentTrades: [
      { id: 'tr-14', user: '0x55E...99D', type: 'YES', shares: 700, price: 0.82, total: '$57,400', timeAgo: '16m ago' }
    ]
  },
  {
    id: 'm-spacex-starship',
    question: 'Will SpaceX Starship Flight 6 catch the Super Heavy booster on first attempt?',
    category: 'Science',
    topic: 'Aerospace',
    yesProbability: 86,
    noProbability: 14,
    volume: '$4.9M',
    volumeNumeric: 4900000,
    tradersCount: 1280,
    liquidity: '$1.8M',
    timeRemaining: '16d 10h',
    status: 'active',
    iconBg: 'bg-slate-100 text-slate-800 border border-slate-300',
    iconSymbol: '🚀',
    createdDate: 'Sep 30, 2026',
    resolutionDate: 'Launch Event Day',
    resolutionCriteria: 'Successful Mechazilla tower chopstick catch of the Starship Super Heavy booster without structural explosion.',
    recentSparkline: [79, 82, 84, 85, 87, 86],
    theses: [
      {
        id: 't-13',
        author: 'orbital_mechanics',
        side: 'YES',
        summary: 'Flight 5 telemetry proved precision sub-meter guidance; flight 6 has updated aerodynamic grid-fin heat shielding.',
        staked: '$410K',
        reactions: { insightful: 33, bullish: 41, fire: 20 },
        timeAgo: '12h ago'
      }
    ],
    recentTrades: [
      { id: 'tr-15', user: '0x12A...44C', type: 'YES', shares: 500, price: 0.86, total: '$43,000', timeAgo: '25m ago' }
    ]
  },
  {
    id: 'm-nvidia-earnings',
    question: 'Will NVIDIA beat Wall Street consensus revenue by > 5%?',
    category: 'Business',
    topic: 'Equities & Semis',
    yesProbability: 69,
    noProbability: 31,
    volume: '$11.1M',
    volumeNumeric: 11100000,
    tradersCount: 2600,
    liquidity: '$4.2M',
    timeRemaining: '22d 2h',
    status: 'active',
    iconBg: 'bg-green-50 text-green-700 border border-green-200',
    iconSymbol: '📈',
    createdDate: 'Sep 26, 2026',
    resolutionDate: 'Earnings Call',
    resolutionCriteria: 'SEC 8-K filing revenue exceeding Bloomberg consensus estimate by strictly 5.00% or more.',
    recentSparkline: [62, 65, 68, 66, 71, 69],
    theses: [
      {
        id: 't-14',
        author: 'chip_cycle',
        side: 'YES',
        summary: 'Blackwell hyperscaler datacenter order backlogs are filled through 2027 with sovereign cloud capex increases.',
        staked: '$950K',
        reactions: { insightful: 40, bullish: 48, fire: 16 },
        timeAgo: '7h ago'
      }
    ],
    recentTrades: [
      { id: 'tr-16', user: '0x77F...11A', type: 'YES', shares: 900, price: 0.69, total: '$62,100', timeAgo: '18m ago' }
    ]
  },
  {
    id: 'm-gta6-trailer',
    question: 'Will Rockstar Games release GTA VI Trailer 2 before December 15?',
    category: 'Gaming',
    topic: 'Rockstar Games',
    yesProbability: 53,
    noProbability: 47,
    volume: '$3.2M',
    volumeNumeric: 3200000,
    tradersCount: 1180,
    liquidity: '$1.1M',
    timeRemaining: '41d 8h',
    status: 'active',
    iconBg: 'bg-amber-50 text-amber-800 border border-amber-300',
    iconSymbol: '🎮',
    createdDate: 'Oct 01, 2026',
    resolutionDate: 'Dec 15, 2026',
    resolutionCriteria: 'Official Rockstar Games YouTube channel public release of official Trailer 2 for Grand Theft Auto VI.',
    recentSparkline: [48, 50, 52, 55, 51, 53],
    theses: [
      {
        id: 't-15',
        author: 'gta_insider',
        side: 'YES',
        summary: 'Take-Two interactive quarterly earnings call historic cadence always drops major trailers one year post-reveal.',
        staked: '$220K',
        reactions: { insightful: 16, bullish: 29, fire: 11 },
        timeAgo: '10h ago'
      }
    ],
    recentTrades: [
      { id: 'tr-17', user: '0x88A...99C', type: 'YES', shares: 400, price: 0.53, total: '$21,200', timeAgo: '32m ago' }
    ]
  },
  {
    id: 'm-mrbeast-subscribers',
    question: 'Will MrBeast surpass 400 million YouTube subscribers this year?',
    category: 'Creators',
    topic: 'YouTube Creators',
    yesProbability: 61,
    noProbability: 39,
    volume: '$2.4M',
    volumeNumeric: 2400000,
    tradersCount: 880,
    liquidity: '$850K',
    timeRemaining: '58d 14h',
    status: 'active',
    iconBg: 'bg-red-50 text-red-600 border border-red-200',
    iconSymbol: '▶',
    createdDate: 'Oct 01, 2026',
    resolutionDate: 'Dec 31, 2026',
    resolutionCriteria: 'SocialBlade and official YouTube channel subscriber count reading 400M or above before Jan 01 00:00 UTC.',
    recentSparkline: [56, 58, 60, 62, 59, 61],
    theses: [
      {
        id: 't-16',
        author: 'creator_metrics',
        side: 'YES',
        summary: 'Global language dubbing channel mergers are consolidating subscriber growth at 6M net adds per month.',
        staked: '$180K',
        reactions: { insightful: 14, bullish: 20, fire: 6 },
        timeAgo: '14h ago'
      }
    ],
    recentTrades: [
      { id: 'tr-18', user: '0x44D...88A', type: 'YES', shares: 350, price: 0.61, total: '$21,350', timeAgo: '45m ago' }
    ]
  },
  {
    id: 'm-oil-80',
    question: 'Will Brent Crude Oil cross $85/barrel before month end?',
    category: 'World',
    topic: 'Commodities',
    yesProbability: 44,
    noProbability: 56,
    volume: '$5.8M',
    volumeNumeric: 5800000,
    tradersCount: 1410,
    liquidity: '$2.1M',
    timeRemaining: '12d 8h',
    status: 'active',
    iconBg: 'bg-stone-100 text-stone-800 border border-stone-300',
    iconSymbol: '🛢',
    createdDate: 'Sep 29, 2026',
    resolutionDate: 'Oct 31, 2026',
    resolutionCriteria: 'ICE Brent Crude front-month futures contract price printing ≥ $85.00/bbl at any point during regular market sessions.',
    recentSparkline: [38, 41, 45, 47, 43, 44],
    theses: [
      {
        id: 't-17',
        author: 'energy_trader',
        side: 'NO',
        summary: 'OPEC+ non-compliance and increasing supply from non-OPEC deepwater producers are suppressing upside breaks.',
        staked: '$390K',
        reactions: { insightful: 24, bullish: 5, fire: 7 },
        timeAgo: '9h ago'
      }
    ],
    recentTrades: [
      { id: 'tr-19', user: '0x99C...11B', type: 'NO', shares: 600, price: 0.56, total: '$33,600', timeAgo: '28m ago' }
    ]
  },
  {
    id: 'm-arsenal-chelsea',
    question: 'Will Premier League London Derby end in a draw?',
    category: 'Sports',
    topic: 'Premier League',
    yesProbability: 28,
    noProbability: 72,
    volume: '$4.1M',
    volumeNumeric: 4100000,
    tradersCount: 1120,
    liquidity: '$1.5M',
    timeRemaining: '2d 6h',
    status: 'active',
    iconBg: 'bg-red-50 text-red-700 border border-red-200',
    iconSymbol: '⚽',
    createdDate: 'Oct 02, 2026',
    resolutionDate: 'Full Time Whistle',
    resolutionCriteria: 'Official Premier League match final score ending with equal goals scored for both teams.',
    recentSparkline: [25, 27, 30, 29, 27, 28],
    theses: [
      {
        id: 't-18',
        author: 'london_footy',
        side: 'NO',
        summary: 'Both teams rank top-3 in transition speed and high-turnover counters; clean sheets are statistically rare.',
        staked: '$320K',
        reactions: { insightful: 18, bullish: 8, fire: 5 },
        timeAgo: '11h ago'
      }
    ],
    recentTrades: [
      { id: 'tr-20', user: '0x33B...55C', type: 'NO', shares: 800, price: 0.72, total: '$57,600', timeAgo: '19m ago' }
    ]
  },
  {
    id: 'm-fusion-breakeven',
    question: 'Will a private fusion energy firm announce Q > 2 net gain this year?',
    category: 'Science',
    topic: 'Clean Tech',
    yesProbability: 24,
    noProbability: 76,
    volume: '$2.7M',
    volumeNumeric: 2700000,
    tradersCount: 820,
    liquidity: '$900K',
    timeRemaining: '65d 0h',
    status: 'active',
    iconBg: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
    iconSymbol: '⚛',
    createdDate: 'Sep 27, 2026',
    resolutionDate: 'Dec 31, 2026',
    resolutionCriteria: 'Peer-reviewed paper or verified third-party laboratory confirmation of plasma energy gain Q strictly > 2.0.',
    recentSparkline: [20, 22, 25, 23, 26, 24],
    theses: [
      {
        id: 't-19',
        author: 'quantum_phys',
        side: 'NO',
        summary: 'High-temperature superconducting magnet stabilization trials are still in calibration cycles until early 2027.',
        staked: '$250K',
        reactions: { insightful: 29, bullish: 3, fire: 4 },
        timeAgo: '16h ago'
      }
    ],
    recentTrades: [
      { id: 'tr-21', user: '0x77E...33A', type: 'NO', shares: 500, price: 0.76, total: '$38,000', timeAgo: '50m ago' }
    ]
  },
  {
    id: 'm-us-tiktok-ban',
    question: 'Will TikTok remain accessible in US app stores by year end?',
    category: 'Politics',
    topic: 'US Regulation',
    yesProbability: 81,
    noProbability: 19,
    volume: '$8.9M',
    volumeNumeric: 8900000,
    tradersCount: 2150,
    liquidity: '$3.2M',
    timeRemaining: '59d 12h',
    status: 'active',
    iconBg: 'bg-black text-white border border-neutral-800',
    iconSymbol: '📱',
    createdDate: 'Sep 25, 2026',
    resolutionDate: 'Jan 01, 2027',
    resolutionCriteria: 'TikTok app remaining downloadable from both Apple App Store and Google Play Store for US IP addresses.',
    recentSparkline: [74, 76, 79, 83, 80, 81],
    theses: [
      {
        id: 't-20',
        author: 'dc_insider',
        side: 'YES',
        summary: 'Appeals court injunction and ongoing Oracle project Texas audit will delay any enforcement into mid next year.',
        staked: '$720K',
        reactions: { insightful: 36, bullish: 41, fire: 15 },
        timeAgo: '8h ago'
      }
    ],
    recentTrades: [
      { id: 'tr-22', user: '0x66B...22D', type: 'YES', shares: 900, price: 0.81, total: '$72,900', timeAgo: '22m ago' }
    ]
  },
  {
    id: 'm-amazon-drone',
    question: 'Will Amazon expand Prime Air drone deliveries to 5 new cities this quarter?',
    category: 'Business',
    topic: 'Logistics',
    yesProbability: 35,
    noProbability: 65,
    volume: '$1.9M',
    volumeNumeric: 1900000,
    tradersCount: 680,
    liquidity: '$720K',
    timeRemaining: '45d 0h',
    status: 'active',
    iconBg: 'bg-orange-50 text-orange-700 border border-orange-200',
    iconSymbol: '📦',
    createdDate: 'Oct 01, 2026',
    resolutionDate: 'Dec 31, 2026',
    resolutionCriteria: 'Official Amazon press release confirming live customer drone package drops operating in at least 5 new metropolitan areas.',
    recentSparkline: [31, 33, 37, 34, 36, 35],
    theses: [
      {
        id: 't-21',
        author: 'logistics_analyst',
        side: 'NO',
        summary: 'FAA Part 135 beyond-visual-line-of-sight waivers are taking 9+ months per municipal district.',
        staked: '$140K',
        reactions: { insightful: 16, bullish: 4, fire: 3 },
        timeAgo: '18h ago'
      }
    ],
    recentTrades: [
      { id: 'tr-23', user: '0x11C...88F', type: 'NO', shares: 450, price: 0.65, total: '$29,250', timeAgo: '40m ago' }
    ]
  }
];

export const BIGGEST_VOLUME_SIDEBAR = [
  { name: 'BTC > $120K (Fri)', volume: '$12.4M', change: '+18%', isPositive: true, symbol: '₿', iconImage: '/btc.png' },
  { name: 'ETH > $4K (10 PM)', volume: '$8.7M', change: '+12%', isPositive: true, symbol: 'Ξ', iconImage: '/eth.png' },
  { name: 'Team A Score (HT)', volume: '$5.2M', change: '+9%', isPositive: true, symbol: '⚽' },
  { name: 'TGE This Week', volume: '$3.6M', change: '+4%', isPositive: true, symbol: '✦' },
  { name: 'X Post 10K Views', volume: '$1.8M', change: '+6%', isPositive: true, symbol: '𝕏', iconImage: '/x-logo.svg' }
];

export const PEOPLE_YOU_FOLLOW: FollowedPerson[] = [
  {
    id: 'fol-1',
    username: 'TechBae',
    handle: '@techbae',
    avatarColor: 'bg-violet-100 text-violet-700 border border-violet-200',
    avatarImage: '/techbae.jpg',
    timePosted: '2h ago',
    isFollowing: true,
    question: 'Will SOL hit $250 before September ends?',
    category: 'Crypto',
    probability: 76,
    volume: '$2.1M'
  },
  {
    id: 'fol-2',
    username: 'DaraTrades',
    handle: '@daratrades',
    avatarColor: 'bg-sky-100 text-sky-700 border border-sky-200',
    avatarImage: '/dara.jpg',
    timePosted: '4h ago',
    isFollowing: true,
    question: 'Will Apple announce a new AI feature this week?',
    category: 'Technology',
    probability: 58,
    volume: '$1.3M'
  },
  {
    id: 'fol-3',
    username: 'MissCrypto',
    handle: '@misscrypto',
    avatarColor: 'bg-rose-100 text-rose-700 border border-rose-200',
    avatarImage: '/crypto.jpg',
    timePosted: '6h ago',
    isFollowing: true,
    question: 'Will this project announce its TGE this week?',
    category: 'Web3',
    probability: 34,
    volume: '$980K'
  }
];

export const LEADERBOARD_USERS: LeaderboardUser[] = [
  {
    rank: 1,
    username: 'satoshiduck',
    avatarColor: 'bg-amber-100 text-amber-800',
    predictionsCount: 142,
    winRate: 84,
    totalVolume: '$18.9M',
    profit: '+$4.2M',
    trackRecordBadge: 'Master Forecaster'
  },
  {
    rank: 2,
    username: 'ElenaV_Macro',
    avatarColor: 'bg-emerald-100 text-emerald-800',
    predictionsCount: 98,
    winRate: 79,
    totalVolume: '$14.2M',
    profit: '+$3.1M',
    trackRecordBadge: 'Central Bank Analyst'
  },
  {
    rank: 3,
    username: 'TechBae',
    avatarColor: 'bg-violet-100 text-violet-800',
    predictionsCount: 114,
    winRate: 77,
    totalVolume: '$11.5M',
    profit: '+$2.6M',
    trackRecordBadge: 'Alpha Scout'
  },
  {
    rank: 4,
    username: 'PitchTactics',
    avatarColor: 'bg-teal-100 text-teal-800',
    predictionsCount: 88,
    winRate: 74,
    totalVolume: '$8.7M',
    profit: '+$1.9M',
    trackRecordBadge: 'Sports Quant'
  },
  {
    rank: 5,
    username: 'DaraTrades',
    avatarColor: 'bg-sky-100 text-sky-800',
    predictionsCount: 65,
    winRate: 71,
    totalVolume: '$6.3M',
    profit: '+$1.4M',
    trackRecordBadge: 'Tech Analyst'
  }
];
