-- ============================================
-- KAILU PLATFORM — Migration 014
-- Security Fixes (Zekro Audit Remediation)
-- ============================================

-- 1. Helper function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Restrict profiles selection policy (preventing anon users from reading everyone's sensitive info)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Anyone can view publisher profiles" ON public.profiles
  FOR SELECT USING (role = 'publisher');

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin(auth.uid()));


-- 3. Drop insecure INSERT policy on payments (preventing payment forgery)
-- Webhooks/backend functions use the Service Role Key which completely bypasses RLS,
-- so client-side inserts should be entirely blocked.
DROP POLICY IF EXISTS "System can insert payments" ON public.payments;


-- 4. Harden INSERT policy on booking_addons (preventing arbitrary addon insertion on other users' bookings)
DROP POLICY IF EXISTS "Anyone can insert booking addons" ON public.booking_addons;

CREATE POLICY "Users can insert booking addons for their own bookings" ON public.booking_addons
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = booking_id 
        AND (user_id = auth.uid() OR (user_id IS NULL AND auth.uid() IS NULL))
    )
  );
