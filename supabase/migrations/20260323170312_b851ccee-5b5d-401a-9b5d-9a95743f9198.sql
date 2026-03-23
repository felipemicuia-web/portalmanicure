
-- Add email column to professionals table
ALTER TABLE public.professionals ADD COLUMN email text DEFAULT NULL;

-- Create index for fast lookups by email+tenant
CREATE UNIQUE INDEX idx_professionals_email_tenant 
ON public.professionals (tenant_id, email) 
WHERE email IS NOT NULL;

-- RPC to get professional linked to a user's email in a specific tenant
CREATE OR REPLACE FUNCTION public.get_professional_by_user_email(p_user_email text, p_tenant_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id
  FROM public.professionals
  WHERE email = p_user_email
    AND tenant_id = p_tenant_id
    AND active = true
  LIMIT 1;
$$;
