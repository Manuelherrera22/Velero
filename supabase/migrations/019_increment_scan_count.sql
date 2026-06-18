-- Atomic increment for QR scan count to avoid race conditions
CREATE OR REPLACE FUNCTION increment_scan_count(qr_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE qr_codes SET scan_count = COALESCE(scan_count, 0) + 1 WHERE id = qr_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
