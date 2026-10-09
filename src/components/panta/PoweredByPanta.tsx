/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useMarkets } from '../../context/MarketsContext';

/**
 * Attribution required by the Panta Public API Terms of Use §6:
 * must read exactly "Powered by Panta", be legible, and link to panta.market.
 */
export function PoweredByPanta({ className = '', tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  return (
    <a
      href="https://panta.market"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 text-[11px] font-bold tracking-tight rounded-md px-2 py-1 border transition-colors ${
        tone === 'dark'
          ? 'text-neutral-800 bg-white border-neutral-200 hover:border-neutral-400'
          : 'text-white/90 bg-white/10 border-white/20 hover:bg-white/20'
      } ${className}`}
    >
      <svg viewBox="0 0 16 16" className="w-3 h-3" aria-hidden="true">
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M6 4.5h2.6a2.2 2.2 0 0 1 0 4.4H6V4.5Zm0 4.4v3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span>Powered by Panta</span>
    </a>
  );
}

/** Tells users (and judges) whether they're looking at live Panta markets or demo data. */
export function MarketSourceBanner() {
  const { source, demoReason, lastUpdated, markets } = useMarkets();

  if (source === 'loading') {
    return (
      <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 bg-white border border-neutral-200 rounded-xl px-4 py-2.5">
        <span className="w-2 h-2 rounded-full bg-neutral-300 animate-pulse" />
        Loading live markets from Panta…
      </div>
    );
  }

  if (source === 'demo') {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-2 font-semibold">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Demo data — live trading disabled.</span>
          {demoReason && <span className="font-normal text-amber-800/90">{demoReason}</span>}
        </div>
        <PoweredByPanta />
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-emerald-50/70 border border-emerald-200 text-emerald-900 rounded-xl px-4 py-2.5">
      <div className="flex items-center gap-2 font-semibold">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>
          {markets.length} live markets on Solana · prices from Panta
          {lastUpdated && <span className="font-normal text-emerald-800/80"> · updated {lastUpdated.toLocaleTimeString()}</span>}
        </span>
      </div>
      <PoweredByPanta />
    </div>
  );
}
