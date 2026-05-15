-- ============================================
-- VELERO PLATFORM — Migration 005
-- Affiliate Fields and QR Policies
-- ============================================

-- 1. Add business and bank fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS business_location TEXT,
ADD COLUMN IF NOT EXISTS bank_alias TEXT,
ADD COLUMN IF NOT EXISTS bank_holder TEXT;

-- 2. Allow affiliates to insert QR codes for their own hotels
CREATE POLICY "Affiliates can manage their own hotel QR codes" ON public.qr_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.hotels WHERE id = hotel_id AND owner_id = auth.uid())
  );
