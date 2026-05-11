-- ============================================
-- VELERO PLATFORM — Database Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- ══════════════════════════════════════════════
-- 1. PROFILES (extends Supabase auth.users)
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  phone TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'publisher', 'admin', 'affiliate')),
  is_verified BOOLEAN DEFAULT FALSE,
  bio TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
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
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ══════════════════════════════════════════════
-- 2. TAGS (for filtering travesías)
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT DEFAULT 'general' CHECK (category IN ('activity', 'location', 'feature', 'audience', 'general')),
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default tags
INSERT INTO public.tags (name, category) VALUES
  ('Paseo', 'activity'),
  ('Aventura', 'activity'),
  ('Pesca', 'activity'),
  ('Atardecer', 'activity'),
  ('Nocturno', 'activity'),
  ('Familiar', 'audience'),
  ('Parejas', 'audience'),
  ('Grupos', 'audience'),
  ('Corporativo', 'audience'),
  ('Río', 'location'),
  ('Mar', 'location'),
  ('Lago', 'location'),
  ('Delta', 'location'),
  ('Costa', 'location'),
  ('Naturaleza', 'feature'),
  ('Gastronomía', 'feature'),
  ('Navegación', 'feature'),
  ('Deportivo', 'feature'),
  ('Internacional', 'location')
ON CONFLICT (name) DO NOTHING;

-- ══════════════════════════════════════════════
-- 3. BOATS (embarcaciones de cada capitán)
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.boats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'velero' CHECK (type IN ('velero', 'catamaran', 'lancha', 'yate', 'otro')),
  length_m REAL,
  amenities TEXT,
  description TEXT,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════
-- 4. TRIPS (travesías)
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  captain_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  boat_id UUID REFERENCES public.boats(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  lat REAL,
  lng REAL,
  capacity INT DEFAULT 6,
  price_per_person REAL NOT NULL,
  currency TEXT DEFAULT 'ARS' CHECK (currency IN ('ARS', 'EUR', 'USD')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'rejected', 'archived')),
  rejection_reason TEXT,
  images TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════
-- 5. TRIP_DATES (fechas disponibles)
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.trip_dates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  available_spots INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════
-- 6. TRIP_ADDONS (extras / servicios adicionales)
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.trip_addons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL DEFAULT 0,
  max_quantity INT DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════
-- 7. BOOKINGS (reservas)
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  trip_date_id UUID REFERENCES public.trip_dates(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- Guest checkout fields (when user_id is null)
  guest_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  -- Reservation details
  quantity INT NOT NULL DEFAULT 1,
  subtotal REAL NOT NULL DEFAULT 0,
  addons_total REAL DEFAULT 0,
  discount REAL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'refunded')),
  -- Coupons & QR
  coupon_id UUID,
  qr_code_id UUID,
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════
-- 8. BOOKING_ADDONS (extras seleccionados)
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.booking_addons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  addon_id UUID REFERENCES public.trip_addons(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity INT DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════
-- 9. PAYMENTS (pagos via Mercado Pago)
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  mp_payment_id TEXT,
  mp_preference_id TEXT,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'ARS',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'refunded', 'in_process')),
  mp_response JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════
-- 10. REVIEWS (calificaciones post-experiencia)
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════
-- 11. COUPONS (cupones de descuento)
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT DEFAULT 'percentage' CHECK (type IN ('percentage', 'fixed')),
  value REAL NOT NULL,
  currency TEXT DEFAULT 'ARS',
  valid_from DATE,
  valid_until DATE,
  max_uses INT DEFAULT 100,
  current_uses INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════
-- 12. HOTELS (para sistema QR)
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.hotels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  commission_percent REAL DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════
-- 13. QR_CODES (códigos QR por hotel/zona)
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  zone TEXT NOT NULL,
  trip_filters TEXT[] DEFAULT '{}',
  valid_from DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT TRUE,
  scan_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK constraints to bookings now that coupons and qr_codes exist
ALTER TABLE public.bookings 
  ADD CONSTRAINT fk_booking_coupon FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE SET NULL;
ALTER TABLE public.bookings 
  ADD CONSTRAINT fk_booking_qr FOREIGN KEY (qr_code_id) REFERENCES public.qr_codes(id) ON DELETE SET NULL;


-- ══════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ══════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- ── Profiles ──
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ── Tags ──
CREATE POLICY "Tags are viewable by everyone" ON public.tags
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage tags" ON public.tags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Boats ──
CREATE POLICY "Published boat info is viewable by everyone" ON public.boats
  FOR SELECT USING (is_active = true);

CREATE POLICY "Owners can manage their own boats" ON public.boats
  FOR ALL USING (auth.uid() = owner_id);

