CREATE INDEX IF NOT EXISTS idx_professionals_tenant_email_normalized
ON public.professionals (tenant_id, lower(trim(email)))
WHERE email IS NOT NULL AND active = true;

CREATE OR REPLACE FUNCTION public.get_professional_by_user_email(p_user_email text, p_tenant_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.id
  FROM public.professionals p
  WHERE p.tenant_id = p_tenant_id
    AND p.active = true
    AND p.email IS NOT NULL
    AND p_user_email IS NOT NULL
    AND lower(trim(p.email)) = lower(trim(p_user_email))
  ORDER BY p.created_at ASC
  LIMIT 1;
$$;