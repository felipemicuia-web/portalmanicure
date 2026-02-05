-- Criar tabela para datas bloqueadas por profissional (folgas, férias, etc)
CREATE TABLE public.professional_blocked_dates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(professional_id, blocked_date)
);

-- Adicionar coluna de dias de trabalho específicos para cada profissional
ALTER TABLE public.professionals 
ADD COLUMN working_days INTEGER[] DEFAULT NULL;

-- RLS para professional_blocked_dates
ALTER TABLE public.professional_blocked_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view blocked dates" 
ON public.professional_blocked_dates 
FOR SELECT USING (true);

CREATE POLICY "Admins can manage blocked dates" 
ON public.professional_blocked_dates 
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Comentários
COMMENT ON TABLE public.professional_blocked_dates IS 'Datas específicas em que cada profissional não trabalha';
COMMENT ON COLUMN public.professionals.working_days IS 'Dias da semana que o profissional trabalha (sobrescreve configuração global se definido)';