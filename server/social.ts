/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * DuckCast social layer: wallet-signed prediction theses stamped with the
 * author's live Panta position, plus Prediction Battles derived from them.
 *
 * - The wallet signature proves the author controls the address.
 * - The Panta /positions/ lookup proves they actually hold shares on the side
 *   they argue for, so "staked YES" badges are verified, not self-reported.
 */

import { Router } from 'express';
import { createPublicKey, verify as verifySignature, randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { getWalletPositions, isPantaConfigured } from './panta.ts';

type Side = 'YES' | 'NO';
type Reaction = 'agree' | 'fire' | 'insightful';

export interface StoredThesis {
  id: string;
  marketId: string;
  marketTitle: string;
  wallet: string;
  side: Side;
  text: string;
  createdAt: string;
  signed: boolean;
  position: { shares: number; estValueUsdc: number | null; checkedAt: string } | null;
  reactions: Record<Reaction, number>;
  reactedBy: Record<Reaction, string[]>;
}

const STORE_FILE = path.resolve(process.cwd(), 'data', 'social.json');
let theses: StoredThesis[] = [];
let writeTimer: NodeJS.Timeout | null = null;

export async function loadSocialStore() {
  try {
    const parsed = JSON.parse(await fs.readFile(STORE_FILE, 'utf8'));
    theses = Array.isArray(parsed.theses) ? parsed.theses : [];
  } catch {
    theses = [];
  }
}

function persistSoon() {
  if (writeTimer) return;
  writeTimer = setTimeout(async () => {
    writeTimer = null;
    try {
      await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
      await fs.writeFile(STORE_FILE, JSON.stringify({ theses }, null, 2));
    } catch (err) {
      console.warn('[Social] Could not persist store:', (err as Error).message);
    }
  }, 500);
}

// ---------------------------------------------------------------------------
// Wallet signature verification (Solana wallets sign with ed25519)
// ---------------------------------------------------------------------------

const B58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Decode(s: string): Uint8Array | null {
  let num = 0n;
  for (const ch of s) {
    const v = B58_ALPHABET.indexOf(ch);
    if (v < 0) return null;
    num = num * 58n + BigInt(v);
  }
  const bytes: number[] = [];
  while (num > 0n) {
    bytes.unshift(Number(num % 256n));
    num /= 256n;
  }
  for (const ch of s) {
    if (ch !== '1') break;
    bytes.unshift(0);
  }
  return new Uint8Array(bytes);
}

function verifyWalletSignature(wallet: string, message: string, signatureB64: string): boolean {
  const pub = base58Decode(wallet);
  if (!pub || pub.length !== 32) return false;
  try {
    const key = createPublicKey({
      key: { kty: 'OKP', crv: 'Ed25519', x: Buffer.from(pub).toString('base64url') },
      format: 'jwk'
    });
    return verifySignature(null, Buffer.from(message, 'utf8'), key, Buffer.from(signatureB64, 'base64'));
  } catch {
    return false;
  }
}

/** Must match buildThesisMessage() in src/services/socialApi.ts exactly. */
function buildThesisMessage(p: { marketId: string; side: Side; wallet: string; text: string; issuedAt: string }) {
  return [
    'DuckCast thesis',
    `Market: ${p.marketId}`,
    `Side: ${p.side}`,
    `Wallet: ${p.wallet}`,
    `Issued: ${p.issuedAt}`,
    '',
    p.text
  ].join('\n');
}

const isPubkey = (v: unknown): v is string => typeof v === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v);

function publicView(t: StoredThesis, viewer?: string) {
  const { reactedBy, ...rest } = t;
  return {
    ...rest,
    viewerReacted: viewer
      ? {
          agree: reactedBy.agree.includes(viewer),
          fire: reactedBy.fire.includes(viewer),
          insightful: reactedBy.insightful.includes(viewer)
        }
      : { agree: false, fire: false, insightful: false }
  };
}

