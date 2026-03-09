
-- Drop old function signature (had DEFAULT NULL on p_owner_user_id)
DROP FUNCTION IF EXISTS public.onboard_tenant(text, text, uuid, text);

-- Recreate with p_owner_user_id required (no default)
CREATE OR REPLACE FUNCTION public.onboard_tenant(
  p_name text,
  p_slug text,
  p_owner_user_id uuid,
  p_custom_domain text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_tenant_id uuid;
  v_owner_exists boolean;
BEGIN
  IF NOT public.is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Only superadmins can create tenants';
  END IF;

  IF p_slug IS NULL OR p_slug = '' THEN
    RAISE EXCEPTION 'Slug is required';
  END IF;

  IF p_name IS NULL OR p_name = '' THEN
    RAISE EXCEPTION 'Name is required';
  END IF;

  IF p_owner_user_id IS NULL THEN
    RAISE EXCEPTION 'Owner user ID is required. Every tenant must have an owner.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = p_owner_user_id
  ) INTO v_owner_exists;

  IF NOT v_owner_exists THEN
    RAISE EXCEPTION 'Owner user ID does not exist in the system';
  END IF;

  IF p_slug !~ '^[a-z0-9][a-z0-9_-]{1,48}[a-z0-9]$' THEN
    RAISE EXCEPTION 'Invalid slug format. Use 3-50 lowercase chars: a-z, 0-9, hyphens, underscores. Must start and end with alphanumeric.';
  END IF;

  IF p_slug IN ('admin', 'app', 'api', 'www', 'platform', 'auth', 'login', 'signup', 'register', 'dashboard', 'settings', 'system', 'superadmin', 'root', 'null', 'undefined') THEN
    RAISE EXCEPTION 'This slug is reserved and cannot be used';
  END IF;

  IF p_custom_domain IS NOT NULL THEN
    p_custom_domain := lower(trim(p_custom_domain));
    IF p_custom_domain = '' THEN
      p_custom_domain := NULL;
    END IF;
  END IF;

  INSERT INTO public.tenants (name, slug, custom_domain, status, active)
  VALUES (p_name, p_slug, p_custom_domain, 'active', true)
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.work_settings (tenant_id) VALUES (v_tenant_id);

  INSERT INTO public.tenant_users (tenant_id, user_id, role, status)
  VALUES (v_tenant_id, p_owner_user_id, 'owner', 'active');

  INSERT INTO public.profiles (user_id, tenant_id)
  VALUES (p_owner_user_id, v_tenant_id)
  ON CONFLICT DO NOTHING;

  RETURN v_tenant_id;
END;
$function$;
