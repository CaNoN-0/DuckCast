/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import '../solana/polyfill';
import { createAppKit } from '@reown/appkit/react';
import { SolanaAdapter } from '@reown/appkit-adapter-solana';
import { solana, solanaDevnet } from '@reown/appkit/networks';
import { REOWN_PROJECT_ID } from '../solana/config';

// 1. Initialize official Solana Adapter
export const solanaAdapter = new SolanaAdapter();

// 2. Configure Reown AppKit modal for Solana
export const appKit = createAppKit({
  adapters: [solanaAdapter],
  networks: [solana, solanaDevnet],
  metadata: {
    name: 'DuckCast',
    description: 'DuckCast Social Prediction Markets with Native Solana USDC',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://duckcast.app',
    icons: ['/src/assets/images/duckcast_mascot_illustration_1790877735628.jpg']
  },
  projectId: REOWN_PROJECT_ID,
  features: {
    analytics: false,
    email: false,
    socials: false
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#09090B',
    '--w3m-border-radius-master': '16px',
    '--w3m-font-family': 'Geist, sans-serif'
  }
});
