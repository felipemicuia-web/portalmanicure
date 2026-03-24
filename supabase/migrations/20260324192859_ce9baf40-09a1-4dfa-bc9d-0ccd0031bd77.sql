
-- Create tenant_payment_settings table
CREATE TABLE public.tenant_payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  title text NOT NULL DEFAULT 'Pagamento Adiantado',
  description text NOT NULL DEFAULT '',
  payment_url text NOT NULL DEFAULT '',
  button_text text NOT NULL DEFAULT 'Pagar Agora',
  open_in_new_tab boolean NOT NULL DEFAULT true,
  warning_message text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id)
);

-- Enable RLS
ALTER TABLE public.tenant_payment_settings ENABLE ROW LEVEL SECURITY;

-- Public read (same pattern as work_settings)
CREATE POLICY "Payment settings are public readable"
  ON public.tenant_payment_settings
  FOR SELECT
  TO public
  USING (true);

-- Admin insert
CREATE POLICY "Tenant admins can insert payment settings"
  ON public.tenant_payment_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

-- Admin update
CREATE POLICY "Tenant admins can update payment settings"
  ON public.tenant_payment_settings
  FOR UPDATE
  TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

-- Admin delete
CREATE POLICY "Tenant admins can delete payment settings"
  ON public.tenant_payment_settings
  FOR DELETE
  TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id));

-- Auto-update updated_at trigger
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.tenant_payment_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
