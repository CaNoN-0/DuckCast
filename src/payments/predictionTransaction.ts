/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Real on-chain prediction flows powered by the Panta API.
 *
 *   Buy:    quote -> build -> wallet signs + broadcasts -> submit -> confirm -> verify -> report (attribution)
 *   Claim:  build claim -> wallet signs + broadcasts -> confirm -> report (attribution)
 *   Create: quote fee -> build tx -> wallet signs + broadcasts -> confirm -> register
 *
 * Panta never holds keys and DuckCast never holds keys: the user's wallet signs every transaction.
 */

import { SolanaNetworkType, getSolscanTxUrl } from '../solana/config';
import { getSolanaConnection } from '../solana/connection';
import { pantaApi, PantaApiError, PantaCreateQuote } from '../services/pantaApi';
import {
  SolanaSigner,
  compileInstructions,
  confirmSignature,
  deserializeTransaction,
  isUserRejection,
  signAndBroadcast
} from '../solana/transactions';

// Panta markets settle in native USDC on Solana mainnet.
export const PANTA_NETWORK: SolanaNetworkType = 'mainnet-beta';

export type TransactionStep =
  | 'idle'
  | 'quoting'
  | 'building'
  | 'waiting_approval'
  | 'submitting'
  | 'confirming'
  | 'confirmed'
  | 'rejected'
  | 'failed';

export interface PredictionTransactionRecord {
  id: string;
  kind: 'buy' | 'claim' | 'create' | 'creator_fees';
  signature: string;
  walletAddress: string;
  marketId: string;
  marketQuestion: string;
  position?: 'YES' | 'NO';
  usdcAmount: number;
  sharesBought: number;
  timestamp: string;
  status: 'confirmed' | 'failed' | 'pending';
  network: SolanaNetworkType;
  explorerUrl: string;
}

export class UserRejectedError extends Error {
  constructor() {
    super('Transaction was cancelled in your wallet.');
  }
}

type StatusCallback = (step: TransactionStep, message?: string) => void;

// Local receipt cache of trades initiated from this browser (positions themselves come from Panta).
const TRANSACTION_STORAGE_KEY = 'duckcast_panta_transactions';

export function getStoredTransactions(walletAddress?: string): PredictionTransactionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TRANSACTION_STORAGE_KEY);
    if (!raw) return [];
    const parsed: PredictionTransactionRecord[] = JSON.parse(raw);
    if (!walletAddress) return parsed;
    return parsed.filter((tx) => tx.walletAddress === walletAddress);
  } catch {
    return [];
  }
}

export function saveTransactionRecord(record: PredictionTransactionRecord) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredTransactions();
    const updated = [record, ...existing.filter((t) => t.id !== record.id)].slice(0, 200);
    localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function signOrThrow(signer: SolanaSigner, tx: Parameters<typeof signAndBroadcast>[1], onStatus: StatusCallback) {
  const connection = getSolanaConnection(PANTA_NETWORK);
  onStatus('waiting_approval', 'Approve the transaction in your wallet…');
  try {
    return await signAndBroadcast(signer, tx, connection);
  } catch (err) {
    if (isUserRejection(err)) {
      onStatus('rejected', 'Transaction was cancelled in your wallet.');
      throw new UserRejectedError();
    }
    throw err;
  }
}

/**
 * Confirms on our RPC. If the RPC itself is unreachable we don't fail the trade,
 * because Panta's verify endpoint independently confirms on-chain.
 */
async function confirmBestEffort(signature: string, blockhash: string, lastValidBlockHeight: number): Promise<boolean> {
  try {
    await confirmSignature(getSolanaConnection(PANTA_NETWORK), signature, blockhash, lastValidBlockHeight);
    return true;
  } catch (err: any) {
    if (String(err?.message || '').startsWith('Transaction failed on-chain')) throw err;
    console.warn('[Panta] RPC confirmation unavailable, relying on Panta verify:', err?.message);
    return false;
  }
}

