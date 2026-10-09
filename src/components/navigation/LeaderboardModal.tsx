import React from 'react';
import { X, Trophy } from 'lucide-react';
import { LeaderboardSection } from '../marketplace/LeaderboardSection';
import { MOCK_LEADERBOARD } from '../../data/mockMarkets';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeaderboardModal({ isOpen, onClose }: LeaderboardModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white border border-neutral-200 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-lg font-bold font-display text-[#09090B]">
                Global Leaderboard
              </h3>
              <p className="text-xs text-neutral-500">
                <span className="font-bold text-amber-700">Sample data.</span> Rankings go live once Panta markets
                traded through DuckCast resolve.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-black rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <LeaderboardSection users={MOCK_LEADERBOARD} />
      </div>
    </div>
  );
}
