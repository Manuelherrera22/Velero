-- ============================================
-- KAILU PLATFORM — Migration 012
-- Remaining Backlog Fields & Navigation Zones
-- ============================================

-- 1. Profiles updates (nautical license & custom commission rate)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS nautical_license_url TEXT,
  ADD COLUMN IF NOT EXISTS captain_commission_rate NUMERIC DEFAULT 20.0;

-- 2. Navigation Zones table
CREATE TABLE IF NOT EXISTS public.navigation_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Trips updates (variable deposit / down-payment percentage & navigation zone)
ALTER TABLE public.trips 
  ADD COLUMN IF NOT EXISTS deposit_percentage NUMERIC DEFAULT 100.0,
  ADD COLUMN IF NOT EXISTS navigation_zone_id UUID REFERENCES public.navigation_zones(id) ON DELETE SET NULL;

-- Seed initial navigation zones
INSERT INTO public.navigation_zones (name) VALUES
  ('Río de la Plata y Litoral'),
  ('Patagonia y Lagos Andinos'),
  ('Brasil')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on navigation zones
ALTER TABLE public.navigation_zones ENABLE ROW LEVEL SECURITY;

-- Select policy: viewable by everyone
DROP POLICY IF EXISTS "Navigation zones are viewable by everyone" ON public.navigation_zones;
CREATE POLICY "Navigation zones are viewable by everyone" ON public.navigation_zones
  FOR SELECT USING (true);

-- Admin policy: managed by admins only
DROP POLICY IF EXISTS "Admins can manage navigation zones" ON public.navigation_zones;
CREATE POLICY "Admins can manage navigation zones" ON public.navigation_zones
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Storage Bucket for Captain Licenses
INSERT INTO storage.buckets (id, name, public) VALUES ('licenses', 'licenses', true)
  ON CONFLICT (id) DO NOTHING;

-- Select policy: public access
DROP POLICY IF EXISTS "Licenses are viewable by everyone" ON storage.objects;
CREATE POLICY "Licenses are viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'licenses');

-- Insert policy: authenticated users can upload
DROP POLICY IF EXISTS "Users can upload their own license document" ON storage.objects;
CREATE POLICY "Users can upload their own license document" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'licenses' AND auth.role() = 'authenticated'
  );

