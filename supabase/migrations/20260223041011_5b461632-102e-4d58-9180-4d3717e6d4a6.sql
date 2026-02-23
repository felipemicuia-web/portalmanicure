
ALTER TABLE public.work_settings
  ADD COLUMN IF NOT EXISTS hero_background_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS hero_title text DEFAULT 'Manicures De Sucesso',
  ADD COLUMN IF NOT EXISTS hero_subtitle text DEFAULT 'Plataforma profissional para agendamentos premium',
  ADD COLUMN IF NOT EXISTS hero_font text DEFAULT 'Playfair Display';
