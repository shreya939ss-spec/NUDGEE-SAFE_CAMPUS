import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui';
import { InlineLoader } from '@/components/Logo';
import { Users, CalendarDays, Heart, TrendingUp, Activity, AlertTriangle, Sparkles } from 'lucide-react';

type Stats = {
  totalStudents: number;
  totalClubs: number;
  eventsThisMonth: number;
  engagementPct: number;
  pressureIndex: number;
  wellnessIndex: number;
  recentReports: number;
};

export function DashboardScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [studentsRes, clubsRes, eventsRes, wellnessRes, reportsRes, rsvpsRes, membersRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('clubs').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id, event_date'),
        supabase.from('wellness_checks').select('mood'),
        supabase.from('pressure_reports').select('id, created_at'),
        supabase.from('event_rsvps').select('event_id', { count: 'exact', head: true }),
        supabase.from('club_members').select('student_id', { count: 'exact', head: true }),
      ]);

      const totalStudents = studentsRes.count || 0;
      const totalClubs = clubsRes.count || 0;
      const allEvents = eventsRes.data || [];
      const now = new Date();
      const eventsThisMonth = allEvents.filter((e: { event_date: string | null }) => {
        if (!e.event_date) return false;
        const d = new Date(e.event_date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length;

      const moods = (wellnessRes.data || []) as { mood: string }[];
      const wellnessIndex = moods.length > 0
        ? Math.round((moods.filter((m) => m.mood === 'happy').length / moods.length) * 100)
        : 0;

      const reports = (reportsRes.data || []) as { created_at: string }[];
      const last7Days = reports.filter((r) => Date.now() - new Date(r.created_at).getTime() < 7 * 86400000).length;
      const pressureIndex = Math.min(100, last7Days * 10);

      const totalRsvps = rsvpsRes.count || 0;
      const totalMembers = membersRes.count || 0;
      const engagement = totalStudents > 0
        ? Math.min(100, Math.round(((totalRsvps + totalMembers) / Math.max(totalStudents, 1)) * 50))
        : 0;

      setStats({
        totalStudents,
        totalClubs,
        eventsThisMonth,
        engagementPct: engagement,
        pressureIndex,
        wellnessIndex,
        recentReports: last7Days,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !stats) {
    return <InlineLoader message="Loading dashboard..." />;
  }

  const cards = [
    { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'brand', bg: 'bg-brand-50', text: 'text-brand-600' },
    { label: 'Total Clubs', value: stats.totalClubs, icon: Sparkles, color: 'accent', bg: 'bg-accent-50', text: 'text-accent-600' },
    { label: 'Events This Month', value: stats.eventsThisMonth, icon: CalendarDays, color: 'success', bg: 'bg-success-50', text: 'text-success-600' },
    { label: 'Engagement', value: `${stats.engagementPct}%`, icon: Activity, color: 'warning', bg: 'bg-warning-50', text: 'text-warning-600' },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-display font-bold text-slate-900 mb-1">Dashboard</h1>
      <p className="text-sm text-slate-400 mb-6">Campus overview and engagement metrics</p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="p-4">
              <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${c.text}`} />
              </div>
              <p className="text-2xl font-display font-bold text-slate-900">{c.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{c.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Index cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Peer Pressure Index</p>
              <p className="text-3xl font-display font-bold text-slate-900 mt-1">{stats.pressureIndex}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stats.pressureIndex > 50 ? 'bg-error-50' : 'bg-warning-50'}`}>
              <AlertTriangle className={`w-6 h-6 ${stats.pressureIndex > 50 ? 'text-error-500' : 'text-warning-500'}`} />
            </div>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${stats.pressureIndex > 50 ? 'bg-error-500' : 'bg-warning-500'}`}
              style={{ width: `${stats.pressureIndex}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">{stats.recentReports} reports in the last 7 days</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Wellness Index</p>
              <p className="text-3xl font-display font-bold text-slate-900 mt-1">{stats.wellnessIndex}%</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center">
              <Heart className="w-6 h-6 text-success-500" />
            </div>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-success-500 transition-all" style={{ width: `${stats.wellnessIndex}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-2">Based on happy mood check-ins</p>
        </Card>
      </div>

      {/* Placeholder note */}
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">AI Insights</p>
            <p className="text-xs text-slate-500 mt-1">AI-powered insights and recommendations will be available in Stage 4.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
