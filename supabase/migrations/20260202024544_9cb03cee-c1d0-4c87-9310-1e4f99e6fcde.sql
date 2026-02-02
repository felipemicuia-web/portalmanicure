-- Corrigir função com search_path definido para segurança
DROP FUNCTION IF EXISTS public.get_public_gallery_photos(integer);

CREATE OR REPLACE FUNCTION public.get_public_gallery_photos(limit_count integer DEFAULT 50)
RETURNS TABLE(id uuid, image_url text, caption text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT gp.id, gp.image_url, gp.caption, gp.created_at
  FROM public.gallery_photos gp
  ORDER BY gp.created_at DESC
  LIMIT limit_count;
$$;