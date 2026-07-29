import type { Profile } from '@/lib/supabase';

export type { Profile };

export type Club = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
};

export type ClubMember = {
  club_id: string;
  student_id: string;
  joined_at: string;
};

export type EventItem = {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  created_by: string | null;
  created_at: string;
};

export type EventRsvp = {
  event_id: string;
  student_id: string;
  rsvp_at: string;
};

export type Mentor = {
  id: string;
  name: string | null;
  bio: string | null;
  capacity: number;
  created_at: string;
};

export type MentorAssignment = {
  mentor_id: string;
  student_id: string;
};

export type Reward = {
  id: string;
  title: string | null;
  points_required: number | null;
  category: string | null;
  created_at: string;
};

export type WellnessCheck = {
  id: string;
  student_id: string;
  mood: 'happy' | 'neutral' | 'low';
  created_at: string;
};

export type PressureReport = {
  id: string;
  hostel: string | null;
  description: string | null;
  category: string | null;
  created_at: string;
};

export type FeedPost = {
  id: string;
  type: 'event' | 'club' | 'competition' | 'internship' | 'news' | 'story';
  title: string | null;
  body: string | null;
  created_at: string;
};

export type InfluenceLedgerEntry = {
  id: string;
  student_id: string;
  points: number;
  reason: string | null;
  created_at: string;
};
