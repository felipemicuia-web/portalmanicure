
-- Create tenant_location_settings table
CREATE TABLE public.tenant_location_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  title text NOT NULL DEFAULT 'Nossa Localização',
  address text NOT NULL DEFAULT '',
  google_maps_url text NOT NULL DEFAULT '',
  embed_url text NOT NULL DEFAULT '',
  description text,
  button_text text NOT NULL DEFAULT 'Ver no Google Maps',
  open_in_new_tab boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id)
);

-- Enable RLS
ALTER TABLE public.tenant_location_settings ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Location settings are public readable"
  ON public.tenant_location_settings FOR SELECT
  TO public
  USING (true);

-- Admin insert
CREATE POLICY "Tenant admins can insert location settings"
  ON public.tenant_location_settings FOR INSERT
  TO authenticated
  WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

-- Admin update
CREATE POLICY "Tenant admins can update location settings"
  ON public.tenant_location_settings FOR UPDATE
  TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

-- Admin delete
CREATE POLICY "Tenant admins can delete location settings"
  ON public.tenant_location_settings FOR DELETE
  TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id));
