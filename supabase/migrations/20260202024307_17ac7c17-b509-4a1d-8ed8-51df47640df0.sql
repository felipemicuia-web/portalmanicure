-- 1. Atualizar política de gallery_photos para não expor user_id em SELECT público
-- Remover política atual e criar uma mais segura

DROP POLICY IF EXISTS "Gallery photos are viewable by everyone" ON public.gallery_photos;

-- Criar uma view segura que não expõe user_id para leitura pública
CREATE OR REPLACE VIEW public.gallery_photos_public AS
SELECT id, image_url, caption, created_at
FROM public.gallery_photos;

-- Política para usuários visualizarem apenas suas próprias fotos com user_id
CREATE POLICY "Users can view their own gallery photos with full details"
ON public.gallery_photos
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Política para leitura pública sem expor user_id (via aplicação, não diretamente da tabela)
-- A leitura pública será feita através da view gallery_photos_public

-- 2. Para a tabela bookings, os dados já estão protegidos por RLS
-- Vamos adicionar uma camada extra de segurança criando uma função para validar telefone

CREATE OR REPLACE FUNCTION public.validate_phone_format(phone text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Valida formato de telefone brasileiro (pelo menos 10 dígitos numéricos)
  RETURN phone ~ '^[0-9]{10,15}$' OR phone ~ '^\+?[0-9\s\-\(\)]{10,20}$';
END;
$$;

-- Adicionar constraint de validação via trigger (mais flexível que CHECK)
CREATE OR REPLACE FUNCTION public.validate_booking_phone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove caracteres não numéricos para validação
  IF NOT public.validate_phone_format(NEW.client_phone) THEN
    RAISE EXCEPTION 'Formato de telefone inválido. Use apenas números (10-15 dígitos).';
  END IF;
  RETURN NEW;
END;
$$;

-- Criar trigger para validar telefone antes de inserir/atualizar
DROP TRIGGER IF EXISTS validate_booking_phone_trigger ON public.bookings;
CREATE TRIGGER validate_booking_phone_trigger
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.validate_booking_phone();

-- Mesmo para profiles
CREATE OR REPLACE FUNCTION public.validate_profile_phone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Permite telefone nulo, mas se preenchido, valida formato
  IF NEW.phone IS NOT NULL AND NEW.phone != '' AND NOT public.validate_phone_format(NEW.phone) THEN
    RAISE EXCEPTION 'Formato de telefone inválido. Use apenas números (10-15 dígitos).';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_profile_phone_trigger ON public.profiles;
CREATE TRIGGER validate_profile_phone_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_profile_phone();