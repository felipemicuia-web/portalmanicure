
CREATE TABLE public.tenant_popups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  title text,
  trigger_image_url text NOT NULL DEFAULT '',
  modal_image_url text,
  description text,
  button_text text,
  button_url text,
  open_button_in_new_tab boolean NOT NULL DEFAULT true,
  position text NOT NULL DEFAULT 'bottom',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_popups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Popup settings are public readable"
  ON public.tenant_popups FOR SELECT TO public
  USING (true);

CREATE POLICY "Tenant admins can insert popups"
  ON public.tenant_popups FOR INSERT TO authenticated
  WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can update popups"
  ON public.tenant_popups FOR UPDATE TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can delete popups"
  ON public.tenant_popups FOR DELETE TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id));

CREATE TRIGGER handle_tenant_popups_updated_at
  BEFORE UPDATE ON public.tenant_popups
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
