import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Button, Modal, Input, Textarea, EmptyState } from '@/components/ui';
import { InlineLoader } from '@/components/Logo';
import type { EventItem } from '@/types';
import { CalendarDays, Plus, Pencil, Trash2, MapPin, Clock, Loader2 } from 'lucide-react';

type FormData = { title: string; description: string; event_date: string; location: string };

const empty: FormData = { title: '', description: '', event_date: '', location: '' };

export function EventsManager() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true });
    setEvents((data as EventItem[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(empty); setError(null); setModalOpen(true); };
  const openEdit = (e: EventItem) => {
    setEditing(e);
    setForm({
      title: e.title,
      description: e.description || '',
      event_date: e.event_date ? new Date(e.event_date).toISOString().slice(0, 16) : '',
      location: e.location || '',
    });
    setError(null);
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      event_date: form.event_date ? new Date(form.event_date).toISOString() : null,
      location: form.location.trim() || null,
      created_by: profile?.id,
    };
    if (editing) {
      await supabase.from('events').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('events').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    await load();
  };

  const remove = async (id: string) => {
    await supabase.from('events').delete().eq('id', id);
    await load();
  };

  if (loading) return <InlineLoader message="Loading events..." />;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Event Manager</h1>
          <p className="text-sm text-slate-400">Create and manage campus events</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> New Event</Button>
      </div>

      {events.length === 0 ? (
        <EmptyState icon={<CalendarDays className="w-7 h-7" />} title="No events yet" subtitle="Create your first campus event." />
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Card key={event.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <CalendarDays className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{event.title}</p>
                  {event.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{event.description}</p>}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {event.event_date && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" /> {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                    {event.location && (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <MapPin className="w-3 h-3" /> {event.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(event)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(event.id)} className="p-2 rounded-lg hover:bg-error-50 text-slate-400 hover:text-error-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Event' : 'New Event'}>
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Tech Talk 2026" />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Event details..." />
          <Input label="Date & Time" type="datetime-local" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
          <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Auditorium A" />
          {error && <p className="text-xs text-error-500">{error}</p>}
          <Button onClick={save} loading={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? 'Save Changes' : 'Create Event'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
