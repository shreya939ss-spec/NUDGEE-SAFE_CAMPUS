import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Button, Modal, Input, Textarea, EmptyState } from '@/components/ui';
import { InlineLoader } from '@/components/Logo';
import type { Club } from '@/types';
import { Users, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

type FormData = { name: string; category: string; description: string };
const empty: FormData = { name: '', category: '', description: '' };

export function ClubsManager() {
  const { profile } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Club | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('clubs').select('*').order('name');
    setClubs((data as Club[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(empty); setError(null); setModalOpen(true); };
  const openEdit = (c: Club) => {
    setEditing(c);
    setForm({ name: c.name, category: c.category || '', description: c.description || '' });
    setError(null);
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      category: form.category.trim() || null,
      description: form.description.trim() || null,
      created_by: profile?.id,
    };
    if (editing) {
      await supabase.from('clubs').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('clubs').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    await load();
  };

  const remove = async (id: string) => {
    await supabase.from('clubs').delete().eq('id', id);
    await load();
  };

  if (loading) return <InlineLoader message="Loading clubs..." />;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Club Manager</h1>
          <p className="text-sm text-slate-400">Create and manage campus clubs</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> New Club</Button>
      </div>

      {clubs.length === 0 ? (
        <EmptyState icon={<Users className="w-7 h-7" />} title="No clubs yet" subtitle="Create your first campus club." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {clubs.map((club) => (
            <Card key={club.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-accent-50 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-accent-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{club.name}</p>
                  {club.category && <div className="mt-1"><Badge color="accent">{club.category}</Badge></div>}
                  {club.description && <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{club.description}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(club)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(club.id)} className="p-2 rounded-lg hover:bg-error-50 text-slate-400 hover:text-error-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Club' : 'New Club'}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Coding Club" />
          <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Technology" />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="What is this club about?" />
          {error && <p className="text-xs text-error-500">{error}</p>}
          <Button onClick={save} loading={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? 'Save Changes' : 'Create Club'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
