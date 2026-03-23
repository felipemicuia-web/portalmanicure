ALTER TABLE public.professionals
ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE INDEX IF NOT EXISTS idx_professionals_tenant_user_id
ON public.professionals (tenant_id, user_id)
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_professionals_tenant_user_id
ON public.professionals (tenant_id, user_id)
WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.get_my_linked_professional(p_tenant_id uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE
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

CREATE OR REPLACE FUNCTION public.professional_can_access_booking(p_professional_id uuid, p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.professionals p
    LEFT JOIN auth.users u ON u.id = auth.uid()
    WHERE p.id = p_professional_id
      AND p.tenant_id = p_tenant_id
      AND p.active = true
      AND (
        p.user_id = auth.uid()
        OR (
          u.email IS NOT NULL
          AND p.email IS NOT NULL
          AND lower(trim(p.email)) = lower(trim(u.email))
        )
      )
  );
$$;

DROP POLICY IF EXISTS "Professionals can view own bookings" ON public.bookings;

CREATE POLICY "Professionals can view own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (public.professional_can_access_booking(professional_id, tenant_id));