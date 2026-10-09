/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Maps Panta API market data onto DuckCast's PredictionMarket view model so
 * the existing marketplace UI renders live Panta markets unchanged.
 */

import { ChartPoint, MarketCategory, PredictionMarket, RecentTrade } from '../types/market';
import { PantaMarket, PantaTrade } from './pantaApi';
import { shortenSolanaAddress } from '../solana/config';

const CATEGORY_MAP: Record<string, MarketCategory> = {
  sports: 'Sports',
  crypto: 'Crypto',
  politics: 'Politics',
  entertainment: 'Entertainment',
  finance: 'Finance',
  science: 'Science',
  world: 'World',
  other: 'Other'
};

/** DuckCast category -> Panta create-quote category slug */
export const PANTA_CATEGORY_SLUGS: Array<{ slug: string; label: MarketCategory }> = Object.entries(CATEGORY_MAP).map(
  ([slug, label]) => ({ slug, label })
);

export function formatUsdCompact(n: number): string {
  if (!Number.isFinite(n)) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(n >= 100 ? 0 : 2)}`;
}

export function formatTimeRemaining(endTimeSec: number): { label: string; minutes: number } {
  const ms = endTimeSec * 1000 - Date.now();
  if (ms <= 0) return { label: 'Ended', minutes: 0 };
  const minutes = Math.floor(ms / 60_000);
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;
  return { label: d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`, minutes };
}

