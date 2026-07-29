import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Button, Modal, Input, Textarea, EmptyState, Select } from '@/components/ui';
import { InlineLoader } from '@/components/Logo';
import type { Mentor, MentorAssignment, Profile } from '@/types';
import { UserCog, Plus, Pencil, Trash2, Loader2, UserPlus, X } from 'lucide-react';

type FormData = { name: string; bio: string; capacity: string };
const empty: FormData = { name: '', bio: '', capacity: '20' };

export function MentorsManager() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [assignments, setAssignments] = useState<Record<string, MentorAssignment[]>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Mentor | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [assignBusy, setAssignBusy] = useState(false);

  const load = useCallback(async () => {
    const [mRes, sRes, aRes] = await Promise.all([
      supabase.from('mentors').select('*').order('name'),
      supabase.from('profiles').select('*').eq('role', 'student').order('full_name'),
      supabase.from('mentor_assignments').select('mentor_id, student_id, profiles!inner(full_name)'),
    ]);

    const mentorList = (mRes.data as Mentor[]) || [];
    const studentList = (sRes.data as Profile[]) || [];
    const assignmentList = (aRes.data || []) as unknown as { mentor_id: string; student_id: string; profiles: { full_name: string | null } }[];

    const grouped: Record<string, MentorAssignment[]> = {};
    assignmentList.forEach((a) => {
      if (!grouped[a.mentor_id]) grouped[a.mentor_id] = [];
      grouped[a.mentor_id].push({ mentor_id: a.mentor_id, student_id: a.student_id });
    });

    setMentors(mentorList);
    setStudents(studentList);
    setAssignments(grouped);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(empty); setError(null); setModalOpen(true); };
  const openEdit = (m: Mentor) => {
    setEditing(m);
    setForm({ name: m.name || '', bio: m.bio || '', capacity: String(m.capacity) });
    setError(null);
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      bio: form.bio.trim() || null,
      capacity: parseInt(form.capacity) || 20,
    };
    if (editing) {
      await supabase.from('mentors').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('mentors').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    await load();
  };

  const remove = async (id: string) => {
    await supabase.from('mentors').delete().eq('id', id);
    await load();
  };

  const assignStudent = async () => {
    if (!selectedStudent || !assignOpen) return;
    setAssignBusy(true);
    await supabase.from('mentor_assignments').insert({ mentor_id: assignOpen, student_id: selectedStudent });
    setAssignBusy(false);
    setSelectedStudent('');
    setAssignOpen(null);
    await load();
  };

  const unassignStudent = async (mentorId: string, studentId: string) => {
    await supabase.from('mentor_assignments').delete().eq('mentor_id', mentorId).eq('student_id', studentId);
    await load();
  };

  if (loading) return <InlineLoader message="Loading mentors..." />;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Mentor Manager</h1>
          <p className="text-sm text-slate-400">Manage mentors and student assignments</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> New Mentor</Button>
      </div>

      {mentors.length === 0 ? (
        <EmptyState icon={<UserCog className="w-7 h-7" />} title="No mentors yet" subtitle="Add your first mentor." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {mentors.map((mentor) => {
            const assigned = assignments[mentor.id] || [];
            const isFull = assigned.length >= mentor.capacity;
            return (
              <Card key={mentor.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <UserCog className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{mentor.name}</p>
                    {mentor.bio && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{mentor.bio}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge color={isFull ? 'error' : 'success'}>
                        {assigned.length}/{mentor.capacity} assigned
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(mentor)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => remove(mentor.id)} className="p-2 rounded-lg hover:bg-error-50 text-slate-400 hover:text-error-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Assigned students */}
                {assigned.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-50">
                    <div className="flex flex-wrap gap-1.5">
                      {assigned.map((a) => {
                        const student = students.find((s) => s.id === a.student_id);
                        return (
                          <span key={a.student_id} className="inline-flex items-center gap-1 bg-slate-50 text-slate-600 rounded-full pl-2.5 pr-1 py-1 text-xs">
                            {student?.full_name || 'Unknown'}
                            <button onClick={() => unassignStudent(mentor.id, a.student_id)} className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!isFull && (
                  <button
                    onClick={() => setAssignOpen(mentor.id)}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 py-2 rounded-lg transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Assign Student
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Mentor create/edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Mentor' : 'New Mentor'}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. Sarah Chen" />
          <Textarea label="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="Mentor expertise and background..." />
          <Input label="Capacity" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="20" />
          {error && <p className="text-xs text-error-500">{error}</p>}
          <Button onClick={save} loading={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? 'Save Changes' : 'Create Mentor'}
          </Button>
        </div>
      </Modal>

      {/* Assign student modal */}
      <Modal open={!!assignOpen} onClose={() => setAssignOpen(null)} title="Assign Student">
        <div className="space-y-4">
          <Select label="Select Student" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
            <option value="">Choose a student...</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.full_name || 'Unknown'}</option>
            ))}
          </Select>
          <Button onClick={assignStudent} loading={assignBusy} disabled={!selectedStudent} className="w-full">
            {assignBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Assign to Mentor</>}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
