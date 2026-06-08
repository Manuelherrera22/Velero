-- ============================================
-- VELERO PLATFORM — Migration 011
-- Add commission_type to hotels
-- ============================================

ALTER TABLE public.hotels
ADD COLUMN IF NOT EXISTS commission_type TEXT DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed'));
