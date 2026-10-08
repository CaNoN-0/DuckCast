import {
  PredictionMarket,
  UserPredictionActivity,
  LeaderboardUser,
  ChartPoint
} from '../types/market';

// Helper to generate chart history
function generateChartPoints(baseProb: number, volatility: number): {
  '1H': ChartPoint[];
  '6H': ChartPoint[];
  '1D': ChartPoint[];
  '1W': ChartPoint[];
  'ALL': ChartPoint[];
  '24H': ChartPoint[];
  '7D': ChartPoint[];
  '30D': ChartPoint[];
} {
  const gen = (count: number, stepLabel: (i: number) => string) => {
    const pts: ChartPoint[] = [];
    let cur = Math.max(8, Math.min(92, baseProb - (count * 0.3 * (Math.random() - 0.45))));
    for (let i = 0; i < count; i++) {
      const shift = (Math.random() - 0.48) * volatility;
      cur = Math.max(5, Math.min(95, cur + shift));
      pts.push({
        time: stepLabel(i),
        probability: Math.round(cur)
      });
    }
    // ensure last matches current
    if (pts.length > 0) {
      pts[pts.length - 1].probability = baseProb;
    }
    return pts;
  };

  const h1 = gen(12, (i) => `${(i + 1) * 5}m`);
  const h6 = gen(14, (i) => `${(i + 1) * 25}m`);
  const d1 = gen(16, (i) => `${(i + 1) * 1.5}h`);
  const w1 = gen(14, (i) => `Day ${i + 1}`);
  const all = gen(20, (i) => `T-${20 - i}d`);

  return {
    '1H': h1,
    '6H': h6,
    '1D': d1,
    '1W': w1,
    'ALL': all,
    '24H': d1,
    '7D': w1,
    '30D': all
  };
}

