/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import './appKit';
import { useAppKit, useAppKitAccount, useDisconnect, useAppKitNetwork, useAppKitProvider } from '@reown/appkit/react';
import type { Provider as SolanaProvider } from '@reown/appkit-adapter-solana/react';
import {
  SolanaNetworkType,
  shortenSolanaAddress,
  DEFAULT_SOLANA_NETWORK
} from '../solana/config';
import { getUsdcBalance, getSolBalance } from '../solana/connection';
import { formatUsdc } from '../solana/usdc';
import type { SolanaSigner } from '../solana/transactions';

export type WalletConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'wrong_network'
  | 'error';

export interface ConnectedSolanaWallet {
  address: string;
  shortAddress: string;
  name: string;
  network: SolanaNetworkType;
  networkName: string;
  usdcBalance: number;
  formattedUsdcBalance: string;
  solBalance: number;
  provider?: any;
}

export interface WalletContextType {
  connectedWallet: ConnectedSolanaWallet | null;
  walletState: WalletConnectionState;
  isConnecting: boolean;
  error: string | null;
  currentNetwork: SolanaNetworkType;
  openWalletModal: () => void;
  disconnectWallet: () => void;
  switchNetwork: (net: SolanaNetworkType) => Promise<void>;
  refreshBalances: () => Promise<void>;
  clearError: () => void;
  /** Signs Panta-built transactions; null until a wallet is connected. */
  signer: SolanaSigner | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { open } = useAppKit();
  const { address, isConnected, status } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const { caipNetwork } = useAppKitNetwork();
  const { walletProvider } = useAppKitProvider<SolanaProvider>('solana');

  const [currentNetwork, setCurrentNetwork] = useState<SolanaNetworkType>(DEFAULT_SOLANA_NETWORK);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [solBalance, setSolBalance] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Determine current network from Reown caipNetwork if present
  useEffect(() => {
    if (caipNetwork?.name?.toLowerCase().includes('devnet')) {
      setCurrentNetwork('devnet');
    } else if (caipNetwork?.name?.toLowerCase().includes('solana')) {
      setCurrentNetwork('mainnet-beta');
    }
  }, [caipNetwork]);

  // Fetch real on-chain balances whenever address or network changes
  const fetchBalances = useCallback(async (targetAddress: string, network: SolanaNetworkType) => {
    setIsRefreshing(true);
    try {
      const [fetchedUsdc, fetchedSol] = await Promise.all([
        getUsdcBalance(targetAddress, network),
        getSolBalance(targetAddress, network)
      ]);

      // Real on-chain balances only — trades settle in real USDC on Panta.
      setUsdcBalance(fetchedUsdc);
      setSolBalance(fetchedSol);
    } catch (err: any) {
      console.warn('[Wallet] Balance fetch notice:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      fetchBalances(address, currentNetwork);
    } else {
      setUsdcBalance(0);
      setSolBalance(0);
    }
  }, [isConnected, address, currentNetwork, fetchBalances]);

  // Active wallet state mapping
  const walletState: WalletConnectionState = useMemo(() => {
    if (status === 'connecting') return 'connecting';
    if (isConnected && address) return 'connected';
    if (error) return 'error';
    return 'disconnected';
  }, [status, isConnected, address, error]);

  // Unified connected wallet object
  const connectedWallet: ConnectedSolanaWallet | null = useMemo(() => {
    if (!isConnected || !address) return null;

    return {
      address,
      shortAddress: shortenSolanaAddress(address),
      name: 'Solana Wallet',
      network: currentNetwork,
      networkName: currentNetwork === 'devnet' ? 'Solana Devnet' : 'Solana Mainnet',
      usdcBalance,
      formattedUsdcBalance: `${formatUsdc(usdcBalance)} USDC`,
      solBalance
    };
  }, [isConnected, address, currentNetwork, usdcBalance, solBalance]);

  const openWalletModal = useCallback(() => {
    setError(null);
    try {
      open();
    } catch (err: any) {
      console.warn('[Wallet] Error opening AppKit modal:', err);
      setError('Unable to open wallet connection modal.');
    }
  }, [open]);

  const handleDisconnect = useCallback(() => {
    setError(null);
    try {
      disconnect();
    } catch (err: any) {
      console.warn('[Wallet] Error during disconnect:', err);
    }
  }, [disconnect]);

  const handleSwitchNetwork = useCallback(async (targetNetwork: SolanaNetworkType) => {
    setCurrentNetwork(targetNetwork);
    if (address) {
      await fetchBalances(address, targetNetwork);
    }
  }, [address, fetchBalances]);

  const refreshBalances = useCallback(async () => {
    if (address) {
      await fetchBalances(address, currentNetwork);
    }
  }, [address, currentNetwork, fetchBalances]);

  const signer: SolanaSigner | null = useMemo(() => {
    if (!isConnected || !walletProvider) return null;
    return {
      signAndSendTransaction: walletProvider.signAndSendTransaction
        ? (tx) => walletProvider.signAndSendTransaction(tx)
        : undefined,
      signTransaction: walletProvider.signTransaction
        ? (tx) => walletProvider.signTransaction(tx)
        : undefined,
      signMessage: walletProvider.signMessage ? (msg) => walletProvider.signMessage(msg) : undefined
    };
  }, [isConnected, walletProvider]);

  return (
    <WalletContext.Provider
      value={{
        connectedWallet,
        walletState,
        isConnecting: status === 'connecting',
        error,
        currentNetwork,
        openWalletModal,
        disconnectWallet: handleDisconnect,
        switchNetwork: handleSwitchNetwork,
        refreshBalances,
        clearError: () => setError(null),
        signer
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useSolanaWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useSolanaWallet must be used within a WalletProvider');
  }
  return context;
}

export const useWallet = useSolanaWallet;
