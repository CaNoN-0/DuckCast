/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, ArrowRight, ShieldCheck, Sparkles, Check } from 'lucide-react';
import { PredictionMarket } from '../data/marketsData';

interface CreateMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateMarket: (newMarket: PredictionMarket) => void;
}

export function CreateMarketModal({ isOpen, onClose, onCreateMarket }: CreateMarketModalProps) {
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState<PredictionMarket['category']>('Crypto');
  const [topic, setTopic] = useState('');
  const [resolutionDate, setResolutionDate] = useState('2026-11-15');
  const [resolutionCriteria, setResolutionCriteria] = useState('');
  const [description, setDescription] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [initialProb, setInitialProb] = useState(50);
  const [initialLiquidity, setInitialLiquidity] = useState('50000');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const newMarket: PredictionMarket = {
      id: `custom-${Date.now()}`,
      question: question.trim(),
      category: category,
      topic: topic.trim() || category,
      yesProbability: initialProb,
      noProbability: 100 - initialProb,
      volume: `$${parseInt(initialLiquidity || '0').toLocaleString()}`,
      volumeNumeric: parseInt(initialLiquidity || '50000'),
      tradersCount: 1,
      liquidity: `$${parseInt(initialLiquidity || '0').toLocaleString()}`,
      timeRemaining: '14d 0h',
      status: 'active',
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
      iconSymbol: '★',
      createdDate: 'Today',
      resolutionDate: resolutionDate,
      resolutionCriteria: resolutionCriteria.trim() || 'Market resolves based on consensus reporting from verifiable public sources.',
      sourceUrl: sourceUrl.trim() || undefined,
      recentSparkline: [initialProb, initialProb, initialProb],
      theses: description.trim()
        ? [
            {
              id: `t-created-${Date.now()}`,
              author: 'you.duck',
              side: 'YES',
              summary: description.trim(),
              staked: `$${parseInt(initialLiquidity || '50000').toLocaleString()}`,
              reactions: { insightful: 1, bullish: 1, fire: 1 },
              timeAgo: 'Just now'
            }
          ]
        : [],
      recentTrades: []
    };

    onCreateMarket(newMarket);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="bg-white border border-neutral-200 rounded-2xl w-full max-w-[720px] max-h-[92vh] flex flex-col shadow-xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            {/* DuckCast Duck icon in Create section */}
            <img
              src="/2.png"
              alt="DuckCast Mascot"
              className="w-8 h-8 object-contain"
            />
            <div>
              <h2 className="text-base font-semibold text-[#09090B]">
                Create a Prediction Market
              </h2>
              <p className="text-xs text-[#64748b]">
                Propose a new event market and seed initial liquidity
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body with Preview */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
          {/* Question */}
          <div>
            <label htmlFor="create-question" className="text-xs font-semibold text-[#334155] block mb-1">
              Prediction Question *
            </label>
            <input
              id="create-question"
              required
              type="text"
              placeholder="e.g. Will Ethereum Gas Fees drop below 5 Gwei throughout Q4?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-[#10b981] placeholder:text-neutral-400"
            />
          </div>

          {/* Category & Topic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="create-cat" className="text-xs font-semibold text-[#334155] block mb-1">
                Category *
              </label>
              <select
                id="create-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as PredictionMarket['category'])}
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-[#10b981]"
              >
                <option value="Politics">Politics</option>
                <option value="Crypto">Crypto</option>
                <option value="Sports">Sports</option>
                <option value="Technology">Technology</option>
                <option value="Culture">Culture</option>
                <option value="Business">Business</option>
                <option value="World">World</option>
                <option value="Science">Science</option>
                <option value="Gaming">Gaming</option>
                <option value="Creators">Creators</option>
              </select>
            </div>

            <div>
              <label htmlFor="create-topic" className="text-xs font-semibold text-[#334155] block mb-1">
                Topic Tag
              </label>
              <input
                id="create-topic"
                type="text"
                placeholder="e.g. Layer 2, Premier League, AI"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-[#10b981]"
              />
            </div>
          </div>

          {/* Resolution Date & Oracle Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="create-date" className="text-xs font-semibold text-[#334155] block mb-1">
                Resolution Date *
              </label>
              <input
                id="create-date"
                required
                type="date"
                value={resolutionDate}
                onChange={(e) => setResolutionDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-[#10b981]"
              />
            </div>

            <div>
              <label htmlFor="create-source" className="text-xs font-semibold text-[#334155] block mb-1">
                Resolution Source URL
              </label>
              <input
                id="create-source"
                type="url"
                placeholder="https://official-source.com"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-[#10b981]"
              />
            </div>
          </div>

          {/* Resolution Criteria */}
          <div>
            <label htmlFor="create-criteria" className="text-xs font-semibold text-[#334155] block mb-1">
              Resolution Criteria *
            </label>
            <textarea
              id="create-criteria"
              required
              rows={2}
              placeholder="Specify the unambiguous conditions under which this market resolves to YES or NO..."
              value={resolutionCriteria}
              onChange={(e) => setResolutionCriteria(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-[#10b981] placeholder:text-neutral-400"
            />
          </div>

          {/* Probability & Initial Liquidity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="create-prob" className="text-xs font-semibold text-[#334155]">
                  Initial Probability
                </label>
                <span className="font-mono-tabular font-bold text-xs text-[#10b981]">
                  {initialProb}% Yes / {100 - initialProb}% No
                </span>
              </div>
              <input
                id="create-prob"
                type="range"
                min="5"
                max="95"
                value={initialProb}
                onChange={(e) => setInitialProb(parseInt(e.target.value))}
                className="w-full accent-[#10b981]"
              />
            </div>

            <div>
              <label htmlFor="create-liquidity" className="text-xs font-semibold text-[#334155] block mb-1">
                Initial Liquidity Seed ($)
              </label>
              <input
                id="create-liquidity"
                type="number"
                min="10000"
                step="5000"
                value={initialLiquidity}
                onChange={(e) => setInitialLiquidity(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono-tabular bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-[#10b981]"
              />
            </div>
          </div>

          {/* Creator Thesis Description */}
          <div>
            <label htmlFor="create-desc" className="text-xs font-semibold text-[#334155] block mb-1">
              Creator Thesis / Background <span className="font-normal text-neutral-400">(optional)</span>
            </label>
            <textarea
              id="create-desc"
              rows={2}
              placeholder="Explain why you are creating this market and why it matters..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:border-[#10b981] placeholder:text-neutral-400"
            />
          </div>

          {/* Live Preview Card */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider block mb-2">
              Market Preview
            </span>
            <div className="bg-[#fcfdfd] border border-neutral-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-[#64748b]">
                <span className="font-semibold text-[#09090B]">{category}</span>
                <span aria-hidden="true">·</span>
                <span>{topic || category}</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-mono-tabular">
                  ${parseInt(initialLiquidity || '0').toLocaleString()} Liquidity
                </span>
              </div>
              <h4 className="text-sm font-semibold text-[#09090B]">
                {question || 'Your market question will appear here...'}
              </h4>
              <div className="flex items-center gap-3 pt-1">
                <span className="text-sm font-bold font-mono-tabular text-[#09090B]">
                  {initialProb}% <span className="text-xs font-medium text-[#10b981]">Yes</span>
                </span>
                <span className="text-sm font-bold font-mono-tabular text-neutral-400">
                  {100 - initialProb}% <span className="text-xs font-medium">No</span>
                </span>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#64748b] hover:text-[#09090B] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-medium rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Publish Market</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
