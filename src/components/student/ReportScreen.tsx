import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { callAi } from '@/lib/ai';
import { Card, Button, Textarea, Badge } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, CheckCircle2, Loader2, Lock } from 'lucide-react';

export function ReportScreen() {
  const { profile } = useAuth();
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<{ hostel: string; category: string; description: string } | null>(null);

  const handleSubmit = async () => {
    if (!text.trim() || status === 'submitting') return;
    setStatus('submitting');

    const res = await callAi('report_normalizer', text.trim(), undefined, 8000);

    const hostel = res.hostel || 'Unknown';
    const category = res.category || 'other';
    const description = res.description || text.trim();

    const { error } = await supabase.from('pressure_reports').insert({
      hostel,
      description,
      category,
    });

    if (error) {
      setStatus('error');
      return;
    }

    // Award influence points for reporting
    if (profile?.id) {
      await supabase.from('influence_ledger').insert({
        student_id: profile.id,
        points: 20,
        reason: 'Anonymous experience report',
      });
    }

    setResult({ hostel, category, description });
    setStatus('success');
    setText('');
  };

  if (status === 'success' && result) {
    return (
      <div className="max-w-md mx-auto px-4 pt-6 pb-4 animate-fade-in">
        <div className="flex flex-col items-center text-center py-8">
          <div className="w-16 h-16 rounded-2xl bg-success-50 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-success-500" />
          </div>
          <h2 className="text-lg font-display font-bold text-slate-900">Report Submitted</h2>
          <p className="text-sm text-slate-500 mt-1.5 max-w-xs">
            Your anonymous report has been recorded. Thank you for helping make campus safer.
          </p>
        </div>

        <Card className="p-4 mb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">What was recorded</p>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Hostel</span>
              <Badge color="slate">{result.hostel}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Category</span>
              <Badge color={result.category === 'tobacco' || result.category === 'alcohol' || result.category === 'drugs' ? 'error' : 'warning'}>
                {result.category}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Anonymous description</p>
              <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 leading-relaxed">{result.description}</p>
            </div>
          </div>
        </Card>

        <div className="flex items-center gap-2 justify-center text-xs text-slate-400 mb-4">
          <Lock className="w-3.5 h-3.5" />
          No identifying information was stored. This report is fully anonymous.
        </div>

        <Button onClick={() => { setStatus('idle'); setResult(null); }} variant="outline" className="w-full">
          Submit another report
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-4 animate-fade-in">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-display font-bold text-slate-900">Anonymous Report</h1>
          <p className="text-xs text-slate-400">Share your experience — fully anonymous</p>
        </div>
      </div>

      <Card className="p-4 mb-4 bg-slate-50 border-slate-100">
        <div className="flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 leading-relaxed">
            Your report is processed by AI to remove any identifying details before storing. No name, email, or student ID is ever attached. Admins only see the anonymous summary.
          </p>
        </div>
      </Card>

      <Card className="p-4 mb-4">
        <Textarea
          label="What happened?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Describe the peer pressure situation you experienced or witnessed. E.g., 'In Block C hostel, some seniors were pressuring juniors to try smoking during the weekend gathering...'"
        />
      </Card>

      {status === 'error' && (
        <div className="bg-error-50 text-error-600 text-sm rounded-xl px-3.5 py-2.5 border border-error-100 mb-4">
          Something went wrong submitting your report. Please try again.
        </div>
      )}

      <Button onClick={handleSubmit} disabled={!text.trim() || status === 'submitting'} loading={status === 'submitting'} className="w-full">
        {status === 'submitting' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Processing anonymously...
          </>
        ) : (
          <>Submit Anonymous Report</>
        )}
      </Button>

      <p className="text-center text-xs text-slate-400 mt-3">
        You earn 20 influence points for each report
      </p>
    </div>
  );
}
