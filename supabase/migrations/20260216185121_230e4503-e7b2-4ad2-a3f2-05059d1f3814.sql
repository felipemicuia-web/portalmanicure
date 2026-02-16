
-- Add blocked column to profiles
ALTER TABLE public.profiles ADD COLUMN blocked boolean NOT NULL DEFAULT false;

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
