-- ============================================
-- VELERO PLATFORM — Migration 008
-- Affiliate Hotel Owners
-- ============================================

-- Add owner_id to hotels to link businesses to affiliate users
ALTER TABLE public.hotels
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- If there are existing hotels that need to be owned by someone specific, you would UPDATE them here.
-- Example: UPDATE public.hotels SET owner_id = 'some-uuid' WHERE name = 'Hotel Kailu';
