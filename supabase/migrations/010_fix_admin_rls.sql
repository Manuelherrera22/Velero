-- ============================================
-- VELERO PLATFORM — Migration 010
-- Fix Admin RLS policies (WITH CHECK missing)
-- ============================================

-- The existing "Admins can manage all trips" policy has FOR ALL USING(...)
-- but is missing WITH CHECK(...), which causes UPDATE/INSERT to fail with 400.

-- Drop the broken policy and recreate it correctly
DROP POLICY IF EXISTS "Admins can manage all trips" ON public.trips;

CREATE POLICY "Admins can manage all trips" ON public.trips
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Same fix for profiles — admin needs WITH CHECK to update other users
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Also allow admins to SELECT all trips (any status) — currently they can only
-- see published trips or their own through the existing policies.
-- The FOR ALL policy above covers this, but let's ensure a dedicated SELECT exists.
DROP POLICY IF EXISTS "Admins can view all trips" ON public.trips;

CREATE POLICY "Admins can view all trips" ON public.trips
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
