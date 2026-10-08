/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SolanaNetworkType = 'mainnet-beta' | 'devnet';

export interface SolanaNetworkConfig {
  network: SolanaNetworkType;
  name: string;
  rpcUrl: string;
  usdcMint: string;
  explorerUrl: string;
}

// Official Native Solana USDC Mint
export const SOLANA_USDC_MINT_MAINNET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
// Standard Devnet SPL USDC Mint
export const SOLANA_USDC_MINT_DEVNET = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

export const USDC_DECIMALS = 6;

// Reown / WalletConnect Project ID from environment variable or standard fallback
export const REOWN_PROJECT_ID =
  (import.meta as any).env?.VITE_PROJECT_ID || '3fcc6bba6f1de962d911bb5b5c3dba68';

export const DEFAULT_SOLANA_NETWORK: SolanaNetworkType =
  ((import.meta as any).env?.VITE_SOLANA_NETWORK as SolanaNetworkType) || 'mainnet-beta';

export const SOLANA_NETWORKS: Record<SolanaNetworkType, SolanaNetworkConfig> = {
  'mainnet-beta': {
    network: 'mainnet-beta',
    name: 'Solana Mainnet',
    rpcUrl: (import.meta as any).env?.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    usdcMint: SOLANA_USDC_MINT_MAINNET,
    explorerUrl: 'https://solscan.io'
  },
  devnet: {
    network: 'devnet',
    name: 'Solana Devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    usdcMint: SOLANA_USDC_MINT_DEVNET,
    explorerUrl: 'https://solscan.io'
  }
};

/**
 * Format a Solana transaction signature or address into a clickable Solscan URL
 */
export function getSolscanTxUrl(signature: string, network: SolanaNetworkType = DEFAULT_SOLANA_NETWORK): string {
  const clusterParam = network === 'devnet' ? '?cluster=devnet' : '';
  return `https://solscan.io/tx/${signature}${clusterParam}`;
}

export function getSolscanAccountUrl(address: string, network: SolanaNetworkType = DEFAULT_SOLANA_NETWORK): string {
  const clusterParam = network === 'devnet' ? '?cluster=devnet' : '';
  return `https://solscan.io/account/${address}${clusterParam}`;
}

/**
 * Shortens a standard base58 Solana address (e.g. 7xKp...92FQ)
 */
export function shortenSolanaAddress(address: string): string {
  if (!address || address.length < 10) return address || '';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
