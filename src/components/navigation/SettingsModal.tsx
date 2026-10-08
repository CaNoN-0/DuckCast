import React, { useState } from 'react';
import { X, Moon, Sun, DollarSign, Bell, Shield, Sliders, Check } from 'lucide-react';
import { HalftoneBackground } from '../marketplace/HalftoneBackground';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  if (!isOpen) return null;

  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'ETH'>('USD');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [slippage, setSlippage] = useState('1.0');
  const [tradeConfirmation, setTradeConfirmation] = useState(true);

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
            {/* Display Currency */}
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1.5">
                Display Currency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['USD', 'EUR', 'ETH'] as const).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setCurrency(curr)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      currency === curr
                        ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 shadow-2xs'
                        : 'border-neutral-200 bg-neutral-50/60 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Slippage Tolerance */}
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1.5">
                Max Slippage Tolerance
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['0.5', '1.0', '2.5', '5.0'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSlippage(val)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      slippage === val
                        ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 shadow-2xs'
                        : 'border-neutral-200 bg-neutral-50/60 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle Preferences */}
            <div className="space-y-3 pt-2 border-t border-neutral-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-neutral-800">Trade Confirmations</div>
                  <div className="text-[11px] text-neutral-500">Require one-tap preview before signing</div>
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
                  <div className="text-xs font-bold text-neutral-800">Sound Effects & Haptics</div>
                  <div className="text-[11px] text-neutral-500">Audio feedback on prediction placement</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    soundEnabled ? 'bg-emerald-600 justify-end' : 'bg-neutral-300 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-[#09090B] hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
