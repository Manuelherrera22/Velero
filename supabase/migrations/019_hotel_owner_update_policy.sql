-- ============================================
-- Allow affiliate users to update their own hotel
-- (name, location, contact info)
-- ============================================

-- Affiliates can view their own hotels (even if inactive)
CREATE POLICY "Owners can view their own hotels" ON public.hotels
  FOR SELECT USING (auth.uid() = owner_id);

-- Affiliates can update their own hotel details
CREATE POLICY "Owners can update their own hotels" ON public.hotels
  FOR UPDATE USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
