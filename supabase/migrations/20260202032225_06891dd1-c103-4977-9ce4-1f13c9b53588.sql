-- 1. Fix gallery_photos public exposure - create a function to return photos without user_id
CREATE OR REPLACE FUNCTION public.get_public_gallery_photos(limit_count integer DEFAULT 50)
RETURNS TABLE(id uuid, image_url text, caption text, created_at timestamp with time zone)
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

-- 2. Add admin SELECT policy for profiles (for customer service)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));