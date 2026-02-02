-- Add photo_url column to professionals table
ALTER TABLE public.professionals 
ADD COLUMN photo_url TEXT DEFAULT NULL;