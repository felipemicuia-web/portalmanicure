-- Tabela para configurações de horário de trabalho
CREATE TABLE public.work_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  start_time time NOT NULL DEFAULT '09:00',
  end_time time NOT NULL DEFAULT '18:00',
  interval_minutes integer NOT NULL DEFAULT 10,
  lunch_start time DEFAULT NULL,
  lunch_end time DEFAULT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Inserir configuração padrão
INSERT INTO public.work_settings (start_time, end_time, interval_minutes, lunch_start, lunch_end)
VALUES ('09:00', '18:00', 10, '12:00', '13:00');

-- RLS: Todos podem ver as configurações
ALTER TABLE public.work_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view work settings"
ON public.work_settings
FOR SELECT
USING (true);

-- Somente admins podem atualizar
CREATE POLICY "Admins can update work settings"
ON public.work_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert work settings"
ON public.work_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));