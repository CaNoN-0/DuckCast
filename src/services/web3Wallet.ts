/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { formatEther } from 'viem';

// Standard EIP-6963 Interfaces
export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: any;
}

export interface DetectedWallet {
  id: string;
  name: string;
  icon: string;
  installed: boolean;
  installUrl: string;
  provider?: any;
  rdns?: string;
}

export interface ConnectedWalletState {
  name: string;
  walletName: string;
  address: string;
  shortAddress: string;
  chainId: number;
  networkName: string;
  balanceEth?: string;
  balanceUsd?: string;
  walletId: string;
  provider: any;
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  shortName: string;
  currency: string;
  rpcUrl?: string;
  blockExplorerUrl?: string;
}

export const SUPPORTED_NETWORKS: Record<number, NetworkConfig> = {
  1: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    shortName: 'Ethereum',
    currency: 'ETH',
    blockExplorerUrl: 'https://etherscan.io'
  },
  8453: {
    chainId: 8453,
    name: 'Base',
    shortName: 'Base',
    currency: 'ETH',
    blockExplorerUrl: 'https://basescan.org'
  },
  42161: {
    chainId: 42161,
    name: 'Arbitrum One',
    shortName: 'Arbitrum',
    currency: 'ETH',
    blockExplorerUrl: 'https://arbiscan.io'
  },
  137: {
    chainId: 137,
    name: 'Polygon',
    shortName: 'Polygon',
    currency: 'POL',
    blockExplorerUrl: 'https://polygonscan.com'
  },
  10: {
    chainId: 10,
    name: 'Optimism',
    shortName: 'Optimism',
    currency: 'ETH',
    blockExplorerUrl: 'https://optimistic.etherscan.io'
  },
  11155111: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    shortName: 'Sepolia',
    currency: 'ETH',
    blockExplorerUrl: 'https://sepolia.etherscan.io'
  }
};

export const TARGET_CHAIN_ID = 1; // Default Ethereum Mainnet (can be changed by backend configuration)

const KNOWN_WALLETS = {
  rabby: {
    name: 'Rabby Wallet',
    installUrl: 'https://rabby.io/',
    icon: 'https://rabby.io/assets/images/logo.svg'
  },
  metamask: {
    name: 'MetaMask',
    installUrl: 'https://metamask.io/download/',
    icon: 'https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg'
  },
  coinbase: {
    name: 'Coinbase Wallet',
    installUrl: 'https://www.coinbase.com/wallet/downloads',
    icon: 'https://images.ctfassets.net/q5ulk4bp65r7/3TBS4oVkD1ghowTqVQjlqj/2dfd4ea3b623a7c0d8deb2ff445dee9e/Consumer_Wordmark.svg'
  },
  phantom: {
    name: 'Phantom',
    installUrl: 'https://phantom.app/download',
    icon: 'https://phantom.app/img/phantom-logo.svg'
  },
  rainbow: {
    name: 'Rainbow',
    installUrl: 'https://rainbow.me/',
    icon: 'https://avatars.githubusercontent.com/u/48327834?s=200&v=4'
  }
};

// Internal registry of EIP-6963 announced providers
const eip6963Providers = new Map<string, EIP6963ProviderDetail>();
let isEip6963Initialized = false;

/**
 * Initialize EIP-6963 provider announcement listeners
 */
export function initEip6963Discovery(onNewProvider?: () => void) {
  if (typeof window === 'undefined' || isEip6963Initialized) return;
  isEip6963Initialized = true;

  window.addEventListener('eip6963:announceProvider', (event: any) => {
    if (event?.detail?.info?.uuid) {
      eip6963Providers.set(event.detail.info.uuid, event.detail);
      if (onNewProvider) {
        onNewProvider();
      }
    }
  });

  window.dispatchEvent(new Event('eip6963:requestProvider'));
}

/**
 * Discovers injected EVM wallets via EIP-6963 announcements and window.ethereum globals.
 */
