/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PredictionMarket, PredictionBattle } from '../types/market';
import { SOLANA_USDC_MINT } from '../solana/config';

/**
 * Panta Protocol Market Configuration & Constants
 * Panta is the permissionless Solana prediction market protocol powering DuckCast.
 */
export const PANTA_CONFIG = {
  protocolName: 'Panta',
  network: 'Solana',
  usdcMint: SOLANA_USDC_MINT,
  usdcDecimals: 6,
  primaryMarketFeePercent: 2.0, // Panta standard primary market AMM fee (2%)
  secondaryMarketFeePercent: 1.5, // Panta secondary orderbook fee (1.5%)
  disputeWindowSeconds: 3600, // 1 hour dispute window after initial resolution
  resolutionSourceType: 'Decentralized Oracle & Verified Feeds'
};

/**
 * Curated DuckCast Prediction Battles attached to Panta markets
 * Community backs User A (YES) or User B (NO)
 */
export const INITIAL_PREDICTION_BATTLES: PredictionBattle[] = [
  {
    id: 'battle-btc-120k',
    marketId: 'crypto-btc-120k',
    marketQuestion: 'Will BTC move above $120K before Friday?',
    category: 'Crypto',
    userYes: {
      username: 'SatoshiDuck',
      handle: '@satoshiduck',
      avatar: '/src/assets/images/duckcast_mascot_illustration_1790877735628.jpg',
      stakedUsdc: 24500,
      entryProb: 75,
      thesis: 'Institutional OTC desks reported zero liquid inventory above $115k. ETF spot net inflows are averaging $800M daily.',
      backingVotes: 184
    },
    userNo: {
      username: 'MacroQuack',
      handle: '@macroquack',
      avatar: '/src/assets/images/crypto_avatar_1791030371504.jpg',
      stakedUsdc: 18200,
      entryProb: 25,
      thesis: 'CME options gamma wall sits heavily at $119,500. Friday options expiry is likely to pin spot below $120K before settlement.',
      backingVotes: 142
    },
    totalBattlePotUsdc: 42700,
    status: 'active',
    timeRemaining: '2d 14h'
  },
  {
    id: 'battle-sports-halftime',
    marketId: 'sports-team-a-halftime',
    marketQuestion: 'Will Team A score before halftime?',
    category: 'Sports',
    userYes: {
      username: 'StrikerPro',
      handle: '@strikerpro',
      avatar: '/src/assets/images/dara_avatar_1791030355835.jpg',
      stakedUsdc: 5000,
      entryProb: 67,
      thesis: 'Team A is pressing with 74% possession in the first 25 minutes. High xG chances created from set-pieces.',
      backingVotes: 98
    },
    userNo: {
      username: 'DefenseWall',
      handle: '@defensewall',
      avatar: '/src/assets/images/techbae_avatar_1791030339680.jpg',
      stakedUsdc: 4800,
      entryProb: 33,
      thesis: 'Away team is playing a low 5-4-1 block and counter-pressing effectively. Zero shots on target conceded so far.',
      backingVotes: 73
    },
    totalBattlePotUsdc: 9800,
    status: 'active',
    timeRemaining: '1h 42m'
  }
];

/**
 * Calculates share allocation and Panta protocol fees
 */
export function calculatePantaOrder({
  amountUsdc,
  probabilityPercent,
  phase = 'primary'
}: {
  amountUsdc: number;
  probabilityPercent: number;
  phase?: 'primary' | 'secondary';
}) {
  const feePercent = phase === 'primary' 
    ? PANTA_CONFIG.primaryMarketFeePercent 
    : PANTA_CONFIG.secondaryMarketFeePercent;
  
  const feeAmount = (amountUsdc * feePercent) / 100;
  const netAmount = Math.max(0, amountUsdc - feeAmount);
  const sharePrice = Math.max(0.01, Math.min(0.99, probabilityPercent / 100));
  const sharesBought = Math.floor(netAmount / sharePrice);
  const potentialPayout = sharesBought; // Each winning Panta share pays 1.00 USDC
  const potentialProfit = Math.max(0, potentialPayout - amountUsdc);

  return {
    sharePrice,
    sharesBought,
    feePercent,
    feeAmount,
    netAmount,
    potentialPayout,
    potentialProfit,
    returnPercentage: amountUsdc > 0 ? Math.round((potentialProfit / amountUsdc) * 100) : 0
  };
}

/**
 * Formats Panta resolution and dispute window status
 */
export function getPantaResolutionStatus(market: PredictionMarket) {
  return {
    source: market.source || PANTA_CONFIG.resolutionSourceType,
    criteria: market.resolutionCriteria,
    disputeWindow: '1 Hour (Panta Settlement Standard)',
    disputeStatus: market.disputeStatus || 'none',
    currency: 'Native USDC on Solana',
    mint: PANTA_CONFIG.usdcMint,
    phase: market.pantaMarketPhase || 'primary'
  };
}
