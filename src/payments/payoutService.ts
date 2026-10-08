/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SolanaNetworkType, getSolscanTxUrl } from '../solana/config';

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface UsdcPayoutRecord {
  id: string;
  marketId: string;
  marketTitle: string;
  position: 'YES' | 'NO';
  usdcAmount: number;
  status: PayoutStatus;
  date: string;
  signature: string;
  explorerUrl: string;
}

export interface PayoutSummary {
  totalWinningsUsdc: number;
  totalWithdrawnUsdc: number;
  pendingPayoutsCount: number;
  completedPayoutsCount: number;
}

/**
 * Isolated mock payouts for frontend development.
 * The backend settlement engine will replace this with real on-chain automated payouts.
 */
export const INITIAL_MOCK_PAYOUTS: UsdcPayoutRecord[] = [
  {
    id: 'pay-1',
    marketId: 'm-1',
    marketTitle: 'Will Solana break $300 by Q4 2026?',
    position: 'YES',
    usdcAmount: 184.50,
    status: 'completed',
    date: 'Oct 3, 2026',
    signature: '5xY9k2FqL8M1aZpW7nR4tV6bC3sD8eH9jK2mN5pQ8rT1vX4yA7bE0dF3gH6jK9m',
    explorerUrl: getSolscanTxUrl('5xY9k2FqL8M1aZpW7nR4tV6bC3sD8eH9jK2mN5pQ8rT1vX4yA7bE0dF3gH6jK9m')
  },
  {
    id: 'pay-2',
    marketId: 'm-2',
    marketTitle: 'Will Ethereum stay above $4,000 at monthly close?',
    position: 'YES',
    usdcAmount: 82.50,
    status: 'completed',
    date: 'Sep 28, 2026',
    signature: '3kL7mP9qR2tV5xY8aB1cE4fG7hJ0kM3nP6rS9uW2xZ5aD8eH1jK4mN7pQ0rT3v',
    explorerUrl: getSolscanTxUrl('3kL7mP9qR2tV5xY8aB1cE4fG7hJ0kM3nP6rS9uW2xZ5aD8eH1jK4mN7pQ0rT3v')
  },
  {
    id: 'pay-3',
    marketId: 'm-3',
    marketTitle: 'Will the Federal Reserve cut rates at the next FOMC meeting?',
    position: 'NO',
    usdcAmount: 145.00,
    status: 'pending',
    date: 'Resolution Pending',
    signature: '7aB4cD1eF8gH2jK5mN9pQ3rT6vX0yZ2bE5hJ8kM1nP4sR7uW0xY3aD6fG9jK2m',
    explorerUrl: getSolscanTxUrl('7aB4cD1eF8gH2jK5mN9pQ3rT6vX0yZ2bE5hJ8kM1nP4sR7uW0xY3aD6fG9jK2m')
  }
];

export function getPayoutSummary(payouts: UsdcPayoutRecord[]): PayoutSummary {
  const completed = payouts.filter((p) => p.status === 'completed');
  const pending = payouts.filter((p) => p.status === 'pending');

  const totalWinnings = completed.reduce((acc, p) => acc + p.usdcAmount, 0);
  const totalWithdrawn = totalWinnings; // In full on-chain model, payouts deposit directly to user wallet

  return {
    totalWinningsUsdc: totalWinnings,
    totalWithdrawnUsdc: totalWithdrawn,
    pendingPayoutsCount: pending.length,
    completedPayoutsCount: completed.length
  };
}
