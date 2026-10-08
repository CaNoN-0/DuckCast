export type MarketCategory =
  | 'All'
  | 'Politics'
  | 'Crypto'
  | 'Sports'
  | 'Technology'
  | 'Business'
  | 'Culture'
  | 'World'
  | 'Science'
  | 'Gaming'
  | 'Entertainment'
  | 'Social';

export type MarketSortOption =
  | 'Trending'
  | 'Biggest Movers'
  | 'Highest Volume'
  | 'Ending Soon'
  | 'Newest'
  | 'Highest Probability';

export type MarketQuickFilter =
  | 'All Markets'
  | 'Trending'
  | 'Live'
  | 'Biggest Movers'
  | 'Most Volume'
  | 'Ending Soon'
  | 'Ending Today'
  | 'Ending This Week'
  | 'High Volume'
  | 'New';

export interface ThesisReaction {
  agree: number;
  fire: number;
  insightful: number;
}

export interface PredictionThesis {
  id: string;
  author: string;
  handle: string;
  side: 'YES' | 'NO';
  text: string;
  staked: string;
  timestamp: string;
  reactions: ThesisReaction;
  userReacted?: { [key: string]: boolean };
  likes?: number;
  repliesCount?: number;
}

export interface RecentTrade {
  id: string;
  user: string;
  side: 'YES' | 'NO';
  amount: string;
  shares: number;
  price: number; // in cents
  time: string;
  type?: 'buy' | 'sell' | 'prob_move';
  probMove?: string; // e.g. "61% → 66%"
}

export interface MarketTimelineEvent {
  id: string;
  time: string; // e.g. "NOW", "2h ago", "5h ago"
  title: string;
  description: string;
  type: 'probability' | 'trade' | 'created' | 'news' | 'resolution';
  badge?: string;
}

export interface MarketCommentReply {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  text: string;
  timestamp: string;
  likes: number;
  userLiked?: boolean;
}

export interface MarketComment {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  position?: 'YES' | 'NO';
  staked?: string;
  text: string;
  timestamp: string;
  likes: number;
  userLiked?: boolean;
  replies: MarketCommentReply[];
}

export interface ChartPoint {
  time: string;
  probability: number;
}

export type MarketTimeframe = '1H' | '6H' | '1D' | '1W' | 'ALL';

export interface PredictionMarket {
  id: string;
  question: string;
  category: MarketCategory;
  topic: string;
  shortLabel?: string; // e.g. "BTC $120K", "ETH $5K", "SOL $300"
  yesProbability: number;
  noProbability: number;
  yesPriceCents: number;
  noPriceCents: number;
  volume: string;
  volumeNumeric: number; // for sorting in USD
  traders: number;
  timeRemaining: string;
  timeMinutes: number; // for ending soon sort
  sparkline: number[]; // 8-10 points between 0 and 100
  change24h?: number; // percentage, e.g. +18.4, -9.8
  chartHistory: {
    '1H': ChartPoint[];
    '6H': ChartPoint[];
    '1D': ChartPoint[];
    '1W': ChartPoint[];
    'ALL': ChartPoint[];
    '24H'?: ChartPoint[];
    '7D'?: ChartPoint[];
    '30D'?: ChartPoint[];
  };
  isLive?: boolean;
  isTrending?: boolean;
  trendingDelta?: string; // e.g. "+3%"
  trendingFrom?: number;  // e.g. 72
  trendingTo?: number;    // e.g. 75
  isEndingToday?: boolean;
  isEndingThisWeek?: boolean;
  isHighVolume?: boolean;
  isNew?: boolean;
  resolutionDate: string;
  resolutionCriteria: string;
  source: string;
  liquidity: string;
  theses: PredictionThesis[];
  recentActivity: RecentTrade[];
  commentsCount: number;
  timeline?: MarketTimelineEvent[];
  commentsList?: MarketComment[];
  // Panta Protocol Architecture Metadata
  pantaMarketType?: 'standard' | 'breaking';
  pantaMarketPhase?: 'primary' | 'secondary' | 'resolving' | 'resolved';
  pantaFeePercent?: number; // 2.0% for primary, 1.5% for secondary
  disputeWindowEndsAt?: string;
  disputeStatus?: 'none' | 'disputed' | 'finalized';
  creatorAddress?: string;
  creatorRoyaltyPercent?: number;
  activeBattle?: PredictionBattle;
}

export interface UserPredictionActivity {
  id: string;
  username: string;
  handle: string;
  avatar: string;
  side: 'YES' | 'NO';
  probability: number;
  question: string;
  marketId: string;
  time: string;
  comment?: string;
  amount?: string;
}

export interface LeaderboardUser {
  rank: number;
  username: string;
  handle: string;
  avatar: string;
  accuracy: string;
  totalVolume: string;
  pnl: string;
  predictions: number;
  winStreak: number;
  badges: string[];
  isCurrentUser?: boolean;
}

export interface UserPosition {
  id: string;
  marketId: string;
  question: string;
  category: MarketCategory;
  outcome: 'YES' | 'NO';
  shares: number;
  avgPrice: number; // in cents or dollars
  currentPrice: number;
  invested: number; // in USD
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  timestamp: string;
}

export interface UserProfileData {
  username: string;
  handle: string;
  avatar: string;
  address: string;
  totalPredictions: number;
  accuracy: number;
  totalProfit: number;
  winRate: number;
  currentStreak: number;
  recentPredictions: {
    id: string;
    marketId: string;
    question: string;
    outcome: 'YES' | 'NO';
    amount: string;
    pnl: string;
    isWin?: boolean;
    status: 'Open' | 'Won' | 'Lost';
    timestamp: string;
  }[];
}

export interface PredictionBattle {
  id: string;
  marketId: string;
  marketQuestion: string;
  category: MarketCategory;
  userYes: {
    username: string;
    handle: string;
    avatar: string;
    stakedUsdc: number;
    entryProb: number;
    thesis: string;
    backingVotes: number;
  };
  userNo: {
    username: string;
    handle: string;
    avatar: string;
    stakedUsdc: number;
    entryProb: number;
    thesis: string;
    backingVotes: number;
  };
  totalBattlePotUsdc: number;
  status: 'active' | 'resolved';
  winnerSide?: 'YES' | 'NO';
  timeRemaining: string;
}

