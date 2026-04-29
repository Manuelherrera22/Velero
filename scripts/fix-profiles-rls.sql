-- Fix: Políticas RLS para profiles (eliminar recursión)
-- Pegar en Supabase → SQL Editor → Run

-- 1. Eliminar todas las políticas existentes de profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;

-- 2. Asegurar RLS habilitado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas limpias (sin recursión)

-- Lectura: cualquiera puede ver perfiles (necesario para mostrar nombre/avatar del capitán)
CREATE POLICY "profiles_public_read"
ON profiles FOR SELECT
USING (true);

-- Inserción: solo el propio usuario
CREATE POLICY "profiles_self_insert"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Actualización: solo el propio usuario
CREATE POLICY "profiles_self_update"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
