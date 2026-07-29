import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Button, EmptyState } from '@/components/ui';
import { InlineLoader } from '@/components/Logo';
import type { WellnessCheck, InfluenceLedgerEntry } from '@/types';
import { LogOut, TrendingUp, Heart, Sparkles, Award } from 'lucide-react';

type Mood = 'happy' | 'neutral' | 'low';

const moodConfig: Record<Mood, { emoji: string; label: string; color: string; bg: string }> = {
  happy: { emoji: '😀', label: 'Happy', color: 'text-success-600', bg: 'bg-success-50 border-success-200', },
  neutral: { emoji: '😐', label: 'Neutral', color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200', },
  low: { emoji: '😔', label: 'Low', color: 'text-warning-600', bg: 'bg-warning-50 border-warning-200', },
};

export function ProfileScreen() {
  const { profile, user, signOut } = useAuth();
  const [wellness, setWellness] = useState<WellnessCheck[]>([]);
  const [ledger, setLedger] = useState<InfluenceLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [todayMood, setTodayMood] = useState<Mood | null>(null);

  const loadData = useCallback(async () => {
    if (!profile?.id) return;
    const [wRes, lRes] = await Promise.all([
      supabase.from('wellness_checks').select('*').eq('student_id', profile.id).order('created_at', { ascending: false }).limit(30),
      supabase.from('influence_ledger').select('*').eq('student_id', profile.id).order('created_at', { ascending: false }),
    ]);
    setWellness((wRes.data as WellnessCheck[]) || []);
    setLedger((lRes.data as InfluenceLedgerEntry[]) || []);
    const today = (wRes.data as WellnessCheck[])?.find((w) => isSameDay(new Date(w.created_at), new Date()));
    setTodayMood(today?.mood || null);
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const submitMood = async (mood: Mood) => {
    if (!profile?.id || submitting) return;
    setSubmitting(true);
    await supabase.from('wellness_checks').insert({ student_id: profile.id, mood });
    await supabase.from('influence_ledger').insert({ student_id: profile.id, points: 5, reason: 'Daily wellness check-in' });
    setTodayMood(mood);
    await loadData();
    setSubmitting(false);
  };

  if (loading) {
    return <InlineLoader message="Loading profile..." />;
  }

  const totalPoints = ledger.reduce((sum, e) => sum + e.points, 0);

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-4 animate-fade-in">
      {/* Profile header */}
      <div className="flex flex-col items-center mb-5">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-2xl font-display font-bold mb-3">
          {(profile?.full_name || '?').charAt(0).toUpperCase()}
        </div>
        <h1 className="text-xl font-display font-bold text-slate-900">{profile?.full_name}</h1>
        <p className="text-sm text-slate-400">{user?.email}</p>
        <div className="flex gap-2 mt-2">
          {profile?.hostel && <Badge color="slate">Hostel: {profile.hostel}</Badge>}
          <Badge color="brand">Student</Badge>
        </div>
      </div>

      {/* Influence Points */}
      <Card className="p-4 mb-5 bg-gradient-to-br from-brand-500 to-brand-600 border-0">
        <div className="flex items-center justify-between text-white">
          <div>
            <p className="text-brand-100 text-xs font-medium">Total Influence Points</p>
            <p className="text-3xl font-display font-bold mt-0.5">{totalPoints || profile?.influence_points || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </Card>

      {/* Wellness Check-in */}
      <div className="mb-5">
        <h2 className="font-display font-bold text-base text-slate-900 mb-3">Daily Wellness Check</h2>
        <Card className="p-4">
          {todayMood ? (
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl ${moodConfig[todayMood].bg}`}>
                {moodConfig[todayMood].emoji}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">You're feeling {moodConfig[todayMood].label.toLowerCase()} today</p>
                <p className="text-xs text-slate-400">Come back tomorrow to check in again</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 mb-3">How are you feeling today?</p>
              <div className="grid grid-cols-3 gap-2.5">
                {(Object.keys(moodConfig) as Mood[]).map((mood) => (
                  <button
                    key={mood}
                    onClick={() => submitMood(mood)}
                    disabled={submitting}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <span className="text-3xl">{moodConfig[mood].emoji}</span>
                    <span className={`text-xs font-medium ${moodConfig[mood].color}`}>{moodConfig[mood].label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Points History */}
      <div className="mb-5">
        <h2 className="font-display font-bold text-base text-slate-900 mb-3">Points History</h2>
        {ledger.length === 0 ? (
          <EmptyState icon={<Award className="w-7 h-7" />} title="No points yet" subtitle="Join clubs and RSVP to events to earn points." />
        ) : (
          <Card className="divide-y divide-slate-50">
            {ledger.slice(0, 15).map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 p-3.5">
                <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{entry.reason || 'Points earned'}</p>
                  <p className="text-xs text-slate-400">{timeAgo(entry.created_at)}</p>
                </div>
                <span className="text-sm font-bold text-success-600">+{entry.points}</span>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Wellness History */}
      {wellness.length > 0 && (
        <div className="mb-5">
          <h2 className="font-display font-bold text-base text-slate-900 mb-3">Wellness History</h2>
          <Card className="p-4">
            <div className="flex gap-1.5 flex-wrap">
              {wellness.slice(0, 14).map((w) => (
                <div key={w.id} className={`w-9 h-9 rounded-lg border flex items-center justify-center text-lg ${moodConfig[w.mood].bg}`} title={`${moodConfig[w.mood].label} · ${new Date(w.created_at).toLocaleDateString()}`}>
                  {moodConfig[w.mood].emoji}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <Button variant="outline" size="lg" onClick={signOut} className="w-full">
        <LogOut className="w-4 h-4" /> Sign Out
      </Button>
    </div>
  );
}

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
