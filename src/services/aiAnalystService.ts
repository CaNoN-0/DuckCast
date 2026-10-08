/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PredictionMarket } from '../types/market';

export interface AiChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  lean?: 'YES' | 'NO' | 'NEUTRAL';
  confidence?: 'LOW' | 'MODERATE' | 'HIGH';
  isAnalysisCard?: boolean;
}

export interface MarketContextPayload {
  marketQuestion: string;
  category: string;
  yesProbability: number;
  noProbability: number;
  yesPriceCents: number;
  noPriceCents: number;
  volume: string;
  priceMovement?: string;
  timeRemaining: string;
  marketStatus: string;
  marketDescription?: string;
  resolutionCriteria?: string;
  traders?: number;
  recentActivity?: Array<{
    side: 'YES' | 'NO';
    amount: string;
    shares: number;
    price: number;
    time: string;
  }>;
  userPosition?: {
    side: 'YES' | 'NO';
    amount?: string;
    shares?: number;
  };
}

export function buildMarketContext(
  market: PredictionMarket,
  userPositionSide?: 'YES' | 'NO'
): MarketContextPayload {
  return {
    marketQuestion: market.question,
    category: market.category,
    yesProbability: market.yesProbability,
    noProbability: market.noProbability,
    yesPriceCents: market.yesPriceCents,
    noPriceCents: market.noPriceCents,
    volume: market.volume,
    priceMovement: market.trendingDelta || (market.change24h ? `${market.change24h > 0 ? '+' : ''}${market.change24h}% in 24h` : 'Stable'),
    timeRemaining: market.timeRemaining,
    marketStatus: market.isLive ? 'Live & Trading' : 'Active',
    marketDescription: market.topic || market.question,
    resolutionCriteria: market.resolutionCriteria || market.source || 'Standard market resolution.',
    traders: market.traders,
    recentActivity: (market.recentActivity || []).slice(0, 5).map((t) => ({
      side: t.side,
      amount: t.amount,
      shares: t.shares,
      price: t.price,
      time: t.time
    })),
    userPosition: userPositionSide
      ? {
          side: userPositionSide,
          shares: 50,
          amount: '$50.00'
        }
      : undefined
  };
}

export async function sendAiMarketQuery(
  context: MarketContextPayload,
  history: Array<{ role: 'user' | 'model'; text: string }>
): Promise<{ text: string; lean?: 'YES' | 'NO' | 'NEUTRAL'; confidence?: 'LOW' | 'MODERATE' | 'HIGH' }> {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        marketContext: context,
        messages: history
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    console.warn('AI API call failed, using client fallback:', err);
    // Offline / fallback analysis if server route unavailable
    const isYes = context.yesProbability > 50;
    return {
      text: `### 📊 Market Breakdown\n\n**Market:** ${context.marketQuestion}\n\n- **📌 Facts:** Resolution is governed by standard market settlement criteria.\n- **📊 Market Data:** YES odds stand at **${context.yesProbability}%** ($${(context.yesPriceCents / 100).toFixed(2)}) with ${context.volume} total volume.\n- **🔍 Analysis:** Market volume currently concentrates toward ${isYes ? 'YES' : 'NO'}, indicating near-term participant confidence.\n- **⚠️ Uncertainty:** Unforeseen market volatility or news developments could swiftly reverse positioning.\n- **⚖️ Analytical Lean:** Probabilistically leans **${isYes ? 'YES' : 'NO'}**, but this is not a guaranteed outcome.`,
      lean: isYes ? 'YES' : 'NO',
      confidence: 'MODERATE'
    };
  }
}

export async function sendQuickAnalysis(
  context: MarketContextPayload,
  analysisType: 'summary' | 'bull_case' | 'bear_case' | 'risk' | 'probability'
): Promise<string> {
  try {
    const res = await fetch('/api/ai/quick-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        marketContext: context,
        analysisType
      })
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.text;
  } catch (err) {
    console.warn('Quick analysis failed, using fallback:', err);
    return `### 📊 ${analysisType.toUpperCase().replace('_', ' ')}\n\nBased on current odds (YES ${context.yesProbability}% / NO ${context.noProbability}%), trading volume of ${context.volume}, and remaining time (${context.timeRemaining}), market signals reflect ongoing price discovery without guaranteed certainty.`;
  }
}

export async function critiqueThesis(
  context: MarketContextPayload,
  thesisText: string,
  proposedSide: 'YES' | 'NO'
): Promise<string> {
  try {
    const res = await fetch('/api/ai/analyze-thesis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        marketContext: context,
        thesisText,
        proposedSide
      })
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.critique;
  } catch (err) {
    return `Your argument emphasizes ${proposedSide} probability momentum. To bolster your thesis before posting, verify the exact resolution conditions and consider what counter-catalysts could challenge your assumption.`;
  }
}