export function getAvailableWallets(): DetectedWallet[] {
  if (typeof window === 'undefined') return [];

  // Ensure EIP-6963 request was fired
  if (!isEip6963Initialized) {
    initEip6963Discovery();
  }

  const detectedMap = new Map<string, DetectedWallet>();
  const win = window as any;
  const eth = win.ethereum;

  // 1. First, register all modern EIP-6963 announced wallets
  for (const [uuid, detail] of eip6963Providers.entries()) {
    const rdns = detail.info.rdns || '';
    let id = rdns.includes('rabby')
      ? 'rabby'
      : rdns.includes('metamask')
      ? 'metamask'
      : rdns.includes('coinbase')
      ? 'coinbase'
      : rdns.includes('phantom')
      ? 'phantom'
      : rdns.includes('rainbow')
      ? 'rainbow'
      : `eip6963-${uuid}`;

    detectedMap.set(id, {
      id,
      name: detail.info.name,
      icon: detail.info.icon || KNOWN_WALLETS.metamask.icon,
      installed: true,
      installUrl: (KNOWN_WALLETS as any)[id]?.installUrl || 'https://metamask.io/download/',
      provider: detail.provider,
      rdns: detail.info.rdns
    });
  }

  // Helper to extract provider from window.ethereum.providers array
  const findProvider = (predicate: (p: any) => boolean) => {
    if (predicate(eth)) return eth;
    if (Array.isArray(eth?.providers)) {
      return eth.providers.find(predicate);
    }
    return null;
  };

  // 2. Rabby Wallet detection
  if (!detectedMap.has('rabby')) {
    const rabbyProvider = findProvider((p) => Boolean(p?.isRabby)) || (win.rabby ? win.rabby : null);
    if (rabbyProvider) {
      detectedMap.set('rabby', {
        id: 'rabby',
        name: 'Rabby Wallet',
        icon: KNOWN_WALLETS.rabby.icon,
        installed: true,
        installUrl: KNOWN_WALLETS.rabby.installUrl,
        provider: rabbyProvider
      });
    }
  }

  // 3. MetaMask detection
  if (!detectedMap.has('metamask')) {
    const metamaskProvider = findProvider((p) => Boolean(p?.isMetaMask && !p?.isRabby && !p?.isPhantom && !p?.isBraveWallet));
    if (metamaskProvider) {
      detectedMap.set('metamask', {
        id: 'metamask',
        name: 'MetaMask',
        icon: KNOWN_WALLETS.metamask.icon,
        installed: true,
        installUrl: KNOWN_WALLETS.metamask.installUrl,
        provider: metamaskProvider
      });
    }
  }

  // 4. Coinbase Wallet detection
  if (!detectedMap.has('coinbase')) {
    const coinbaseProvider = win.coinbaseWalletExtension || findProvider((p) => Boolean(p?.isCoinbaseWallet));
    if (coinbaseProvider) {
      detectedMap.set('coinbase', {
        id: 'coinbase',
        name: 'Coinbase Wallet',
        icon: KNOWN_WALLETS.coinbase.icon,
        installed: true,
        installUrl: KNOWN_WALLETS.coinbase.installUrl,
        provider: coinbaseProvider
      });
    }
  }

  // 5. Phantom EVM detection
  if (!detectedMap.has('phantom')) {
    const phantomProvider = win.phantom?.ethereum || findProvider((p) => Boolean(p?.isPhantom));
    if (phantomProvider) {
      detectedMap.set('phantom', {
        id: 'phantom',
        name: 'Phantom',
        icon: KNOWN_WALLETS.phantom.icon,
        installed: true,
        installUrl: KNOWN_WALLETS.phantom.installUrl,
        provider: phantomProvider
      });
    }
  }

  // 6. Rainbow detection
  if (!detectedMap.has('rainbow')) {
    const rainbowProvider = findProvider((p) => Boolean(p?.isRainbow));
    if (rainbowProvider) {
      detectedMap.set('rainbow', {
        id: 'rainbow',
        name: 'Rainbow',
        icon: KNOWN_WALLETS.rainbow.icon,
        installed: true,
        installUrl: KNOWN_WALLETS.rainbow.installUrl,
        provider: rainbowProvider
      });
    }
  }

  // 7. Generic Injected fallback if window.ethereum exists but no specific brand was tagged
  if (eth && detectedMap.size === 0) {
    detectedMap.set('injected', {
      id: 'injected',
      name: 'Injected Browser Wallet',
      icon: KNOWN_WALLETS.metamask.icon,
      installed: true,
      installUrl: 'https://metamask.io/download/',
      provider: eth
    });
  }

  // If installed wallets were detected, return only the installed wallets!
  const installedWallets = Array.from(detectedMap.values());
  if (installedWallets.length > 0) {
    return installedWallets;
  }

  // If NO wallet is detected in the browser, provide the standard catalog with installed: false
  // so the modal can show clear install guidance for MetaMask, Rabby, and Coinbase Wallet
  return [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: KNOWN_WALLETS.metamask.icon,
      installed: false,
      installUrl: KNOWN_WALLETS.metamask.installUrl
    },
    {
      id: 'rabby',
      name: 'Rabby Wallet',
      icon: KNOWN_WALLETS.rabby.icon,
      installed: false,
      installUrl: KNOWN_WALLETS.rabby.installUrl
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: KNOWN_WALLETS.coinbase.icon,
      installed: false,
      installUrl: KNOWN_WALLETS.coinbase.installUrl
    }
  ];
}

/**
 * Shorten an Ethereum address to standard format: 0x71A4...92F1
 */
export function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address || '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Connect to an injected wallet provider using standard EIP-1193 eth_requestAccounts.
 */
