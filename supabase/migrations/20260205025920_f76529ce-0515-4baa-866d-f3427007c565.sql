-- Adiciona coluna para dias de trabalho (array de inteiros: 0=domingo, 1=segunda, ..., 6=sábado)
ALTER TABLE public.work_settings
ADD COLUMN working_days integer[] NOT NULL DEFAULT ARRAY[1, 2, 3, 4, 5, 6];