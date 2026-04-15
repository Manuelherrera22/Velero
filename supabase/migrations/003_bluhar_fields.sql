-- ============================================
-- VELERO PLATFORM — Migration 003
-- Bluhar Database Architecture Integration
-- ============================================

-- 1. Extend profiles (Captain Languages)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';


-- 2. Extend boats (Specs & Equipment)
ALTER TABLE public.boats
ADD COLUMN IF NOT EXISTS manufacturer TEXT,
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS build_year INT,
ADD COLUMN IF NOT EXISTS capacity INT DEFAULT 6,
ADD COLUMN IF NOT EXISTS cabins INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS bathrooms INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS equipment TEXT[] DEFAULT '{}';


-- 3. Extend trips (Multi-currency, Pricing, Policies, Itinerary)
-- First, drop the old currency check constraint if it exists.
DO $$ 
BEGIN
    ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_currency_check;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Expand the allowed currencies
ALTER TABLE public.trips 
ADD CONSTRAINT trips_currency_check CHECK (currency IN ('ARS', 'EUR', 'USD', 'GBP', 'JPY', 'BRL', 'CNY'));

-- Add new pricing and numeric limits
ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS full_boat_price REAL,
ADD COLUMN IF NOT EXISTS allow_full_boat BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS min_passengers INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_passengers INT DEFAULT 6;

-- Add properties and policies
ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS pension_type TEXT,
ADD COLUMN IF NOT EXISTS included_services TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS excluded_services TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS allowed_payment_methods TEXT[] DEFAULT '{PayPal}',
ADD COLUMN IF NOT EXISTS cancellation_policy TEXT,
ADD COLUMN IF NOT EXISTS requires_full_payment BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS images_meta JSONB DEFAULT '{}', -- For categorized images {"portada": "url", "camarote": ["url1"]}
ADD COLUMN IF NOT EXISTS itinerary JSONB DEFAULT '[]', -- [{ day: 1, description: '' }]
ADD COLUMN IF NOT EXISTS role_in_activity TEXT DEFAULT 'capitan';


-- 4. Extend trip_dates (Date-specific pricing options)
ALTER TABLE public.trip_dates
ADD COLUMN IF NOT EXISTS price_per_person REAL,
ADD COLUMN IF NOT EXISTS full_boat_price REAL,
ADD COLUMN IF NOT EXISTS allow_full_boat BOOLEAN DEFAULT FALSE;

-- End of File
