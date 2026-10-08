/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Check, AlertCircle, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { useWallet } from '../context/WalletContext';

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectWalletModal({ isOpen, onClose }: ConnectWalletModalProps) {
  const {
    connectedWallet,
    isConnecting,
    connectingId,
    error,
    detectedWallets,
    connectWallet,
    disconnectWallet,
    clearError,
    refreshWallets
  } = useWallet();

  if (!isOpen) return null;

  const installedWallets = detectedWallets.filter((w) => w.installed);
  const hasInstalledWallets = installedWallets.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100 select-none"
      onClick={onClose}
    >
      <div
        className="bg-white border border-neutral-200 rounded-2xl w-full max-w-[420px] p-6 shadow-xl relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-[#09090B] font-display">
              Connect Wallet
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#71717A] hover:text-[#09090B] rounded-md transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subtext */}
        <p className="text-[13px] text-[#71717A] mt-3 mb-4 leading-relaxed">
          Sign in with your wallet to publish on-chain predictions, stake behind your thesis, and build a verifiable forecasting record.
        </p>

        {/* Error Alert Banner */}
        {error && (
          <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[12px] flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={clearError}
              className="text-rose-500 hover:text-rose-700 cursor-pointer"
              aria-label="Dismiss error"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Wallet List */}
        {hasInstalledWallets ? (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider px-1 pb-0.5 flex items-center justify-between">
              <span>Detected in Browser</span>
              <button
                type="button"
                onClick={refreshWallets}
                className="hover:text-black transition-colors inline-flex items-center gap-1 cursor-pointer font-medium lowercase"
                title="Refresh detection"
              >
                <RefreshCw className="w-3 h-3" />
                <span>rescan</span>
              </button>
            </div>

            {installedWallets.map((wallet) => {
              const isCurrent = connectedWallet?.walletId === wallet.id || connectedWallet?.name === wallet.name;
              const isBusy = connectingId === wallet.id;

              return (
                <button
                  key={wallet.id}
                  type="button"
                  disabled={isConnecting}
                  onClick={() => connectWallet(wallet)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                    isCurrent
                      ? 'border-[#10B981] bg-[#10B981]/[0.04]'
                      : 'border-neutral-200 hover:border-[#09090B] bg-white hover:bg-neutral-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Wallet Icon */}
                    <div className="w-8 h-8 rounded-lg bg-neutral-100/80 border border-neutral-200/80 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                      {wallet.id === 'metamask' ? (
                        <svg viewBox="0 0 32 32" className="w-5 h-5">
                          <path fill="#E17726" d="M28.4 6.7L18.2 14l3.8-9.1L28.4 6.7z" />
                          <path fill="#E27625" d="M3.6 6.7l10.1 7.4-3.7-9.2L3.6 6.7z" />
                          <path fill="#D5BFB2" d="M23.9 22.4l-3.3 5 7.1 2-1.9-6.9-1.9-.1z" />
                          <path fill="#D5BFB2" d="M8.1 22.4l3.3 5-7.1 2 1.9-6.9 1.9-.1z" />
                          <path fill="#233447" d="M12.4 18.5l-3.3-1 2.3-2.3 1 3.3z" />
                          <path fill="#233447" d="M19.6 18.5l3.3-1-2.3-2.3-1 3.3z" />
                          <path fill="#CC6228" d="M11.5 27.4l3.7-1.8-3.2-2.4-.5 4.2z" />
                          <path fill="#CC6228" d="M20.5 27.4l-3.7-1.8 3.2-2.4.5 4.2z" />
                          <path fill="#E27525" d="M16 19.3l-3.6-.8 2.5-3.3 1.1 4.1zm0 0l3.6-.8-2.5-3.3-1.1 4.1z" />
                        </svg>
                      ) : wallet.id === 'rabby' ? (
                        <svg viewBox="0 0 32 32" className="w-5 h-5">
                          <rect width="32" height="32" rx="6" fill="#8B98FE" />
                          <path
                            d="M10 18c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6h-6v-6z"
                            fill="#FFFFFF"
                          />
                          <circle cx="14" cy="16" r="1.5" fill="#8B98FE" />
                          <circle cx="18" cy="16" r="1.5" fill="#8B98FE" />
                        </svg>
                      ) : wallet.id === 'coinbase' ? (
                        <svg viewBox="0 0 32 32" className="w-5 h-5">
                          <rect width="32" height="32" rx="6" fill="#0052FF" />
                          <circle cx="16" cy="16" r="6.5" fill="#FFF" />
                          <rect x="13.5" y="13.5" width="5" height="5" rx="1" fill="#0052FF" />
                        </svg>
                      ) : wallet.icon?.startsWith('http') || wallet.icon?.startsWith('data:') ? (
                        <img
                          src={wallet.icon}
                          alt={wallet.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-xs font-bold text-neutral-800">EVM</span>
                      )}
                    </div>

                    <div className="truncate">
                      <div className="text-[14px] font-medium text-[#09090B] truncate">
                        {wallet.name}
                      </div>
                      <div className="text-[12px] text-[#71717A] flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Detected</span>
                        {wallet.rdns && (
                          <span className="text-[10px] text-neutral-400 font-mono-tabular">· {wallet.rdns}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[12px] font-medium shrink-0 ml-2">
                    {isBusy ? (
                      <span className="text-[#10B981] inline-flex items-center gap-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Connecting…
                      </span>
                    ) : isCurrent ? (
                      <span className="inline-flex items-center gap-1 text-[#10B981]">
                        <Check className="w-3.5 h-3.5" />
                        Active
                      </span>
                    ) : (
                      <span className="text-[#71717A] group-hover:text-black transition-colors">
                        Connect
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* When NO compatible wallet extension is installed */
          <div className="py-2">
            <div className="p-4 bg-amber-50/70 border border-amber-200/90 rounded-xl mb-4 text-left">
              <div className="text-[13px] font-bold text-amber-950 mb-1">
                No compatible wallet detected.
              </div>
              <p className="text-[12px] text-amber-900 leading-relaxed">
                Install a supported browser wallet and try again.
              </p>
            </div>

            <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider px-1 pb-1 text-left">
              Supported Browser Wallets
            </div>

            <div className="space-y-2">
              {detectedWallets.map((wallet) => (
                <a
                  key={wallet.id}
                  href={wallet.installUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-neutral-200 hover:border-neutral-400 bg-white hover:bg-neutral-50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center p-1 shrink-0">
                      {wallet.id === 'metamask' ? (
                        <svg viewBox="0 0 32 32" className="w-4 h-4">
                          <path fill="#E17726" d="M28.4 6.7L18.2 14l3.8-9.1L28.4 6.7z" />
                          <path fill="#E27625" d="M3.6 6.7l10.1 7.4-3.7-9.2L3.6 6.7z" />
                          <path fill="#D5BFB2" d="M23.9 22.4l-3.3 5 7.1 2-1.9-6.9-1.9-.1z" />
                          <path fill="#D5BFB2" d="M8.1 22.4l3.3 5-7.1 2 1.9-6.9 1.9-.1z" />
                        </svg>
                      ) : wallet.id === 'rabby' ? (
                        <svg viewBox="0 0 32 32" className="w-4 h-4">
                          <rect width="32" height="32" rx="4" fill="#8B98FE" />
                          <path d="M10 18c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6h-6v-6z" fill="#FFFFFF" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 32 32" className="w-4 h-4">
                          <rect width="32" height="32" rx="4" fill="#0052FF" />
                          <circle cx="16" cy="16" r="6" fill="#FFF" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-[#09090B]">
                        {wallet.name}
                      </div>
                      <div className="text-[11px] text-[#71717A]">
                        Browser extension
                      </div>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1 text-[12px] font-semibold text-neutral-600 group-hover:text-black">
                    <span>Install</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                </a>
              ))}
            </div>

            <button
              type="button"
              onClick={refreshWallets}
              className="mt-3 w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-[#09090B] text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>I have installed a wallet, check again</span>
            </button>
          </div>
        )}

        {/* Currently Connected Info Footer */}
        {connectedWallet && (
          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
            <div className="text-[12px] text-[#71717A] flex items-center gap-1.5">
              <span>Signed in as</span>
              <span className="font-mono-tabular font-semibold text-[#09090B]">
                {connectedWallet.shortAddress || connectedWallet.address}
              </span>
              {connectedWallet.networkName && (
                <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-medium">
                  {connectedWallet.networkName}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                disconnectWallet();
                onClose();
              }}
              className="text-[12px] font-medium text-rose-600 hover:text-rose-700 underline underline-offset-4 cursor-pointer"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
