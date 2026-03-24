
-- Platform-level settings (key-value store for global config)
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read platform settings (footer link is public)
CREATE POLICY "Platform settings are public readable"
  ON public.platform_settings FOR SELECT
  TO public
  USING (true);

-- Only superadmins can manage
CREATE POLICY "Superadmins can insert platform settings"
  ON public.platform_settings FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can update platform settings"
  ON public.platform_settings FOR UPDATE
  TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can delete platform settings"
  ON public.platform_settings FOR DELETE
  TO authenticated
  USING (is_superadmin(auth.uid()));

-- Insert default footer settings
INSERT INTO public.platform_settings (key, value) VALUES
  ('footer_text', '© 2026 Agendamento Manicure'),
  ('footer_url', ''),
  ('footer_secondary_text', 'Sistema de agendamento online');