export function formatRelativeTime(unixSec: number | null): string {
  if (!unixSec) return '—';
  const diff = Math.max(0, Date.now() / 1000 - unixSec);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86_400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86_400)}d ago`;
}

function toNum(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : 0;
}

const TIMEFRAMES: Array<{ key: '1H' | '6H' | '1D' | '1W' | 'ALL'; ms: number }> = [
  { key: '1H', ms: 3_600_000 },
  { key: '6H', ms: 6 * 3_600_000 },
  { key: '1D', ms: 86_400_000 },
  { key: '1W', ms: 7 * 86_400_000 },
  { key: 'ALL', ms: Number.POSITIVE_INFINITY }
];

/**
 * Builds chart series from the spot prices DuckCast has observed for this market.
 * Panta's trade tape doesn't carry a per-trade price, so these are snapshots.
 */
function buildChartHistory(history: Array<[number, number]>, currentProb: number): PredictionMarket['chartHistory'] {
  const now = Date.now();
  const out = {} as PredictionMarket['chartHistory'];

  for (const tf of TIMEFRAMES) {
    const points = history.filter(([ts]) => now - ts <= tf.ms);
    const series: ChartPoint[] = points.map(([ts, yes]) => ({
      time:
        tf.ms <= 86_400_000
          ? new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      probability: Math.round(yes * 1000) / 10
    }));
    // Always end on the current price; pad a flat line when there is not enough history yet.
    series.push({ time: 'Now', probability: currentProb });
    if (series.length < 2) series.unshift({ time: 'Start', probability: currentProb });
    out[tf.key] = series;
  }
  out['24H'] = out['1D'];
  out['7D'] = out['1W'];
  out['30D'] = out['ALL'];
  return out;
}

export function pantaTradeToRecentTrade(t: PantaTrade, currentPriceCents: { yes: number; no: number }): RecentTrade {
  const yesAmt = toNum(t.yesAmount);
  const noAmt = toNum(t.noAmount);
  const side: 'YES' | 'NO' = yesAmt >= noAmt ? 'YES' : 'NO';
  const shares = side === 'YES' ? yesAmt : noAmt;
  return {
    id: String(t.signature || t.id),
    user: shortenSolanaAddress(t.wallet),
    side,
    amount: `${shares.toLocaleString('en-US', { maximumFractionDigits: 2 })} sh`,
    shares,
    price: side === 'YES' ? currentPriceCents.yes : currentPriceCents.no,
    time: formatRelativeTime(t.blockTime),
    type: 'buy'
  };
}

export function pantaToPredictionMarket(
  m: PantaMarket,
  extras: { trades?: PantaTrade[]; history?: Array<[number, number]>; previous?: PredictionMarket } = {}
): PredictionMarket {
  const pricePending = m.yesPrice === null;
  const yesRaw = m.yesPrice ?? 0.5;
  const yesProbability = Math.round(yesRaw * 100);
  const noProbability = 100 - yesProbability;
  const yesPriceCents = Math.round(yesRaw * 10_000) / 100;
  const noPriceCents = Math.round((m.noPrice ?? 1 - yesRaw) * 10_000) / 100;

  const time = formatTimeRemaining(m.endTime);
  const history = extras.history || [];
  const chartHistory = buildChartHistory(history, yesProbability);

  // 24h move from observed history (percentage points)
  const dayAgo = Date.now() - 86_400_000;
  const first24h = history.find(([ts]) => ts >= dayAgo);
  const change24h = first24h ? Math.round((yesRaw - first24h[1]) * 1000) / 10 : undefined;

  const sparklineSource = history.slice(-9).map(([, yes]) => Math.round(yes * 100));
  const sparkline = [...sparklineSource, yesProbability];
  if (sparkline.length < 2) sparkline.unshift(yesProbability);

  const trades = extras.trades;
  const recentActivity = trades
    ? trades.slice(0, 25).map((t) => pantaTradeToRecentTrade(t, { yes: yesPriceCents, no: noPriceCents }))
    : extras.previous?.recentActivity || [];
  const traders = trades ? new Set(trades.map((t) => t.wallet)).size : extras.previous?.traders || 0;

  const nowSec = Date.now() / 1000;
  const category = CATEGORY_MAP[m.category] || 'Other';
  const phase = (['primary', 'secondary', 'resolved', 'cancelled'].includes(m.phase) ? m.phase : 'primary') as PredictionMarket['pantaMarketPhase'];

  return {
    id: m.marketId,
    question: m.title,
    category,
    topic: m.region && m.region !== 'Global' ? m.region : category,
    yesProbability,
    noProbability,
    yesPriceCents,
    noPriceCents,
    volume: formatUsdCompact(m.volumeUsdc),
    volumeNumeric: m.volumeUsdc,
    traders,
    timeRemaining: time.label,
    timeMinutes: time.minutes,
    sparkline,
    change24h,
    chartHistory,
    isLive: m.marketType === 'breaking' && !m.resolved && time.minutes > 0,
    isEndingToday: time.minutes > 0 && time.minutes <= 1440,
    isEndingThisWeek: time.minutes > 0 && time.minutes <= 10_080,
    isNew: m.startTime > 0 && nowSec - m.startTime < 3 * 86_400,
    trendingDelta: change24h !== undefined && Math.abs(change24h) >= 1 ? `${change24h > 0 ? '+' : ''}${change24h}%` : undefined,
    resolutionDate: m.resolutionTime
      ? new Date(m.resolutionTime * 1000).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        })
      : 'TBD',
    resolutionCriteria: m.description || 'See market rules on Panta.',
    source: 'Panta oracle (Solana)',
    liquidity: phase === 'primary' ? 'Bonding curve' : phase === 'secondary' ? 'Order book' : '—',
    theses: extras.previous?.theses || [],
    recentActivity,
    commentsCount: extras.previous?.commentsCount || 0,
    isPanta: true,
    pricePending,
    pantaImage: m.image,
    endTimeSec: m.endTime,
    resolved: m.resolved,
    pantaMarketType: m.marketType === 'breaking' ? 'breaking' : 'standard',
    pantaMarketPhase: phase,
    pantaFeePercent: phase === 'primary' ? 2 : undefined
  };
}

/** Flags the feed's top markets by volume / movement, mirroring the mock data's highlight flags. */
export function applyFeedHighlights(markets: PredictionMarket[]): PredictionMarket[] {
  const byVolume = [...markets].sort((a, b) => b.volumeNumeric - a.volumeNumeric);
  const highVolumeCut = byVolume[Math.min(byVolume.length - 1, Math.max(0, Math.floor(byVolume.length / 4)))]?.volumeNumeric ?? Infinity;
  const trendingIds = new Set(
    [...markets]
      .filter((m) => m.change24h !== undefined && Math.abs(m.change24h) >= 1)
      .sort((a, b) => Math.abs(b.change24h || 0) - Math.abs(a.change24h || 0))
      .slice(0, 6)
      .map((m) => m.id)
  );
  // With no observed movement yet, fall back to the busiest markets as "trending".
  if (trendingIds.size === 0) byVolume.slice(0, 4).forEach((m) => trendingIds.add(m.id));

  return markets.map((m) => ({
    ...m,
    isHighVolume: m.volumeNumeric > 0 && m.volumeNumeric >= highVolumeCut,
    isTrending: trendingIds.has(m.id)
  }));
}