export const MOCK_MARKETS: PredictionMarket[] = [
  // CRYPTO 1 - Trending & Highest Volume
  {
    id: 'crypto-btc-120k',
    question: 'Will BTC move above $120K before Friday?',
    category: 'Crypto',
    topic: 'Bitcoin',
    yesProbability: 78,
    noProbability: 22,
    yesPriceCents: 78,
    noPriceCents: 22,
    volume: '$12.4M',
    volumeNumeric: 12400000,
    traders: 2481,
    timeRemaining: '2d 14h',
    timeMinutes: 3720,
    sparkline: [68, 70, 72, 71, 74, 76, 75, 78],
    chartHistory: generateChartPoints(78, 3.2),
    isTrending: true,
    trendingDelta: '+3%',
    trendingFrom: 75,
    trendingTo: 78,
    isHighVolume: true,
    isEndingThisWeek: true,
    resolutionDate: 'Oct 9, 2026, 23:59 UTC',
    resolutionCriteria: 'Resolves YES if spot BTC/USDT prints at or above $120,000.00 on Binance or Coinbase at any instant prior to expiration.',
    source: 'Binance & Coinbase Spot API',
    liquidity: '$4.8M',
    commentsCount: 142,
    theses: [
      {
        id: 'th-1',
        author: 'SatoshiDuck',
        handle: '@satoshiduck',
        side: 'YES',
        text: 'BTC has strong momentum and ETF inflows are increasing. Institutional OTC desks reported zero liquid inventory above $115k.',
        staked: '$24,500',
        timestamp: '35m ago',
        reactions: { agree: 184, fire: 92, insightful: 61 }
      },
      {
        id: 'th-2',
        author: 'MacroQuack',
        handle: '@macroquack',
        side: 'NO',
        text: 'CME options gamma wall sits heavily at $119,500. Friday options expiry is likely to pin spot below $120K before settlement.',
        staked: '$8,200',
        timestamp: '2h ago',
        reactions: { agree: 43, fire: 12, insightful: 28 }
      }
    ],
    recentActivity: [
      { id: 't-1', user: '0x8b2...a41', side: 'YES', amount: '$1,200', shares: 1538, price: 78, time: '2m ago' },
      { id: 't-2', user: '0x3f1...e99', side: 'YES', amount: '$4,500', shares: 5769, price: 78, time: '5m ago' },
      { id: 't-3', user: '0x7c9...12b', side: 'NO', amount: '$850', shares: 3863, price: 22, time: '12m ago' }
    ]
  },

  // SPORTS 1 - LIVE & High Volume
  {
    id: 'sports-team-a-halftime',
    question: 'Will Team A score before halftime?',
    category: 'Sports',
    topic: 'Premier League',
    yesProbability: 71,
    noProbability: 29,
    yesPriceCents: 71,
    noPriceCents: 29,
    volume: '$5.2M',
    volumeNumeric: 5200000,
    traders: 1420,
    timeRemaining: '1h 42m',
    timeMinutes: 102,
    sparkline: [58, 62, 65, 68, 66, 69, 70, 71],
    chartHistory: generateChartPoints(71, 4.5),
    isLive: true,
    isTrending: true,
    trendingDelta: '+4%',
    trendingFrom: 67,
    trendingTo: 71,
    isHighVolume: true,
    isEndingToday: true,
    resolutionDate: 'Tonight 20:45 UTC',
    resolutionCriteria: 'Resolves YES if Team A is awarded an official goal by the match referee prior to 45:00 + first half stoppage time.',
    source: 'Official League Match Centre & Opta Feed',
    liquidity: '$1.4M',
    commentsCount: 88,
    theses: [
      {
        id: 'th-3',
        author: 'PitchTactics',
        handle: '@pitch_tactics',
        side: 'YES',
        text: 'Team A is averaging 2.4 expected goals in the first 30 minutes in their last five home fixtures. High pressing line will force an early mistake.',
        staked: '$5,000',
        timestamp: '18m ago',
        reactions: { agree: 94, fire: 45, insightful: 32 }
      }
    ],
    recentActivity: [
      { id: 't-4', user: '0x11a...40f', side: 'YES', amount: '$2,000', shares: 2816, price: 71, time: '1m ago' },
      { id: 't-5', user: '0x94d...68c', side: 'NO', amount: '$500', shares: 1724, price: 29, time: '4m ago' }
    ]
  },

  // CRYPTO 2 - Ending Soon & High Volume
  {
    id: 'crypto-eth-4000',
    question: 'Will ETH stay above $4,000 by 10 PM?',
    category: 'Crypto',
    topic: 'Ethereum',
    yesProbability: 62,
    noProbability: 38,
    yesPriceCents: 62,
    noPriceCents: 38,
    volume: '$8.7M',
    volumeNumeric: 8700000,
    traders: 1840,
    timeRemaining: '11h 23m',
    timeMinutes: 683,
    sparkline: [54, 57, 59, 61, 60, 63, 61, 62],
    chartHistory: generateChartPoints(62, 3.8),
    isTrending: true,
    trendingDelta: '+2%',
    trendingFrom: 60,
    trendingTo: 62,
    isHighVolume: true,
    isEndingToday: true,
    resolutionDate: 'Today 22:00 UTC',
    resolutionCriteria: 'Resolves YES if Ethereum spot price on Chainlink decentralized oracle feeds >= $4,000.00 at exactly 22:00 UTC.',
    source: 'Chainlink Price Oracle (ETH / USD)',
    liquidity: '$2.9M',
    commentsCount: 96,
    theses: [
      {
        id: 'th-4',
        author: 'DefiDuck',
        handle: '@defiduck',
        side: 'YES',
        text: 'Layer 2 gas burn reached monthly high today and staking yields jumped to 4.2%. Strong buyer wall at $3,980.',
        staked: '$12,000',
        timestamp: '1h ago',
        reactions: { agree: 112, fire: 58, insightful: 40 }
      }
    ],
    recentActivity: [
      { id: 't-6', user: '0x55e...29a', side: 'YES', amount: '$3,100', shares: 5000, price: 62, time: '8m ago' }
    ]
  },

  // SOCIAL 1 - Ending Soon
  {
    id: 'social-x-post-10k',
    question: 'Will this X post reach 10K views?',
    category: 'Social',
    topic: 'Viral Metrics',
    yesProbability: 49,
    noProbability: 51,
    yesPriceCents: 49,
    noPriceCents: 51,
    volume: '$1.8M',
    volumeNumeric: 1800000,
    traders: 840,
    timeRemaining: '6h 17m',
    timeMinutes: 377,
    sparkline: [35, 40, 42, 45, 48, 50, 47, 49],
    chartHistory: generateChartPoints(49, 4.1),
    isTrending: false,
    isHighVolume: false,
    isEndingToday: true,
    resolutionDate: 'Today 18:00 UTC',
    resolutionCriteria: 'Resolves YES if the designated viral tweet public view counter displays 10,000 or greater before cutoff.',
    source: 'Public X API v2 Public Metrics',
    liquidity: '$620K',
    commentsCount: 34,
    theses: [
      {
        id: 'th-5',
        author: 'ViralHunter',
        handle: '@viral_hunter',
        side: 'NO',
        text: 'Algorithm saturation dropped the impressions rate after hour 2; retweet acceleration has clearly plateaued.',
        staked: '$1,500',
        timestamp: '3h ago',
        reactions: { agree: 52, fire: 14, insightful: 19 }
      }
    ],
    recentActivity: [
      { id: 't-7', user: '0x77d...89f', side: 'NO', amount: '$450', shares: 882, price: 51, time: '14m ago' }
    ]
  },

  // CRYPTO 3 - High Volume
  {
    id: 'crypto-project-tge',
    question: 'Will this crypto project announce its TGE this week?',
    category: 'Crypto',
    topic: 'Token Launches',
    yesProbability: 34,
    noProbability: 66,
    yesPriceCents: 34,
    noPriceCents: 66,
    volume: '$3.6M',
    volumeNumeric: 3600000,
    traders: 940,
    timeRemaining: '3d 6h',
    timeMinutes: 4680,
    sparkline: [25, 28, 30, 32, 35, 33, 31, 34],
    chartHistory: generateChartPoints(34, 3.5),
    isTrending: true,
    trendingDelta: '+3%',
    trendingFrom: 31,
    trendingTo: 34,
    isHighVolume: true,
    isEndingThisWeek: true,
    resolutionDate: 'Sunday 23:59 UTC',
    resolutionCriteria: 'Resolves YES if official team verified X account announces a concrete date for Token Generation Event (TGE).',
    source: 'Official Verified Team Announcement',
    liquidity: '$1.1M',
    commentsCount: 72,
    theses: [
      {
        id: 'th-6',
        author: 'MissCrypto',
        handle: '@misscrypto',
        side: 'NO',
        text: 'Smart contract audit report GitHub commit showed two unresolved findings awaiting re-test. Likely pushing into Q4.',
        staked: '$4,500',
        timestamp: '5h ago',
        reactions: { agree: 89, fire: 31, insightful: 67 }
      }
    ],
    recentActivity: [
      { id: 't-8', user: '0x21c...6b8', side: 'NO', amount: '$1,000', shares: 1515, price: 66, time: '11m ago' }
    ]
  },

  // TECHNOLOGY 1
  {
    id: 'tech-apple-ai-feature',
    question: 'Will Apple announce a new AI feature this week?',
    category: 'Technology',
    topic: 'Apple Intelligence',
    yesProbability: 58,
    noProbability: 42,
    yesPriceCents: 58,
    noPriceCents: 42,
    volume: '$4.3M',
    volumeNumeric: 4300000,
    traders: 1510,
    timeRemaining: '3d 12h',
    timeMinutes: 5040,
    sparkline: [48, 50, 52, 55, 54, 57, 56, 58],
    chartHistory: generateChartPoints(58, 2.9),
    isTrending: true,
    trendingDelta: '+4%',
    trendingFrom: 54,
    trendingTo: 58,
    isHighVolume: true,
    isEndingThisWeek: true,
    resolutionDate: 'Friday 17:00 PT',
    resolutionCriteria: 'Resolves YES if Apple issues an official press release or keynote detailing a new consumer AI feature in iOS/macOS.',
    source: 'Apple Newsroom & Developer Portal',
    liquidity: '$1.8M',
    commentsCount: 65,
    theses: [
      {
        id: 'th-7',
        author: 'DaraTrades',
        handle: '@daratrades',
        side: 'YES',
        text: 'Supply chain leaks indicate Siri LLM cloud integration beta scheduled for developer seed 3 release this Wednesday.',
        staked: '$6,000',
        timestamp: '4h ago',
        reactions: { agree: 73, fire: 29, insightful: 51 }
      }
    ],
    recentActivity: [
      { id: 't-9', user: '0x33b...99e', side: 'YES', amount: '$750', shares: 1293, price: 58, time: '19m ago' }
    ]
  },

  // TECHNOLOGY 2
  {
    id: 'tech-openai-new-model',
    question: 'Will OpenAI release a new model this month?',
    category: 'Technology',
    topic: 'Artificial Intelligence',
    yesProbability: 81,
    noProbability: 19,
    yesPriceCents: 81,
    noPriceCents: 19,
    volume: '$7.4M',
    volumeNumeric: 7400000,
    traders: 2190,
    timeRemaining: '14d 9h',
    timeMinutes: 20700,
    sparkline: [70, 72, 75, 76, 78, 80, 79, 81],
    chartHistory: generateChartPoints(81, 2.2),
    isTrending: true,
    trendingDelta: '+3%',
    trendingFrom: 78,
    trendingTo: 81,
    isHighVolume: true,
    resolutionDate: 'End of Current Month 23:59 PT',
    resolutionCriteria: 'Resolves YES if OpenAI officially rolls out a new flagship or reasoning model on platform.openai.com or ChatGPT.',
    source: 'OpenAI Official Blog & Documentation',
    liquidity: '$2.6M',
    commentsCount: 118,
    theses: [
      {
        id: 'th-8',
        author: 'NeuralPond',
        handle: '@neuralpond',
        side: 'YES',
        text: 'Sam Altman teased major reasoning benchmarks at DevDay fringe meetup, and red-teaming embargo expires this week.',
        staked: '$15,000',
        timestamp: '6h ago',
        reactions: { agree: 142, fire: 80, insightful: 65 }
      }
    ],
    recentActivity: [
      { id: 't-10', user: '0x88f...1a2', side: 'YES', amount: '$2,500', shares: 3086, price: 81, time: '3m ago' }
    ]
  },

  // CRYPTO 4
  {
    id: 'crypto-sol-250',
    question: 'Will Solana reach $250 before the end of the month?',
    category: 'Crypto',
    topic: 'Solana',
    yesProbability: 76,
    noProbability: 24,
    yesPriceCents: 76,
    noPriceCents: 24,
    volume: '$4.9M',
    volumeNumeric: 4900000,
    traders: 1320,
    timeRemaining: '18d 6h',
    timeMinutes: 26280,
    sparkline: [62, 65, 69, 71, 74, 73, 75, 76],
    chartHistory: generateChartPoints(76, 3.4),
    isTrending: true,
    trendingDelta: '+5%',
    trendingFrom: 71,
    trendingTo: 76,
    isHighVolume: true,
    resolutionDate: 'End of Month 23:59 UTC',
    resolutionCriteria: 'Resolves YES if SOL/USDT trades at or above $250.00 on Binance spot before month end.',
    source: 'Binance Spot Index',
    liquidity: '$1.7M',
    commentsCount: 84,
    theses: [
      {
        id: 'th-9',
        author: 'TechBae',
        handle: '@techbae',
        side: 'YES',
        text: 'DEX volume on Solana continues to flip Ethereum mainnet on weekly aggregates. Firedancer testnet throughput hits record.',
        staked: '$8,400',
        timestamp: '2h ago',
        reactions: { agree: 165, fire: 89, insightful: 52 }
      }
    ],
    recentActivity: [
      { id: 't-11', user: '0x62a...3c1', side: 'YES', amount: '$1,800', shares: 2368, price: 76, time: '7m ago' }
    ]
  },

  // CRYPTO 5
  {
    id: 'crypto-etf-inflows-1b',
    question: 'Will Bitcoin ETF inflows exceed $1B this week?',
    category: 'Crypto',
    topic: 'ETF Flows',
    yesProbability: 83,
    noProbability: 17,
    yesPriceCents: 83,
    noPriceCents: 17,
    volume: '$6.8M',
    volumeNumeric: 6800000,
    traders: 1940,
    timeRemaining: '4d 8h',
    timeMinutes: 6240,
    sparkline: [74, 76, 78, 80, 81, 82, 81, 83],
    chartHistory: generateChartPoints(83, 2.1),
    isTrending: true,
    trendingDelta: '+3%',
    trendingFrom: 80,
    trendingTo: 83,
    isHighVolume: true,
    isEndingThisWeek: true,
    resolutionDate: 'Friday 21:00 EST',
    resolutionCriteria: 'Resolves YES if Farside Investors aggregate net spot Bitcoin ETF weekly inflows print > $1,000,000,000.',
    source: 'Farside Investors Verified ETF Flow Table',
    liquidity: '$2.3M',
    commentsCount: 57,
    theses: [
      {
        id: 'th-10',
        author: 'InstituDuck',
        handle: '@instituduck',
        side: 'YES',
        text: 'BlackRock IBIT alone took in $420M on Monday. Two more days of baseline inflows seals this easily.',
        staked: '$10,000',
        timestamp: '1h ago',
        reactions: { agree: 98, fire: 42, insightful: 36 }
      }
    ],
    recentActivity: [
      { id: 't-12', user: '0x99c...52e', side: 'YES', amount: '$5,000', shares: 6024, price: 83, time: '15m ago' }
    ]
  },

  // SPORTS 2 - LIVE
  {
    id: 'sports-team-b-win',
    question: 'Will Team B win tonight?',
    category: 'Sports',
    topic: 'Basketball',
    yesProbability: 48,
    noProbability: 52,
    yesPriceCents: 48,
    noPriceCents: 52,
    volume: '$3.1M',
    volumeNumeric: 3100000,
    traders: 890,
    timeRemaining: '4h 15m',
    timeMinutes: 255,
    sparkline: [52, 50, 49, 47, 46, 48, 49, 48],
    chartHistory: generateChartPoints(48, 3.6),
    isLive: true,
    isEndingToday: true,
    resolutionDate: 'Tonight 23:30 EST',
    resolutionCriteria: 'Resolves YES if Team B wins the contest including overtime periods according to official box score.',
    source: 'NBA Official Box Score',
    liquidity: '$950K',
    commentsCount: 41,
    theses: [
      {
        id: 'th-11',
        author: 'CourtSide',
        handle: '@courtside',
        side: 'NO',
        text: 'Starting point guard is listed as questionable with hamstring tightness. Value is on the away side.',
        staked: '$2,200',
        timestamp: '45m ago',
        reactions: { agree: 38, fire: 15, insightful: 20 }
      }
    ],
    recentActivity: [
      { id: 't-13', user: '0x12a...77b', side: 'NO', amount: '$600', shares: 1153, price: 52, time: '6m ago' }
    ]
  },

  // SPORTS 3 - LIVE & Ending Soon
  {
    id: 'sports-goals-2-5',
    question: 'Will the match have more than 2.5 goals?',
    category: 'Sports',
    topic: 'Champions League',
    yesProbability: 64,
    noProbability: 36,
    yesPriceCents: 64,
    noPriceCents: 36,
    volume: '$2.7M',
    volumeNumeric: 2700000,
    traders: 760,
    timeRemaining: '2h 18m',
    timeMinutes: 138,
    sparkline: [55, 58, 60, 62, 61, 63, 62, 64],
    chartHistory: generateChartPoints(64, 4.0),
    isLive: true,
    isEndingToday: true,
    resolutionDate: 'Tonight 22:00 UTC',
    resolutionCriteria: 'Resolves YES if total combined regular time score ends with 3 or more goals.',
    source: 'UEFA Official Match Scoreboard',
    liquidity: '$820K',
    commentsCount: 29,
    theses: [
      {
        id: 'th-12',
        author: 'StrikerQuack',
        handle: '@strikerquack',
        side: 'YES',
        text: 'Both teams are playing ultra-aggressive high backlines with defensive regulars rested.',
        staked: '$3,000',
        timestamp: '1h ago',
        reactions: { agree: 54, fire: 22, insightful: 18 }
      }
    ],
    recentActivity: [
      { id: 't-14', user: '0x44c...91a', side: 'YES', amount: '$1,200', shares: 1875, price: 64, time: '9m ago' }
    ]
  },

  // SPORTS 4 - Ending Soon
  {
    id: 'sports-player-x-score',
    question: 'Will Player X score?',
    category: 'Sports',
    topic: 'Individual Props',
    yesProbability: 55,
    noProbability: 45,
    yesPriceCents: 55,
    noPriceCents: 45,
    volume: '$1.9M',
    volumeNumeric: 1900000,
    traders: 610,
    timeRemaining: '42m',
    timeMinutes: 42,
    sparkline: [46, 48, 50, 52, 54, 53, 56, 55],
    chartHistory: generateChartPoints(55, 3.8),
    isLive: true,
    isEndingToday: true,
    resolutionDate: 'Tonight 21:30 UTC',
    resolutionCriteria: 'Resolves YES if Player X is credited with an official goal in regulation or extra time.',
    source: 'Opta Sports Official Player Stats',
    liquidity: '$540K',
    commentsCount: 33,
    theses: [
      {
        id: 'th-13',
        author: 'GoldenBoot',
        handle: '@goldenboot',
        side: 'YES',
        text: 'He takes all penalties and has hit the woodwork twice in the last 20 minutes.',
        staked: '$1,800',
        timestamp: '25m ago',
        reactions: { agree: 41, fire: 19, insightful: 14 }
      }
    ],
    recentActivity: [
      { id: 't-15', user: '0x71e...33b', side: 'YES', amount: '$350', shares: 636, price: 55, time: '2m ago' }
    ]
  },

  // TECHNOLOGY 3
  {
    id: 'tech-major-ai-announcement',
    question: 'Will a major AI company announce a new product?',
    category: 'Technology',
    topic: 'Generative AI',
    yesProbability: 73,
    noProbability: 27,
    yesPriceCents: 73,
    noPriceCents: 27,
    volume: '$3.8M',
    volumeNumeric: 3800000,
    traders: 1120,
    timeRemaining: '5d 4h',
    timeMinutes: 7440,
    sparkline: [62, 65, 68, 70, 71, 72, 71, 73],
    chartHistory: generateChartPoints(73, 2.7),
    isTrending: false,
    isEndingThisWeek: true,
    resolutionDate: 'Sunday 23:59 UTC',
    resolutionCriteria: 'Resolves YES if Anthropic, Google, Meta, or OpenAI publicly releases a new AI model or consumer product tier.',
    source: 'Official Press Releases from designated tech companies',
    liquidity: '$1.2M',
    commentsCount: 52,
    theses: [
      {
        id: 'th-14',
        author: 'TechPond',
        handle: '@techpond',
        side: 'YES',
        text: 'Multiple keynote events are scheduled across California tech summits this Thursday.',
        staked: '$4,200',
        timestamp: '3h ago',
        reactions: { agree: 66, fire: 21, insightful: 34 }
      }
    ],
    recentActivity: [
      { id: 't-16', user: '0x88c...77a', side: 'YES', amount: '$900', shares: 1232, price: 73, time: '22m ago' }
    ]
  },

  // TECHNOLOGY 4
  {
    id: 'tech-startup-100k-users',
    question: 'Will this startup reach 100K users?',
    category: 'Technology',
    topic: 'Growth Metrics',
    yesProbability: 39,
    noProbability: 61,
    yesPriceCents: 39,
    noPriceCents: 61,
    volume: '$890K',
    volumeNumeric: 890000,
    traders: 480,
    timeRemaining: '9d 18h',
    timeMinutes: 14040,
    sparkline: [30, 32, 35, 36, 38, 40, 38, 39],
    chartHistory: generateChartPoints(39, 3.2),
    isNew: true,
    resolutionDate: 'End of Next Week',
    resolutionCriteria: 'Resolves YES if verified public user milestone is published with verifiable analytics certificate.',
    source: 'Founder public dashboard screenshot + Stripe/PostHog proof',
    liquidity: '$310K',
    commentsCount: 19,
    theses: [
      {
        id: 'th-15',
        author: 'SeedDuck',
        handle: '@seedduck',
        side: 'NO',
        text: 'Product Hunt traffic had a sharp dropoff by Day 3. Without paid ads, crossing 100K in under two weeks is improbable.',
        staked: '$2,000',
        timestamp: '8h ago',
        reactions: { agree: 45, fire: 12, insightful: 38 }
      }
    ],
    recentActivity: [
      { id: 't-17', user: '0x55b...11c', side: 'NO', amount: '$400', shares: 655, price: 61, time: '35m ago' }
    ]
  },

  // SOCIAL 2
  {
    id: 'social-creator-1m-followers',
    question: 'Will this creator reach 1M followers?',
    category: 'Social',
    topic: 'YouTube / X',
    yesProbability: 66,
    noProbability: 34,
    yesPriceCents: 66,
    noPriceCents: 34,
    volume: '$1.2M',
    volumeNumeric: 1200000,
    traders: 530,
    timeRemaining: '5d 2h',
    timeMinutes: 7320,
    sparkline: [54, 57, 60, 62, 65, 64, 67, 66],
    chartHistory: generateChartPoints(66, 2.5),
    isEndingThisWeek: true,
    resolutionDate: 'Saturday 23:59 UTC',
    resolutionCriteria: 'Resolves YES if channel subscriber counter hits or passes 1,000,000 before deadline.',
    source: 'SocialBlade & YouTube Public API',
    liquidity: '$430K',
    commentsCount: 27,
    theses: [
      {
        id: 'th-16',
        author: 'SubTracker',
        handle: '@subtracker',
        side: 'YES',
        text: 'Gaining 18k subscribers daily after viral podcast appearance. Pacing to cross 1M by Friday morning.',
        staked: '$3,500',
        timestamp: '5h ago',
        reactions: { agree: 59, fire: 28, insightful: 22 }
      }
    ],
    recentActivity: [
      { id: 't-18', user: '0x99a...44d', side: 'YES', amount: '$800', shares: 1212, price: 66, time: '17m ago' }
    ]
  },

  // SOCIAL 3
  {
    id: 'social-account-post-project',
    question: 'Will this account post about the project this week?',
    category: 'Social',
    topic: 'Crypto Influencers',
    yesProbability: 44,
    noProbability: 56,
    yesPriceCents: 44,
    noPriceCents: 56,
    volume: '$920K',
    volumeNumeric: 920000,
    traders: 390,
    timeRemaining: '4d 11h',
    timeMinutes: 6420,
    sparkline: [40, 42, 45, 43, 46, 45, 43, 44],
    chartHistory: generateChartPoints(44, 3.1),
    isEndingThisWeek: true,
    resolutionDate: 'Sunday 12:00 UTC',
    resolutionCriteria: 'Resolves YES if designated influencer account mentions the project ticker or name in an organic post.',
    source: 'X Platform public feed verification',
    liquidity: '$320K',
    commentsCount: 22,
    theses: [
      {
        id: 'th-17',
        author: 'DegenFeed',
        handle: '@degenfeed',
        side: 'NO',
        text: 'They explicitly stated they are taking a 10-day detox trip to Bali without phone access.',
        staked: '$1,200',
        timestamp: '7h ago',
        reactions: { agree: 33, fire: 14, insightful: 19 }
      }
    ],
    recentActivity: [
      { id: 't-19', user: '0x32c...88f', side: 'NO', amount: '$250', shares: 446, price: 56, time: '41m ago' }
    ]
  },

  // BUSINESS 1
  {
    id: 'business-earnings-above-expectations',
    question: 'Will Company X announce earnings above expectations?',
    category: 'Business',
    topic: 'Q3 Earnings',
    yesProbability: 67,
    noProbability: 33,
    yesPriceCents: 67,
    noPriceCents: 33,
    volume: '$5.8M',
    volumeNumeric: 5800000,
    traders: 1670,
    timeRemaining: '2d 8h',
    timeMinutes: 3360,
    sparkline: [58, 60, 62, 64, 65, 66, 68, 67],
    chartHistory: generateChartPoints(67, 2.4),
    isTrending: true,
    trendingDelta: '+3%',
    trendingFrom: 64,
    trendingTo: 67,
    isHighVolume: true,
    isEndingThisWeek: true,
    resolutionDate: 'Thursday 16:05 EST',
    resolutionCriteria: 'Resolves YES if consensus EPS reported by Bloomberg/Refinitiv is beaten by at least 1 cent.',
    source: 'SEC 10-Q Filing & Bloomberg Consensus',
    liquidity: '$1.9M',
    commentsCount: 68,
    theses: [
      {
        id: 'th-18',
        author: 'AlphaDuck',
        handle: '@alphaduck',
        side: 'YES',
        text: 'Enterprise cloud renewals increased 28% YoY based on channel checks. Guidance will also be raised.',
        staked: '$11,000',
        timestamp: '3h ago',
        reactions: { agree: 82, fire: 39, insightful: 55 }
      }
    ],
    recentActivity: [
      { id: 't-20', user: '0x66d...21b', side: 'YES', amount: '$2,400', shares: 3582, price: 67, time: '12m ago' }
    ]
  },

  // BUSINESS 2
  {
    id: 'business-crypto-firms-revenue',
    question: 'Will Bitcoin related companies increase revenue this quarter?',
    category: 'Business',
    topic: 'Fintech & Mining',
    yesProbability: 75,
    noProbability: 25,
    yesPriceCents: 75,
    noPriceCents: 25,
    volume: '$4.1M',
    volumeNumeric: 4100000,
    traders: 1180,
    timeRemaining: '22d 4h',
    timeMinutes: 31920,
    sparkline: [68, 70, 71, 73, 72, 74, 76, 75],
    chartHistory: generateChartPoints(75, 2.0),
    isHighVolume: true,
    resolutionDate: 'Quarterly Filing Cycle End',
    resolutionCriteria: 'Resolves YES if aggregate revenue of top 5 public crypto-native firms grows >= 15% sequentially.',
    source: 'Public SEC filings aggregate',
    liquidity: '$1.4M',
    commentsCount: 45,
    theses: [
      {
        id: 'th-19',
        author: 'LedgerLens',
        handle: '@ledgerlens',
        side: 'YES',
        text: 'Trading fee revenues on major exchanges expanded over 40% with Bitcoin setting all time highs.',
        staked: '$7,500',
        timestamp: '6h ago',
        reactions: { agree: 71, fire: 33, insightful: 46 }
      }
    ],
    recentActivity: [
      { id: 't-21', user: '0x14f...99d', side: 'YES', amount: '$1,500', shares: 2000, price: 75, time: '18m ago' }
    ]
  },

  // BUSINESS 3
  {
    id: 'business-major-partnership',
    question: 'Will this company announce a major partnership?',
    category: 'Business',
    topic: 'Strategic Deals',
    yesProbability: 52,
    noProbability: 48,
    yesPriceCents: 52,
    noPriceCents: 48,
    volume: '$2.3M',
    volumeNumeric: 2300000,
    traders: 710,
    timeRemaining: '6d 14h',
    timeMinutes: 9480,
    sparkline: [45, 47, 49, 50, 52, 51, 53, 52],
    chartHistory: generateChartPoints(52, 2.8),
    isEndingThisWeek: true,
    resolutionDate: 'Next Monday 09:00 EST',
    resolutionCriteria: 'Resolves YES if an official commercial partnership is announced with a Fortune 500 entity.',
    source: 'PR Newswire / Business Wire press release',
    liquidity: '$780K',
    commentsCount: 31,
    theses: [
      {
        id: 'th-20',
        author: 'DealMakerDuck',
        handle: '@dealmakerduck',
        side: 'YES',
        text: 'Rumors of enterprise deployment integration with AWS Marketplace have been confirmed by three independent sources.',
        staked: '$3,800',
        timestamp: '4h ago',
        reactions: { agree: 49, fire: 18, insightful: 31 }
      }
    ],
    recentActivity: [
      { id: 't-22', user: '0x88e...33f', side: 'YES', amount: '$600', shares: 1153, price: 52, time: '29m ago' }
    ]
  },

  // CULTURE 1
  {
    id: 'culture-movie-open-100m',
    question: 'Will the movie open above $100M?',
    category: 'Culture',
    topic: 'Box Office',
    yesProbability: 63,
    noProbability: 37,
    yesPriceCents: 63,
    noPriceCents: 37,
    volume: '$3.4M',
    volumeNumeric: 3400000,
    traders: 1040,
    timeRemaining: '4d 20h',
    timeMinutes: 6960,
    sparkline: [52, 55, 57, 59, 61, 64, 62, 63],
    chartHistory: generateChartPoints(63, 2.9),
    isHighVolume: true,
    isEndingThisWeek: true,
    resolutionDate: 'Sunday Box Office Mojo Update',
    resolutionCriteria: 'Resolves YES if domestic opening weekend gross exceeds $100,000,000.00.',
    source: 'Box Office Mojo / Deadline Hollywood official tally',
    liquidity: '$1.1M',
    commentsCount: 44,
    theses: [
      {
        id: 'th-21',
        author: 'CineDuck',
        handle: '@cineduck',
        side: 'YES',
        text: 'Presales pacing 14% ahead of the last installment with glowing early audience exit scores.',
        staked: '$4,600',
        timestamp: '5h ago',
        reactions: { agree: 63, fire: 27, insightful: 35 }
      }
    ],
    recentActivity: [
      { id: 't-23', user: '0x45a...12c', side: 'YES', amount: '$1,100', shares: 1746, price: 63, time: '21m ago' }
    ]
  },

  // CULTURE 2
  {
    id: 'culture-artist-album-month',
    question: 'Will the artist release a new album this month?',
    category: 'Culture',
    topic: 'Music Releases',
    yesProbability: 29,
    noProbability: 71,
    yesPriceCents: 29,
    noPriceCents: 71,
    volume: '$1.6M',
    volumeNumeric: 1600000,
    traders: 590,
    timeRemaining: '16d 7h',
    timeMinutes: 23460,
    sparkline: [22, 24, 26, 28, 30, 29, 28, 29],
    chartHistory: generateChartPoints(29, 3.4),
    resolutionDate: 'Month End 23:59 UTC',
    resolutionCriteria: 'Resolves YES if a full LP with >= 8 original tracks is released on Apple Music or Spotify.',
    source: 'Apple Music / Spotify Catalog API',
    liquidity: '$520K',
    commentsCount: 26,
    theses: [
      {
        id: 'th-22',
        author: 'VinylDuck',
        handle: '@vinylduck',
        side: 'NO',
        text: 'Mixing engineer confirmed in an interview yesterday that master tracks are still being finalized in London.',
        staked: '$2,100',
        timestamp: '9h ago',
        reactions: { agree: 51, fire: 16, insightful: 28 }
      }
    ],
    recentActivity: [
      { id: 't-24', user: '0x77b...66a', side: 'NO', amount: '$700', shares: 985, price: 71, time: '34m ago' }
    ]
  },

  // CULTURE 3
  {
    id: 'culture-show-return-season',
    question: 'Will the show return for another season?',
    category: 'Culture',
    topic: 'Streaming Renewal',
    yesProbability: 84,
    noProbability: 16,
    yesPriceCents: 84,
    noPriceCents: 16,
    volume: '$2.1M',
    volumeNumeric: 2100000,
    traders: 820,
    timeRemaining: '12d 15h',
    timeMinutes: 18180,
    sparkline: [75, 78, 80, 81, 83, 85, 83, 84],
    chartHistory: generateChartPoints(84, 1.8),
    resolutionDate: 'End of Quarter',
    resolutionCriteria: 'Resolves YES if streaming network or Variety confirms an official season renewal.',
    source: 'Variety / The Hollywood Reporter trade announcement',
    liquidity: '$790K',
    commentsCount: 39,
    theses: [
      {
        id: 'th-23',
        author: 'BingeWatcher',
        handle: '@bingewatcher',
        side: 'YES',
        text: 'Viewership charts showed over 400M hours streamed in the first 28 days with 92% completion rate.',
        staked: '$5,000',
        timestamp: '8h ago',
        reactions: { agree: 88, fire: 34, insightful: 42 }
      }
    ],
    recentActivity: [
      { id: 't-25', user: '0x22d...91c', side: 'YES', amount: '$1,300', shares: 1547, price: 84, time: '13m ago' }
    ]
  },

  // POLITICS 1
  {
    id: 'politics-energy-bill-senate',
    question: 'Will the major energy bill pass the Senate vote this month?',
    category: 'Politics',
    topic: 'Legislation',
    yesProbability: 54,
    noProbability: 46,
    yesPriceCents: 54,
    noPriceCents: 46,
    volume: '$6.2M',
    volumeNumeric: 6200000,
    traders: 1880,
    timeRemaining: '11d 5h',
    timeMinutes: 16140,
    sparkline: [48, 50, 52, 53, 55, 54, 53, 54],
    chartHistory: generateChartPoints(54, 2.6),
    isHighVolume: true,
    resolutionDate: 'End of Month 23:59 EST',
    resolutionCriteria: 'Resolves YES if bill receives affirmative majority floor vote in the US Senate.',
    source: 'Congress.gov official roll call record',
    liquidity: '$2.1M',
    commentsCount: 79,
    theses: [
      {
        id: 'th-24',
        author: 'CapitolDuck',
        handle: '@capitolduck',
        side: 'YES',
        text: 'Bipartisan compromise caucus secured 4 key swing votes yesterday after permitting amendments were accepted.',
        staked: '$9,200',
        timestamp: '4h ago',
        reactions: { agree: 92, fire: 38, insightful: 61 }
      }
    ],
    recentActivity: [
      { id: 't-26', user: '0x90a...33e', side: 'YES', amount: '$3,200', shares: 5925, price: 54, time: '16m ago' }
    ]
  },

  // SCIENCE 1
  {
    id: 'science-lunar-landing-date',
    question: 'Will space exploration agency confirm the lunar landing date?',
    category: 'Science',
    topic: 'Space Exploration',
    yesProbability: 70,
    noProbability: 30,
    yesPriceCents: 70,
    noPriceCents: 30,
    volume: '$2.8M',
    volumeNumeric: 2800000,
    traders: 910,
    timeRemaining: '8d 19h',
    timeMinutes: 12660,
    sparkline: [62, 64, 66, 68, 69, 71, 70, 70],
    chartHistory: generateChartPoints(70, 2.3),
    resolutionDate: 'Next Week Friday 18:00 UTC',
    resolutionCriteria: 'Resolves YES if official press conference announces a targeted landing window for the mission.',
    source: 'Official Agency Briefing Transcript',
    liquidity: '$890K',
    commentsCount: 37,
    theses: [
      {
        id: 'th-25',
        author: 'CosmoDuck',
        handle: '@cosmoduck',
        side: 'YES',
        text: 'Hardware flight readiness review concluded with zero launch-critical flags.',
        staked: '$4,100',
        timestamp: '6h ago',
        reactions: { agree: 64, fire: 25, insightful: 41 }
      }
    ],
    recentActivity: [
      { id: 't-27', user: '0x33e...77c', side: 'YES', amount: '$850', shares: 1214, price: 70, time: '26m ago' }
    ]
  },

  // GAMING 1
  {
    id: 'gaming-open-world-rpg-launch',
    question: 'Will the new open-world RPG launch on steam before Q4?',
    category: 'Gaming',
    topic: 'PC Gaming',
    yesProbability: 77,
    noProbability: 23,
    yesPriceCents: 77,
    noPriceCents: 23,
    volume: '$1.9M',
    volumeNumeric: 1900000,
    traders: 760,
    timeRemaining: '15d 10h',
    timeMinutes: 22200,
    sparkline: [68, 70, 72, 74, 76, 78, 76, 77],
    chartHistory: generateChartPoints(77, 2.5),
    resolutionDate: 'End of Month',
    resolutionCriteria: 'Resolves YES if game is officially playable for general purchasers on Steam before Q4 start.',
    source: 'Steam Store & Valve Database',
    liquidity: '$670K',
    commentsCount: 31,
    theses: [
      {
        id: 'th-26',
        author: 'QuestMaster',
        handle: '@questmaster',
        side: 'YES',
        text: 'Pre-load files were deployed to Steam CDN servers yesterday morning, confirming readiness.',
        staked: '$3,200',
        timestamp: '7h ago',
        reactions: { agree: 58, fire: 29, insightful: 31 }
      }
    ],
    recentActivity: [
      { id: 't-28', user: '0x55c...44a', side: 'YES', amount: '$550', shares: 714, price: 77, time: '38m ago' }
    ]
  },

  // WORLD 1
  {
    id: 'world-climate-summit-accord',
    question: 'Will the global climate summit achieve unanimous agreement?',
    category: 'World',
    topic: 'Global Policy',
    yesProbability: 31,
    noProbability: 69,
    yesPriceCents: 31,
    noPriceCents: 69,
    volume: '$3.3M',
    volumeNumeric: 3300000,
    traders: 1020,
    timeRemaining: '19d 8h',
    timeMinutes: 27840,
    sparkline: [26, 28, 29, 31, 33, 32, 30, 31],
    chartHistory: generateChartPoints(31, 3.0),
    resolutionDate: 'Summit Closing Plenary',
    resolutionCriteria: 'Resolves YES if final communiqué is formally ratified without national reservation opt-outs.',
    source: 'UN Official Plenary Document Registry',
    liquidity: '$1.0M',
    commentsCount: 48,
    theses: [
      {
        id: 'th-27',
        author: 'GlobeWatcher',
        handle: '@globewatcher',
        side: 'NO',
        text: 'Developing nations delegation is conditioning sign-off on $300B annual loss-and-damage fund which major powers haven\'t budgeted.',
        staked: '$6,000',
        timestamp: '9h ago',
        reactions: { agree: 79, fire: 24, insightful: 56 }
      }
    ],
    recentActivity: [
      { id: 't-29', user: '0x18a...88d', side: 'NO', amount: '$1,400', shares: 2028, price: 69, time: '43m ago' }
    ]
  }
];