export async function connectWalletProvider(wallet: DetectedWallet): Promise<ConnectedWalletState> {
  let provider = wallet.provider;

  // Fallback to window.ethereum if specific provider wasn't bound
  if (!provider && typeof window !== 'undefined') {
    const win = window as any;
    if (wallet.id === 'phantom') {
      provider = win.phantom?.ethereum || win.ethereum;
    } else if (wallet.id === 'coinbase') {
      provider = win.coinbaseWalletExtension || win.ethereum;
    } else if (wallet.id === 'rabby') {
      provider = win.rabby || win.ethereum;
    } else {
      provider = win.ethereum;
    }
  }

  if (!provider || typeof provider.request !== 'function') {
    throw new Error('NOT_INSTALLED');
  }

  try {
    // 1. Standard request for account authorization from the user's extension
    const accounts = (await provider.request({
      method: 'eth_requestAccounts'
    })) as string[];

    if (!accounts || accounts.length === 0) {
      throw new Error('NO_ACCOUNTS');
    }

    const address = accounts[0];

    // 2. Fetch the connected blockchain network chain ID
    let chainId = 1;
    try {
      const chainIdHex = (await provider.request({
        method: 'eth_chainId'
      })) as string;
      chainId = parseInt(chainIdHex, 16);
    } catch {
      chainId = 1;
    }

    // 3. Fetch native balance (ETH)
    let balanceEth = '0.00';
    let balanceUsd = '$0.00';
    try {
      const balanceHex = (await provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      })) as string;
      const parsedEth = parseFloat(formatEther(BigInt(balanceHex)));
      balanceEth = parsedEth.toFixed(4);
      if (parsedEth > 0) {
        balanceUsd = `$${(parsedEth * 3450).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`;
      }
    } catch {
      balanceEth = '0.00';
    }

    const network = SUPPORTED_NETWORKS[chainId];
    const networkName = network ? network.name : `Chain ID ${chainId}`;

    // Store in localStorage for session restoration
    try {
      localStorage.setItem('duckcast_wallet_connected', wallet.id);
      localStorage.setItem('duckcast_wallet_address', address);
    } catch {
      // ignore
    }

    return {
      name: wallet.name,
      walletName: wallet.name,
      address,
      shortAddress: shortenAddress(address),
      chainId,
      networkName,
      balanceEth,
      balanceUsd,
      walletId: wallet.id,
      provider
    };
  } catch (err: any) {
    if (
      err?.code === 4001 ||
      err?.message?.includes('rejected') ||
      err?.message?.includes('denied') ||
      err?.message?.includes('User rejected')
    ) {
      throw new Error('USER_REJECTED');
    }
    if (err?.code === -32002 || err?.message?.includes('already pending')) {
      throw new Error('PENDING_REQUEST');
    }
    if (err?.code === -32603 || err?.message?.includes('locked')) {
      throw new Error('WALLET_LOCKED');
    }
    throw new Error(err?.message || 'FAILED');
  }
}

/**
 * Silently check if the user has already approved account access in their wallet
 */
export async function checkExistingConnection(): Promise<ConnectedWalletState | null> {
  if (typeof window === 'undefined') return null;

  try {
    const savedWalletId = localStorage.getItem('duckcast_wallet_connected');
    if (!savedWalletId) return null;

    const wallets = getAvailableWallets();
    const targetWallet = wallets.find((w) => w.id === savedWalletId);
    if (!targetWallet || !targetWallet.provider) return null;

    const provider = targetWallet.provider;
    // eth_accounts returns granted accounts without prompting the user
    let accounts: string[] = [];
    try {
      accounts = (await provider.request({ method: 'eth_accounts' })) as string[];
    } catch {
      return null;
    }
    if (!accounts || accounts.length === 0) {
      disconnectWallet();
      return null;
    }

    const address = accounts[0];
    let chainId = 1;
    try {
      const chainIdHex = (await provider.request({ method: 'eth_chainId' })) as string;
      chainId = parseInt(chainIdHex, 16);
    } catch {
      chainId = 1;
    }

    const network = SUPPORTED_NETWORKS[chainId];
    const networkName = network ? network.name : `Chain ID ${chainId}`;

    return {
      name: targetWallet.name,
      walletName: targetWallet.name,
      address,
      shortAddress: shortenAddress(address),
      chainId,
      networkName,
      walletId: targetWallet.id,
      provider
    };
  } catch {
    return null;
  }
}

/**
 * Switch network on the connected provider.
 */
export async function switchNetwork(provider: any, chainId: number): Promise<void> {
  if (!provider || typeof provider.request !== 'function') {
    throw new Error('No provider available');
  }

  const chainIdHex = `0x${chainId.toString(16)}`;

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }]
    });
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      const net = SUPPORTED_NETWORKS[chainId];
      if (net && net.rpcUrl) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: chainIdHex,
              chainName: net.name,
              nativeCurrency: { name: net.currency, symbol: net.currency, decimals: 18 },
              rpcUrls: [net.rpcUrl],
              blockExplorerUrls: net.blockExplorerUrl ? [net.blockExplorerUrl] : []
            }
          ]
        });
      }
    } else {
      throw switchError;
    }
  }
}

/**
 * Disconnect and clear local state.
 */
export function disconnectWallet() {
  try {
    localStorage.removeItem('duckcast_wallet_connected');
    localStorage.removeItem('duckcast_wallet_address');
  } catch {
    // ignore
  }
}
