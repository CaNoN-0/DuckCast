/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Server-side Panta API integration.
 *
 * The Panta API key must never reach the browser (Panta docs: "Store it in your
 * backend. Never put it in a query string, mobile binary, or frontend bundle"),
 * so every Panta call DuckCast makes goes through this router. It also:
 *   - self-throttles under Panta's documented per-family rate limits,
 *   - caches catalog reads so many viewers share one upstream request,
 *   - normalises market rows (list rows ship without prices) into one shape,
 *   - records observed spot prices to build probability charts over time,
 *   - validates wallet / market / signature inputs before forwarding writes.
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { promises as fs } from 'fs';
import path from 'path';

const PANTA_BASE = (process.env.PANTA_API_BASE || 'https://live-api.panta.market/api/v1').replace(/\/+$/, '');
const API_KEY = process.env.PANTA_API_KEY || '';

export const isPantaConfigured = () => API_KEY.length > 0;

// ---------------------------------------------------------------------------
// Rate limiting: Panta documents per-account limits per route family. We stay
// at ~85% of each so a burst of DuckCast users never gets the key throttled.
// ---------------------------------------------------------------------------

type Family = 'read' | 'positions' | 'quote' | 'build' | 'register' | 'upload';

const FAMILY_LIMITS: Record<Family, number> = {
  read: 100, // documented 120 / 60s
  positions: 50, // documented 60 / 60s
  quote: 25, // documented 30 / 60s
  build: 17, // documented 20 / 60s
  register: 34, // documented 40 / 60s
  upload: 8 // documented 10 / 60s
};

const WINDOW_MS = 60_000;
const familyHits = new Map<Family, number[]>();

async function acquire(family: Family, maxWaitMs = 4_000): Promise<void> {
  const deadline = Date.now() + maxWaitMs;
  for (;;) {
    const now = Date.now();
    const hits = (familyHits.get(family) || []).filter((t) => now - t < WINDOW_MS);
    if (hits.length < FAMILY_LIMITS[family]) {
      hits.push(now);
      familyHits.set(family, hits);
      return;
    }
    const waitMs = WINDOW_MS - (now - hits[0]) + 25;
    if (now + waitMs > deadline) {
      throw new PantaError(429, { code: 'RATE_LIMITED', message: 'DuckCast is briefly over its Panta request budget. Try again in a few seconds.' });
    }
    await new Promise((r) => setTimeout(r, waitMs));
  }
}

// ---------------------------------------------------------------------------
// Upstream client
// ---------------------------------------------------------------------------

export class PantaError extends Error {
  status: number;
  body: { code: string; message: string; [k: string]: unknown };

  constructor(status: number, body: { code: string; message: string; [k: string]: unknown }) {
    super(body.message);
    this.status = status;
    this.body = body;
  }
}

async function pantaFetch<T>(
  family: Family,
  pathAndQuery: string,
  init: { method?: 'GET' | 'POST'; body?: unknown } = {}
): Promise<T> {
  if (!isPantaConfigured()) {
    throw new PantaError(503, {
      code: 'PANTA_NOT_CONFIGURED',
      message: 'PANTA_API_KEY is not set on the DuckCast server.'
    });
  }

  await acquire(family);

  let res: globalThis.Response;
  try {
    res = await fetch(`${PANTA_BASE}${pathAndQuery}`, {
      method: init.method || 'GET',
      headers: {
        'X-Api-Key': API_KEY,
        Accept: 'application/json',
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {})
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(15_000)
    });
  } catch (err: any) {
    throw new PantaError(502, {
      code: 'UPSTREAM_UNAVAILABLE',
      message: `Could not reach the Panta API (${err?.name === 'TimeoutError' ? 'timeout' : 'network error'}).`
    });
  }

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const body =
      json && typeof json.code === 'string'
        ? json
        : { code: res.status === 429 ? 'RATE_LIMITED' : 'UPSTREAM_ERROR', message: `Panta API responded ${res.status}` };
    throw new PantaError(res.status, body);
  }

  return json as T;
}

// ---------------------------------------------------------------------------
// Tiny TTL cache with in-flight de-duplication and stale-on-error fallback
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  value?: T;
  expiresAt: number;
  inflight?: Promise<T>;
}

