/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  HelpCircle,
  ShieldAlert,
  TrendingUp,
  Scale,
  Brain,
  ChevronRight,
  Info,
  Clock,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { PredictionMarket } from '../../types/market';
import {
  AiChatMessage,
  buildMarketContext,
  sendAiMarketQuery,
  sendQuickAnalysis,
  critiqueThesis
} from '../../services/aiAnalystService';
import { HalftoneBackground } from './HalftoneBackground';

interface AiAnalystPanelProps {
  isOpen: boolean;
  onClose: () => void;
  market: PredictionMarket;
  userPositionSide?: 'YES' | 'NO';
  onDraftThesisFill?: (text: string) => void;
}

const SUGGESTED_QUESTIONS = [
  'Why is YES currently leading?',
  'What could invalidate YES?',
  'Give me the strongest NO argument.',
  'Analyze recent market movement.',
  'Give me a neutral summary.',
  'What factors should I watch most closely?',
  'How risky is this prediction compared to the odds?'
];

export function AiAnalystPanel({
  isOpen,
  onClose,
  market,
  userPositionSide,
  onDraftThesisFill
}: AiAnalystPanelProps) {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickLoadingType, setQuickLoadingType] = useState<string | null>(null);
  const [thesisDraft, setThesisDraft] = useState('');
  const [isThesisMode, setIsThesisMode] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize introductory message when opening a new market
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const isYesLeading = market.yesProbability >= market.noProbability;
      const initialMessage: AiChatMessage = {
        id: `init-${market.id}`,
        role: 'model',
        text: `### 🎯 DuckCast AI Market Brief\n\nI've integrated live parameters for **"${market.question}"**:\n\n- **📊 Live Odds:** YES is at **${market.yesProbability}%** ($${(market.yesPriceCents / 100).toFixed(2)}) | NO is at **${market.noProbability}%** ($${(market.noPriceCents / 100).toFixed(2)})\n- **📈 Volume & Activity:** ${market.volume} traded across ${market.traders} participants.\n- **⏳ Resolution Window:** Ends ${market.timeRemaining}.\n\n*Select a question below or ask me about risk, odds asymmetry, catalysts, or test your thesis.*`,
        timestamp: 'Just now',
        lean: isYesLeading ? 'YES' : 'NO',
        confidence: 'MODERATE'
      };
      setMessages([initialMessage]);
    }
  }, [isOpen, market]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputValue).trim();
    if (!textToSend || isLoading) return;

    const userMessage: AiChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: 'Just now'
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputValue('');
    setIsLoading(true);

    try {
      const context = buildMarketContext(market, userPositionSide);
      const apiHistory = newHistory.map((m) => ({
        role: m.role,
        text: m.text
      }));

      const res = await sendAiMarketQuery(context, apiHistory);

      const aiResponse: AiChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        text: res.text,
        timestamp: 'Just now',
        lean: res.lean,
        confidence: res.confidence
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (err) {
      console.error('Failed to get AI response:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (type: 'summary' | 'bull_case' | 'bear_case' | 'risk' | 'probability') => {
    if (isLoading) return;
    setQuickLoadingType(type);
    setIsLoading(true);

    const typeLabels: Record<string, string> = {
      summary: 'Give me a neutral market summary',
      bull_case: 'What is the strongest bull case for YES?',
      bear_case: 'What is the strongest bear case for NO?',
      risk: 'What are the biggest risks and uncertainties?',
      probability: 'Analyze the current probability vs recent movement'
    };

    const userMsg: AiChatMessage = {
      id: `quick-usr-${Date.now()}`,
      role: 'user',
      text: typeLabels[type] || 'Analyze market',
      timestamp: 'Just now'
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const context = buildMarketContext(market, userPositionSide);
      const analysisText = await sendQuickAnalysis(context, type);

      const aiMsg: AiChatMessage = {
        id: `quick-ai-${Date.now()}`,
        role: 'model',
        text: analysisText,
        timestamp: 'Just now',
        lean: type === 'bull_case' ? 'YES' : type === 'bear_case' ? 'NO' : 'NEUTRAL',
        confidence: 'MODERATE'
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Quick action failed:', err);
    } finally {
      setIsLoading(false);
      setQuickLoadingType(null);
    }
  };

  const handleCritiqueThesis = async () => {
    if (!thesisDraft.trim() || isLoading) return;
    setIsLoading(true);

    const userMsg: AiChatMessage = {
      id: `thesis-usr-${Date.now()}`,
      role: 'user',
      text: `Review my thesis on ${userPositionSide || 'this market'}: "${thesisDraft}"`,
      timestamp: 'Just now'
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const context = buildMarketContext(market, userPositionSide);
      const critiqueResult = await critiqueThesis(context, thesisDraft, userPositionSide || 'YES');

      const aiMsg: AiChatMessage = {
        id: `thesis-ai-${Date.now()}`,
        role: 'model',
        text: `### 💡 AI Thesis Review\n\n${critiqueResult}\n\n*Tip: You can revise and copy this thesis directly to the community thesis section below the market.*`,
        timestamp: 'Just now'
      };

      setMessages((prev) => [...prev, aiMsg]);
      setThesisDraft('');
      setIsThesisMode(false);
    } catch (err) {
      console.error('Thesis critique failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-over Container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
        <div className="w-screen max-w-md sm:max-w-lg bg-white shadow-2xl flex flex-col pointer-events-auto border-l border-neutral-200 animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="relative px-5 py-4 border-b border-neutral-200 bg-neutral-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#09090B] text-white flex items-center justify-center shadow-2xs">
                <Brain className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-extrabold text-[#09090B] font-display">
                    DuckCast AI Analyst
                  </h2>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider font-mono-tabular">
                    Gemini 3.5
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 font-medium">
                  Objective probabilistic market intelligence
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 rounded-lg transition-colors cursor-pointer"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Context Banner */}
          <div className="px-5 py-3 bg-white border-b border-neutral-100">
            <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Market Context</span>
              <span className="text-neutral-500 font-mono-tabular font-medium">
                {market.category}
              </span>
            </div>
            <p className="text-xs font-bold text-[#09090B] line-clamp-1 mb-2 font-display">
              {market.question}
            </p>

            <div className="flex items-center gap-2 text-xs font-mono-tabular">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-[11px]">
                YES {market.yesProbability}%
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-extrabold text-[11px]">
                NO {market.noProbability}%
              </span>
              <span className="text-[11px] text-neutral-500 ml-auto font-medium">
                Vol: {market.volume}
              </span>
            </div>

            {userPositionSide && (
              <div className="mt-2 text-[11px] font-medium text-emerald-700 bg-emerald-50/70 border border-emerald-200/60 px-2 py-1 rounded-md flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>You hold a position on <strong>{userPositionSide}</strong></span>
              </div>
            )}
          </div>

          {/* Quick Action Chips */}
          <div className="px-4 py-2.5 bg-neutral-50/50 border-b border-neutral-200/70 overflow-x-auto scrollbar-none flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickAction('summary')}
              disabled={isLoading}
              className="whitespace-nowrap px-2.5 py-1 text-[11px] font-bold text-neutral-700 bg-white border border-neutral-200 hover:border-neutral-400 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Summary
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction('bull_case')}
              disabled={isLoading}
              className="whitespace-nowrap px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Bull Case
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction('bear_case')}
              disabled={isLoading}
              className="whitespace-nowrap px-2.5 py-1 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 hover:border-rose-300 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Bear Case
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction('risk')}
              disabled={isLoading}
              className="whitespace-nowrap px-2.5 py-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 hover:border-amber-300 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Key Risks
            </button>
            <button
              type="button"
              onClick={() => setIsThesisMode(!isThesisMode)}
              className={`whitespace-nowrap px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors cursor-pointer ${
                isThesisMode
                  ? 'bg-[#09090B] text-white border-[#09090B]'
                  : 'text-neutral-700 bg-white border-neutral-200 hover:border-neutral-400'
              }`}
            >
              Thesis Assistant
            </button>
          </div>

          {/* Thesis Assistant Expandable Drawer */}
          {isThesisMode && (
            <div className="p-3.5 bg-neutral-100/80 border-b border-neutral-200 animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[#09090B] flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-emerald-600" />
                  Test Your Prediction Thesis
                </span>
                <span className="text-[10px] text-neutral-500 font-mono-tabular">
                  AI will critique assumptions
                </span>
              </div>
              <textarea
                value={thesisDraft}
                onChange={(e) => setThesisDraft(e.target.value)}
                placeholder="e.g. I think ETH will exceed $4,000 because ETF inflows are accelerating and resistance is thinning..."
                rows={2}
                className="w-full p-2.5 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-[#09090B] text-[#09090B] resize-none"
              />
              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsThesisMode(false)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCritiqueThesis}
                  disabled={!thesisDraft.trim() || isLoading}
                  className="px-3 py-1 bg-[#09090B] text-white text-[11px] font-bold rounded-lg hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
                >
                  Critique My Thesis
                </button>
              </div>
            </div>
          )}

          {/* Messages Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                {/* Role Pill */}
                <span className="text-[10px] font-bold text-neutral-400 mb-1 px-1">
                  {msg.role === 'user' ? 'You' : 'DuckCast AI Analyst'}
                </span>

                {/* Message Content */}
                <div
                  className={`max-w-[92%] rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-[#09090B] text-white rounded-tr-xs'
                      : 'bg-white border border-neutral-200/90 text-neutral-800 rounded-tl-xs'
                  }`}
                >
                  {/* AI Lean Header if present */}
                  {msg.role === 'model' && msg.lean && (
                    <div className="mb-2.5 pb-2.5 border-b border-neutral-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-black text-neutral-500 uppercase tracking-wider">
                          Analytical Lean:
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono-tabular ${
                            msg.lean === 'YES'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : msg.lean === 'NO'
                              ? 'bg-rose-100 text-rose-900 border border-rose-300'
                              : 'bg-neutral-100 text-neutral-800 border border-neutral-200'
                          }`}
                        >
                          {msg.lean}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-neutral-400">
                        Confidence: {msg.confidence || 'Moderate'}
                      </span>
                    </div>
                  )}

                  {/* Body text rendered cleanly */}
                  <div className="space-y-2 whitespace-pre-wrap font-sans">
                    {msg.text.split('\n\n').map((paragraph, idx) => {
                      // Check for markdown headers like ###
                      if (paragraph.startsWith('### ')) {
                        return (
                          <h4
                            key={idx}
                            className="text-xs font-black text-[#09090B] uppercase tracking-wider pt-1 border-t border-neutral-100 first:border-t-0 first:pt-0"
                          >
                            {paragraph.replace('### ', '')}
                          </h4>
                        );
                      }
                      return (
                        <p key={idx} className={msg.role === 'user' ? 'text-white' : 'text-neutral-700'}>
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex flex-col items-start animate-pulse">
                <span className="text-[10px] font-bold text-neutral-400 mb-1 px-1">
                  DuckCast AI Analyst
                </span>
                <div className="bg-white border border-neutral-200 rounded-2xl rounded-tl-xs p-3.5 shadow-xs flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-semibold text-neutral-600">
                    Evaluating market dynamics & resolution conditions...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Prompts (if chat is short) */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                Suggested Questions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_QUESTIONS.slice(0, 4).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSendMessage(q)}
                    className="text-[11px] font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 px-2.5 py-1 rounded-full transition-colors cursor-pointer text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Input */}
          <div className="p-4 bg-white border-t border-neutral-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask DuckCast AI about this market..."
                  disabled={isLoading}
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-neutral-100 hover:bg-neutral-100/80 focus:bg-white border border-neutral-200 focus:border-[#09090B] rounded-xl focus:outline-none transition-colors text-[#09090B] disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="w-10 h-10 rounded-xl bg-[#09090B] text-white flex items-center justify-center hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs shrink-0"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-2 text-[10px] text-neutral-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Info className="w-3 h-3 text-neutral-400 shrink-0" />
                Probabilistic analysis only. Never guaranteed.
              </span>
              <span className="font-mono-tabular">Gemini AI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
