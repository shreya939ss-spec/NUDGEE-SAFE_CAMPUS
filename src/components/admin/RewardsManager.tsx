import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Button, Modal, Input, Select, EmptyState } from '@/components/ui';
import { InlineLoader } from '@/components/Logo';
import type { Reward } from '@/types';
import { Gift, Plus, Pencil, Trash2, Loader2, Award } from 'lucide-react';

type FormData = { title: string; points_required: string; category: string };
const empty: FormData = { title: '', points_required: '100', category: 'general' };

const categories = ['general', 'merch', 'experience', 'privilege', 'academic'];

export function RewardsManager() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Reward | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('rewards').select('*').order('points_required');
    setRewards((data as Reward[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(empty); setError(null); setModalOpen(true); };
  const openEdit = (r: Reward) => {
    setEditing(r);
    setForm({ title: r.title || '', points_required: String(r.points_required || 100), category: r.category || 'general' });
    setError(null);
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      points_required: parseInt(form.points_required) || 0,
      category: form.category,
    };
    if (editing) {
      await supabase.from('rewards').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('rewards').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    await load();
  };

  const remove = async (id: string) => {
    await supabase.from('rewards').delete().eq('id', id);
    await load();
  };

  if (loading) return <InlineLoader message="Loading rewards..." />;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Reward Manager</h1>
          <p className="text-sm text-slate-400">Create and manage influence point rewards</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> New Reward</Button>
      </div>

      {rewards.length === 0 ? (
        <EmptyState icon={<Gift className="w-7 h-7" />} title="No rewards yet" subtitle="Create your first reward." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rewards.map((reward) => (
            <Card key={reward.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-warning-50 flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-warning-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{reward.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge color="warning">{reward.points_required} pts</Badge>
                    <Badge color="slate">{reward.category}</Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 mt-3 pt-3 border-t border-slate-50">
                <button onClick={() => openEdit(reward)} className="flex-1 flex items-center justify-center gap-1 text-xs font-medium text-slate-500 hover:text-brand-600 py-1.5 rounded-lg hover:bg-brand-50 transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => remove(reward.id)} className="flex-1 flex items-center justify-center gap-1 text-xs font-medium text-slate-500 hover:text-error-600 py-1.5 rounded-lg hover:bg-error-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Reward' : 'New Reward'}>
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Free Campus Coffee" />
          <Input label="Points Required" type="number" value={form.points_required} onChange={(e) => setForm({ ...form, points_required: e.target.value })} placeholder="100" />
          <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {categories.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </Select>
          {error && <p className="text-xs text-error-500">{error}</p>}
          <Button onClick={save} loading={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? 'Save Changes' : 'Create Reward'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
