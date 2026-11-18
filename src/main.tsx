import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Tier-1 Google Maps JS API & Places Quota Detection
const origError = console.error;
console.error = (...args: unknown[]) => {
  origError.apply(console, args);
  if (
    args.some(
      (a) =>
        typeof a === 'string' &&
        (a.includes('OverQuotaMapError') || a.includes('QuotaExceededError')),
    )
  ) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
};

(window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
};

createRoot(document.getElementById('root')!).render(<App />);
