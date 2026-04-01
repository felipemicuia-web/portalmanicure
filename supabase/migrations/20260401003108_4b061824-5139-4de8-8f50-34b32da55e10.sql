
-- Table for payment methods configured by tenant admin
CREATE TABLE public.tenant_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.tenant_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payment methods are public readable"
  ON public.tenant_payment_methods FOR SELECT TO public
  USING (true);

CREATE POLICY "Tenant admins can insert payment methods"
  ON public.tenant_payment_methods FOR INSERT TO authenticated
  WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can update payment methods"
  ON public.tenant_payment_methods FOR UPDATE TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can delete payment methods"
  ON public.tenant_payment_methods FOR DELETE TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id));

-- updated_at trigger
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.tenant_payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
