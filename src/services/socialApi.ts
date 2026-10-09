/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Client for DuckCast's social layer (server/social.ts): wallet-signed theses
 * that the server stamps with the author's live Panta position.
 */

import { Buffer } from 'buffer';
import type { SolanaSigner } from '../solana/transactions';

export interface SocialThesis {
  id: string;
  marketId: string;
  marketTitle: string;
  wallet: string;
  side: 'YES' | 'NO';
  text: string;
  createdAt: string;
  signed: boolean;
  position: { shares: number; estValueUsdc: number | null; checkedAt: string } | null;
  reactions: { agree: number; fire: number; insightful: number };
  viewerReacted: { agree: boolean; fire: boolean; insightful: boolean };
}

export interface SocialBattle {
  id: string;
  marketId: string;
  marketTitle: string;
  yes: SocialThesis;
  no: SocialThesis;
  potUsdc: number;
}

/** Must match buildThesisMessage() in server/social.ts exactly. */
export function buildThesisMessage(p: { marketId: string; side: 'YES' | 'NO'; wallet: string; text: string; issuedAt: string }) {
  return ['DuckCast thesis', `Market: ${p.marketId}`, `Side: ${p.side}`, `Wallet: ${p.wallet}`, `Issued: ${p.issuedAt}`, '', p.text].join('\n');
}

/** Anonymous per-browser id for reactions (reactions don't need a wallet). */
export function getViewerId(wallet?: string | null): string {
  if (wallet) return wallet;
  try {
    let id = localStorage.getItem('duckcast_viewer_id');
    if (!id) {
      id = `anon-${crypto.randomUUID()}`;
      localStorage.setItem('duckcast_viewer_id', id);
    }
    return id;
  } catch {
    return `anon-session-${Math.random().toString(36).slice(2, 12)}`;
  }
}

async function request<T>(path: string, init?: { method?: 'GET' | 'POST'; body?: unknown }): Promise<T> {
  const res = await fetch(`/api/social${path}`, {
    method: init?.method || 'GET',
    headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  return json as T;
}

export const socialApi = {
  theses: (marketId: string, viewer?: string) =>
    request<{ items: SocialThesis[] }>(
      `/theses?marketId=${encodeURIComponent(marketId)}${viewer ? `&viewer=${encodeURIComponent(viewer)}` : ''}`
    ),
  recentTheses: () => request<{ items: SocialThesis[] }>('/theses'),
  thesesByWallet: (wallet: string) => request<{ items: SocialThesis[] }>(`/theses?wallet=${encodeURIComponent(wallet)}`),
  battles: () => request<{ items: SocialBattle[] }>('/battles'),
  react: (thesisId: string, reaction: 'agree' | 'fire' | 'insightful', viewer: string) =>
    request<{ item: SocialThesis }>(`/theses/${encodeURIComponent(thesisId)}/react`, {
      method: 'POST',
      body: { reaction, viewer }
    }),

  async postThesis(p: {
    marketId: string;
    marketTitle: string;
    wallet: string;
    side: 'YES' | 'NO';
    text: string;
    signer: SolanaSigner;
  }): Promise<SocialThesis> {
    if (!p.signer.signMessage) throw new Error('Your wallet does not support message signing.');
    const issuedAt = new Date().toISOString();
    const text = p.text.trim();
    const message = buildThesisMessage({ marketId: p.marketId, side: p.side, wallet: p.wallet, text, issuedAt });
    const sig = await p.signer.signMessage(new TextEncoder().encode(message));
    const res = await request<{ item: SocialThesis }>('/theses', {
      method: 'POST',
      body: {
        marketId: p.marketId,
        marketTitle: p.marketTitle,
        wallet: p.wallet,
        side: p.side,
        text,
        issuedAt,
        signature: Buffer.from(sig).toString('base64')
      }
    });
    return res.item;
  }
};
