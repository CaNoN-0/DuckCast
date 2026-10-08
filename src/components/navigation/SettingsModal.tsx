/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Sliders, Bell, Shield, Wallet, Check } from 'lucide-react';
import { HalftoneBackground } from '../marketplace/HalftoneBackground';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  if (!isOpen) return null;

  const [defaultAmount, setDefaultAmount] = useState<string>('50');
  const [tradeConfirmation, setTradeConfirmation] = useState(true);
  const [resolutionNotifications, setResolutionNotifications] = useState(true);
  const [publicTheses, setPublicTheses] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 400);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white border border-neutral-200 rounded-2xl w-full max-w-md p-6 shadow-xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <HalftoneBackground opacity={0.08} />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-bold font-display text-[#09090B]">
                Settings & Preferences
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-black rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 py-4">
            {/* Default Prediction Amount */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-neutral-700">
                  Default Prediction Stake
                </label>
                <span className="text-[11px] font-mono-tabular text-emerald-700 font-semibold">
                  Native Solana USDC
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['10', '50', '100', '500'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDefaultAmount(val)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer font-mono-tabular ${
                      defaultAmount === val
                        ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 shadow-2xs'
                        : 'border-neutral-200 bg-neutral-50/60 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    ${val}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification & Confirmation Preferences */}
            <div className="space-y-3 pt-3 border-t border-neutral-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-neutral-800">Prediction Confirmation</div>
                  <div className="text-[11px] text-neutral-500">Require one-tap preview before signing on Solana</div>
                </div>
                <button
                  type="button"
                  onClick={() => setTradeConfirmation(!tradeConfirmation)}
                  className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    tradeConfirmation ? 'bg-emerald-600 justify-end' : 'bg-neutral-300 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-neutral-800">Resolution Notifications</div>
                  <div className="text-[11px] text-neutral-500">Alerts when predictions resolve or claims are ready</div>
                </div>
                <button
                  type="button"
                  onClick={() => setResolutionNotifications(!resolutionNotifications)}
                  className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    resolutionNotifications ? 'bg-emerald-600 justify-end' : 'bg-neutral-300 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-neutral-800">Public Thesis Visibility</div>
                  <div className="text-[11px] text-neutral-500">Display your theses and research in social feeds</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPublicTheses(!publicTheses)}
                  className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    publicTheses ? 'bg-emerald-600 justify-end' : 'bg-neutral-300 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>

            {/* Protocol & Currency Badge */}
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/70 flex items-center justify-between text-xs font-mono-tabular">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-neutral-700">Settlement Currency</span>
              </div>
              <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                USDC (Solana SPL)
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
            <span className="text-[11px] text-neutral-400 font-mono-tabular">Panta Architecture</span>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-[#09090B] hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              {saved && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{saved ? 'Saved' : 'Done'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
