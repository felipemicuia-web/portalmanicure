
-- =============================================
-- SUPERADMIN / PLATFORM ARCHITECTURE
-- =============================================

-- 1. Table: platform_admins (superadmin global)
-- Separate table so no user can self-promote via client
CREATE TABLE IF NOT EXISTS public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.platform_admins IS 'Global superadmins who can manage all tenants. Insert via SQL only.';

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- 2. Function: is_superadmin()
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins WHERE user_id = _user_id
  );
$$;

-- 3. RLS on platform_admins: only superadmins can read, nobody can write via client
CREATE POLICY "Superadmins can view platform_admins"
  ON public.platform_admins FOR SELECT
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- No INSERT/UPDATE/DELETE policies = no client writes allowed

-- 4. Table: dashboards
CREATE TABLE IF NOT EXISTS public.dashboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_by uuid NOT NULL,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
COMMENT ON COLUMN public.dashboards.tenant_id IS 'NULL = global/platform dashboard; set = tenant-specific dashboard';

ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_dashboards_tenant_id ON public.dashboards(tenant_id);

-- 5. Table: dashboard_widgets
CREATE TABLE IF NOT EXISTS public.dashboard_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id uuid NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
  type text NOT NULL,
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  position_json jsonb NOT NULL DEFAULT '{"x":0,"y":0,"w":6,"h":4}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_dashboard_widgets_dashboard_id ON public.dashboard_widgets(dashboard_id);

-- =============================================
-- RLS POLICIES FOR DASHBOARDS
-- =============================================

-- SELECT: superadmin sees all; tenant admin sees own tenant dashboards
CREATE POLICY "Superadmins can view all dashboards"
  ON public.dashboards FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Tenant admins can view own dashboards"
  ON public.dashboards FOR SELECT TO authenticated
  USING (
    tenant_id IS NOT NULL
    AND public.is_tenant_admin(auth.uid(), tenant_id)
  );

-- INSERT: superadmin can create any; tenant admin only for own tenant
CREATE POLICY "Superadmins can create any dashboard"
  ON public.dashboards FOR INSERT TO authenticated
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Tenant admins can create own dashboards"
  ON public.dashboards FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IS NOT NULL
    AND public.is_tenant_admin(auth.uid(), tenant_id)
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

-- UPDATE
CREATE POLICY "Superadmins can update any dashboard"
  ON public.dashboards FOR UPDATE TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Tenant admins can update own dashboards"
  ON public.dashboards FOR UPDATE TO authenticated
  USING (
    tenant_id IS NOT NULL
    AND public.is_tenant_admin(auth.uid(), tenant_id)
  )
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- DELETE
CREATE POLICY "Superadmins can delete any dashboard"
  ON public.dashboards FOR DELETE TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Tenant admins can delete own dashboards"
  ON public.dashboards FOR DELETE TO authenticated
  USING (
    tenant_id IS NOT NULL
    AND public.is_tenant_admin(auth.uid(), tenant_id)
  );

-- =============================================
-- RLS POLICIES FOR DASHBOARD_WIDGETS
-- =============================================

-- Widgets follow their parent dashboard's access
CREATE POLICY "Superadmins can manage all widgets"
  ON public.dashboard_widgets FOR ALL TO authenticated
  USING (
    public.is_superadmin(auth.uid())
  )
  WITH CHECK (
    public.is_superadmin(auth.uid())
  );

CREATE POLICY "Tenant admins can view own widgets"
  ON public.dashboard_widgets FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.dashboards d
      WHERE d.id = dashboard_widgets.dashboard_id
        AND d.tenant_id IS NOT NULL
        AND public.is_tenant_admin(auth.uid(), d.tenant_id)
    )
  );

CREATE POLICY "Tenant admins can insert own widgets"
  ON public.dashboard_widgets FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dashboards d
      WHERE d.id = dashboard_widgets.dashboard_id
        AND d.tenant_id IS NOT NULL
        AND public.is_tenant_admin(auth.uid(), d.tenant_id)
    )
  );

CREATE POLICY "Tenant admins can update own widgets"
  ON public.dashboard_widgets FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.dashboards d
      WHERE d.id = dashboard_widgets.dashboard_id
        AND d.tenant_id IS NOT NULL
        AND public.is_tenant_admin(auth.uid(), d.tenant_id)
    )
  );

CREATE POLICY "Tenant admins can delete own widgets"
  ON public.dashboard_widgets FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.dashboards d
      WHERE d.id = dashboard_widgets.dashboard_id
        AND d.tenant_id IS NOT NULL
        AND public.is_tenant_admin(auth.uid(), d.tenant_id)
    )
  );

-- =============================================
-- SUPERADMIN: allow listing ALL tenants
-- =============================================
-- The existing policy "Anyone can view active tenants" already allows SELECT.
-- Add a policy for superadmins to also manage tenants (INSERT/DELETE)
CREATE POLICY "Superadmins can insert tenants"
  ON public.tenants FOR INSERT TO authenticated
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can delete tenants"
  ON public.tenants FOR DELETE TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can update any tenant"
  ON public.tenants FOR UPDATE TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

-- Superadmins can view all tenant_users
CREATE POLICY "Superadmins can view all tenant members"
  ON public.tenant_users FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- Superadmins can manage all tenant_users
CREATE POLICY "Superadmins can manage all tenant members"
  ON public.tenant_users FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

-- =============================================
-- BOOTSTRAP: How to create the first superadmin
-- =============================================
-- Run this SQL manually (replace with your user's UUID):
-- INSERT INTO public.platform_admins (user_id) VALUES ('YOUR-USER-UUID-HERE');
--
-- To find your user_id: SELECT id FROM auth.users WHERE email = 'your@email.com';
