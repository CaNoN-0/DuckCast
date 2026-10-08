/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Copy,
  Check,
  LogOut,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Wallet
} from 'lucide-react';
import { ConnectedWalletState, switchNetwork, SUPPORTED_NETWORKS } from '../services/web3Wallet';

interface ConnectedAccountPanelProps {
  walletState: ConnectedWalletState;
  isOpen: boolean;
  onClose: () => void;
  onDisconnect: () => void;
  onNetworkSwitched: (newChainId: number, newNetworkName: string) => void;
}

export function ConnectedAccountPanel({
  walletState,
  isOpen,
  onClose,
  onDisconnect,
  onNetworkSwitched
}: ConnectedAccountPanelProps) {
  const [copied, setCopied] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (walletState.address) {
      navigator.clipboard.writeText(walletState.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Panta operates on Ethereum (Chain ID 1) or Base (Chain ID 8453)
  const isTargetNetwork = walletState.chainId === 1 || walletState.chainId === 8453;

  const handleSwitchNetwork = async (targetChainId: number) => {
    setIsSwitching(true);
    setSwitchError(null);
    try {
      await switchNetwork(walletState.provider, targetChainId);
      const targetName = SUPPORTED_NETWORKS[targetChainId]?.name || `Chain ${targetChainId}`;
      onNetworkSwitched(targetChainId, targetName);
      setIsSwitching(false);
    } catch (err: any) {
      setIsSwitching(false);
      if (err.code === 4001) {
        setSwitchError('Network switch request was rejected.');
      } else {
        setSwitchError('Failed to switch network. Please try from your wallet.');
      }
    }
  };

  const explorerUrl =
    walletState.chainId === 8453
      ? `https://basescan.org/address/${walletState.address}`
      : `https://etherscan.io/address/${walletState.address}`;

  return (
    <AnimatePresence>
      <div className="absolute right-0 top-12 z-50 select-none">
        {/* Click outside backdrop */}
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -6 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-80 rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-xl shadow-black/10 p-5 space-y-4"
        >
          {/* Header Status */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100/80">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
              <span className="text-xs font-bold text-[#09090B]">Connected</span>
            </div>
            <span className="text-[11px] font-semibold text-[#10b981] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
              {walletState.walletName}
            </span>
          </div>

          {/* Address Display */}
          <div className="p-3 rounded-xl bg-white/70 border border-neutral-200/60 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] text-[#64748b] block font-medium">Account</span>
              <span className="font-mono-tabular font-bold text-sm text-[#09090B] tracking-tight block truncate">
                {walletState.shortAddress}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopy}
                title="Copy Address"
                className="p-1.5 rounded-lg text-neutral-500 hover:text-[#09090B] hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-[#10b981]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              <a
                href={explorerUrl}
                target="_blank"
                rel="noreferrer"
                title="View on Block Explorer"
                className="p-1.5 rounded-lg text-neutral-500 hover:text-[#09090B] hover:bg-neutral-100 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Network Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64748b] font-medium">Network</span>
              {isTargetNetwork ? (
                <span className="font-semibold text-[#09090B] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {walletState.networkName}
                </span>
              ) : (
                <span className="font-semibold text-rose-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  Wrong network
                </span>
              )}
            </div>

            {/* Switch Network option if on unsupported network */}
            {!isTargetNetwork && (
              <div className="pt-1">
                <button
                  type="button"
                  disabled={isSwitching}
                  onClick={() => handleSwitchNetwork(1)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSwitching ? 'animate-spin' : ''}`} />
                  <span>Switch to Ethereum</span>
                </button>
              </div>
            )}

            {switchError && (
              <p className="text-[11px] text-rose-600 pt-0.5">{switchError}</p>
            )}
          </div>

          {/* Balance Section */}
          <div className="p-3 rounded-xl bg-white/70 border border-neutral-200/60 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64748b] font-medium">Trading Balance</span>
              <span className="font-mono-tabular font-bold text-sm text-[#09090B]">
                ${walletState.balanceUsd}
              </span>
            </div>
            {walletState.balanceEth && walletState.balanceEth !== '0.00' && (
              <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono-tabular">
                <span>Wallet Native</span>
                <span>{walletState.balanceEth} ETH</span>
              </div>
            )}
          </div>

          {/* Buttons: Copy Address & Disconnect */}
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-neutral-200 hover:border-neutral-300 bg-white text-xs font-medium text-[#09090B] transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Address</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                onDisconnect();
                onClose();
              }}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-rose-200 hover:bg-rose-50 text-xs font-medium text-rose-600 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
