
CREATE POLICY "Tenant admins can delete any review in tenant"
ON public.reviews
FOR DELETE
USING (is_tenant_admin(auth.uid(), tenant_id));
