/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import {
  SolanaNetworkType,
  SOLANA_NETWORKS,
  DEFAULT_SOLANA_NETWORK
} from './config';

// Active connection cache by network type
const connections = new Map<SolanaNetworkType, Connection>();

export function getSolanaConnection(network: SolanaNetworkType = DEFAULT_SOLANA_NETWORK): Connection {
  if (!connections.has(network)) {
    const rpcUrl = SOLANA_NETWORKS[network].rpcUrl;
    connections.set(
      network,
      new Connection(rpcUrl, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 30000
      })
    );
  }
  return connections.get(network)!;
}

/**
 * Fetch native SOL balance for transaction fee validation
 */
export async function getSolBalance(
  address: string,
  network: SolanaNetworkType = DEFAULT_SOLANA_NETWORK
): Promise<number> {
  try {
    const pubkey = new PublicKey(address);
    const conn = getSolanaConnection(network);
    const lamports = await conn.getBalance(pubkey);
    return lamports / LAMPORTS_PER_SOL;
  } catch (err) {
    console.warn('[Solana] Error fetching SOL balance:', err);
    return 0;
  }
}

/**
 * Fetch native USDC SPL Token balance for the specified wallet address
 */
export async function getUsdcBalance(
  address: string,
  network: SolanaNetworkType = DEFAULT_SOLANA_NETWORK
): Promise<number> {
  try {
    const pubkey = new PublicKey(address);
    const mintPubkey = new PublicKey(SOLANA_NETWORKS[network].usdcMint);
    const conn = getSolanaConnection(network);

    const tokenAccounts = await conn.getParsedTokenAccountsByOwner(pubkey, {
      mint: mintPubkey
    });

    if (!tokenAccounts.value || tokenAccounts.value.length === 0) {
      return 0;
    }

    let totalUsdc = 0;
    for (const item of tokenAccounts.value) {
      const parsedInfo = item.account.data.parsed?.info;
      const amountUi = parsedInfo?.tokenAmount?.uiAmount;
      if (typeof amountUi === 'number') {
        totalUsdc += amountUi;
      }
    }

    return totalUsdc;
  } catch (err) {
    console.warn('[Solana] Error fetching USDC balance:', err);
    return 0;
  }
}

/**
 * Minimum SOL required for a standard transaction fee (typically 5,000 lamports = 0.000005 SOL)
 */
export const MIN_SOL_FOR_FEES = 0.0005;

export function hasEnoughSolForFees(solBalance: number): boolean {
  return solBalance >= MIN_SOL_FOR_FEES;
}
