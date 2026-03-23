
ALTER TABLE public.work_settings ALTER COLUMN hero_title SET DEFAULT NULL;
ALTER TABLE public.work_settings ALTER COLUMN hero_subtitle SET DEFAULT NULL;

UPDATE public.work_settings
SET hero_title = NULL
WHERE hero_title = 'Manicures De Sucesso';

UPDATE public.work_settings
SET hero_subtitle = NULL
WHERE hero_subtitle = 'Plataforma profissional para agendamentos premium';
