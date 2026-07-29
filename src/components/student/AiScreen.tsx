import { useState } from 'react';
import { CompanionScreen } from './CompanionScreen';
import { ShieldScreen } from './ShieldScreen';
import { ReportScreen } from './ReportScreen';
import { Brain, Shield, ShieldCheck } from 'lucide-react';

type AiTab = 'companion' | 'shield' | 'report';

const segments: { id: AiTab; label: string; icon: typeof Brain; color: string }[] = [
  { id: 'companion', label: 'Companion', icon: Brain, color: 'brand' },
  { id: 'shield', label: 'Shield', icon: Shield, color: 'error' },
  { id: 'report', label: 'Report', icon: ShieldCheck, color: 'slate' },
];

export function AiScreen() {
  const [tab, setTab] = useState<AiTab>('companion');

  return (
    <div>
      {/* Segmented control */}
      <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm pt-4 pb-2 px-4">
        <div className="max-w-md mx-auto flex bg-white rounded-xl p-1 border border-slate-100 shadow-sm">
          {segments.map((seg) => {
            const Icon = seg.icon;
            const isActive = tab === seg.id;
            return (
              <button
                key={seg.id}
                onClick={() => setTab(seg.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? seg.color === 'error'
                      ? 'bg-error-50 text-error-700'
                      : seg.color === 'brand'
                      ? 'bg-brand-50 text-brand-700'
                      : 'bg-slate-100 text-slate-700'
                    : 'text-slate-400'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {seg.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'companion' && <CompanionScreen />}
      {tab === 'shield' && <ShieldScreen />}
      {tab === 'report' && <ReportScreen />}
    </div>
  );
}
