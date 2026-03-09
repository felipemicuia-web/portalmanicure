
-- =============================================================
-- Migration: Tenant status enum + enforcement + security hardening
-- =============================================================

-- 1. Add status column to tenants (active/inactive/suspended)
-- We keep the existing 'active' boolean for backwards compat but add a proper status
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Set status based on current active column
UPDATE public.tenants SET status = CASE WHEN active = true THEN 'active' ELSE 'inactive' END;

-- Add CHECK constraint for valid status values
ALTER TABLE public.tenants ADD CONSTRAINT tenants_status_check CHECK (status IN ('active', 'inactive', 'suspended'));

-- Keep active column synced via trigger
CREATE OR REPLACE FUNCTION public.sync_tenant_active_from_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.active = (NEW.status = 'active');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_tenant_active
  BEFORE INSERT OR UPDATE OF status ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_tenant_active_from_status();

-- 2. Create safe function to change tenant status (superadmin only)
CREATE OR REPLACE FUNCTION public.set_tenant_status(p_tenant_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Only superadmins can change tenant status';
  END IF;
  IF p_status NOT IN ('active', 'inactive', 'suspended') THEN
    RAISE EXCEPTION 'Invalid status. Must be: active, inactive, suspended';
  END IF;
  UPDATE public.tenants SET status = p_status, updated_at = now() WHERE id = p_tenant_id;
END;
$$;

-- 3. Create function to get tenant stats (superadmin only)
CREATE OR REPLACE FUNCTION public.get_tenant_stats(p_tenant_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result json;
BEGIN
  IF NOT public.is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Only superadmins can view tenant stats';
  END IF;

  SELECT json_build_object(
    'internal_users', (SELECT count(*) FROM public.tenant_users WHERE tenant_id = p_tenant_id AND status = 'active'),
    'total_profiles', (SELECT count(*) FROM public.profiles WHERE tenant_id = p_tenant_id),
    'total_bookings', (SELECT count(*) FROM public.bookings WHERE tenant_id = p_tenant_id AND deleted_at IS NULL),
    'owner_user_id', (SELECT user_id FROM public.tenant_users WHERE tenant_id = p_tenant_id AND role = 'owner' AND status = 'active' LIMIT 1)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 4. Update resolve_tenant to only resolve active tenants
CREATE OR REPLACE FUNCTION public.resolve_tenant(p_slug text DEFAULT NULL, p_domain text DEFAULT NULL)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM public.tenants
  WHERE status = 'active'
    AND (
      (p_slug IS NOT NULL AND slug = p_slug)
      OR (p_domain IS NOT NULL AND custom_domain = p_domain)
    )
  LIMIT 1;
$$;

-- 5. Update tenant SELECT policy to show only active tenants to public
DROP POLICY IF EXISTS "Anyone can view active tenants" ON public.tenants;
CREATE POLICY "Anyone can view active tenants"
  ON public.tenants FOR SELECT
  USING (status = 'active' OR is_superadmin(auth.uid()));

-- 6. Update bookings INSERT to also check tenant is active
DROP POLICY IF EXISTS "Clients can insert own bookings" ON public.bookings;
CREATE POLICY "Clients can insert own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND user_has_profile_in_tenant(auth.uid(), tenant_id)
    AND EXISTS (SELECT 1 FROM public.tenants WHERE id = tenant_id AND status = 'active')
  );

-- 7. Update profiles INSERT to check tenant is active
DROP POLICY IF EXISTS "Clients can insert own profile" ON public.profiles;
CREATE POLICY "Clients can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.tenants WHERE id = profiles.tenant_id AND status = 'active')
  );
