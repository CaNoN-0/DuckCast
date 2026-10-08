/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { USDC_DECIMALS } from './config';

/**
 * Format a numeric USDC value to clean USD currency format:
 * Examples: $5.00, $25.50, $1,250.00
 */
export function formatUsdc(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Convert user UI decimal amount (e.g. 12.50 USDC) to raw integer base units (12,500,000)
 */
export function usdcToRawUnits(amountUsd: number): bigint {
  const scaled = Math.round(amountUsd * Math.pow(10, USDC_DECIMALS));
  return BigInt(scaled);
}

/**
 * Convert raw integer base units (12,500,000) to human readable decimal amount (12.50)
 */
export function rawUnitsToUsdc(rawUnits: bigint | number): number {
  return Number(rawUnits) / Math.pow(10, USDC_DECIMALS);
}

export interface AmountValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates prediction amount in USDC against wallet balance
 */
export function validatePredictionAmount(
  amountUsd: number,
  availableUsdc: number,
  solBalance: number
): AmountValidationResult {
  if (isNaN(amountUsd) || amountUsd <= 0) {
    return { isValid: false, error: 'Please enter a valid prediction amount greater than $0.' };
  }

  if (amountUsd < 1) {
    return { isValid: false, error: 'Minimum prediction amount is $1.00 USDC.' };
  }

  if (amountUsd > 100000) {
    return { isValid: false, error: 'Maximum single prediction amount is $100,000.00 USDC.' };
  }

  if (amountUsd > availableUsdc) {
    return {
      isValid: false,
      error: `Insufficient USDC balance (${formatUsdc(availableUsdc)} available).`
    };
  }

  if (solBalance < 0.0005) {
    return {
      isValid: false,
      error: 'Not enough SOL to pay network fees. You need at least ~0.0005 SOL.'
    };
  }

  return { isValid: true };
}