const cache = new Map<string, CacheEntry<unknown>>();

async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  const now = Date.now();
  if (entry?.value !== undefined && entry.expiresAt > now) return entry.value;
  if (entry?.inflight) return entry.inflight;

  const inflight = load()
    .then((value) => {
      cache.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .catch((err) => {
      // Serve the last good value rather than failing a page render
      if (entry?.value !== undefined) {
        cache.set(key, { value: entry.value, expiresAt: Date.now() + Math.min(ttlMs, 10_000) });
        return entry.value;
      }
      cache.delete(key);
      throw err;
    });

  cache.set(key, { ...(entry || { expiresAt: 0 }), inflight });
  return inflight;
}

// ---------------------------------------------------------------------------
// Panta response shapes (from docs.panta.market) and DuckCast's normalised view
// ---------------------------------------------------------------------------

interface PantaCatalogRow {
  marketId: string;
  category: string;
  title: string;
  description: string;
  images: string[];
  phase: string;
  marketType: string;
  startTime: number;
  endTime: number;
  resolutionTime: number;
  region: string;
  resolved: boolean;
  status: string;
  volumeUsdc: string | number | null;
  campaignId: string | null;
  createdByPartner: boolean;
  yesPrice: string | number | null;
  noPrice: string | number | null;
  primaryYesPrice?: string | number | null;
  primaryNoPrice?: string | number | null;
  secondaryYesPrice?: string | number | null;
  secondaryNoPrice?: string | number | null;
}

interface PantaTradeRow {
  id: string | number;
  marketId: string;
  wallet: string;
  isPrimary: boolean;
  yesAmount: string | number | null;
  noAmount: string | number | null;
  feePaid: string | number | null;
  blockTime: number | null;
  signature: string;
  quoteAsset: string;
  amountUsdc?: string | number | null;
}

interface PantaPositionRow {
  marketId: string;
  category: string | null;
  side: 'yes' | 'no';
  shares: string;
  phase: string;
  claimable: boolean;
  claimed: boolean;
  outcome: 'yes' | 'no' | null;
}

export interface DuckMarket {
  marketId: string;
  title: string;
  description: string;
  category: string;
  image: string | null;
  phase: string;
  marketType: string;
  startTime: number;
  endTime: number;
  resolutionTime: number;
  region: string;
  resolved: boolean;
  status: string;
  volumeUsdc: number;
  yesPrice: number | null;
  noPrice: number | null;
  createdByPartner: boolean;
  pricedAt: number | null;
}

/** Panta prices arrive as decimal strings ("0.43") and sometimes 1e9-scaled strings. */
export function normalizePrice(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  if (!Number.isFinite(n) || n < 0) return null;
  if (n <= 1.000001) return n;
  const scaled = n / 1e9;
  return scaled <= 1.000001 ? scaled : null;
}

function toNumber(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : 0;
}

function normalizeMarket(row: PantaCatalogRow, detail?: PantaCatalogRow): DuckMarket {
  const src = detail || row;
  // List rows can carry empty titles and stale phases; prefer detail fields when present.
  let yes = normalizePrice(src.yesPrice ?? src.primaryYesPrice ?? src.secondaryYesPrice);
  let no = normalizePrice(src.noPrice ?? src.primaryNoPrice ?? src.secondaryNoPrice);
  if (yes !== null && no === null) no = Math.max(0, 1 - yes);
  if (no !== null && yes === null) yes = Math.max(0, 1 - no);

  return {
    marketId: row.marketId,
    title: (src.title || row.title || '').trim(),
    description: (src.description || row.description || '').trim(),
    category: (src.category || row.category || 'other').toLowerCase(),
    image: (src.images && src.images[0]) || (row.images && row.images[0]) || null,
    phase: src.phase || row.phase,
    marketType: src.marketType || row.marketType || 'standard',
    startTime: toNumber(src.startTime ?? row.startTime),
    endTime: toNumber(src.endTime ?? row.endTime),
    resolutionTime: toNumber(src.resolutionTime ?? row.resolutionTime),
    region: src.region || row.region || 'Global',
    resolved: Boolean(src.resolved ?? row.resolved),
    status: src.status || row.status || '',
    volumeUsdc: toNumber(src.volumeUsdc ?? row.volumeUsdc),
    yesPrice: yes,
    noPrice: no,
    createdByPartner: Boolean(src.createdByPartner ?? row.createdByPartner),
    pricedAt: yes !== null ? Date.now() : null
  };
}

// ---------------------------------------------------------------------------
// Observed price history -> probability charts.
// Panta's trade tape has share amounts but no per-trade price, so DuckCast
// snapshots the spot price whenever it reads a market and persists the series.
// ---------------------------------------------------------------------------

const HISTORY_FILE = path.resolve(process.cwd(), 'data', 'price-history.json');
const HISTORY_MAX_POINTS = 720;
const HISTORY_MIN_GAP_MS = 60_000;
let priceHistory: Record<string, Array<[number, number]>> = {};
let historyDirty = false;

export async function loadPriceHistory() {
  try {
    priceHistory = JSON.parse(await fs.readFile(HISTORY_FILE, 'utf8'));
  } catch {
    priceHistory = {};
  }
  setInterval(async () => {
    if (!historyDirty) return;
    historyDirty = false;
    try {
      await fs.mkdir(path.dirname(HISTORY_FILE), { recursive: true });
      await fs.writeFile(HISTORY_FILE, JSON.stringify(priceHistory));
    } catch (err) {
      console.warn('[Panta] Could not persist price history:', (err as Error).message);
    }
  }, 30_000).unref();
}

function recordPrice(marketId: string, yes: number | null) {
  if (yes === null) return;
  const series = (priceHistory[marketId] ||= []);
  const now = Date.now();
  const last = series[series.length - 1];
  if (last && now - last[0] < HISTORY_MIN_GAP_MS && Math.abs(last[1] - yes) < 0.0005) return;
  series.push([now, Math.round(yes * 10_000) / 10_000]);
  if (series.length > HISTORY_MAX_POINTS) series.splice(0, series.length - HISTORY_MAX_POINTS);
  historyDirty = true;
}

// ---------------------------------------------------------------------------
// Cached reads
// ---------------------------------------------------------------------------

async function getMarketDetail(marketId: string): Promise<PantaCatalogRow> {
  return cached(`detail:${marketId}`, 30_000, () =>
    pantaFetch<PantaCatalogRow>('read', `/markets/${encodeURIComponent(marketId)}/`)
  );
}

async function getEnrichedMarket(marketId: string, listRow?: PantaCatalogRow): Promise<DuckMarket> {
  const detail = await getMarketDetail(marketId);
  const market = normalizeMarket(listRow || detail, detail);
  recordPrice(marketId, market.yesPrice);
  return market;
}

async function listCatalog(phase: string, category?: string): Promise<PantaCatalogRow[]> {
  const key = `list:${phase}:${category || '*'}`;
  return cached(key, 60_000, async () => {
    const rows: PantaCatalogRow[] = [];
    const seenCursors = new Set<string>();
    let cursor: string | null = null;
    // Cap pagination: list cursors have been reported to loop, so we also stop on a repeated cursor.
    for (let page = 0; page < 4; page++) {
      const qs = new URLSearchParams({ status: phase, limit: '50' });
      if (category) qs.set('category', category);
      if (cursor) qs.set('cursor', cursor);
      const res = await pantaFetch<{ items: PantaCatalogRow[]; nextCursor?: string | null }>('read', `/markets/?${qs}`);
      rows.push(...(res.items || []));
      cursor = res.nextCursor || null;
      if (!cursor || seenCursors.has(cursor)) break;
      seenCursors.add(cursor);
    }
    return rows;
  });
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        try {
          results[i] = { status: 'fulfilled', value: await fn(items[i]) };
        } catch (reason) {
          results[i] = { status: 'rejected', reason };
        }
      }
    })
  );
  return results;
}

