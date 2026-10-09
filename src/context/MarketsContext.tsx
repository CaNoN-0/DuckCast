/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Single source of market data for the app.
 * - "panta": live markets from the Panta API (via DuckCast's server proxy)
 * - "demo":  bundled sample markets, shown only when the server has no Panta key
 *            or Panta is unreachable — always labelled as demo data in the UI.
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { PredictionMarket } from '../types/market';
import { MOCK_MARKETS } from '../data/mockMarkets';
import { pantaApi, PantaStatus, describePantaError } from '../services/pantaApi';
import { applyFeedHighlights, pantaToPredictionMarket } from '../services/pantaAdapter';

export type MarketSource = 'loading' | 'panta' | 'demo';

interface MarketsContextValue {
  source: MarketSource;
  markets: PredictionMarket[];
  status: PantaStatus | null;
  /** Why we fell back to demo data, if we did */
  demoReason: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  /** Merge a market refreshed elsewhere (e.g. detail page) back into the list */
  upsertMarket: (market: PredictionMarket) => void;
}

const MarketsContext = createContext<MarketsContextValue | undefined>(undefined);

const REFRESH_MS = 30_000;

export function MarketsProvider({ children }: { children: React.ReactNode }) {
  const [source, setSource] = useState<MarketSource>('loading');
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [status, setStatus] = useState<PantaStatus | null>(null);
  const [demoReason, setDemoReason] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const marketsRef = useRef<PredictionMarket[]>([]);
  marketsRef.current = markets;

  const fallBackToDemo = useCallback((reason: string) => {
    setSource('demo');
    setDemoReason(reason);
    setMarkets(MOCK_MARKETS);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const st = await pantaApi.status();
      setStatus(st);
      if (!st.configured) {
        fallBackToDemo('The DuckCast server has no PANTA_API_KEY configured.');
        return;
      }
      if (!st.ok) {
        throw new Error(st.error?.message || 'Panta API is unreachable right now.');
      }

      const feed = await pantaApi.markets();
      const previousById = new Map(marketsRef.current.map((m) => [m.id, m]));
      const mapped = feed.items.map((m) =>
        pantaToPredictionMarket(m, { history: feed.history?.[m.marketId], previous: previousById.get(m.marketId) })
      );
      setMarkets(applyFeedHighlights(mapped));
      setSource('panta');
      setDemoReason(null);
      setLastUpdated(new Date());
    } catch (err) {
      // Keep showing the last live data if we had it; otherwise fall back to demo.
      if (marketsRef.current.length && marketsRef.current[0]?.isPanta) {
        console.warn('[Markets] Refresh failed, keeping last live data:', err);
        return;
      }
      fallBackToDemo(describePantaError(err));
    }
  }, [fallBackToDemo]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(t);
  }, [refresh]);

  const upsertMarket = useCallback((market: PredictionMarket) => {
    setMarkets((prev) => {
      const idx = prev.findIndex((m) => m.id === market.id);
      if (idx < 0) return [market, ...prev];
      const next = prev.slice();
      next[idx] = { ...market, isTrending: prev[idx].isTrending, isHighVolume: prev[idx].isHighVolume };
      return next;
    });
  }, []);

  return (
    <MarketsContext.Provider value={{ source, markets, status, demoReason, lastUpdated, refresh, upsertMarket }}>
      {children}
    </MarketsContext.Provider>
  );
}

export function useMarkets() {
  const ctx = useContext(MarketsContext);
  if (!ctx) throw new Error('useMarkets must be used within a MarketsProvider');
  return ctx;
}
