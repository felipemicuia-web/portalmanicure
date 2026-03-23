
-- Drop existing policies on logo_history
DROP POLICY IF EXISTS "Logo history is viewable by tenant admins" ON public.logo_history;
DROP POLICY IF EXISTS "Tenant admins can delete logo history" ON public.logo_history;
DROP POLICY IF EXISTS "Tenant admins can insert logo history" ON public.logo_history;

-- Recreate with superadmin support
CREATE POLICY "Logo history is viewable by tenant admins"
  ON public.logo_history FOR SELECT TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));

CREATE POLICY "Tenant admins can delete logo history"
  ON public.logo_history FOR DELETE TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));

CREATE POLICY "Tenant admins can insert logo history"
  ON public.logo_history FOR INSERT TO authenticated
  WITH CHECK (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));
