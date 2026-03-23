
-- Allow professionals to view bookings assigned to them
CREATE POLICY "Professionals can view own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = bookings.professional_id
      AND p.tenant_id = bookings.tenant_id
      AND p.active = true
      AND p.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);
