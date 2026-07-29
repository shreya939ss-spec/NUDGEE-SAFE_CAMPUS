-- Fix 1: Function Search Path Mutable
-- Pin search_path to pg_catalog so the SECURITY DEFINER function is not
-- vulnerable to search_path hijacking. All object references inside the
-- function body are fully-qualified (public.profiles, auth.uid), so a
-- minimal search_path is safe.
ALTER FUNCTION public.is_admin() SET search_path = pg_catalog;

-- Fix 2 & 3: Public / authenticated can execute SECURITY DEFINER function
-- Revoke EXECUTE from PUBLIC (which includes every role) and from anon
-- explicitly, then grant only to authenticated — the minimum role that
-- needs it because RLS policies on shared tables call is_admin() during
-- query evaluation.
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Fix 4: RLS Policy Always True on pressure_reports INSERT
-- The previous WITH CHECK (true) was flagged as unrestricted. Replace
-- with an explicit authenticated-user check. The table is anonymous by
-- design (no student_id column), so the only meaningful predicate is that
-- the inserter is a real signed-in user.
DROP POLICY IF EXISTS "insert_pressure_report" ON public.pressure_reports;
CREATE POLICY "insert_pressure_report" ON public.pressure_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
