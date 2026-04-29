-- ============================================
-- ELIMINAR POLÍTICAS RECURSIVAS ESPECÍFICAS
-- Ejecutar en Supabase → SQL Editor → Run
-- ============================================

-- Esta es la que causa la recursión infinita en profiles
DROP POLICY IF EXISTS "Teachers can read all profiles" ON profiles;

-- Estas también hacen subqueries a profiles, amplificando el problema
DROP POLICY IF EXISTS "Admins can manage all trips" ON trips;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Verificar que solo quedan las políticas limpias
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE tablename IN ('profiles', 'trips', 'boats', 'trip_dates')
ORDER BY tablename, policyname;
