
ALTER TABLE public.work_settings
ADD COLUMN show_brand_name boolean NOT NULL DEFAULT true,
ADD COLUMN logo_size integer NOT NULL DEFAULT 80;