export const MOCK_USER_ACTIVITIES: UserPredictionActivity[] = [
  {
    id: 'act-1',
    username: 'TechBae',
    handle: '@techbae',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
    side: 'YES',
    probability: 76,
    question: 'Will SOL hit $250 before September ends?',
    marketId: 'crypto-sol-250',
    time: '2h ago',
    comment: 'DEX volumes on Solana continue to break records.'
  },
  {
    id: 'act-2',
    username: 'DaraTrades',
    handle: '@daratrades',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
    side: 'YES',
    probability: 58,
    question: 'Will Apple announce a new AI feature this week?',
    marketId: 'tech-apple-ai-feature',
    time: '4h ago',
    comment: 'Siri LLM integration confirmed in developer builds.'
  },
  {
    id: 'act-3',
    username: 'MissCrypto',
    handle: '@misscrypto',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=80',
    side: 'NO',
    probability: 34,
    question: 'Will this project announce its TGE this week?',
    marketId: 'crypto-project-tge',
    time: '6h ago',
    comment: 'Security audits require another round of verification.'
  },
  {
    id: 'act-4',
    username: 'SatoshiDuck',
    handle: '@satoshiduck',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
    side: 'YES',
    probability: 78,
    question: 'Will BTC move above $120K before Friday?',
    marketId: 'crypto-btc-120k',
    time: '8h ago',
    comment: 'OTC desks report complete supply dry up.'
  }
];