export interface EnrichedPosition extends Omit<PantaPositionRow, 'side'> {
  side: 'yes' | 'no';
  sharesNum: number;
  estValueUsdc: number | null;
  valuation: 'mark' | 'settled_win' | 'settled_loss' | 'unknown';
  market: DuckMarket | null;
}

/**
 * Wallet holdings joined with live market prices.
 * Mark-to-market follows docs.panta.market/api-reference/positions#estimating-position-value-client-side:
 * open = shares x side price; resolved winner ~ 1 USDC/share; resolved loser = 0.
 */
export async function getWalletPositions(wallet: string): Promise<EnrichedPosition[]> {
  const data = await cached(`positions:${wallet}`, 8_000, () =>
    pantaFetch<{ wallet: string; positions: PantaPositionRow[] }>('positions', `/positions/?wallet=${encodeURIComponent(wallet)}`)
  );
  const positions = data.positions || [];
  const marketIds = [...new Set(positions.map((p) => p.marketId))];
  const markets = await mapLimit(marketIds, 4, (id) => getEnrichedMarket(id));
  const byId = new Map<string, DuckMarket>();
  markets.forEach((r, i) => {
    if (r.status === 'fulfilled') byId.set(marketIds[i], r.value);
  });

  return positions.map((p) => {
    const market = byId.get(p.marketId) || null;
    const shares = toNumber(p.shares);
    const side = String(p.side).toLowerCase() as 'yes' | 'no';
    let estValueUsdc: number | null = null;
    let valuation: EnrichedPosition['valuation'] = 'unknown';
    if (p.outcome) {
      const won = String(p.outcome).toLowerCase() === side;
      estValueUsdc = won ? shares : 0;
      valuation = won ? 'settled_win' : 'settled_loss';
    } else if (market) {
      const price = side === 'yes' ? market.yesPrice : market.noPrice;
      if (price !== null) {
        estValueUsdc = shares * price;
        valuation = 'mark';
      }
    }
    return { ...p, side, sharesNum: shares, estValueUsdc, valuation, market };
  });
}

