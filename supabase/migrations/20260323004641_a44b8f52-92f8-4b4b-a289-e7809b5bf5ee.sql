-- 1. Replace is_following to accept tenant_id
CREATE OR REPLACE FUNCTION public.is_following(p_user_id uuid, p_professional_id uuid, p_tenant_id uuid DEFAULT NULL)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.followers
    WHERE user_id = p_user_id
      AND professional_id = p_professional_id
      AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id)
  );
$$;

-- 2. Replace get_average_rating to accept tenant_id
CREATE OR REPLACE FUNCTION public.get_average_rating(p_professional_id uuid, p_tenant_id uuid DEFAULT NULL)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
  FROM public.reviews
  WHERE professional_id = p_professional_id
    AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id);
$$;

-- 3. Replace get_follower_count to accept tenant_id
CREATE OR REPLACE FUNCTION public.get_follower_count(p_professional_id uuid, p_tenant_id uuid DEFAULT NULL)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer
  FROM public.followers
  WHERE professional_id = p_professional_id
    AND (p_tenant_id IS NULL OR tenant_id = p_tenant_id);
$$;

-- 4. Remove public SELECT on coupons and replace with tenant-scoped policy
DROP POLICY IF EXISTS "Coupons are public" ON public.coupons;

CREATE POLICY "Tenant members can view coupons"
  ON public.coupons FOR SELECT
  TO authenticated
  USING (
    user_has_profile_in_tenant(auth.uid(), tenant_id)
    OR is_tenant_admin(auth.uid(), tenant_id)
    OR is_superadmin(auth.uid())
  );