export const MOCK_LEADERBOARD: LeaderboardUser[] = [
  {
    rank: 1,
    username: 'SatoshiDuck',
    handle: '@satoshiduck',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
    accuracy: '88.4%',
    totalVolume: '$1.42M',
    pnl: '+$284,500',
    predictions: 142,
    winStreak: 12,
    badges: ['Top Forecaster', 'Crypto Oracle']
  },
  {
    rank: 2,
    username: 'TechBae',
    handle: '@techbae',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
    accuracy: '84.1%',
    totalVolume: '$980K',
    pnl: '+$192,200',
    predictions: 98,
    winStreak: 8,
    badges: ['Tech Expert', 'Solana Bull']
  },
  {
    rank: 3,
    username: 'PitchTactics',
    handle: '@pitch_tactics',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&h=120&q=80',
    accuracy: '79.6%',
    totalVolume: '$840K',
    pnl: '+$148,900',
    predictions: 114,
    winStreak: 5,
    badges: ['Sports Savant']
  },
  {
    rank: 4,
    username: 'MacroQuack',
    handle: '@macroquack',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
    accuracy: '77.2%',
    totalVolume: '$720K',
    pnl: '+$112,400',
    predictions: 85,
    winStreak: 6,
    badges: ['Macro Analyst']
  },
  {
    rank: 5,
    username: 'MissCrypto',
    handle: '@misscrypto',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=80',
    accuracy: '75.8%',
    totalVolume: '$610K',
    pnl: '+$94,800',
    predictions: 73,
    winStreak: 4,
    badges: ['DeFi Scout']
  },
  {
    rank: 6,
    username: 'AlphaDuck_99',
    handle: '@alphaduck',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
    accuracy: '74.2%',
    totalVolume: '$520K',
    pnl: '+$81,300',
    predictions: 64,
    winStreak: 7,
    badges: ['Momentum Trader']
  },
  {
    rank: 7,
    username: 'QuantumForecaster',
    handle: '@quantum_fc',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&h=120&q=80',
    accuracy: '72.9%',
    totalVolume: '$490K',
    pnl: '+$67,500',
    predictions: 58,
    winStreak: 3,
    badges: ['Quant Model']
  },
  {
    rank: 14,
    username: 'You (Forecaster0x)',
    handle: '@duck_trader',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
    accuracy: '81.5%',
    totalVolume: '$32,450',
    pnl: '+$8,420',
    predictions: 42,
    winStreak: 6,
    badges: ['Rising Star', 'High Accuracy'],
    isCurrentUser: true
  }
];