const FEED_ENRICH_LIMIT = 40;

async function getMarketFeed(): Promise<{ items: DuckMarket[]; fetchedAt: string }> {
  return cached('feed', 20_000, async () => {
    const phases = ['primary', 'secondary'];
    const lists = await Promise.allSettled(phases.map((p) => listCatalog(p)));
    const byId = new Map<string, PantaCatalogRow>();
    for (const l of lists) {
      if (l.status === 'fulfilled') for (const row of l.value) if (row?.marketId) byId.set(row.marketId, row);
    }
    if (byId.size === 0) {
      const firstErr = lists.find((l) => l.status === 'rejected') as PromiseRejectedResult | undefined;
      if (firstErr) throw firstErr.reason;
    }

    // List rows have null prices, so enrich the most relevant markets with detail calls.
    const rows = [...byId.values()].sort((a, b) => toNumber(b.volumeUsdc) - toNumber(a.volumeUsdc));
    const toEnrich = rows.slice(0, FEED_ENRICH_LIMIT);
    const enriched = await mapLimit(toEnrich, 4, (row) => getEnrichedMarket(row.marketId, row));

    const items: DuckMarket[] = enriched.map((r, i) =>
      r.status === 'fulfilled' ? r.value : normalizeMarket(toEnrich[i])
    );
    return { items: items.filter((m) => m.title), fetchedAt: new Date().toISOString() };
  });
}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;
const isPubkey = (v: unknown): v is string => typeof v === 'string' && v.length >= 32 && v.length <= 44 && BASE58.test(v);
const isSignature = (v: unknown): v is string => typeof v === 'string' && v.length >= 64 && v.length <= 90 && BASE58.test(v);
const isSessionId = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_\-:.]{1,128}$/.test(v);
const isSide = (v: unknown): v is string => typeof v === 'string' && /^(yes|no)$/i.test(v);

function bad(res: Response, field: string, message: string) {
  return res.status(400).json({ code: 'INVALID_MARKET_PARAMS', field, message });
}

function sendError(res: Response, err: unknown) {
  if (err instanceof PantaError) {
    return res.status(err.status).json(err.body);
  }
  console.error('[Panta] Unexpected error:', err);
  return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Unexpected DuckCast server error.' });
}

