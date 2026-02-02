-- Fix: Make user_id NOT NULL to prevent anonymous bookings
-- This ensures all bookings are tied to an authenticated user

-- First, delete any anonymous bookings (if any exist)
DELETE FROM public.bookings WHERE user_id IS NULL;

-- Now alter the column to be NOT NULL
ALTER TABLE public.bookings ALTER COLUMN user_id SET NOT NULL;