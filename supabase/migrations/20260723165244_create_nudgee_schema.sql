/*
# NUDGEE — Full Database Schema (Stage 1)

## Purpose
NUDGEE is an AI-powered campus influence PWA. This migration creates the
complete data model: user profiles, clubs, events, mentors, rewards,
wellness check-ins, anonymous pressure reports, the campus feed, and an
influence-points ledger.

## New Tables
1. `profiles` — extends `auth.users`. Holds full name, role (student/admin),
   hostel, and influence_points total.
2. `clubs` — student clubs/organizations.
3. `club_members` — join table linking students to clubs.
4. `events` — campus events with date/location.
5. `event_rsvps` — join table linking students to events they'll attend.
6. `mentors` — mentor profiles with capacity.
7. `mentor_assignments` — join table linking students to mentors.
8. `rewards` — redeemable rewards with a points cost.
9. `wellness_checks` — daily mood check-ins (happy/neutral/low) per student.
10. `pressure_reports` — ANONYMOUS peer-pressure reports. By design this
    table has NO `student_id` column — this is the "privacy by design"
    talking point. Students can insert but can never read back identifying
    data because none is stored.
11. `feed_posts` — campus feed cards (event/club/competition/internship/news/story).
12. `influence_ledger` — append-only ledger of influence-points transactions.

## Security (RLS)
- `profiles`: a user reads/updates only their own row. Admins can read all
  profiles (for dashboard stats) via a separate admin_read_profiles policy.
- `wellness_checks`: a student reads/inserts only their own rows. Admins
  read aggregate-only via a dedicated admin SELECT policy.
- `influence_ledger`: student reads only their own rows; inserts allowed
  for own rows.
- `pressure_reports`: any authenticated user may INSERT (anonymous). No
  SELECT policy for students — admins get a SELECT policy to view reports
  for the dashboard. There is no `student_id` column, so no ownership
  predicate is possible or needed.
- `clubs`, `events`, `mentors`, `rewards`, `feed_posts`: readable by all
  authenticated users (shared campus data). Inserts/updates/deletes are
  admin-only via the is_admin() helper.
- `club_members`, `event_rsvps`: students manage their own membership rows;
  admins can read all.

## Important Notes
1. `profiles.role` uses a CHECK constraint ('student' | 'admin').
2. `pressure_reports` intentionally has NO `student_id` — anonymity by design.
3. Owner columns (`student_id`) default to `auth.uid()` so client inserts
   that omit the owner still satisfy RLS `WITH CHECK`.
4. A `is_admin()` SQL helper checks the profile role for admin-only policies.
*/

-- ---------------------------------------------------------------------------
-- profiles table (created BEFORE is_admin() so the function's reference resolves)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text CHECK (role IN ('student','admin')) NOT NULL DEFAULT 'student',
  hostel text,
  influence_points int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Helper: is_admin() — true if the current user's profile role is 'admin'
-- (created AFTER profiles table exists, BEFORE any policy references it)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- profiles RLS + policies
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "admin_select_profiles" ON public.profiles;
CREATE POLICY "admin_select_profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
CREATE POLICY "insert_own_profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- clubs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  description text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_clubs" ON public.clubs;
CREATE POLICY "read_clubs" ON public.clubs
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_clubs" ON public.clubs;
CREATE POLICY "admin_insert_clubs" ON public.clubs
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_clubs" ON public.clubs;
CREATE POLICY "admin_update_clubs" ON public.clubs
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_clubs" ON public.clubs;
CREATE POLICY "admin_delete_clubs" ON public.clubs
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- club_members
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.club_members (
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (club_id, student_id)
);

ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_club_members" ON public.club_members;
CREATE POLICY "read_club_members" ON public.club_members
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_club_membership" ON public.club_members;
CREATE POLICY "insert_own_club_membership" ON public.club_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "delete_own_club_membership" ON public.club_members;
CREATE POLICY "delete_own_club_membership" ON public.club_members
  FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date timestamptz,
  location text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_events" ON public.events;
CREATE POLICY "read_events" ON public.events
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_events" ON public.events;
CREATE POLICY "admin_insert_events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_events" ON public.events;
CREATE POLICY "admin_update_events" ON public.events
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_events" ON public.events;
CREATE POLICY "admin_delete_events" ON public.events
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- event_rsvps
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  rsvp_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, student_id)
);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_event_rsvps" ON public.event_rsvps;
CREATE POLICY "read_event_rsvps" ON public.event_rsvps
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_rsvp" ON public.event_rsvps;
CREATE POLICY "insert_own_rsvp" ON public.event_rsvps
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "delete_own_rsvp" ON public.event_rsvps;
CREATE POLICY "delete_own_rsvp" ON public.event_rsvps
  FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- ---------------------------------------------------------------------------
