-- ============================================
-- VELERO PLATFORM — Migration 009
-- Admin Policies
-- ============================================

-- Allow admins to update any profile
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins also need to be able to delete profiles/trips if needed
-- But for now, we just need them to verify users:
