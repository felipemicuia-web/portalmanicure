-- Tabela de seguidores (usuários seguindo profissionais)
CREATE TABLE public.followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, professional_id)
);

-- Tabela de avaliações de profissionais
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, professional_id, booking_id)
);

-- Tabela para associar profissionais aos serviços que oferecem
CREATE TABLE public.professional_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (professional_id, service_id)
);

-- Adicionar campo de bio/descrição ao profissional
ALTER TABLE public.professionals 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS instagram text;

-- Enable RLS
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;

-- Políticas para followers
CREATE POLICY "Anyone can view followers count" ON public.followers
FOR SELECT USING (true);

CREATE POLICY "Users can follow professionals" ON public.followers
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow professionals" ON public.followers
FOR DELETE USING (auth.uid() = user_id);

-- Políticas para reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews
FOR SELECT USING (true);

CREATE POLICY "Users can create their own reviews" ON public.reviews
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.reviews
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON public.reviews
FOR DELETE USING (auth.uid() = user_id);

-- Políticas para professional_services
CREATE POLICY "Anyone can view professional services" ON public.professional_services
FOR SELECT USING (true);

CREATE POLICY "Admins can manage professional services" ON public.professional_services
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Função para obter contagem de seguidores
CREATE OR REPLACE FUNCTION public.get_follower_count(p_professional_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.followers
  WHERE professional_id = p_professional_id;
$$;

-- Função para verificar se usuário segue profissional
CREATE OR REPLACE FUNCTION public.is_following(p_user_id uuid, p_professional_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.followers
    WHERE user_id = p_user_id
      AND professional_id = p_professional_id
  );
$$;

-- Função para obter média de avaliação
CREATE OR REPLACE FUNCTION public.get_average_rating(p_professional_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
  FROM public.reviews
  WHERE professional_id = p_professional_id;
$$;