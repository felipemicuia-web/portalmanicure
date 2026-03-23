CREATE POLICY "Professionals can view own booking services"
ON public.booking_services
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = booking_services.booking_id
      AND b.tenant_id = booking_services.tenant_id
      AND public.professional_can_access_booking(b.professional_id, b.tenant_id)
  )
);