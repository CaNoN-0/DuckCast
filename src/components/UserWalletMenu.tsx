/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LogOut, Wallet, TrendingUp, Trophy, ArrowUpRight } from 'lucide-react';

interface UserWalletMenuProps {
  wallet: { name: string; address: string };
  balance: number;
  isOpen: boolean;
  onClose: () => void;
  onDisconnect: () => void;
}

export function UserWalletMenu({
  wallet,
  balance,
  isOpen,
  onClose,
  onDisconnect
}: UserWalletMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-12 w-72 bg-white border border-neutral-200 rounded-2xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-100">
      {/* Wallet info */}
      <div className="pb-3 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span className="text-xs font-semibold text-[#09090B]">{wallet.name}</span>
          </div>
          <span className="text-[10px] font-mono-tabular bg-neutral-100 px-2 py-0.5 rounded text-[#64748b]">
            {wallet.address}
          </span>
        </div>
      </div>

      {/* Balance stats */}
      <div className="py-3 space-y-2 border-b border-neutral-100">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#64748b]">Cash Balance</span>
          <span className="font-mono-tabular font-bold text-[#09090B]">
            ${balance.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#64748b]">Portfolio Value</span>
          <span className="font-mono-tabular font-semibold text-emerald-600">
            ${(balance + 115000).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#64748b]">Track Record</span>
          <span className="font-mono-tabular font-medium text-[#09090B] flex items-center gap-1">
            <Trophy className="w-3 h-3 text-amber-500" />
            74% Win Rate
          </span>
        </div>
      </div>

      {/* Quick Links */}
      <div className="py-2 space-y-1">
        <div className="px-2 py-1.5 text-xs text-[#475569] flex items-center justify-between rounded hover:bg-neutral-50 transition-colors">
          <span>Active Positions</span>
          <span className="font-mono-tabular font-semibold text-[#09090B]">3 open</span>
        </div>
      </div>

      {/* Disconnect */}
      <div className="pt-2 border-t border-neutral-100">
        <button
          type="button"
          onClick={() => {
            onDisconnect();
            onClose();
          }}
          className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
        >
          <span>Disconnect Wallet</span>
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
