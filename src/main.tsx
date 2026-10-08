import './solana/polyfill';
import {createRoot} from 'react-dom/client';
import './wallet/appKit';
import App from './App.tsx';
import './index.css';

// Gracefully handle browser wallet extension initial rejections (e.g. Rabby / OKX error 4001 when locked or empty)
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = (reason?.message || '').toLowerCase();
    const code = reason?.code;
    if (
      code === 4001 ||
      msg.includes('at least one account') ||
      msg.includes('user rejected') ||
      msg.includes('user denied')
    ) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