-- ── Trips ──
CREATE POLICY "Published trips are viewable by everyone" ON public.trips
  FOR SELECT USING (status = 'published');

CREATE POLICY "Captains can view their own trips (any status)" ON public.trips
  FOR SELECT USING (auth.uid() = captain_id);

CREATE POLICY "Captains can create trips" ON public.trips
  FOR INSERT WITH CHECK (auth.uid() = captain_id);

CREATE POLICY "Captains can update their own trips" ON public.trips
  FOR UPDATE USING (auth.uid() = captain_id);

CREATE POLICY "Admins can manage all trips" ON public.trips
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Trip Dates ──
CREATE POLICY "Active trip dates are viewable via published trips" ON public.trip_dates
  FOR SELECT USING (
    is_active = true AND EXISTS (
      SELECT 1 FROM public.trips WHERE id = trip_id AND status = 'published'
    )
  );

CREATE POLICY "Captains can manage dates for their trips" ON public.trip_dates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.trips WHERE id = trip_id AND captain_id = auth.uid())
  );

-- ── Trip Addons ──
CREATE POLICY "Active addons are viewable via published trips" ON public.trip_addons
  FOR SELECT USING (
    is_active = true AND EXISTS (
      SELECT 1 FROM public.trips WHERE id = trip_id AND status = 'published'
    )
  );

CREATE POLICY "Captains can manage addons for their trips" ON public.trip_addons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.trips WHERE id = trip_id AND captain_id = auth.uid())
  );

-- ── Bookings ──
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Captains can view bookings for their trips" ON public.bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.trips WHERE id = trip_id AND captain_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage all bookings" ON public.bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Booking Addons ──
CREATE POLICY "Users can view addons of their bookings" ON public.booking_addons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND user_id = auth.uid())
  );

CREATE POLICY "Anyone can insert booking addons" ON public.booking_addons
  FOR INSERT WITH CHECK (true);

-- ── Payments ──
CREATE POLICY "Users can view their own payments" ON public.payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all payments" ON public.payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can insert payments" ON public.payments
  FOR INSERT WITH CHECK (true);

-- ── Reviews ──
CREATE POLICY "Published reviews are viewable by everyone" ON public.reviews
  FOR SELECT USING (is_published = true);

CREATE POLICY "Users can create reviews for their bookings" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- ── Coupons ──
CREATE POLICY "Active coupons are viewable by everyone" ON public.coupons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all coupons" ON public.coupons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── Hotels ──
CREATE POLICY "Active hotels are viewable by everyone" ON public.hotels
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage hotels" ON public.hotels
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── QR Codes ──
CREATE POLICY "Active QR codes are viewable by everyone" ON public.qr_codes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage QR codes" ON public.qr_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );


-- ══════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ══════════════════════════════════════════════

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_boats_updated_at
  BEFORE UPDATE ON public.boats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Reduce available spots when booking is confirmed
CREATE OR REPLACE FUNCTION public.handle_booking_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    UPDATE public.trip_dates
    SET available_spots = available_spots - NEW.quantity
    WHERE id = NEW.trip_date_id;
  END IF;
  
  -- Restore spots if cancelled
  IF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
    UPDATE public.trip_dates
    SET available_spots = available_spots + NEW.quantity
    WHERE id = NEW.trip_date_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_booking_status_change
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_booking_confirmed();

-- Increment coupon usage on booking
CREATE OR REPLACE FUNCTION public.handle_coupon_used()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.coupon_id IS NOT NULL AND NEW.status = 'confirmed' THEN
    UPDATE public.coupons
    SET current_uses = current_uses + 1
    WHERE id = NEW.coupon_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_coupon_used
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_coupon_used();

-- Increment QR scan count
CREATE OR REPLACE FUNCTION public.handle_qr_scan()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qr_code_id IS NOT NULL THEN
    UPDATE public.qr_codes
    SET scan_count = scan_count + 1
    WHERE id = NEW.qr_code_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_qr_booking
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_qr_scan();


-- ══════════════════════════════════════════════
-- INDEXES for performance
-- ══════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_captain ON public.trips(captain_id);
CREATE INDEX IF NOT EXISTS idx_trips_location ON public.trips(location);
CREATE INDEX IF NOT EXISTS idx_trip_dates_trip ON public.trip_dates(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_dates_date ON public.trip_dates(date);
CREATE INDEX IF NOT EXISTS idx_bookings_trip ON public.bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_reviews_trip ON public.reviews(trip_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id);


-- ══════════════════════════════════════════════
-- STORAGE BUCKETS
-- ══════════════════════════════════════════════
-- Run these separately in SQL editor if needed:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('trip-images', 'trip-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('boat-images', 'boat-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
