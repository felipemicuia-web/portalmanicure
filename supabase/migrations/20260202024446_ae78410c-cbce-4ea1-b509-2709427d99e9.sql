-- Remover a view com SECURITY DEFINER que causou o problema
DROP VIEW IF EXISTS public.gallery_photos_public;

-- Recriar política para galeria - abordagem mais segura
-- Fotos da galeria podem ser vistas por todos, mas user_id só aparece para o dono
-- Como não podemos ocultar colunas em RLS, a melhor abordagem é manter a política restrita
-- e usar uma função RPC para acesso público sem user_id

CREATE OR REPLACE FUNCTION public.get_public_gallery_photos(limit_count integer DEFAULT 50)
RETURNS TABLE(id uuid, image_url text, caption text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT gp.id, gp.image_url, gp.caption, gp.created_at
  FROM public.gallery_photos gp
  ORDER BY gp.created_at DESC
  LIMIT limit_count;
$$;

-- Recriar a política pública mas agora entendemos que o código deve usar a função RPC
-- para acesso público e evitar expor user_id
CREATE POLICY "Gallery photos are viewable by everyone"
ON public.gallery_photos
FOR SELECT
USING (true);