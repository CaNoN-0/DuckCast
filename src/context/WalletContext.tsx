/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  DetectedWallet,
  ConnectedWalletState,
  getAvailableWallets,
  connectWalletProvider,
  checkExistingConnection,
  disconnectWallet as clearStoredWallet,
  initEip6963Discovery,
  shortenAddress,
  SUPPORTED_NETWORKS
} from '../services/web3Wallet';

export interface WalletContextType {
  connectedWallet: ConnectedWalletState | null;
  isConnecting: boolean;
  connectingId: string | null;
  error: string | null;
  detectedWallets: DetectedWallet[];
  isWalletModalOpen: boolean;
  openWalletModal: () => void;
  closeWalletModal: () => void;
  connectWallet: (wallet: DetectedWallet) => Promise<void>;
  disconnectWallet: () => void;
  clearError: () => void;
  refreshWallets: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [connectedWallet, setConnectedWallet] = useState<ConnectedWalletState | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectedWallets, setDetectedWallets] = useState<DetectedWallet[]>([]);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // Store active provider reference to manage listener detachments cleanly
  const activeProviderRef = useRef<any>(null);

  const refreshWallets = useCallback(() => {
    setDetectedWallets(getAvailableWallets());
  }, []);

  const detachListeners = useCallback((provider: any) => {
    if (!provider || typeof provider.removeListener !== 'function') return;
    try {
      if (provider.__duckcastAccountsHandler) {
        provider.removeListener('accountsChanged', provider.__duckcastAccountsHandler);
        delete provider.__duckcastAccountsHandler;
      }
      if (provider.__duckcastChainHandler) {
        provider.removeListener('chainChanged', provider.__duckcastChainHandler);
        delete provider.__duckcastChainHandler;
      }
      if (provider.__duckcastDisconnectHandler) {
        provider.removeListener('disconnect', provider.__duckcastDisconnectHandler);
        delete provider.__duckcastDisconnectHandler;
      }
    } catch {
      // Ignore listener removal errors
    }
  }, []);

  const attachListeners = useCallback((provider: any) => {
    if (!provider || typeof provider.on !== 'function') return;
    detachListeners(provider);

    // 1. Account changed listener
    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        // User disconnected all accounts in extension
        clearStoredWallet();
        setConnectedWallet(null);
      } else {
        const newAddress = accounts[0];
        setConnectedWallet((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            address: newAddress,
            shortAddress: shortenAddress(newAddress)
          };
        });
      }
    };

    // 2. Network changed listener
    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      const network = SUPPORTED_NETWORKS[newChainId];
      const networkName = network ? network.name : `Chain ID ${newChainId}`;

      setConnectedWallet((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          chainId: newChainId,
          networkName
        };
      });
    };

    // 3. Provider disconnect listener
    const handleDisconnect = () => {
      clearStoredWallet();
      setConnectedWallet(null);
    };

    provider.__duckcastAccountsHandler = handleAccountsChanged;
    provider.__duckcastChainHandler = handleChainChanged;
    provider.__duckcastDisconnectHandler = handleDisconnect;

    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);
    provider.on('disconnect', handleDisconnect);

    activeProviderRef.current = provider;
  }, [detachListeners]);

  // Initial detection and silent session check
  useEffect(() => {
    initEip6963Discovery(() => {
      refreshWallets();
    });
    refreshWallets();

    // Check if the user previously connected and already granted accounts
    checkExistingConnection().then((existing) => {
      if (existing) {
        setConnectedWallet(existing);
        attachListeners(existing.provider);
      }
    });

    return () => {
      if (activeProviderRef.current) {
        detachListeners(activeProviderRef.current);
      }
    };
  }, [attachListeners, detachListeners, refreshWallets]);

  const openWalletModal = useCallback(() => {
    setError(null);
    refreshWallets();
    setIsWalletModalOpen(true);
  }, [refreshWallets]);

  const closeWalletModal = useCallback(() => {
    if (isConnecting) return;
    setIsWalletModalOpen(false);
    setError(null);
  }, [isConnecting]);

  const connectWallet = useCallback(async (wallet: DetectedWallet) => {
    setError(null);

    // If not installed, guide user to download
    if (!wallet.installed) {
      setError(`No compatible ${wallet.name} extension detected in your browser. Install it and try again.`);
      return;
    }

    setIsConnecting(true);
    setConnectingId(wallet.id);

    try {
      const result = await connectWalletProvider(wallet);
      attachListeners(result.provider);
      setConnectedWallet(result);
      setIsConnecting(false);
      setConnectingId(null);
      setIsWalletModalOpen(false);
    } catch (err: any) {
      setIsConnecting(false);
      setConnectingId(null);

      if (err.message === 'USER_REJECTED') {
        setError('Connection request was rejected in your wallet.');
      } else if (err.message === 'PENDING_REQUEST') {
        setError('A connection request is already pending in your wallet extension.');
      } else if (err.message === 'WALLET_LOCKED') {
        setError('Your wallet appears locked. Please unlock it in your browser extension.');
      } else if (err.message === 'NOT_INSTALLED') {
        setError('This wallet extension was not found. Please install it and try again.');
      } else {
        setError('Unable to connect. Please check your wallet extension and try again.');
      }
    }
  }, [attachListeners]);

  const disconnect = useCallback(() => {
    if (activeProviderRef.current) {
      detachListeners(activeProviderRef.current);
      activeProviderRef.current = null;
    }
    clearStoredWallet();
    setConnectedWallet(null);
  }, [detachListeners]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        connectedWallet,
        isConnecting,
        connectingId,
        error,
        detectedWallets,
        isWalletModalOpen,
        openWalletModal,
        closeWalletModal,
        connectWallet,
        disconnectWallet: disconnect,
        clearError,
        refreshWallets
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