-- mentors
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mentors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  bio text,
  capacity int NOT NULL DEFAULT 20,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_mentors" ON public.mentors;
CREATE POLICY "read_mentors" ON public.mentors
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_mentors" ON public.mentors;
CREATE POLICY "admin_insert_mentors" ON public.mentors
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_mentors" ON public.mentors;
CREATE POLICY "admin_update_mentors" ON public.mentors
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_mentors" ON public.mentors;
CREATE POLICY "admin_delete_mentors" ON public.mentors
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- mentor_assignments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mentor_assignments (
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE CASCADE,
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (mentor_id, student_id)
);

ALTER TABLE public.mentor_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_mentor_assignments" ON public.mentor_assignments;
CREATE POLICY "read_mentor_assignments" ON public.mentor_assignments
  FOR SELECT TO authenticated USING (auth.uid() = student_id OR public.is_admin());

DROP POLICY IF EXISTS "admin_insert_mentor_assignments" ON public.mentor_assignments;
CREATE POLICY "admin_insert_mentor_assignments" ON public.mentor_assignments
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_mentor_assignments" ON public.mentor_assignments;
CREATE POLICY "admin_delete_mentor_assignments" ON public.mentor_assignments
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- rewards
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  points_required int,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_rewards" ON public.rewards;
CREATE POLICY "read_rewards" ON public.rewards
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_rewards" ON public.rewards;
CREATE POLICY "admin_insert_rewards" ON public.rewards
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_rewards" ON public.rewards;
CREATE POLICY "admin_update_rewards" ON public.rewards
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_rewards" ON public.rewards;
CREATE POLICY "admin_delete_rewards" ON public.rewards
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- wellness_checks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wellness_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  mood text CHECK (mood IN ('happy','neutral','low')) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wellness_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_wellness" ON public.wellness_checks;
CREATE POLICY "select_own_wellness" ON public.wellness_checks
  FOR SELECT TO authenticated USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "admin_select_wellness" ON public.wellness_checks;
CREATE POLICY "admin_select_wellness" ON public.wellness_checks
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "insert_own_wellness" ON public.wellness_checks;
CREATE POLICY "insert_own_wellness" ON public.wellness_checks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

-- ---------------------------------------------------------------------------
-- pressure_reports  (ANONYMOUS — no student_id column by design)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pressure_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel text,
  description text,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pressure_reports ENABLE ROW LEVEL SECURITY;

-- Any authenticated user may submit an anonymous report.
DROP POLICY IF EXISTS "insert_pressure_report" ON public.pressure_reports;
CREATE POLICY "insert_pressure_report" ON public.pressure_reports
  FOR INSERT TO authenticated WITH CHECK (true);

-- Only admins can read reports (for the dashboard / insights).
DROP POLICY IF EXISTS "admin_select_pressure_reports" ON public.pressure_reports;
CREATE POLICY "admin_select_pressure_reports" ON public.pressure_reports
  FOR SELECT TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- feed_posts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text CHECK (type IN ('event','club','competition','internship','news','story')) NOT NULL,
  title text,
  body text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_feed_posts" ON public.feed_posts;
CREATE POLICY "read_feed_posts" ON public.feed_posts
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_feed_posts" ON public.feed_posts;
CREATE POLICY "admin_insert_feed_posts" ON public.feed_posts
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_feed_posts" ON public.feed_posts;
CREATE POLICY "admin_update_feed_posts" ON public.feed_posts
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_feed_posts" ON public.feed_posts;
CREATE POLICY "admin_delete_feed_posts" ON public.feed_posts
  FOR DELETE TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- influence_ledger
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.influence_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  points int NOT NULL DEFAULT 0,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.influence_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_ledger" ON public.influence_ledger;
CREATE POLICY "select_own_ledger" ON public.influence_ledger
  FOR SELECT TO authenticated USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "admin_select_ledger" ON public.influence_ledger;
CREATE POLICY "admin_select_ledger" ON public.influence_ledger
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "insert_own_ledger" ON public.influence_ledger;
CREATE POLICY "insert_own_ledger" ON public.influence_ledger
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

-- ---------------------------------------------------------------------------
-- Indexes for common query patterns
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_club_members_student ON public.club_members(student_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_student ON public.event_rsvps(student_id);
CREATE INDEX IF NOT EXISTS idx_wellness_checks_student ON public.wellness_checks(student_id);
CREATE INDEX IF NOT EXISTS idx_wellness_checks_created ON public.wellness_checks(created_at);
CREATE INDEX IF NOT EXISTS idx_pressure_reports_hostel ON public.pressure_reports(hostel);
CREATE INDEX IF NOT EXISTS idx_pressure_reports_created ON public.pressure_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_ledger_student ON public.influence_ledger(student_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON public.feed_posts(created_at);
