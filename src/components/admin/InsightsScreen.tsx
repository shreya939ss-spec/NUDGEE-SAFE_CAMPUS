import { useState } from 'react';
import { callAi } from '@/lib/ai';
import { Card, Button, Badge } from '@/components/ui';
import { InlineLoader } from '@/components/Logo';
import { supabase } from '@/lib/supabase';
import { useEffect, useState as useReactState } from 'react';
import { Brain, TrendingUp, AlertTriangle, Heart, Loader2, RefreshCw } from 'lucide-react';
import type { PressureReport, WellnessCheck } from '@/types';

export function InsightsScreen() {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useReactState<PressureReport[]>([]);
  const [wellness, setWellness] = useReactState<WellnessCheck[]>([]);
  const [dataLoading, setDataLoading] = useReactState(true);

  useEffect(() => {
    async function load() {
      const [rRes, wRes] = await Promise.all([
        supabase.from('pressure_reports').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('wellness_checks').select('*').order('created_at', { ascending: false }).limit(50),
      ]);
      setReports((rRes.data as PressureReport[]) || []);
      setWellness((wRes.data as WellnessCheck[]) || []);
      setDataLoading(false);
    }
    load();
  }, [setReports, setWellness]);

  const generateInsight = async () => {
    setLoading(true);
    setError(null);
    const res = await callAi('insights', '', undefined, 15000);
    if (res.reply) {
      setInsight(res.reply);
    } else {
      setError(res.error || 'Failed to generate insight');
    }
    setLoading(false);
  };

  const moodCounts = { happy: 0, neutral: 0, low: 0 };
  wellness.forEach((w) => { moodCounts[w.mood] = (moodCounts[w.mood] || 0) + 1; });
  const totalWellness = wellness.length;
  const wellnessPct = totalWellness > 0 ? Math.round((moodCounts.happy / totalWellness) * 100) : 0;

  const categoryCounts: Record<string, number> = {};
  reports.forEach((r) => {
    const c = r.category || 'other';
    categoryCounts[c] = (categoryCounts[c] || 0) + 1;
  });
  const hostelCounts: Record<string, number> = {};
  reports.forEach((r) => {
    const h = r.hostel || 'Unknown';
    hostelCounts[h] = (hostelCounts[h] || 0) + 1;
  });

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">AI Insights</h1>
          <p className="text-sm text-slate-400">AI-powered analysis of campus wellness and pressure trends</p>
        </div>
        <Button onClick={generateInsight} disabled={loading} loading={loading}>
          {!loading && <Brain className="w-4 h-4" />}
          {loading ? 'Analyzing...' : 'Generate Insight'}
        </Button>
      </div>

      {/* AI Insight card */}
      {loading && (
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">AI is analyzing campus data...</p>
              <p className="text-xs text-slate-400">Reading wellness check-ins and pressure reports</p>
            </div>
          </div>
        </Card>
      )}

      {error && !loading && (
        <Card className="p-4 mb-6 border-error-100 bg-error-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-error-500" />
            <p className="text-sm text-error-700">{error}</p>
          </div>
        </Card>
      )}

      {insight && !loading && (
        <Card className="p-5 mb-6 border-brand-100 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-brand-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-semibold text-slate-800">AI Recommendation</p>
                <Badge color="brand">Just now</Badge>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{insight}</p>
            </div>
          </div>
        </Card>
      )}

      {!insight && !loading && !error && (
        <Card className="p-6 mb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-3">
            <Brain className="w-7 h-7 text-brand-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No insight generated yet</p>
          <p className="text-xs text-slate-400 mt-1">Click "Generate Insight" to analyze campus data with AI</p>
        </Card>
      )}

      {/* Data overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {/* Wellness overview */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-success-50 flex items-center justify-center">
              <Heart className="w-4.5 h-4.5 text-success-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Wellness Overview</h3>
          </div>
          {dataLoading ? (
            <div className="flex justify-center py-4"><InlineLoader message="" /></div>
          ) : totalWellness === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No wellness check-ins yet</p>
          ) : (
            <div className="space-y-2.5">
              {(['happy', 'neutral', 'low'] as const).map((mood) => {
                const count = moodCounts[mood];
                const pct = totalWellness > 0 ? Math.round((count / totalWellness) * 100) : 0;
                const color = mood === 'happy' ? 'bg-success-500' : mood === 'neutral' ? 'bg-slate-400' : 'bg-warning-500';
                const label = mood === 'happy' ? 'Happy' : mood === 'neutral' ? 'Neutral' : 'Low';
                return (
                  <div key={mood}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">{label}</span>
                      <span className="text-slate-400">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-slate-400 pt-2">Wellness Index: {wellnessPct}%</p>
            </div>
          )}
        </Card>

        {/* Pressure reports overview */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-error-50 flex items-center justify-center">
              <AlertTriangle className="w-4.5 h-4.5 text-error-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Pressure Reports</h3>
          </div>
          {dataLoading ? (
            <div className="flex justify-center py-4"><InlineLoader message="" /></div>
          ) : reports.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No reports submitted yet</p>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1.5">By Category</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(categoryCounts).map(([cat, count]) => (
                    <Badge key={cat} color={cat === 'tobacco' || cat === 'alcohol' || cat === 'drugs' ? 'error' : 'warning'}>
                      {cat}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1.5">By Hostel</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(hostelCounts).map(([hostel, count]) => (
                    <Badge key={hostel} color="slate">{hostel}: {count}</Badge>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-400 pt-1">Total reports: {reports.length}</p>
            </div>
          )}
        </Card>
      </div>

      {/* Recent reports list */}
      {reports.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Recent Anonymous Reports</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
            {reports.map((r) => (
              <div key={r.id} className="flex items-start gap-2.5 py-2 border-b border-slate-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-600 line-clamp-2">{r.description}</p>
                  <div className="flex gap-1.5 mt-1">
                    {r.hostel && <span className="text-xs text-slate-400">{r.hostel}</span>}
                    {r.category && <Badge color="slate">{r.category}</Badge>}
                  </div>
                </div>
                <span className="text-xs text-slate-300 flex-shrink-0">{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