export const MOCK_USER_PROFILE: import('../types/market').UserProfileData = {
  username: 'Forecaster0x (You)',
  handle: '@duck_trader',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
  address: '0x71C...9A24',
  totalPredictions: 42,
  accuracy: 81.5,
  totalProfit: 8420,
  winRate: 78.6,
  currentStreak: 6,
  recentPredictions: [
    {
      id: 'rp-1',
      marketId: 'crypto-btc-120k',
      question: 'Will BTC move above $120K before Friday?',
      outcome: 'YES',
      amount: '$450',
      pnl: '+$182.50',
      isWin: true,
      status: 'Open',
      timestamp: 'Today, 14:20'
    },
    {
      id: 'rp-2',
      marketId: 'crypto-sol-250',
      question: 'Will SOL hit $250 before September ends?',
      outcome: 'YES',
      amount: '$300',
      pnl: '+$124.00',
      isWin: true,
      status: 'Won',
      timestamp: 'Yesterday'
    },
    {
      id: 'rp-3',
      marketId: 'sports-team-a-halftime',
      question: 'Will Team A score before halftime?',
      outcome: 'NO',
      amount: '$150',
      pnl: '-$150.00',
      isWin: false,
      status: 'Lost',
      timestamp: '3 days ago'
    },
    {
      id: 'rp-4',
      marketId: 'tech-apple-ai-feature',
      question: 'Will Apple announce a new AI feature this week?',
      outcome: 'YES',
      amount: '$600',
      pnl: '+$290.00',
      isWin: true,
      status: 'Won',
      timestamp: '5 days ago'
    }
  ]
};

