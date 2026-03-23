CREATE OR REPLACE FUNCTION public.get_my_linked_professional(p_tenant_id uuid)
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_professional_id uuid;
BEGIN
  IF v_user_id IS NULL OR p_tenant_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT lower(trim(u.email))
  INTO v_user_email
  FROM auth.users u
  WHERE u.id = v_user_id;

  -- Auto-link user_id when email matches
  IF v_user_email IS NOT NULL THEN
    UPDATE public.professionals p
    SET user_id = v_user_id
    WHERE p.tenant_id = p_tenant_id
      AND p.active = true
      AND p.user_id IS NULL
      AND p.email IS NOT NULL
      AND lower(trim(p.email)) = v_user_email;
  END IF;

  SELECT p.id
  INTO v_professional_id
  FROM public.professionals p
  WHERE p.tenant_id = p_tenant_id
    AND p.active = true
    AND (
      p.user_id = v_user_id
      OR (
        v_user_email IS NOT NULL
        AND p.email IS NOT NULL
        AND lower(trim(p.email)) = v_user_email
      )
    )
  ORDER BY CASE WHEN p.user_id = v_user_id THEN 0 ELSE 1 END, p.created_at ASC
  LIMIT 1;

  RETURN v_professional_id;
END;
$$;