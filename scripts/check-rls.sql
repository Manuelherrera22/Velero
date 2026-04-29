-- Verificar RLS en todas las tablas relevantes y las políticas
-- Pegar en Supabase SQL Editor → Run

-- 1. Ver políticas de boats
SELECT tablename, policyname, cmd, qual::text FROM pg_policies 
WHERE tablename IN ('boats', 'trips', 'trip_dates', 'profiles')
ORDER BY tablename, policyname;