export const MOCK_USER_POSITIONS: import('../types/market').UserPosition[] = [
  {
    id: 'pos-1',
    marketId: 'crypto-btc-120k',
    question: 'Will BTC move above $120K before Friday?',
    category: 'Crypto',
    outcome: 'YES',
    shares: 641,
    avgPrice: 70,
    currentPrice: 78,
    invested: 450,
    currentValue: 500,
    pnl: 50,
    pnlPercent: 11.1,
    timestamp: '2d ago'
  },
  {
    id: 'pos-2',
    marketId: 'tech-apple-ai-feature',
    question: 'Will Apple announce a new AI feature this week?',
    category: 'Technology',
    outcome: 'YES',
    shares: 480,
    avgPrice: 52,
    currentPrice: 58,
    invested: 250,
    currentValue: 278.4,
    pnl: 28.4,
    pnlPercent: 11.36,
    timestamp: '1d ago'
  }
];

// Enrich all markets with 24h change, shortLabels, timelines, comments
MOCK_MARKETS.forEach((market) => {
  // Assign realistic 24h percentage changes & short labels
  if (market.id === 'crypto-btc-120k') {
    market.shortLabel = 'BTC $120K';
    market.change24h = 18.4;
  } else if (market.id === 'crypto-eth-4000') {
    market.shortLabel = 'ETH $5K';
    market.change24h = 11.2;
  } else if (market.id === 'crypto-sol-250') {
    market.shortLabel = 'SOL $300';
    market.change24h = -9.8;
  } else if (market.id === 'sports-team-a-halftime') {
    market.shortLabel = 'Team A Halftime';
    market.change24h = 14.2;
  } else if (market.id === 'tech-apple-ai-feature') {
    market.shortLabel = 'Apple AI Siri';
    market.change24h = 7.8;
  } else if (market.id === 'tech-openai-new-model') {
    market.shortLabel = 'OpenAI Next Gen';
    market.change24h = 15.3;
  } else if (market.id === 'social-x-post-10k') {
    market.shortLabel = 'X Viral 100K';
    market.change24h = -3.4;
  } else if (market.id === 'crypto-project-tge') {
    market.shortLabel = 'TGE Token Event';
    market.change24h = -6.5;
  } else if (!market.change24h) {
    // Generate deterministic 24h change from sparkline
    const first = market.sparkline[0] || 50;
    const last = market.sparkline[market.sparkline.length - 1] || 50;
    const diff = last - first;
    market.change24h = diff >= 0 ? +(diff * 1.8 + 2.4).toFixed(1) : +(diff * 1.6 - 1.2).toFixed(1);
  }

  if (!market.shortLabel) {
    market.shortLabel = market.topic || market.category;
  }

  // Populate timeline if missing
  if (!market.timeline || market.timeline.length === 0) {
    market.timeline = [
      {
        id: `tl-${market.id}-1`,
        time: 'NOW',
        title: `Probability adjusted to ${market.yesProbability}%`,
        description: `Order flow balance shifting toward ${market.yesProbability >= 50 ? 'YES' : 'NO'} outcome.`,
        type: 'probability',
        badge: `${market.yesProbability}% YES`
      },
      {
        id: `tl-${market.id}-2`,
        time: '2h ago',
        title: `Large ${market.yesProbability >= 50 ? 'YES' : 'NO'} position placed`,
        description: `Institutional whale filled $12,400 worth of contracts at current market depth.`,
        type: 'trade',
        badge: '$12.4K'
      },
      {
        id: `tl-${market.id}-3`,
        time: '5h ago',
        title: 'Market liquidity boosted',
        description: 'Automated market maker added $50,000 in continuous liquidity.',
        type: 'created',
        badge: 'Liquidity'
      },
      {
        id: `tl-${market.id}-4`,
        time: '1d ago',
        title: 'Market opened for public trading',
        description: `Resolution oracle set to ${market.source}.`,
        type: 'resolution',
        badge: 'Initialized'
      }
    ];
  }

  // Populate commentsList if missing
  if (!market.commentsList || market.commentsList.length === 0) {
    market.commentsList = [
      {
        id: `c-${market.id}-1`,
        author: 'ForecasterOne',
        handle: '@forecaster_one',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
        position: 'YES',
        staked: '$2,500',
        text: 'Order book depth is expanding significantly ahead of the resolution cutoff. Strong momentum.',
        timestamp: '14m ago',
        likes: 18,
        replies: [
          {
            id: `r-${market.id}-1`,
            author: 'RiskNeutral',
            handle: '@risk_neutral',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
            text: 'Agreed, implied volatility in derivative markets aligns directly with this spread.',
            timestamp: '8m ago',
            likes: 5
          }
        ]
      },
      {
        id: `c-${market.id}-2`,
        author: 'AlphaDuck',
        handle: '@alphaduck',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
        position: market.yesProbability < 50 ? 'YES' : 'NO',
        staked: '$1,200',
        text: 'Hedging with short perps makes this trade attractive at these specific odds.',
        timestamp: '42m ago',
        likes: 12,
        replies: []
      },
      {
        id: `c-${market.id}-3`,
        author: 'PredictionKing',
        handle: '@pred_king',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&h=120&q=80',
        position: 'YES',
        staked: '$4,800',
        text: 'Historical data across past cycles strongly favors YES settling above target.',
        timestamp: '2h ago',
        likes: 24,
        replies: []
      }
    ];
  }
});

