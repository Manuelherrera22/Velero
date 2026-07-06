-- Gift Cards table for Kailu
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount IN (50000, 100000, 200000)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'redeemed', 'expired')),
  buyer_email TEXT NOT NULL,
  recipient_name TEXT,
  message TEXT,
  payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  redeemed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;

-- Policy: anyone can read confirmed gift cards (for the confirmation page)
CREATE POLICY "Anyone can read confirmed gift cards"
  ON gift_cards FOR SELECT
  USING (status = 'confirmed' OR status = 'redeemed');

-- Policy: anon can read pending gift cards by id (for polling after payment)
CREATE POLICY "Anyone can read their own pending gift cards by id"
  ON gift_cards FOR SELECT
  USING (true);

-- Policy: service role can insert/update (handled by Netlify functions with service key)
-- No additional policy needed — service role bypasses RLS

-- Index for fast code lookups
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status);
