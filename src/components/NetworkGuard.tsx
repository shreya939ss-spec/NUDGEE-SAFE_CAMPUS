import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export function NetworkGuard({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      setWasOffline(true);
      setTimeout(() => setWasOffline(false), 3000);
    };
    const onOffline = () => setOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return (
    <>
      {children}

      {/* Offline banner */}
      {!online && (
        <div className="fixed top-0 left-0 right-0 z-[80] bg-error-500 text-white px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium animate-slide-down safe-top">
          <WifiOff className="w-4 h-4" />
          You're offline. Some features may be unavailable.
        </div>
      )}

      {/* Back online toast */}
      {online && wasOffline && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[80] bg-success-500 text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium animate-slide-down">
          <Wifi className="w-4 h-4" />
          Back online!
        </div>
      )}
    </>
  );
}

export function OfflineScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="fixed inset-0 z-[95] flex flex-col items-center justify-center bg-gradient-to-b from-[#0a0e3d] via-[#1a237e] to-[#0a0e3d] px-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 bg-error-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center text-center">
        <div className="relative w-20 h-20 mb-5">
          <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center opacity-40">
            <img src="./nudgee-logo.png" alt="NUDGEE" width={48} height={48} draggable={false} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-error-500 flex items-center justify-center ring-4 ring-[#0a0e3d]">
            <WifiOff className="w-4 h-4 text-white" />
          </div>
        </div>

        <h2 className="font-display text-lg font-bold text-white mb-1.5">Connection Lost</h2>
        <p className="text-sm text-brand-200/60 max-w-xs mb-6">
          We can't reach the server right now. Check your internet connection and try again.
        </p>

        <button
          onClick={onRetry}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-5 py-3 rounded-xl transition-colors active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
