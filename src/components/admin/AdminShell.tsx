import { type ReactNode, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, CalendarDays, Users, UserCog, Gift, LogOut, Menu, Brain } from 'lucide-react';
import { NudgeeLogo } from '@/components/Logo';

export type AdminTab = 'dashboard' | 'events' | 'clubs' | 'mentors' | 'rewards' | 'insights';

const navItems: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'clubs', label: 'Clubs', icon: Users },
  { id: 'mentors', label: 'Mentors', icon: UserCog },
  { id: 'rewards', label: 'Rewards', icon: Gift },
  { id: 'insights', label: 'AI Insights', icon: Brain },
];

export function AdminShell({ active, onTab, children }: { active: AdminTab; onTab: (t: AdminTab) => void; children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <NudgeeLogo size={36} />
        <div>
          <h1 className="text-base font-display font-bold text-slate-900 leading-none">NUDGEE</h1>
          <p className="text-xs text-slate-400 mt-0.5">Admin Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { onTab(item.id); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-sm font-bold">
            {(profile?.full_name || '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">{profile?.full_name}</p>
            <p className="text-xs text-slate-400">Administrator</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-error-50 hover:text-error-600 transition-colors"
        >
          <LogOut className="w-5 h-5" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-100 flex-col fixed h-screen">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-white h-full animate-slide-down">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <NudgeeLogo size={28} />
            <span className="font-display font-bold text-slate-900">NUDGEE</span>
          </div>
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
