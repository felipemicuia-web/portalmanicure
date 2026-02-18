DROP POLICY IF EXISTS "Authenticated users can view active tenants"
ON public.tenants;

CREATE POLICY "Anyone can view active tenants"
ON public.tenants
FOR SELECT
TO anon, authenticated
USING (active = true);