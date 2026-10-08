/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '2mb' }));

  const apiKey = process.env.GEMINI_API_KEY || '';

  // Initialize Gemini AI Client with User-Agent header for telemetry
  const ai = new GoogleGenAI({
    apiKey: apiKey || 'dummy-key',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });

  const SYSTEM_INSTRUCTION = `You are DuckCast AI Prediction Analyst, the embedded analytical intelligence for DuckCast social prediction markets.
DuckCast connects the social prediction experience, while market infrastructure (such as Panta) provides live probabilities and order matching.
Your purpose: Provide objective, rigorous, probabilistic, and unbiased analysis of prediction markets to help users evaluate odds, risk, and arguments.

CRITICAL OPERATIONAL RULES:
1. CLEAR CATEGORICAL SEPARATION:
   In your analysis, clearly distinguish between:
   - 📌 FACTS: Verified resolution rules, official criteria, official dates.
   - 📊 MARKET DATA: Current YES/NO probabilities, trading volume, recent trades, price movement.
   - 🔍 ANALYSIS: Probabilistic reasoning, bull/bear dynamics, market sentiment.
   - ⚠️ UNCERTAINTY & RISKS: Missing information, volatility catalysts, black swan risks.
   - ⚖️ ANALYTICAL LEAN: A reasoned, non-guaranteed lean (YES, NO, or NEUTRAL).

2. NEVER CLAIM CERTAINTY:
   - NEVER use "guaranteed win", "100% YES", "risk-free", "guaranteed profit", or "certain outcome".
   - Prediction markets are probabilistic estimates. Always convey uncertainty.
   - Example phrasing: "Based on the available market data, I would lean YES, but this is not a guaranteed outcome."

3. EXPLAIN REASONING:
   - Never answer with only "YES" or "NO". Explain why odds are priced at their current levels.

4. DO NOT INVENT DATA:
   - Only analyze the provided market data, verified resolution criteria, and general facts.
   - If data is missing or incomplete, explicitly state: "I don't have enough current external data to verify [X]. Based on the market data available to me, here is what I can observe..."

5. USER POSITION CONTEXT:
   - If the user holds an active position or selected a side, evaluate it objectively without cheerleading.
   - You NEVER execute trades or manage funds. Users must always initiate and approve their own transactions.

6. FORMATTING:
   - Format responses cleanly with concise paragraphs, bullet points, and markdown headers.`;

  // POST /api/ai/chat - Multi-turn conversational analysis
  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    try {
      const { marketContext, messages } = req.body;

      if (!marketContext || !messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Missing marketContext or messages array' });
      }

      // Build structured context string
      const contextString = `
[CURRENT MARKET CONTEXT]
- Question: "${marketContext.marketQuestion || 'N/A'}"
- Category: ${marketContext.category || 'General'}
- Current Odds: YES ${marketContext.yesProbability}% ($${((marketContext.yesPriceCents || 50) / 100).toFixed(2)}) | NO ${marketContext.noProbability}% ($${((marketContext.noPriceCents || 50) / 100).toFixed(2)})
- 24h Volume: ${marketContext.volume || '$0'} (${marketContext.traders || 0} traders)
- Price Movement: ${marketContext.priceMovement || 'Stable'}
- Time Remaining: ${marketContext.timeRemaining || 'Active'}
- Status: ${marketContext.marketStatus || 'Open'}
- Resolution Criteria: ${marketContext.resolutionCriteria || marketContext.marketDescription || 'Standard outcome resolution.'}
${marketContext.userPosition ? `- User Current Position: ${marketContext.userPosition.side} (${marketContext.userPosition.shares || 0} shares, ${marketContext.userPosition.amount || '$0'})` : '- User Position: None'}
${marketContext.recentActivity && marketContext.recentActivity.length > 0 ? `- Recent Activity: ${marketContext.recentActivity.slice(0, 3).map((a: any) => `${a.side} for ${a.amount} (${a.time})`).join(', ')}` : ''}
`;

      if (!apiKey) {
        // Fallback response if GEMINI_API_KEY is not yet attached
        const lastMsg = messages[messages.length - 1]?.text || '';
        const isYesFavor = (marketContext.yesProbability || 50) > 50;
        return res.json({
          text: `### 📊 Market Analysis\n\n**Market:** ${marketContext.marketQuestion}\n\n- **📌 Facts:** Resolves based on verified outcome criteria before ${marketContext.timeRemaining}.\n- **📊 Market Data:** YES is currently at **${marketContext.yesProbability}%** with ${marketContext.volume} in volume.\n- **🔍 Analysis:** ${isYesFavor ? 'Market participants are pricing in favorable conditions for YES based on recent momentum.' : 'Skeptical sentiment is reflected in the current NO probability.'}\n- **⚠️ Uncertainty:** Unexpected volatility and external news remain primary risk factors.\n- **⚖️ Analytical Lean:** Based on current order flow, odds lean **${isYesFavor ? 'YES' : 'NO'}**, though this is not a guaranteed outcome.\n\n*(Note: Attach your GEMINI_API_KEY in Settings > Secrets to enable live Gemini reasoning.)*`,
          lean: isYesFavor ? 'YES' : 'NO',
          confidence: 'MODERATE'
        });
      }

      // Format contents for Gemini generateContent
      const contents = [
        {
          role: 'user',
          parts: [{ text: `${contextString}\n\nPlease analyze this market according to the DuckCast guidelines.` }]
        },
        {
          role: 'model',
          parts: [{ text: `Understood. I have integrated the market context for "${marketContext.marketQuestion}" (YES: ${marketContext.yesProbability}%, NO: ${marketContext.noProbability}%). I am ready to provide objective, separated analysis separating facts, market data, analysis, and uncertainty.` }]
        }
      ];

      // Append user conversation history
      for (const msg of messages) {
        contents.push({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.text }]
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        }
      });

      const responseText = response.text || 'Unable to generate response at this time.';

      // Determine lean heuristically or from text
      let lean: 'YES' | 'NO' | 'NEUTRAL' = 'NEUTRAL';
      const lower = responseText.toLowerCase();
      if (lower.includes('lean yes') || lower.includes('leans yes') || lower.includes('favors yes')) {
        lean = 'YES';
      } else if (lower.includes('lean no') || lower.includes('leans no') || lower.includes('favors no')) {
        lean = 'NO';
      }

      res.json({
        text: responseText,
        lean,
        confidence: 'MODERATE',
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Gemini API chat error:', err?.message || err);
      res.status(500).json({
        error: 'Failed to generate AI analysis',
        details: err?.message || 'Server error'
      });
    }
  });

  // POST /api/ai/quick-analysis - 1-click structured breakdown
  app.post('/api/ai/quick-analysis', async (req: Request, res: Response) => {
    try {
      const { marketContext, analysisType } = req.body;

      if (!marketContext) {
        return res.status(400).json({ error: 'Missing marketContext' });
      }

      const typePrompts: Record<string, string> = {
        summary: 'Provide a concise, 3-part neutral summary of this market: 1) What is being predicted, 2) Current probability breakdown and volume, 3) Key resolution criteria.',
        bull_case: 'Provide the strongest evidence and reasoning supporting the YES case for this market. Clearly highlight what must go right.',
        bear_case: 'Provide the strongest evidence and reasoning supporting the NO case for this market. What are the biggest invalidation risks to YES?',
        risk: 'Analyze the risk profile of this prediction market. What could cause sudden probability swings? Where is the greatest uncertainty?',
        probability: 'Explain why the market is currently priced at YES: ' + (marketContext.yesProbability || 50) + '% vs NO: ' + (marketContext.noProbability || 50) + '%. Compare this with the recent volume and activity.'
      };

      const promptText = typePrompts[analysisType] || typePrompts.summary;

      const contextString = `
[MARKET CONTEXT]
- Question: "${marketContext.marketQuestion}"
- Category: ${marketContext.category}
- Odds: YES ${marketContext.yesProbability}% | NO ${marketContext.noProbability}%
- 24h Volume: ${marketContext.volume}
- Time Remaining: ${marketContext.timeRemaining}
- Resolution Criteria: ${marketContext.resolutionCriteria || marketContext.marketDescription}
`;

      if (!apiKey) {
        return res.json({
          text: `### 📊 ${analysisType.toUpperCase().replace('_', ' ')}\n\n**Market:** ${marketContext.marketQuestion}\n\n- **Probability:** YES ${marketContext.yesProbability}% / NO ${marketContext.noProbability}%\n- **Observation:** ${promptText}\n\n*(Note: Configure your GEMINI_API_KEY in Settings > Secrets to unlock full live analysis.)*`,
          lean: (marketContext.yesProbability || 50) > 50 ? 'YES' : 'NO',
          confidence: 'MODERATE'
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: `${contextString}\n\n${promptText}\n\nRemember to distinguish facts, market data, analysis, and uncertainty. Never claim certainty.` }]
          }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.6,
        }
      });

      res.json({
        text: response.text || 'Analysis unavailable.',
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Gemini quick-analysis error:', err?.message || err);
      res.status(500).json({ error: 'Failed to generate quick analysis' });
    }
  });

  // POST /api/ai/analyze-thesis - AI Thesis Assistant
  app.post('/api/ai/analyze-thesis', async (req: Request, res: Response) => {
    try {
      const { marketContext, thesisText, proposedSide } = req.body;

      if (!thesisText || !marketContext) {
        return res.status(400).json({ error: 'Missing thesisText or marketContext' });
      }

      const prompt = `
[MARKET CONTEXT]
- Question: "${marketContext.marketQuestion}"
- Odds: YES ${marketContext.yesProbability}% | NO ${marketContext.noProbability}%
- Time Remaining: ${marketContext.timeRemaining}

[USER PROPOSED THESIS]
- Side: ${proposedSide || 'Unspecified'}
- User Thesis: "${thesisText}"

Critique this user thesis as the DuckCast Thesis Assistant.
1. Identify the core assumption of the user's thesis.
2. Highlight any blind spots, missing counter-arguments, or time-decay risks.
3. Suggest 2-3 specific improvements or data points the user could verify to strengthen their thesis before staking.
4. Keep the critique constructive, objective, and under 160 words.`;

      if (!apiKey) {
        return res.json({
          critique: `Your thesis focuses on ${proposedSide || 'your position'}. To strengthen it, consider referencing the remaining time until resolution (${marketContext.timeRemaining}) and potential counter-catalysts that could swing probabilities against current odds.`,
          suggestions: ['Verify the official resolution source', 'Account for time remaining', 'Check recent volume shifts']
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.6
        }
      });

      res.json({
        critique: response.text || 'Critique unavailable.',
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Gemini analyze-thesis error:', err?.message || err);
      res.status(500).json({ error: 'Failed to analyze thesis' });
    }
  });

  // Server static in production, mount Vite in development
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DuckCast Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[DuckCast Server] Failed to start:', err);
  process.exit(1);
});