export interface BuyParams {
  wallet: string;
  marketId: string;
  marketQuestion: string;
  side: 'YES' | 'NO';
  amountUsdc: number;
  signer: SolanaSigner;
  maxSlippageBps?: number;
}

export async function executePantaBuy(params: BuyParams, onStatus: StatusCallback): Promise<PredictionTransactionRecord> {
  const { wallet, marketId, marketQuestion, side, amountUsdc, signer, maxSlippageBps = 100 } = params;

  try {
    onStatus('quoting', 'Getting a live quote from Panta…');
    const quote = await pantaApi.quote({ wallet, marketId, side: side === 'YES' ? 'yes' : 'no', amountUsdc });

    onStatus('building', `Building transaction for ~${Number(quote.shares).toFixed(2)} ${side} shares…`);
    const build = await pantaApi.build({ quoteId: quote.quoteId, wallet, maxSlippageBps });
    const tx = compileInstructions(build.instructions, build.recentBlockhash, wallet);

    const signature = await signOrThrow(signer, tx, onStatus);

    onStatus('submitting', 'Registering your order with Panta…');
    await pantaApi.submit({ orderId: build.orderId, signature, wallet }).catch(async () => {
      await sleep(1000);
      return pantaApi.submit({ orderId: build.orderId, signature, wallet }); // idempotent per docs
    });

    onStatus('confirming', 'Waiting for Solana confirmation…');
    const chainConfirmed = await confirmBestEffort(signature, build.recentBlockhash, build.lastValidBlockHeight);

    let pantaStatus: string = 'submitted';
    for (let i = 0; i < 10; i++) {
      try {
        const v = await pantaApi.verify({ orderId: build.orderId, signature, wallet });
        pantaStatus = v.status;
        if (v.status === 'confirmed' || v.status === 'failed') break;
      } catch {
        // keep polling
      }
      await sleep(2000);
    }
    if (pantaStatus === 'failed') throw new Error('Panta could not confirm this order on-chain.');

    // Attribute the verified buy to DuckCast's Panta account (idempotent by signature).
    pantaApi
      .reportTrade({ signature, wallet, marketId, quoteId: quote.quoteId, clientOrderId: build.orderId })
      .catch((err) => console.warn('[Panta] Trade attribution pending:', err?.message));

    const confirmed = pantaStatus === 'confirmed' || chainConfirmed;
    const record: PredictionTransactionRecord = {
      id: build.orderId,
      kind: 'buy',
      signature,
      walletAddress: wallet,
      marketId,
      marketQuestion,
      position: side,
      usdcAmount: amountUsdc,
      sharesBought: Number(build.expectedShares || quote.shares) || 0,
      timestamp: new Date().toISOString(),
      status: confirmed ? 'confirmed' : 'pending',
      network: PANTA_NETWORK,
      explorerUrl: getSolscanTxUrl(signature, PANTA_NETWORK)
    };
    saveTransactionRecord(record);
    onStatus(
      'confirmed',
      confirmed
        ? `Bought ~${record.sharesBought.toFixed(2)} ${side} shares on Panta.`
        : 'Transaction sent. Panta is still confirming it.'
    );
    return record;
  } catch (err) {
    if (!(err instanceof UserRejectedError)) {
      onStatus('failed', err instanceof PantaApiError ? err.message : (err as Error)?.message || 'Transaction failed.');
    }
    throw err;
  }
}

export interface ClaimParams {
  wallet: string;
  marketId: string;
  marketQuestion: string;
  signer: SolanaSigner;
  kind?: 'claim' | 'creator_fees';
}

