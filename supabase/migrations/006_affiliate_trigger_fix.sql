-- ============================================
-- VELERO PLATFORM — Migration 006
-- Trigger fix to store affiliate metadata on signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    phone, 
    full_name, 
    avatar_url, 
    role,
    business_name,
    business_location,
    bank_alias,
    bank_holder
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'),
    NEW.raw_user_meta_data->>'business_name',
    NEW.raw_user_meta_data->>'business_location',
    NEW.raw_user_meta_data->>'bank_alias',
    NEW.raw_user_meta_data->>'bank_holder'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