/** Simple per-IP limiter so one client cannot drain DuckCast's shared Panta budget. */
export function ipRateLimit(maxPerMinute: number) {
  const hits = new Map<string, number[]>();
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const list = (hits.get(ip) || []).filter((t) => now - t < 60_000);
    if (list.length >= maxPerMinute) {
      res.setHeader('Retry-After', '30');
      return res.status(429).json({ code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' });
    }
    list.push(now);
    hits.set(ip, list);
    if (hits.size > 5_000) hits.clear();
    next();
  };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export function createPantaRouter(): Router {
  const router = Router();

  // Every response from a Panta-backed route is attributed, per Panta Terms of Use §6.
  router.use((_req, res, next) => {
    res.setHeader('X-Powered-By', 'Panta');
    next();
  });

  router.get('/status', async (_req, res) => {
    if (!isPantaConfigured()) {
      return res.json({ configured: false, ok: false });
    }
    try {
      const account = await cached('account', 5 * 60_000, () =>
        pantaFetch<{ name?: string; status?: string; canCreateMarkets?: boolean }>('read', '/account/')
      );
      res.json({
        configured: true,
        ok: true,
        account: { name: account.name || null, status: account.status || null, canCreateMarkets: Boolean(account.canCreateMarkets) }
      });
    } catch (err) {
      const body = err instanceof PantaError ? err.body : { code: 'INTERNAL_ERROR', message: 'Status check failed' };
      res.json({ configured: true, ok: false, error: body });
    }
  });

  router.get('/categories', async (_req, res) => {
    try {
      res.json(await cached('categories', 10 * 60_000, () => pantaFetch<{ categories: string[] }>('read', '/categories/')));
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get('/markets', async (_req, res) => {
    try {
      const feed = await getMarketFeed();
      // Recent observed prices per market for card sparklines / 24h movement
      const history: Record<string, Array<[number, number]>> = {};
      const dayAgo = Date.now() - 86_400_000;
      for (const m of feed.items) {
        const series = priceHistory[m.marketId];
        if (series?.length) history[m.marketId] = series.filter(([ts]) => ts >= dayAgo).slice(-30);
      }
      res.json({ ...feed, history });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get('/markets/:marketId', async (req, res) => {
    const { marketId } = req.params;
    if (!isPubkey(marketId)) return bad(res, 'marketId', 'marketId must be a base58 market address');
    try {
      const [market, trades] = await Promise.all([
        getEnrichedMarket(marketId),
        cached(`trades:${marketId}`, 15_000, () =>
          pantaFetch<{ items: PantaTradeRow[] }>('read', `/markets/${encodeURIComponent(marketId)}/trades/?limit=100`)
        ).catch(() => ({ items: [] as PantaTradeRow[] }))
      ]);
      res.json({
        market,
        trades: trades.items || [],
        priceHistory: priceHistory[marketId] || []
      });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get('/positions', async (req, res) => {
    const wallet = req.query.wallet;
    if (!isPubkey(wallet)) return bad(res, 'wallet', 'wallet must be a base58 Solana address');
    try {
      res.json({ wallet, positions: await getWalletPositions(wallet) });
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get('/wallets/:wallet/trades', async (req, res) => {
    const { wallet } = req.params;
    if (!isPubkey(wallet)) return bad(res, 'wallet', 'wallet must be a base58 Solana address');
    try {
      res.json(
        await cached(`wtrades:${wallet}`, 15_000, () =>
          pantaFetch('read', `/wallets/${encodeURIComponent(wallet)}/trades/?limit=100`)
        )
      );
    } catch (err) {
      sendError(res, err);
    }
  });

  // ----- Primary buy: quote -> build -> (wallet signs + broadcasts) -> submit / verify -> report -----

  router.post('/orders/quote', async (req, res) => {
    const { wallet, marketId, side, amountUsdc } = req.body || {};
    if (!isPubkey(wallet)) return bad(res, 'wallet', 'wallet must be a base58 Solana address');
    if (!isPubkey(marketId)) return bad(res, 'marketId', 'marketId must be a base58 market address');
    if (!isSide(side)) return bad(res, 'side', 'side must be yes or no');
    const amount = Number(amountUsdc);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000) {
      return bad(res, 'amountUsdc', 'amountUsdc must be between 0 and 10,000 USDC');
    }
    try {
      res.json(
        await pantaFetch('quote', '/primaryorderquote/', {
          method: 'POST',
          body: { wallet, marketId, side: side.toLowerCase(), amountUsdc: amount.toFixed(2) }
        })
      );
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post('/orders/build', async (req, res) => {
    const { quoteId, wallet, maxSlippageBps } = req.body || {};
    if (!isSessionId(quoteId)) return bad(res, 'quoteId', 'quoteId is required');
    if (!isPubkey(wallet)) return bad(res, 'wallet', 'wallet must be a base58 Solana address');
    const slippage = maxSlippageBps === undefined ? 100 : Number(maxSlippageBps);
    if (!Number.isInteger(slippage) || slippage < 1 || slippage > 5000) {
      return bad(res, 'maxSlippageBps', 'maxSlippageBps must be an integer between 1 and 5000');
    }
    try {
      res.json(await pantaFetch('build', '/primaryorderbuild/', { method: 'POST', body: { quoteId, wallet, maxSlippageBps: slippage } }));
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post('/orders/submit', async (req, res) => {
    const { orderId, signature, wallet } = req.body || {};
    if (!isSessionId(orderId)) return bad(res, 'orderId', 'orderId is required');
    if (!isSignature(signature)) return bad(res, 'signature', 'signature must be a base58 transaction signature');
    if (wallet !== undefined && !isPubkey(wallet)) return bad(res, 'wallet', 'wallet must be a base58 Solana address');
    try {
      res.json(await pantaFetch('register', '/primaryordersubmit/', { method: 'POST', body: { orderId, signature, wallet } }));
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post('/orders/verify', async (req, res) => {
    const { orderId, signature, wallet } = req.body || {};
    if (!isSessionId(orderId)) return bad(res, 'orderId', 'orderId is required');
    if (signature !== undefined && !isSignature(signature)) return bad(res, 'signature', 'invalid signature');
    if (wallet !== undefined && !isPubkey(wallet)) return bad(res, 'wallet', 'invalid wallet');
    try {
      res.json(await pantaFetch('register', '/primaryorderverify/', { method: 'POST', body: { orderId, signature, wallet } }));
    } catch (err) {
      sendError(res, err);
    }
  });

  // Trade attribution: credits verified buys / win claims to DuckCast's Panta account.
  router.post('/trades/report', async (req, res) => {
    const { signature, wallet, marketId, quoteId, clientOrderId } = req.body || {};
    if (!isSignature(signature)) return bad(res, 'signature', 'invalid signature');
    if (!isPubkey(wallet)) return bad(res, 'wallet', 'invalid wallet');
    if (!isPubkey(marketId)) return bad(res, 'marketId', 'invalid marketId');
    if (quoteId !== undefined && !isSessionId(quoteId)) return bad(res, 'quoteId', 'invalid quoteId');
    if (clientOrderId !== undefined && !isSessionId(clientOrderId)) return bad(res, 'clientOrderId', 'invalid clientOrderId');
    try {
      const result = await pantaFetch('register', '/trades/', {
        method: 'POST',
        body: { signature, wallet, marketId, quoteId, clientOrderId }
      });
      cache.delete(`positions:${wallet}`);
      cache.delete(`trades:${marketId}`);
      cache.delete(`detail:${marketId}`);
      res.json(result);
    } catch (err) {
      sendError(res, err);
    }
  });

  router.get('/trades/:signature', async (req, res) => {
    const { signature } = req.params;
    if (!isSignature(signature)) return bad(res, 'signature', 'invalid signature');
    try {
      res.json(await pantaFetch('read', `/trades/${encodeURIComponent(signature)}/`));
    } catch (err) {
      sendError(res, err);
    }
  });

  // ----- Claims -----

  router.post('/claims/build', async (req, res) => {
    const { wallet, marketId } = req.body || {};
    if (!isPubkey(wallet)) return bad(res, 'wallet', 'invalid wallet');
    if (!isPubkey(marketId)) return bad(res, 'marketId', 'invalid marketId');
    try {
      res.json(await pantaFetch('build', '/claim/build/', { method: 'POST', body: { wallet, marketId } }));
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post('/claims/creator-fees/build', async (req, res) => {
    const { wallet, marketId } = req.body || {};
    if (!isPubkey(wallet)) return bad(res, 'wallet', 'invalid wallet');
    if (!isPubkey(marketId)) return bad(res, 'marketId', 'invalid marketId');
    try {
      res.json(await pantaFetch('build', '/claim/creator-fees/build/', { method: 'POST', body: { wallet, marketId } }));
    } catch (err) {
      sendError(res, err);
    }
  });

  // ----- Market creation: quote -> build -> (wallet signs + broadcasts) -> register -----

  router.post('/markets/create/quote', async (req, res) => {
    const b = req.body || {};
    if (!isPubkey(b.wallet)) return bad(res, 'wallet', 'wallet must be a base58 Solana address');
    if (typeof b.question !== 'string' || !b.question.trim()) return bad(res, 'question', 'question is required');
    if (typeof b.imageUrl !== 'string' || !/^https?:\/\//.test(b.imageUrl)) return bad(res, 'imageUrl', 'imageUrl must be a public http(s) URL');
    // Forward only documented fields; Panta performs the full validation and returns field-level errors.
    const body = {
      wallet: b.wallet,
      question: b.question.trim().slice(0, 512),
      resolutionRule: String(b.resolutionRule || '').slice(0, 2048),
      sourcesOfTruth: Array.isArray(b.sourcesOfTruth) ? b.sourcesOfTruth.map(String).slice(0, 20) : [],
      category: String(b.category || 'other').toLowerCase(),
      startTime: Number(b.startTime),
      endTime: Number(b.endTime),
      resolutionTime: Number(b.resolutionTime),
      imageUrl: b.imageUrl,
      marketType: b.marketType === 'breaking' ? 'breaking' : 'standard',
      ...(b.marketType === 'breaking' && b.eventInProgress ? { eventInProgress: true } : {}),
      ...(b.title ? { title: String(b.title).slice(0, 512) } : {}),
      ...(b.description ? { description: String(b.description).slice(0, 4000) } : {}),
      ...(b.region ? { region: String(b.region).slice(0, 64) } : {})
    };
    try {
      res.json(await pantaFetch('quote', '/markets/create/quote/', { method: 'POST', body }));
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post('/markets/create/build', async (req, res) => {
    const { createId, wallet } = req.body || {};
    if (!isSessionId(createId)) return bad(res, 'createId', 'createId is required');
    if (wallet !== undefined && !isPubkey(wallet)) return bad(res, 'wallet', 'invalid wallet');
    try {
      res.json(await pantaFetch('build', '/markets/create/build/', { method: 'POST', body: { createId, wallet } }));
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post('/markets/register', async (req, res) => {
    const { createId, signature } = req.body || {};
    if (!isSessionId(createId)) return bad(res, 'createId', 'createId is required');
    if (!isSignature(signature)) return bad(res, 'signature', 'invalid signature');
    try {
      const result = await pantaFetch('register', '/markets/register/', { method: 'POST', body: { createId, signature } });
      cache.delete('feed');
      for (const key of cache.keys()) if (key.startsWith('list:')) cache.delete(key);
      res.json(result);
    } catch (err) {
      sendError(res, err);
    }
  });

  router.post('/markets/create/image-upload', async (req, res) => {
    try {
      res.json(await pantaFetch('upload', '/markets/create/image-upload/', { method: 'POST', body: {} }));
    } catch (err) {
      sendError(res, err);
    }
  });

  return router;
}

/** Used by the AI routes to ground Gemini in live Panta data for a market. */
export async function getMarketSnapshotForAi(marketId: string) {
  if (!isPantaConfigured() || !isPubkey(marketId)) return null;
  try {
    const [market, trades] = await Promise.all([
      getEnrichedMarket(marketId),
      cached(`trades:${marketId}`, 15_000, () =>
        pantaFetch<{ items: PantaTradeRow[] }>('read', `/markets/${encodeURIComponent(marketId)}/trades/?limit=100`)
      ).catch(() => ({ items: [] as PantaTradeRow[] }))
    ]);
    return { market, trades: trades.items || [], history: priceHistory[marketId] || [] };
  } catch {
    return null;
  }
}
