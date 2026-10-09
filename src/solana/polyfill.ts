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

  // 3. Suppress WalletConnect relay WebSocket retries and external extension errors
  try {
    const isIgnoredError = (str: string) => {
      if (!str) return false;
      const lower = str.toLowerCase();
      return (
        lower.includes('relay.walletconnect.org') ||
        lower.includes('websocket connection failed') ||
        lower.includes("couldn't establish socket connection") ||
        lower.includes('failed to publish custom payload') ||
        lower.includes('failed to connect to metamask') ||
        lower.includes('publisher') ||
        lower.includes('context":"core') ||
        lower.includes('level":50')
      );
    };

    const filterConsole = (methodName: 'error' | 'warn' | 'log' | 'info' | 'debug') => {
      const origMethod = console[methodName];
      if (!origMethod) return;
      console[methodName] = function (...args: any[]) {
        try {
          const text = args
            .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
            .join(' ');
          if (isIgnoredError(text)) {
            return;
          }
        } catch (_) {}
        origMethod.apply(console, args);
      };
    };

    filterConsole('error');
    filterConsole('warn');
    filterConsole('log');
    filterConsole('info');
    filterConsole('debug');

    window.addEventListener(
      'error',
      (event) => {
        const msg = event?.message || (event?.error && event.error.message) || '';
        if (isIgnoredError(msg)) {
          event.preventDefault();
          event.stopPropagation();
          return true;
        }
      },
      true
    );

    window.addEventListener(
      'unhandledrejection',
      (event) => {
        const reason = event?.reason;
        const msg = (reason && (reason.message || String(reason))) || '';
        if (
          isIgnoredError(msg) ||
          reason?.code === 4001 ||
          msg.toLowerCase().includes('user rejected')
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
