
CREATE TABLE public.trial_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  full_name text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  whatsapp text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.trial_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert trial leads"
  ON public.trial_leads
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Superadmins can view trial leads"
  ON public.trial_leads
  FOR SELECT
  TO authenticated
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can delete trial leads"
  ON public.trial_leads
  FOR DELETE
  TO authenticated
  USING (is_superadmin(auth.uid()));
