/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';

export interface FilterState {
  status: 'all' | 'live' | 'ending_today' | 'ending_week';
  volume: 'all' | 'high' | 'medium';
  probability: 'all' | 'high' | 'even' | 'low';
  creator: 'all' | 'verified' | 'community';
}

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
  onResetFilters: () => void;
}

export function FiltersModal({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters
}: FiltersModalProps) {
  const [localFilters, setLocalFilters] = React.useState<FilterState>(filters);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="bg-white border border-neutral-200 rounded-2xl w-full max-w-[480px] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#10b981]" />
            <h3 className="text-base font-semibold text-[#09090B]">
              Marketplace Filters
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Groups */}
        <div className="py-4 space-y-4 text-xs">
          {/* Market Status */}
          <div>
            <label className="font-semibold text-[#334155] block mb-2">Market Status</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'All Statuses' },
                { id: 'live', label: 'Live Sessions' },
                { id: 'ending_today', label: 'Ending Today' },
                { id: 'ending_week', label: 'Ending This Week' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLocalFilters({ ...localFilters, status: opt.id as FilterState['status'] })}
                  className={`py-2 px-3 rounded-xl border text-left font-medium transition-colors cursor-pointer ${
                    localFilters.status === opt.id
                      ? 'bg-[#09090B] text-white border-[#09090B]'
                      : 'bg-white text-[#475569] border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Volume */}
          <div>
            <label className="font-semibold text-[#334155] block mb-2">Trading Volume</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'high', label: '> $5M High' },
                { id: 'medium', label: '$1M - $5M' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLocalFilters({ ...localFilters, volume: opt.id as FilterState['volume'] })}
                  className={`py-2 px-2.5 rounded-xl border text-center font-medium transition-colors cursor-pointer ${
                    localFilters.volume === opt.id
                      ? 'bg-[#09090B] text-white border-[#09090B]'
                      : 'bg-white text-[#475569] border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Probability */}
          <div>
            <label className="font-semibold text-[#334155] block mb-2">Implied Probability</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'high', label: '> 70% High' },
                { id: 'even', label: '40% - 60%' },
                { id: 'low', label: '< 30% Low' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLocalFilters({ ...localFilters, probability: opt.id as FilterState['probability'] })}
                  className={`py-2 px-2.5 rounded-xl border text-center font-medium transition-colors cursor-pointer ${
                    localFilters.probability === opt.id
                      ? 'bg-[#09090B] text-white border-[#09090B]'
                      : 'bg-white text-[#475569] border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onResetFilters();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748b] hover:text-[#09090B] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onApplyFilters(localFilters);
              onClose();
            }}
            className="px-5 py-2 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-medium rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
