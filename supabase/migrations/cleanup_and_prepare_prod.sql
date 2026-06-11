-- ========================================================
-- KAILU PLATFORM — Production Cleanup & Preparation Script
-- Run this script in the Supabase SQL Editor
-- ========================================================

-- 1. Explicitly clear all transactional test data in correct order (child tables first)
DELETE FROM public.booking_addons;
DELETE FROM public.reviews;
DELETE FROM public.payments;
DELETE FROM public.bookings;
DELETE FROM public.trip_dates;
DELETE FROM public.trip_addons;
DELETE FROM public.trips;
DELETE FROM public.boats;
DELETE FROM public.qr_codes;
DELETE FROM public.hotels;
DELETE FROM public.coupons;

-- 2. Delete all authentication users except the main administrator (haccorinti@yahoo.com.ar)
-- Note: auth.users deletion cascades automatically to public.profiles and any owned items.
DELETE FROM auth.users 
WHERE email != 'haccorinti@yahoo.com.ar';

-- 3. If the administrator user already exists in auth.users, promote them to admin role
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'haccorinti@yahoo.com.ar';

-- 4. Update handle_new_user() trigger function to guarantee admin role on future registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    CASE 
      WHEN NEW.email = 'haccorinti@yahoo.com.ar' THEN 'admin'
      ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
