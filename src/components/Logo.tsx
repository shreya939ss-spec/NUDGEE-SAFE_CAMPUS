import { useEffect, useState } from 'react';

export function NudgeeLogo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src="./nudgee-logo.png"
      alt="NUDGEE"
      width={size}
      height={size}
      className={`select-none ${className}`}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<
    'hidden' | 'zoom' | 'glow' | 'wordmark' | 'tagline' | 'hold' | 'fade'
  >('hidden');

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase('zoom'), 100));
    timers.push(setTimeout(() => setPhase('glow'), 2200));
    timers.push(setTimeout(() => setPhase('wordmark'), 3800));
    timers.push(setTimeout(() => setPhase('tagline'), 5200));
    timers.push(setTimeout(() => setPhase('hold'), 6800));
    timers.push(setTimeout(() => setPhase('fade'), 9200));
    timers.push(setTimeout(() => onDone(), 10000));
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  const logoScale =
    phase === 'hidden' ? 'scale-[0.15] opacity-0' :
    phase === 'zoom' ? 'scale-100 opacity-100' :
    'scale-100 opacity-100';

  const glowOpacity =
    phase === 'hidden' || phase === 'zoom' ? 'opacity-0' :
    phase === 'glow' ? 'opacity-100' :
    'opacity-60';

  const wordmarkStyle =
    phase === 'hidden' || phase === 'zoom' || phase === 'glow'
      ? 'translate-y-6 opacity-0'
      : 'translate-y-0 opacity-100';

  const taglineStyle =
    phase === 'hidden' || phase === 'zoom' || phase === 'glow' || phase === 'wordmark'
      ? 'translate-y-4 opacity-0'
      : 'translate-y-0 opacity-100';

  const dotsStyle =
    phase === 'hold' || phase === 'fade'
      ? 'opacity-100'
      : 'opacity-0';

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-[#060a2e] via-[#0d1450] to-[#060a2e] transition-opacity duration-700 ${
        phase === 'fade' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={`absolute top-1/3 left-1/2 -translate-x-1/2 w-[28rem] h-[28rem] bg-brand-500/15 rounded-full blur-3xl transition-opacity duration-1000 ${glowOpacity}`}
        />
        <div
          className={`absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl transition-opacity duration-1000 delay-300 ${glowOpacity}`}
        />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-success-500/5 rounded-full blur-3xl transition-opacity duration-1000 delay-500 ${glowOpacity}`}
        />
      </div>

      {/* Particle dots */}
      <div className={`absolute inset-0 overflow-hidden transition-opacity duration-1000 ${glowOpacity}`}>
        {[
          { x: '15%', y: '20%', d: '0s', s: 'w-1 h-1' },
          { x: '85%', y: '25%', d: '0.5s', s: 'w-1.5 h-1.5' },
          { x: '10%', y: '70%', d: '1s', s: 'w-1 h-1' },
          { x: '90%', y: '65%', d: '1.5s', s: 'w-2 h-2' },
          { x: '50%', y: '12%', d: '0.3s', s: 'w-1 h-1' },
          { x: '30%', y: '85%', d: '0.8s', s: 'w-1.5 h-1.5' },
          { x: '70%', y: '88%', d: '1.2s', s: 'w-1 h-1' },
          { x: '20%', y: '45%', d: '0.6s', s: 'w-1 h-1' },
          { x: '80%', y: '40%', d: '1.8s', s: 'w-1.5 h-1.5' },
        ].map((p, i) => (
          <div
            key={i}
            className={`absolute ${p.s} rounded-full bg-brand-300/40 animate-pulse`}
            style={{ left: p.x, top: p.y, animationDelay: p.d, animationDuration: '2s' }}
          />
        ))}
      </div>

      {/* Logo with cinematic zoom */}
      <div
        className={`relative transition-all duration-[2100ms] ease-out ${logoScale}`}
      >
        {/* Pulsing ring behind logo */}
        <div
          className={`absolute inset-0 -m-8 rounded-full border border-brand-400/20 transition-all duration-1000 ${
            phase === 'glow' || phase === 'wordmark' || phase === 'tagline' || phase === 'hold'
              ? 'scale-110 opacity-100'
              : 'scale-75 opacity-0'
          }`}
        />
        <div
          className={`absolute inset-0 -m-12 rounded-full border border-accent-400/10 transition-all duration-1000 delay-300 ${
            phase === 'wordmark' || phase === 'tagline' || phase === 'hold'
              ? 'scale-110 opacity-100'
              : 'scale-75 opacity-0'
          }`}
        />
        <NudgeeLogo size={160} />
      </div>

      {/* Wordmark */}
      <div className={`relative mt-7 transition-all duration-700 ${wordmarkStyle}`}>
        <h1 className="font-display text-4xl font-bold tracking-[0.15em] text-white drop-shadow-lg">
          NUDGEE
        </h1>
      </div>

      {/* Tagline */}
      <div className={`relative mt-3 transition-all duration-700 ${taglineStyle}`}>
        <p className="text-center text-sm text-brand-200/70 px-8 max-w-sm leading-relaxed">
          Turning Positive Influence into the Strongest Peer Pressure
        </p>
      </div>

      {/* Loading dots */}
      <div className={`relative mt-10 transition-opacity duration-500 ${dotsStyle}`}>
        <div className="flex gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-accent-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-success-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-gradient-to-b from-[#060a2e] via-[#0d1450] to-[#060a2e]">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '1.5s' }} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" strokeDasharray="70 220" />
        </svg>
        <div className="w-14 h-14 flex items-center justify-center">
          <NudgeeLogo size={48} />
        </div>
      </div>

      <p className="relative mt-6 text-sm text-brand-200/70 font-medium">{message}</p>
    </div>
  );
}

export function InlineLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative w-16 h-16 flex items-center justify-center mb-3">
        <svg className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: '1.5s' }} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(14,165,233,0.1)" strokeWidth="5" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="#0ea5e9" strokeWidth="5" strokeLinecap="round" strokeDasharray="60 220" />
        </svg>
        <div className="w-9 h-9 flex items-center justify-center">
          <NudgeeLogo size={32} />
        </div>
      </div>
      <p className="text-xs text-slate-400 font-medium">{message}</p>
    </div>
  );
}
