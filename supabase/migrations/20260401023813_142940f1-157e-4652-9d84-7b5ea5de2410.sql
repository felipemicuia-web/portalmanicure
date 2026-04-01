
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS advance_payment_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS advance_payment_percentage integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS advance_payment_message text;
