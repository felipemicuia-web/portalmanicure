ALTER TABLE public.trial_leads ADD COLUMN status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.trial_leads ADD COLUMN notes text;
ALTER TABLE public.trial_leads ADD COLUMN updated_at timestamp with time zone NOT NULL DEFAULT now();

-- Allow superadmins to update trial leads
CREATE POLICY "Superadmins can update trial leads" ON public.trial_leads FOR UPDATE TO authenticated USING (is_superadmin(auth.uid())) WITH CHECK (is_superadmin(auth.uid()));