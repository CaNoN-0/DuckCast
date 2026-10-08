/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// 1. Polyfill for cross-fetch / Reown in browser environments where window.fetch is getter-only
if (typeof window !== 'undefined') {
  try {
    const targets: any[] = [window];
    if (typeof Window !== 'undefined' && Window.prototype) {
      targets.push(Window.prototype);
    }
    targets.forEach((target) => {
      try {
        const desc = Object.getOwnPropertyDescriptor(target, 'fetch');
        if (desc && desc.get && !desc.set) {
          const originalGet = desc.get;
          Object.defineProperty(target, 'fetch', {
            get: originalGet,
            set(val) {
              Object.defineProperty(this, 'fetch', {
                value: val,
                writable: true,
                configurable: true,
                enumerable: true
              });
            },
            configurable: true,
            enumerable: desc.enumerable !== false
          });
        }
      } catch (_) {}
    });
  } catch (_) {}

  // 2. Global error suppression for WalletConnect Relay and HMR WebSocket connection notices
  // (per environment constraint: "HMR: Disabled. Ignore WebSocket errors.")
  try {
    const isRelayOrWsMsg = (str: string) => {
      if (!str) return false;
      const lower = str.toLowerCase();
      return (
        lower.includes('relay.walletconnect.org') ||
        lower.includes('websocket connection failed') ||
        lower.includes("couldn't establish socket connection") ||
        lower.includes('failed to publish custom payload') ||
        lower.includes('publisher') ||
        lower.includes('context":"core') ||
        lower.includes('level":50')
      );
    };

    // Filter console.error so Pino level 50 logs from WalletConnect relay retries don't trigger error alerts
    const origConsoleError = console.error;
    console.error = function (...args: any[]) {
      try {
        const text = args
          .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
          .join(' ');
        if (isRelayOrWsMsg(text)) {
          console.debug(...args);
          return;
        }
      } catch (_) {}
      origConsoleError.apply(console, args);
    };

    // Capture uncaught errors from WebSocket connection failures
    window.addEventListener(
      'error',
      (event) => {
        const msg = event?.message || (event?.error && event.error.message) || '';
        if (isRelayOrWsMsg(msg)) {
          event.preventDefault();
          event.stopPropagation();
          return true;
        }
      },
      true
    );

    // Capture unhandled promise rejections from relay requests
    window.addEventListener(
      'unhandledrejection',
      (event) => {
        const reason = event?.reason;
        const msg = (reason?.message || (typeof reason === 'string' ? reason : '')) || '';
        const code = reason?.code;
        if (
          code === 4001 ||
          msg.toLowerCase().includes('user rejected') ||
          msg.toLowerCase().includes('user denied') ||
          isRelayOrWsMsg(msg)
        ) {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      true
    );
  } catch (_) {}
}

export {};