export async function executePantaClaim(params: ClaimParams, onStatus: StatusCallback): Promise<PredictionTransactionRecord> {
  const { wallet, marketId, marketQuestion, signer, kind = 'claim' } = params;
  try {
    onStatus('building', kind === 'claim' ? 'Building your win claim…' : 'Building creator fee claim…');
    const build =
      kind === 'claim'
        ? await pantaApi.buildClaim({ wallet, marketId })
        : await pantaApi.buildCreatorFeeClaim({ wallet, marketId });
    const tx = compileInstructions(build.instructions, build.recentBlockhash, wallet);

    const signature = await signOrThrow(signer, tx, onStatus);

    onStatus('confirming', 'Waiting for Solana confirmation…');
    const confirmed = await confirmBestEffort(signature, build.recentBlockhash, build.lastValidBlockHeight);

    // Win claims are attributable; creator-fee claims must NOT be reported (docs: TX_MISMATCH).
    if (kind === 'claim') {
      pantaApi.reportTrade({ signature, wallet, marketId }).catch((err) => console.warn('[Panta] Claim attribution pending:', err?.message));
    }

    const record: PredictionTransactionRecord = {
      id: `${kind}-${signature.slice(0, 16)}`,
      kind,
      signature,
      walletAddress: wallet,
      marketId,
      marketQuestion,
      usdcAmount: Number(build.winningShares) || 0,
      sharesBought: 0,
      timestamp: new Date().toISOString(),
      status: confirmed ? 'confirmed' : 'pending',
      network: PANTA_NETWORK,
      explorerUrl: getSolscanTxUrl(signature, PANTA_NETWORK)
    };
    saveTransactionRecord(record);
    onStatus('confirmed', kind === 'claim' ? 'Winnings claimed to your wallet.' : 'Creator fees claimed to your wallet.');
    return record;
  } catch (err) {
    if (!(err instanceof UserRejectedError)) {
      onStatus('failed', (err as Error)?.message || 'Claim failed.');
    }
    throw err;
  }
}

export interface CreateMarketInput {
  wallet: string;
  question: string;
  title?: string;
  description?: string;
  resolutionRule: string;
  sourcesOfTruth: string[];
  category: string;
  startTime: number;
  endTime: number;
  resolutionTime: number;
  imageUrl: string;
  region?: string;
}

export async function quoteMarketCreation(input: CreateMarketInput): Promise<PantaCreateQuote> {
  return pantaApi.createQuote({ ...input, marketType: 'standard' });
}

export async function executeMarketCreation(
  params: { wallet: string; createId: string; question: string; feeUsdc: number; signer: SolanaSigner },
  onStatus: StatusCallback
): Promise<{ marketId: string; record: PredictionTransactionRecord }> {
  const { wallet, createId, question, feeUsdc, signer } = params;
  try {
    onStatus('building', 'Building the market creation transaction…');
    const build = await pantaApi.createBuild({ createId, wallet });
    const tx = deserializeTransaction(build.transaction);

    const signature = await signOrThrow(signer, tx, onStatus);

    onStatus('confirming', 'Waiting for Solana confirmation…');
    await confirmBestEffort(signature, build.recentBlockhash, build.lastValidBlockHeight);

    onStatus('submitting', 'Registering the market in the Panta catalog…');
    let marketId = '';
    let lastErr: unknown = null;
    for (let i = 0; i < 6; i++) {
      try {
        const reg = await pantaApi.registerMarket({ createId, signature });
        marketId = reg.marketId;
        break;
      } catch (err) {
        lastErr = err;
        // Register needs the tx at the required commitment; retry while it propagates.
        if (err instanceof PantaApiError && err.code === 'TX_NOT_FOUND') {
          await sleep(2500);
          continue;
        }
        throw err;
      }
    }
    if (!marketId) throw lastErr || new Error('Market registration did not complete.');

    const record: PredictionTransactionRecord = {
      id: `create-${createId}`,
      kind: 'create',
      signature,
      walletAddress: wallet,
      marketId,
      marketQuestion: question,
      usdcAmount: feeUsdc,
      sharesBought: 0,
      timestamp: new Date().toISOString(),
      status: 'confirmed',
      network: PANTA_NETWORK,
      explorerUrl: getSolscanTxUrl(signature, PANTA_NETWORK)
    };
    saveTransactionRecord(record);
    onStatus('confirmed', 'Market created on Panta!');
    return { marketId, record };
  } catch (err) {
    if (!(err instanceof UserRejectedError)) {
      onStatus('failed', (err as Error)?.message || 'Market creation failed.');
    }
    throw err;
  }
}
