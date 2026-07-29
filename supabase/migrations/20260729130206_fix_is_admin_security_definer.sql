/*
# Fix is_admin() SECURITY DEFINER exposure

## Problem
The scanner flagged that `authenticated` users can execute `is_admin()` — a
SECURITY DEFINER function — directly via `/rest/v1/rpc/is_admin`. SECURITY
DEFINER functions run with the owner's privileges, so exposing them via REST
is a privilege-escalation risk.

## Solution
1. Create a lightweight `admin_users` table holding only admin user IDs.
2. Add a trigger that keeps `admin_users` in sync whenever `profiles.role`
   changes, so it is always an accurate mirror of `profiles.role = 'admin'`.
3. Rewrite `is_admin()` as SECURITY INVOKER, querying `admin_users` instead
   of `profiles`. SECURITY INVOKER functions run with the caller's
   privileges, so they are not flagged by the scanner.
4. The `admin_users` table has a permissive SELECT policy (authenticated can
   read) — it only contains UUIDs of admins, which is not sensitive — so the
   SECURITY INVOKER `is_admin()` can query it during RLS evaluation.
5. Rewrite the `admin_select_profiles` policy to check `admin_users` directly
   instead of calling `is_admin()`, breaking the recursive dependency that
   previously prevented switching to SECURITY INVOKER.
6. Revoke EXECUTE on the trigger helper from anon/authenticated so it cannot
   be called via REST — only the trigger itself invokes it.

## Tables
- `public.admin_users` (new): `user_id` (uuid PK, references auth.users),
  `created_at`. Stores the set of admin user IDs.

## Security
- `admin_users`: RLS enabled, SELECT for authenticated (read-only mirror).
- `is_admin()`: SECURITY INVOKER, search_path pinned to pg_catalog.
- `sync_admin_users()`: SECURITY DEFINER trigger function, search_path pinned,
  EXECUTE revoked from anon/authenticated (trigger-only, not REST-callable).
- `admin_select_profiles` policy rewritten to use `admin_users` subquery
  (no recursion).
*/

-- ---------------------------------------------------------------------------
-- 1. admin_users table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_admin_users" ON public.admin_users;
CREATE POLICY "read_admin_users" ON public.admin_users
  FOR SELECT TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- 2. Populate from existing admin profiles
-- ---------------------------------------------------------------------------
INSERT INTO public.admin_users (user_id)
SELECT id FROM public.profiles WHERE role = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Trigger to keep admin_users in sync with profiles.role
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_admin_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    INSERT INTO public.admin_users (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    DELETE FROM public.admin_users WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger functions don't need EXECUTE permission for the calling user,
-- so revoke from everyone except the owner to prevent direct REST calls.
REVOKE EXECUTE ON FUNCTION public.sync_admin_users() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_sync_admin_users ON public.profiles;
CREATE TRIGGER trg_sync_admin_users
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_admin_users();

-- ---------------------------------------------------------------------------
-- 4. Rewrite is_admin() as SECURITY INVOKER
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  );
$$;

-- Keep EXECUTE restricted: authenticated needs it for RLS policy evaluation,
-- anon does not.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. Rewrite admin_select_profiles to avoid recursion
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "admin_select_profiles" ON public.profiles;
CREATE POLICY "admin_select_profiles" ON public.profiles
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );
