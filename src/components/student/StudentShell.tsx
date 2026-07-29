import { type ReactNode } from 'react';
import { Home, Newspaper, Users, CalendarDays, Sparkles, User } from 'lucide-react';
import { NudgeeLogo } from '@/components/Logo';

export type StudentTab = 'home' | 'feed' | 'clubs' | 'events' | 'ai' | 'profile';

const tabs: { id: StudentTab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'feed', label: 'Feed', icon: Newspaper },
  { id: 'clubs', label: 'Clubs', icon: Users },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'ai', label: 'AI', icon: Sparkles },
  { id: 'profile', label: 'Profile', icon: User },
];

export function StudentShell({ active, onTab, children }: { active: StudentTab; onTab: (t: StudentTab) => void; children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-slate-50 pb-20">
      {/* Top header with logo */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-lg border-b border-slate-100 safe-top">
        <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
          <button onClick={() => onTab('home')} className="flex items-center gap-2">
            <NudgeeLogo size={28} />
            <span className="font-display font-bold text-slate-900 text-sm">NUDGEE</span>
          </button>
          <span className="text-xs text-slate-400">Campus Companion</span>
        </div>
      </header>

      {children}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-100 safe-bottom">
        <div className="max-w-md mx-auto flex items-center justify-around px-1 py-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all ${
                  isActive ? 'text-brand-600' : 'text-slate-400'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
