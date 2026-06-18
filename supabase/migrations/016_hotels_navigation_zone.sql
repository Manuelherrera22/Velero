-- Add navigation_zone_id to hotels table
ALTER TABLE public.hotels
  ADD COLUMN IF NOT EXISTS navigation_zone_id UUID REFERENCES public.navigation_zones(id) ON DELETE SET NULL;
