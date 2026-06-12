-- ============================================
-- KAILU PLATFORM — Migration 015
-- Column-Level Security for Profiles (Zekro Audit)
-- ============================================

-- 1. Revoke default SELECT privilege on profiles table from the public anonymous role
REVOKE SELECT ON public.profiles FROM anon;

-- 2. Grant SELECT privilege only on safe, public columns to the anonymous role
-- This allows guests/non-authenticated users to view captains' public cards
-- while completely blocking access to email, phone, bank_alias, bank_holder,
-- nautical_license_url, and captain_commission_rate.
GRANT SELECT (
  id,
  full_name,
  avatar_url,
  role,
  is_verified,
  bio,
  location,
  languages,
  business_name,
  business_location,
  created_at,
  updated_at
) ON public.profiles TO anon;
