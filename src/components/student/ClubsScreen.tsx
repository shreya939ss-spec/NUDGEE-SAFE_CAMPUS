import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Button, EmptyState } from '@/components/ui';
import { InlineLoader } from '@/components/Logo';
import type { Club } from '@/types';
import { Users, Plus, Check, Loader2 } from 'lucide-react';

export function ClubsScreen() {
  const { profile } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadClubs = useCallback(async () => {
    const { data } = await supabase.from('clubs').select('*').order('name');
    setClubs((data as Club[]) || []);
  }, []);

  const loadJoined = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase.from('club_members').select('club_id').eq('student_id', profile.id);
    setJoinedIds(new Set((data || []).map((r: { club_id: string }) => r.club_id)));
  }, [profile?.id]);

  useEffect(() => {
    Promise.all([loadClubs(), loadJoined()]).finally(() => setLoading(false));
  }, [loadClubs, loadJoined]);

  const toggleJoin = async (clubId: string) => {
    if (!profile?.id) return;
    setBusyId(clubId);
    const isJoined = joinedIds.has(clubId);
    if (isJoined) {
      await supabase.from('club_members').delete().eq('club_id', clubId).eq('student_id', profile.id);
      setJoinedIds((prev) => { const n = new Set(prev); n.delete(clubId); return n; });
    } else {
      await supabase.from('club_members').insert({ club_id: clubId, student_id: profile.id });
      await supabase.from('influence_ledger').insert({ student_id: profile.id, points: 10, reason: `Joined club` });
      setJoinedIds((prev) => new Set(prev).add(clubId));
    }
    setBusyId(null);
  };

  if (loading) {
    return <InlineLoader message="Loading clubs..." />;
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-4 animate-fade-in">
      <h1 className="text-2xl font-display font-bold text-slate-900 mb-1">Clubs</h1>
      <p className="text-sm text-slate-400 mb-4">Join clubs to earn influence points</p>

      {clubs.length === 0 ? (
        <EmptyState icon={<Users className="w-7 h-7" />} title="No clubs yet" subtitle="Check back soon for campus clubs." />
      ) : (
        <div className="space-y-3">
          {clubs.map((club) => {
            const isJoined = joinedIds.has(club.id);
            const isBusy = busyId === club.id;
            return (
              <Card key={club.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-accent-50 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-accent-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{club.name}</p>
                    {club.category && <div className="mt-1"><Badge color="accent">{club.category}</Badge></div>}
                    {club.description && <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{club.description}</p>}
                  </div>
                </div>
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant={isJoined ? 'secondary' : 'primary'}
                    onClick={() => toggleJoin(club.id)}
                    disabled={isBusy}
                    className="w-full"
                  >
                    {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isJoined ? <><Check className="w-3.5 h-3.5" /> Joined</> : <><Plus className="w-3.5 h-3.5" /> Join</>}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
