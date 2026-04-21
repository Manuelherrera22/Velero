-- ============================================
-- VELERO PLATFORM — Security Hardening
-- Migration 004: Harden Bookings RLS
-- ============================================

-- Drop the overly permissive insert policy for bookings
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON public.bookings;

-- Create hardened policy: Users can only create bookings for themselves OR public guests (user_id = null)
CREATE POLICY "Authenticated users can create bookings securely" ON public.bookings
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR user_id IS NULL
  );

-- Double check reviews insert policy (already secure in 001, but reinforced here just in case)
DROP POLICY IF EXISTS "Users can create reviews for their bookings" ON public.reviews;

CREATE POLICY "Users can create reviews securely" ON public.reviews
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- To apply this file:
-- Run this in your Supabase SQL Editor to finish securing the platform.
