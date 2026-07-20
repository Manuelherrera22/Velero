-- Add support for experience-based gift cards

-- 1. Drop the strict amount constraint (if it exists) so we can have custom amounts
ALTER TABLE gift_cards DROP CONSTRAINT IF EXISTS gift_cards_amount_check;

-- 2. Add the new columns
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES trips(id);
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS guests INTEGER;
ALTER TABLE gift_cards ADD COLUMN IF NOT EXISTS is_experience_based BOOLEAN DEFAULT FALSE;
