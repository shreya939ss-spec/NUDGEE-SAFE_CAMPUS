import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, Badge, EmptyState } from '@/components/ui';
import { InlineLoader } from '@/components/Logo';
import type { FeedPost } from '@/types';
import { Newspaper, Trophy, Briefcase, Megaphone, BookOpen, CalendarDays, Users } from 'lucide-react';

const typeMeta: Record<string, { icon: typeof Newspaper; color: string; bg: string; label: string }> = {
  event: { icon: CalendarDays, color: 'text-brand-600', bg: 'bg-brand-50', label: 'Event' },
  club: { icon: Users, color: 'text-accent-600', bg: 'bg-accent-50', label: 'Club' },
  competition: { icon: Trophy, color: 'text-warning-600', bg: 'bg-warning-50', label: 'Competition' },
  internship: { icon: Briefcase, color: 'text-success-600', bg: 'bg-success-50', label: 'Internship' },
  news: { icon: Megaphone, color: 'text-error-600', bg: 'bg-error-50', label: 'News' },
  story: { icon: BookOpen, color: 'text-slate-600', bg: 'bg-slate-100', label: 'Story' },
};

const filterTypes = ['all', 'event', 'club', 'competition', 'internship', 'news', 'story'] as const;

export function FeedScreen() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof filterTypes)[number]>('all');

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('feed_posts').select('*').order('created_at', { ascending: false });
      setPosts((data as FeedPost[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filter === 'all' ? posts : posts.filter((p) => p.type === filter);

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-4 animate-fade-in">
      <h1 className="text-2xl font-display font-bold text-slate-900 mb-4">Campus Feed</h1>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 mb-4 pb-1">
        {filterTypes.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filter === t ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20' : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            {t === 'all' ? 'All' : typeMeta[t]?.label || t}
          </button>
        ))}
      </div>

      {loading ? (
        <InlineLoader message="Loading feed..." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Newspaper className="w-7 h-7" />} title="No posts yet" subtitle="Campus updates will appear here." />
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => {
            const meta = typeMeta[post.type] || typeMeta.story;
            const Icon = meta.icon;
            return (
              <Card key={post.id} className="p-4 animate-slide-up">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                    <Icon className={`w-5 h-5 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge color={post.type === 'event' ? 'brand' : post.type === 'competition' ? 'warning' : post.type === 'internship' ? 'success' : 'slate'}>
                        {meta.label}
                      </Badge>
                      <span className="text-xs text-slate-400">{timeAgo(post.created_at)}</span>
                    </div>
                    {post.title && <p className="text-sm font-semibold text-slate-800">{post.title}</p>}
                    {post.body && <p className="text-sm text-slate-500 mt-1 leading-relaxed">{post.body}</p>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