function rankTheses(list: StoredThesis[]) {
  return [...list].sort((a, b) => {
    const stakeA = a.position?.estValueUsdc ?? 0;
    const stakeB = b.position?.estValueUsdc ?? 0;
    if ((b.position ? 1 : 0) !== (a.position ? 1 : 0)) return (b.position ? 1 : 0) - (a.position ? 1 : 0);
    if (stakeB !== stakeA) return stakeB - stakeA;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function createSocialRouter(): Router {
  const router = Router();

  router.get('/theses', (req, res) => {
    const marketId = typeof req.query.marketId === 'string' ? req.query.marketId : undefined;
    const author = typeof req.query.wallet === 'string' ? req.query.wallet : undefined;
    const viewer = typeof req.query.viewer === 'string' ? req.query.viewer.slice(0, 64) : undefined;
    const list = theses.filter((t) => (!marketId || t.marketId === marketId) && (!author || t.wallet === author));
    res.json({ items: rankTheses(list).slice(0, 100).map((t) => publicView(t, viewer)) });
  });

  router.post('/theses', async (req, res) => {
    const { marketId, marketTitle, wallet, side, text, issuedAt, signature } = req.body || {};
    if (!isPubkey(marketId)) return res.status(400).json({ code: 'INVALID_PARAMS', field: 'marketId', message: 'Theses can only be posted on live Panta markets.' });
    if (!isPubkey(wallet)) return res.status(400).json({ code: 'INVALID_PARAMS', field: 'wallet', message: 'Connect a Solana wallet to post.' });
    if (side !== 'YES' && side !== 'NO') return res.status(400).json({ code: 'INVALID_PARAMS', field: 'side', message: 'side must be YES or NO' });
    if (typeof text !== 'string' || text.trim().length < 10 || text.length > 600) {
      return res.status(400).json({ code: 'INVALID_PARAMS', field: 'text', message: 'Thesis must be 10-600 characters.' });
    }
    const issued = Date.parse(issuedAt);
    if (!Number.isFinite(issued) || Math.abs(Date.now() - issued) > 10 * 60_000) {
      return res.status(400).json({ code: 'INVALID_PARAMS', field: 'issuedAt', message: 'Signature expired. Please sign again.' });
    }
    if (typeof signature !== 'string' || signature.length > 200) {
      return res.status(400).json({ code: 'INVALID_SIGNATURE', message: 'Missing wallet signature.' });
    }

    const message = buildThesisMessage({ marketId, side, wallet, text, issuedAt });
    if (!verifyWalletSignature(wallet, message, signature)) {
      return res.status(401).json({ code: 'INVALID_SIGNATURE', message: 'Wallet signature did not verify.' });
    }

    // Stamp the thesis with the author's live Panta position on the side they argue.
    let position: StoredThesis['position'] = null;
    if (isPantaConfigured()) {
      try {
        const positions = await getWalletPositions(wallet);
        const match = positions.find((p) => p.marketId === marketId && p.side === side.toLowerCase() && p.sharesNum > 0);
        if (match) {
          position = { shares: match.sharesNum, estValueUsdc: match.estValueUsdc, checkedAt: new Date().toISOString() };
        }
      } catch (err) {
        console.warn('[Social] Position lookup failed:', (err as Error).message);
      }
    }

    const thesis: StoredThesis = {
      id: randomUUID(),
      marketId,
      marketTitle: typeof marketTitle === 'string' ? marketTitle.slice(0, 300) : '',
      wallet,
      side,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      signed: true,
      position,
      reactions: { agree: 0, fire: 0, insightful: 0 },
      reactedBy: { agree: [], fire: [], insightful: [] }
    };
    theses.push(thesis);
    persistSoon();
    res.status(201).json({ item: publicView(thesis, wallet) });
  });

  router.post('/theses/:id/react', (req, res) => {
    const { reaction, viewer } = req.body || {};
    if (!['agree', 'fire', 'insightful'].includes(reaction)) return res.status(400).json({ code: 'INVALID_PARAMS', message: 'unknown reaction' });
    if (typeof viewer !== 'string' || viewer.length < 8 || viewer.length > 64) {
      return res.status(400).json({ code: 'INVALID_PARAMS', message: 'viewer id required' });
    }
    const thesis = theses.find((t) => t.id === req.params.id);
    if (!thesis) return res.status(404).json({ code: 'NOT_FOUND', message: 'Thesis not found' });

    const key = reaction as Reaction;
    const list = thesis.reactedBy[key];
    const idx = list.indexOf(viewer);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(viewer);
    thesis.reactions[key] = list.length;
    persistSoon();
    res.json({ item: publicView(thesis, viewer) });
  });

  /**
   * Prediction Battles: for each market, the strongest position-verified YES
   * thesis vs the strongest position-verified NO thesis.
   */
  router.get('/battles', (_req, res) => {
    const byMarket = new Map<string, StoredThesis[]>();
    for (const t of theses) {
      if (!t.position) continue;
      const list = byMarket.get(t.marketId) || [];
      list.push(t);
      byMarket.set(t.marketId, list);
    }

    const battles = [];
    for (const [marketId, list] of byMarket) {
      const ranked = rankTheses(list);
      const yes = ranked.find((t) => t.side === 'YES');
      const no = ranked.find((t) => t.side === 'NO');
      if (!yes || !no) continue;
      battles.push({
        id: `battle-${marketId}`,
        marketId,
        marketTitle: yes.marketTitle || no.marketTitle,
        yes: publicView(yes),
        no: publicView(no),
        potUsdc: (yes.position?.estValueUsdc ?? 0) + (no.position?.estValueUsdc ?? 0)
      });
    }
    battles.sort((a, b) => b.potUsdc - a.potUsdc);
    res.json({ items: battles.slice(0, 12) });
  });

  return router;
}
