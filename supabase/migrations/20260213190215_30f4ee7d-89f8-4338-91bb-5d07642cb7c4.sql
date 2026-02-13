ALTER TABLE public.work_settings ADD COLUMN logo_display_mode text NOT NULL DEFAULT 'icon';
-- 'icon' = small logo + text (current), 'banner' = full-width header image