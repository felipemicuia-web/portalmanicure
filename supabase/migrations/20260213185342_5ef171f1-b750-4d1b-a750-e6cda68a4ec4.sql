
ALTER TABLE public.work_settings
ADD COLUMN site_name text DEFAULT 'Agendamento',
ADD COLUMN site_subtitle text DEFAULT 'Agende seu horário',
ADD COLUMN logo_url text DEFAULT NULL;
