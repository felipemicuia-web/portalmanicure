
CREATE OR REPLACE FUNCTION public.get_user_emails_for_tenant(p_tenant_id uuid)
RETURNS TABLE(user_id uuid, email text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT p.user_id, u.email::text
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE p.tenant_id = p_tenant_id
    AND (
      public.is_tenant_admin(auth.uid(), p_tenant_id)
      OR public.is_superadmin(auth.uid())
    );
$$;
