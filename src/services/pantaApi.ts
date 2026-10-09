/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Browser client for DuckCast's /api/panta proxy (see server/panta.ts).
 * The Panta API key stays on the server; the browser only ever sees
 * market data and unsigned transactions for the user's wallet to sign.
 */

export interface PantaMarket {
  marketId: string;
  title: string;
  description: string;
  category: string;
  image: string | null;
  phase: string; // primary | secondary | resolved | cancelled
  marketType: string; // standard | breaking
  startTime: number;
  endTime: number;
  resolutionTime: number;
  region: string;
  resolved: boolean;
  status: string;
  volumeUsdc: number;
  yesPrice: number | null; // 0..1
  noPrice: number | null; // 0..1
  createdByPartner: boolean;
  pricedAt: number | null;
}

export interface PantaTrade {
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
}

export interface PantaInstruction {
  programId: string;
  data: string; // base64
  accounts: Array<{ pubkey: string; isSigner: boolean; isWritable: boolean }>;
}

export interface PantaQuote {
  quoteId: string;
  marketId: string;
  side: 'yes' | 'no';
  amountUsdc: string;
  shares: string;
  avgPrice: string;
  feeUsdc: string;
  expiresAt: string;
}

export interface PantaOrderBuild {
  orderId: string;
  quoteId: string;
  wallet: string;
  marketId: string;
  side: 'yes' | 'no';
  amountUsdc: string;
  expectedShares: string;
  feeUsdc: string;
  status: string;
  instructions: PantaInstruction[];
  recentBlockhash: string;
  lastValidBlockHeight: number;
  expiresAt: string;
}

export interface PantaOrderStatus {
  orderId: string;
  status: 'built' | 'submitted' | 'confirmed' | 'failed' | 'expired';
  signature?: string;
  marketId?: string;
  side?: string;
}

export interface PantaPosition {
  marketId: string;
  category: string | null;
  side: 'yes' | 'no';
  shares: string;
  sharesNum: number;
  phase: string;
  claimable: boolean;
  claimed: boolean;
  outcome: 'yes' | 'no' | null;
  estValueUsdc: number | null;
  valuation: 'mark' | 'settled_win' | 'settled_loss' | 'unknown';
  market: PantaMarket | null;
}

export interface PantaClaimBuild {
  wallet: string;
  marketId: string;
  outcome?: string;
  winningShares?: string;
  instructions: PantaInstruction[];
  recentBlockhash: string;
  lastValidBlockHeight: number;
}

export interface PantaCreateQuote {
  createId: string;
  expectedEventPda: string;
  paymentUsdc: string; // base units
  liquidityInjectionUsdc: string;
  platformRevenueUsdc: string;
  marketType: string;
  expiresAt: string;
}

export interface PantaCreateBuild {
  createId: string;
  expectedEventPda: string;
  transaction: string; // base64 VersionedTransaction
  recentBlockhash: string;
  lastValidBlockHeight: number;
  paymentUsdc: string;
}

export interface PantaStatus {
  configured: boolean;
  ok: boolean;
  account?: { name: string | null; status: string | null; canCreateMarkets: boolean };
  error?: { code: string; message: string };
}

export class PantaApiError extends Error {
  code: string;
  status: number;
  field?: string;

  constructor(status: number, code: string, message: string, field?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.field = field;
  }
}

