-- Add navigation_zone_id to handle_new_user trigger
-- Affiliates can now choose their navigation zone during registration

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, phone, full_name, avatar_url, role,
    business_name, business_location, bank_alias, bank_holder,
    navigation_zone_id
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    CASE
      WHEN NEW.email = 'haccorinti@yahoo.com.ar' THEN 'admin'
      ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
    END,
    NEW.raw_user_meta_data->>'business_name',
    NEW.raw_user_meta_data->>'business_location',
    NEW.raw_user_meta_data->>'bank_alias',
    NEW.raw_user_meta_data->>'bank_holder',
    NULLIF(NEW.raw_user_meta_data->>'navigation_zone_id', '')::uuid
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
