-- ============================================
-- VELERO PLATFORM — Fix Admin + Boats RLS Policies
-- Ejecutar en Supabase → SQL Editor → Run
-- ============================================

-- 1. Helper function to check admin status (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Fix Admin Trip Policy (required for Approve/Reject)
DROP POLICY IF EXISTS "Admins can manage all trips" ON public.trips;
DROP POLICY IF EXISTS "Admins can view all trips" ON public.trips;

CREATE POLICY "Admins can manage all trips" ON public.trips
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Fix Admin Bookings Policy
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;

CREATE POLICY "Admins can manage all bookings" ON public.bookings
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Fix Admin Profiles Policy  
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Ensure profiles self-management works
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 6. Fix Boats owner policy
DROP POLICY IF EXISTS "Owners can manage their own boats" ON public.boats;

CREATE POLICY "Owners can manage their own boats" ON public.boats
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 7. Verify results
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE tablename IN ('profiles', 'trips', 'boats', 'bookings')
ORDER BY tablename, policyname;
