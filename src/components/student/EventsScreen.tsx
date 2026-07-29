import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Button, EmptyState } from '@/components/ui';
import { InlineLoader } from '@/components/Logo';
import type { EventItem } from '@/types';
import { CalendarDays, MapPin, Check, Loader2, Clock } from 'lucide-react';

export function EventsScreen() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [rsvpIds, setRsvpIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true });
    setEvents((data as EventItem[]) || []);
  }, []);

  const loadRsvps = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase.from('event_rsvps').select('event_id').eq('student_id', profile.id);
    setRsvpIds(new Set((data || []).map((r: { event_id: string }) => r.event_id)));
  }, [profile?.id]);

  useEffect(() => {
    Promise.all([loadEvents(), loadRsvps()]).finally(() => setLoading(false));
  }, [loadEvents, loadRsvps]);

  const toggleRsvp = async (eventId: string) => {
    if (!profile?.id) return;
    setBusyId(eventId);
    const isRsvped = rsvpIds.has(eventId);
    if (isRsvped) {
      await supabase.from('event_rsvps').delete().eq('event_id', eventId).eq('student_id', profile.id);
      setRsvpIds((prev) => { const n = new Set(prev); n.delete(eventId); return n; });
    } else {
      await supabase.from('event_rsvps').insert({ event_id: eventId, student_id: profile.id });
      await supabase.from('influence_ledger').insert({ student_id: profile.id, points: 15, reason: 'RSVP to event' });
      setRsvpIds((prev) => new Set(prev).add(eventId));
    }
    setBusyId(null);
  };

  if (loading) {
    return <InlineLoader message="Loading events..." />;
  }

  const upcoming = events.filter((e) => !e.event_date || new Date(e.event_date) >= new Date());
  const past = events.filter((e) => e.event_date && new Date(e.event_date) < new Date());

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-4 animate-fade-in">
      <h1 className="text-2xl font-display font-bold text-slate-900 mb-1">Events</h1>
      <p className="text-sm text-slate-400 mb-4">RSVP to earn influence points</p>

      {events.length === 0 ? (
        <EmptyState icon={<CalendarDays className="w-7 h-7" />} title="No events yet" subtitle="Campus events will appear here." />
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-3 mb-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Upcoming</h2>
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} isRsvped={rsvpIds.has(event.id)} onToggle={() => toggleRsvp(event.id)} busy={busyId === event.id} />
              ))}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Past</h2>
              {past.map((event) => (
                <EventCard key={event.id} event={event} isRsvped={rsvpIds.has(event.id)} onToggle={() => toggleRsvp(event.id)} busy={busyId === event.id} past />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EventCard({ event, isRsvped, onToggle, busy, past }: { event: EventItem; isRsvped: boolean; onToggle: () => void; busy: boolean; past?: boolean }) {
  return (
    <Card className={`p-4 ${past ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
          <CalendarDays className="w-5 h-5 text-brand-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">{event.title}</p>
          {event.description && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{event.description}</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            {event.event_date && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <Clock className="w-3 h-3" /> {formatDate(event.event_date)}
              </span>
            )}
            {event.location && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <MapPin className="w-3 h-3" /> {event.location}
              </span>
            )}
          </div>
        </div>
      </div>
      {!past && (
        <div className="mt-3">
          <Button size="sm" variant={isRsvped ? 'secondary' : 'primary'} onClick={onToggle} disabled={busy} className="w-full">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isRsvped ? <><Check className="w-3.5 h-3.5" /> Going</> : 'RSVP'}
          </Button>
        </div>
      )}
      {isRsvped && past && <div className="mt-2"><Badge color="success">Attended</Badge></div>}
    </Card>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
