import React, { useState } from 'react';
import { X, Eye, Sparkles, Check, HelpCircle } from 'lucide-react';
import { MarketCategory, PredictionMarket } from '../../types/market';

interface CreatePredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateMarket: (newMarket: Partial<PredictionMarket>) => void;
}

const CATEGORIES: MarketCategory[] = [
  'Crypto',
  'Sports',
  'Technology',
  'Social',
  'Business',
  'Culture',
  'Politics',
  'Science',
  'Gaming',
  'Entertainment',
  'World'
];

export function CreatePredictionModal({
  isOpen,
  onClose,
  onCreateMarket
}: CreatePredictionModalProps) {
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState<MarketCategory>('Crypto');
  const [description, setDescription] = useState('');
  const [resolutionDate, setResolutionDate] = useState('');
  const [resolutionCriteria, setResolutionCriteria] = useState('');
  const [source, setSource] = useState('');
  const [initialLiquidity, setInitialLiquidity] = useState('25000');
  const [initialProb, setInitialProb] = useState(50);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    onCreateMarket({
      question: question.trim(),
      category,
      topic: category,
      yesProbability: initialProb,
      noProbability: 100 - initialProb,
      yesPriceCents: initialProb,
      noPriceCents: 100 - initialProb,
      volume: '$10K',
      volumeNumeric: 10000,
      traders: 1,
      timeRemaining: '7d 0h',
      timeMinutes: 10080,
      sparkline: [50, initialProb],
      resolutionDate: resolutionDate.trim() || 'Nov 30, 2026',
      resolutionCriteria: resolutionCriteria.trim() || 'Standard public confirmation via verified sources.',
      source: source.trim() || 'CoinGecko / Official Press',
      liquidity: `$${parseInt(initialLiquidity || '25000', 10).toLocaleString()}`,
      isNew: true,
      theses: [
        {
          id: `th-init-${Date.now()}`,
          author: 'MarketCreator',
          handle: '@creator.duck',
          side: initialProb >= 50 ? 'YES' : 'NO',
          text: description.trim() || 'Initiating community prediction market on DuckCast.',
          staked: '$250',
          timestamp: 'Just now',
          reactions: { agree: 1, fire: 0, insightful: 1 }
        }
      ],
      recentActivity: []
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white border border-neutral-200 rounded-xl w-full max-w-[620px] shadow-lg my-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h2 className="text-lg font-bold font-display tracking-tight text-[#09090B]">
              Create Prediction Market
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Form / Preview Toggle */}
            <div className="inline-flex p-1 bg-neutral-100 rounded-full text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`px-3.5 py-1 rounded-full cursor-pointer transition-colors ${
                  activeTab === 'form' ? 'bg-white text-[#09090B] shadow-xs' : 'text-neutral-500 hover:text-[#09090B]'
                }`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`inline-flex items-center gap-1 px-3.5 py-1 rounded-full cursor-pointer transition-colors ${
                  activeTab === 'preview' ? 'bg-white text-[#09090B] shadow-xs' : 'text-neutral-500 hover:text-[#09090B]'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Preview</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        {activeTab === 'form' ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-800 tracking-tight mb-1">
                Prediction Question *
              </label>
              <input
                type="text"
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. Will ETH reach $5,000 before end of year?"
                className="w-full px-3.5 py-2.5 text-sm font-semibold bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-800 tracking-tight mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as MarketCategory)}
                  className="w-full px-3 py-2.5 text-sm font-semibold bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-emerald-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 tracking-tight mb-1">
                  Resolution Date / Time *
                </label>
                <input
                  type="text"
                  value={resolutionDate}
                  onChange={(e) => setResolutionDate(e.target.value)}
                  placeholder="e.g. Nov 30, 2026 23:59 UTC"
                  className="w-full px-3 py-2.5 text-sm font-medium bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 tracking-tight mb-1">
                Description & Thesis Overview
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Give background context on this market and why it matters..."
                className="w-full px-3 py-2 text-sm font-medium bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 tracking-tight mb-1">
                Resolution Criteria *
              </label>
              <textarea
                rows={2}
                value={resolutionCriteria}
                onChange={(e) => setResolutionCriteria(e.target.value)}
                placeholder="Specific conditions for YES vs NO settlement (e.g. Binance Spot feed must print >= $5,000)..."
                className="w-full px-3 py-2 text-sm font-medium bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-800 tracking-tight mb-1">
                  Oracle / Resolution Source
                </label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. CoinGecko / Official Press Release"
                  className="w-full px-3 py-2 text-sm font-medium bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 tracking-tight mb-1">
                  Initial Liquidity ($ USD)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={initialLiquidity}
                  onChange={(e) => setInitialLiquidity(e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full px-3 py-2 text-sm font-medium bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-emerald-500 font-mono-tabular"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-neutral-800 tracking-tight">
                  Initial Probability
                </label>
                <span className="text-xs font-extrabold text-emerald-800 font-mono-tabular">
                  {initialProb}% YES ({100 - initialProb}% NO)
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="95"
                value={initialProb}
                onChange={(e) => setInitialProb(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!question.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-extrabold font-display tracking-tight text-white bg-[#09090B] hover:bg-neutral-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
              >
                <span>Publish Market</span>
              </button>
            </div>
          </form>
        ) : (
          /* Live Preview Mode */
          <div className="p-6 space-y-4">
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span className="bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded font-semibold text-[11px]">
                  {category}
                </span>
                <span className="text-emerald-700 font-bold bg-emerald-100/60 px-2 py-0.5 rounded text-[11px]">
                  NEW PREDICTION
                </span>
              </div>

              <h3 className="text-base font-bold text-[#09090B]">
                {question || 'Your prediction question will appear here'}
              </h3>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold font-mono-tabular text-[#09090B]">
                    {initialProb}%
                  </span>
                  <span className="text-xs text-neutral-400 ml-1">YES probability</span>
                </div>
                <div className="text-right text-xs text-neutral-500 font-mono-tabular">
                  <span>Initial YES: ${(initialProb / 100).toFixed(2)} · NO: ${((100 - initialProb) / 100).toFixed(2)}</span>
                </div>
              </div>

              <div className="w-full bg-neutral-200 rounded-full h-1.5 flex overflow-hidden">
                <div className="bg-emerald-500 h-full" style={{ width: `${initialProb}%` }} />
                <div className="bg-neutral-400 h-full" style={{ width: `${100 - initialProb}%` }} />
              </div>

              <div className="pt-2 border-t border-neutral-200 text-xs text-neutral-600 space-y-1">
                <p><strong>Resolves:</strong> {resolutionDate || 'TBD'}</p>
                <p><strong>Criteria:</strong> {resolutionCriteria || 'Standard public verification'}</p>
                <p><strong>Source:</strong> {source || 'Public Feed'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
              >
                ← Back to editing
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!question.trim()}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#09090B] hover:bg-neutral-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
              >
                Confirm & Publish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
