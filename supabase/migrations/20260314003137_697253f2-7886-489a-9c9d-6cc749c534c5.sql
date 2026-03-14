
CREATE TABLE public.logo_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  file_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.logo_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Logo history is viewable by tenant admins"
  ON public.logo_history FOR SELECT TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can insert logo history"
  ON public.logo_history FOR INSERT TO authenticated
  WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can delete logo history"
  ON public.logo_history FOR DELETE TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id));
