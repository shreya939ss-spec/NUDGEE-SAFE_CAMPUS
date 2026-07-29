import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, Badge } from '@/components/ui';
import { InlineLoader } from '@/components/Logo';
import type { Club, EventItem, WellnessCheck } from '@/types';
import { Sparkles, CalendarDays, Users, Heart, TrendingUp, MapPin, ArrowRight, Brain, Shield, ShieldCheck } from 'lucide-react';

type Tab = 'home' | 'feed' | 'clubs' | 'events' | 'ai' | 'profile';

export function HomeScreen({ onTab }: { onTab: (t: Tab) => void }) {
  const { profile } = useAuth();
  const [todayEvents, setTodayEvents] = useState<EventItem[]>([]);
  const [joinedClubs, setJoinedClubs] = useState<Club[]>([]);
  const [todayWellness, setTodayWellness] = useState<WellnessCheck | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!profile?.id) return;
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const [eventsRes, clubsRes, wellnessRes] = await Promise.all([
        supabase.from('events').select('*').gte('event_date', startOfDay.toISOString()).lte('event_date', endOfDay.toISOString()).order('event_date').limit(5),
        supabase.from('club_members').select('club_id, clubs(*)').eq('student_id', profile.id),
        supabase.from('wellness_checks').select('*').eq('student_id', profile.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);

      setTodayEvents((eventsRes.data as EventItem[]) || []);
      const clubsData = (clubsRes.data || []).map((r: { clubs: Club | Club[] }) => Array.isArray(r.clubs) ? r.clubs[0] : r.clubs).filter(Boolean) as Club[];
      setJoinedClubs(clubsData);
      setTodayWellness(wellnessRes.data as WellnessCheck | null);
      setLoading(false);
    }
    load();
  }, [profile?.id]);

  if (loading) {
    return <InlineLoader message="Loading your home..." />;
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (profile?.full_name || 'there').split(' ')[0];
  const hasCheckedInToday = todayWellness && isSameDay(new Date(todayWellness.created_at), new Date());

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-4 animate-fade-in">
      {/* Greeting */}
      <div className="mb-5">
        <p className="text-sm text-slate-400">{greeting},</p>
        <h1 className="text-2xl font-display font-bold text-slate-900">{firstName}!</h1>
      </div>

      {/* Influence Points Banner */}
      <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-4 text-white mb-5 shadow-lg shadow-brand-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-brand-100 text-xs font-medium">Influence Points</p>
            <p className="text-3xl font-display font-bold mt-0.5">{profile?.influence_points ?? 0}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Wellness Check Prompt */}
      {!hasCheckedInToday && (
        <Card className="p-4 mb-5 border-brand-100 bg-gradient-to-r from-brand-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
              <Heart className="w-5 h-5 text-brand-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">How are you feeling today?</p>
              <p className="text-xs text-slate-500">Take your daily wellness check-in</p>
            </div>
            <button onClick={() => onTab('profile')} className="text-brand-600 text-xs font-semibold flex items-center gap-1">
              Check in <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </Card>
      )}

      {hasCheckedInToday && (
        <Card className="p-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center flex-shrink-0">
              <Heart className="w-5 h-5 text-success-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Wellness checked in</p>
              <p className="text-xs text-slate-500">You're feeling {todayWellness?.mood} today. Keep it up!</p>
            </div>
          </div>
        </Card>
      )}

      {/* AI Quick Access */}
      <div className="mb-5">
        <h2 className="font-display font-bold text-base text-slate-900 mb-3">AI Support</h2>
        <div className="grid grid-cols-3 gap-2.5">
          <button onClick={() => onTab('ai')} className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-brand-200 transition-all active:scale-95">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <Brain className="w-5 h-5 text-brand-600" />
            </div>
            <span className="text-xs font-medium text-slate-600">Companion</span>
          </button>
          <button onClick={() => onTab('ai')} className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-error-200 transition-all active:scale-95">
            <div className="w-10 h-10 rounded-xl bg-error-50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-error-600" />
            </div>
            <span className="text-xs font-medium text-slate-600">Shield</span>
          </button>
          <button onClick={() => onTab('ai')} className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-slate-300 transition-all active:scale-95">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-slate-600" />
            </div>
            <span className="text-xs font-medium text-slate-600">Report</span>
          </button>
        </div>
      </div>

      {/* Today's Events */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-base text-slate-900">Today's Events</h2>
          <button onClick={() => onTab('events')} className="text-xs text-brand-600 font-semibold">See all</button>
        </div>
        {todayEvents.length === 0 ? (
          <Card className="p-4">
            <p className="text-sm text-slate-400 text-center py-2">No events scheduled for today</p>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {todayEvents.map((event) => (
              <Card key={event.id} className="p-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <CalendarDays className="w-5 h-5 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{event.title}</p>
                    {event.location && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {event.location}
                      </p>
                    )}
                    {event.event_date && (
                      <p className="text-xs text-slate-400 mt-0.5">{formatTime(event.event_date)}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Joined Clubs */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-base text-slate-900">Your Clubs</h2>
          <button onClick={() => onTab('clubs')} className="text-xs text-brand-600 font-semibold">See all</button>
        </div>
        {joinedClubs.length === 0 ? (
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <p className="text-sm text-slate-500">You haven't joined any clubs yet</p>
                <button onClick={() => onTab('clubs')} className="text-xs text-brand-600 font-semibold mt-0.5">Browse clubs</button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
            {joinedClubs.map((club) => (
              <Card key={club.id} className="p-3 flex-shrink-0 w-36">
                <div className="w-9 h-9 rounded-lg bg-accent-50 flex items-center justify-center mb-2">
                  <Sparkles className="w-4 h-4 text-accent-600" />
                </div>
                <p className="text-sm font-semibold text-slate-800 truncate">{club.name}</p>
                {club.category && <Badge color="accent">{club.category}</Badge>}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