/** Human-readable copy for Panta's documented error codes. */
export function describePantaError(err: unknown): string {
  if (!(err instanceof PantaApiError)) return (err as Error)?.message || 'Something went wrong.';
  switch (err.code) {
    case 'QUOTE_EXPIRED':
      return 'Your quote expired before it was signed. Please try again.';
    case 'QUOTE_STALE':
      return 'The price moved beyond your slippage limit. Re-quote and try again.';
    case 'AMOUNT_TOO_SMALL':
      return 'That amount is below the minimum fill for this market.';
    case 'MARKET_NOT_IN_PRIMARY':
      return 'This market is not accepting primary buys right now.';
    case 'MARKET_NOT_FOUND':
      return 'Panta could not find this market on-chain.';
    case 'NOT_CLAIMABLE':
      return 'This position is not claimable yet.';
    case 'RATE_LIMITED':
      return 'Too many requests right now. Please wait a few seconds.';
    case 'PANTA_NOT_CONFIGURED':
      return 'Live trading is unavailable: the DuckCast server has no Panta API key.';
    case 'TX_NOT_FOUND':
      return 'Transaction not found on-chain yet. It may still be confirming.';
    case 'TX_FAILED':
      return 'The transaction failed on-chain.';
    case 'DUPLICATE_MARKET':
      return 'A market with this question already exists for your wallet.';
    case 'CREATE_NOT_PERMITTED':
      return 'Market creation is disabled for this Panta account.';
    case 'CREATE_EXPIRED':
      return 'The market creation session expired. Please start again.';
    default:
      return err.message || `Panta error (${err.code})`;
  }
}

async function request<T>(path: string, init?: { method?: 'GET' | 'POST'; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/panta${path}`, {
      method: init?.method || 'GET',
      headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined
    });
  } catch {
    throw new PantaApiError(0, 'NETWORK_ERROR', 'Could not reach the DuckCast server.');
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new PantaApiError(res.status, json?.code || 'HTTP_ERROR', json?.message || `Request failed (${res.status})`, json?.field);
  }
  return json as T;
}

export const pantaApi = {
  status: () => request<PantaStatus>('/status'),
  categories: () => request<{ categories: string[] }>('/categories'),
  markets: () =>
    request<{ items: PantaMarket[]; fetchedAt: string; history: Record<string, Array<[number, number]>> }>('/markets'),
  market: (marketId: string) =>
    request<{ market: PantaMarket; trades: PantaTrade[]; priceHistory: Array<[number, number]> }>(
      `/markets/${encodeURIComponent(marketId)}`
    ),
  positions: (wallet: string) =>
    request<{ wallet: string; positions: PantaPosition[] }>(`/positions?wallet=${encodeURIComponent(wallet)}`),
  walletTrades: (wallet: string) => request<{ items: PantaTrade[] }>(`/wallets/${encodeURIComponent(wallet)}/trades`),

  quote: (body: { wallet: string; marketId: string; side: 'yes' | 'no'; amountUsdc: number }) =>
    request<PantaQuote>('/orders/quote', { method: 'POST', body }),
  build: (body: { quoteId: string; wallet: string; maxSlippageBps?: number }) =>
    request<PantaOrderBuild>('/orders/build', { method: 'POST', body }),
  submit: (body: { orderId: string; signature: string; wallet: string }) =>
    request<PantaOrderStatus>('/orders/submit', { method: 'POST', body }),
  verify: (body: { orderId: string; signature?: string; wallet?: string }) =>
    request<PantaOrderStatus>('/orders/verify', { method: 'POST', body }),
  reportTrade: (body: { signature: string; wallet: string; marketId: string; quoteId?: string; clientOrderId?: string }) =>
    request<{ status: string; kind: string }>('/trades/report', { method: 'POST', body }),

  buildClaim: (body: { wallet: string; marketId: string }) =>
    request<PantaClaimBuild>('/claims/build', { method: 'POST', body }),
  buildCreatorFeeClaim: (body: { wallet: string; marketId: string }) =>
    request<PantaClaimBuild>('/claims/creator-fees/build', { method: 'POST', body }),

  createQuote: (body: Record<string, unknown>) => request<PantaCreateQuote>('/markets/create/quote', { method: 'POST', body }),
  createBuild: (body: { createId: string; wallet: string }) =>
    request<PantaCreateBuild>('/markets/create/build', { method: 'POST', body }),
  registerMarket: (body: { createId: string; signature: string }) =>
    request<{ marketId: string; status: string }>('/markets/register', { method: 'POST', body }),
  imageUploadSignature: () =>
    request<{ uploadUrl: string; fields: Record<string, string | number> }>('/markets/create/image-upload', {
      method: 'POST',
      body: {}
    })
};
