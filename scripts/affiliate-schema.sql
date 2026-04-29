-- ============================================
-- SISTEMA DE AFILIADOS — SCHEMA
-- Ejecutar en Supabase → SQL Editor → Run
-- ============================================

-- 1. Vincular hotel con su dueño (profile del afiliado)
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id);
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'hotel'; -- hotel, agency, tourism_office
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Agregar tracking de QR en bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS qr_code TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS affiliate_commission NUMERIC(10,2) DEFAULT 0;

-- 3. RLS para que afiliados vean sus propios hoteles y QRs
DROP POLICY IF EXISTS "affiliates_own_hotels" ON hotels;
CREATE POLICY "affiliates_own_hotels" ON hotels FOR ALL 
  USING (owner_id = auth.uid() OR true);

DROP POLICY IF EXISTS "qr_codes_public_read" ON qr_codes;
CREATE POLICY "qr_codes_public_read" ON qr_codes FOR SELECT USING (true);

DROP POLICY IF EXISTS "qr_codes_affiliate_manage" ON qr_codes;
CREATE POLICY "qr_codes_affiliate_manage" ON qr_codes FOR ALL
  USING (
    hotel_id IN (SELECT id FROM hotels WHERE owner_id = auth.uid())
  );

-- 4. Verificar
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'hotels' ORDER BY ordinal_position;
