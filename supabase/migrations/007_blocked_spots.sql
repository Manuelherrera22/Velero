-- 007_blocked_spots.sql
-- Add blocked_spots column to trip_dates for captain's offline sales management

ALTER TABLE public.trip_dates
ADD COLUMN IF NOT EXISTS blocked_spots INT DEFAULT 0;

-- Optional: We might want to ensure blocked_spots doesn't exceed available_spots. 
-- However, since available_spots represents total capacity from the wizard,
-- the available remaining is `available_spots - blocked_spots - booked_spots`.
-- The UI will handle the subtraction.
