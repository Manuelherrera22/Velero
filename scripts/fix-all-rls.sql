-- ============================================
-- FIX COMPLETO DE RLS PARA KAILU
-- Ejecutar en Supabase → SQL Editor → Run
-- ============================================

-- ─── PROFILES ───
DROP POLICY IF EXISTS "profiles_public_read" ON profiles;
DROP POLICY IF EXISTS "profiles_self_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON profiles;

CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_self_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_self_update" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ─── BOATS (lectura pública necesaria para mostrar info del barco) ───
ALTER TABLE boats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "boats_public_read" ON boats;
CREATE POLICY "boats_public_read" ON boats FOR SELECT USING (true);

-- ─── TRIPS (lectura pública de trips publicados) ───
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trips_public_read" ON trips;
CREATE POLICY "trips_public_read" ON trips FOR SELECT USING (true);

-- ─── TRIP_DATES (lectura pública de fechas activas) ───
ALTER TABLE trip_dates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trip_dates_public_read" ON trip_dates;
CREATE POLICY "trip_dates_public_read" ON trip_dates FOR SELECT USING (true);

-- ─── TRIP_ADDONS (lectura pública) ───
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'trip_addons') THEN
    ALTER TABLE trip_addons ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "trip_addons_public_read" ON trip_addons;
    EXECUTE 'CREATE POLICY "trip_addons_public_read" ON trip_addons FOR SELECT USING (true)';
  END IF;
END $$;

-- ─── REVIEWS (lectura pública) ───
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews') THEN
    ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "reviews_public_read" ON reviews;
    EXECUTE 'CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (true)';
  END IF;
END $$;

-- Verificar que los trips existen
SELECT id, title, status, array_length(images, 1) as img_count FROM trips WHERE status = 'published';
