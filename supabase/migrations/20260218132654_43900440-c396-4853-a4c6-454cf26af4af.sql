
-- Create a secure function for cascading hard delete of bookings
CREATE OR REPLACE FUNCTION public.hard_delete_booking(p_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_deleted_at timestamptz;
BEGIN
  -- Verify the booking exists, is soft-deleted, and get tenant
  SELECT tenant_id, deleted_at INTO v_tenant_id, v_deleted_at
  FROM public.bookings
  WHERE id = p_booking_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_deleted_at IS NULL THEN
    RAISE EXCEPTION 'Booking must be in trash before permanent deletion';
  END IF;

  -- Verify caller is tenant admin
  IF NOT public.is_tenant_admin(auth.uid(), v_tenant_id) THEN
    RAISE EXCEPTION 'Only admins can permanently delete bookings';
  END IF;

  -- Delete related records first
  DELETE FROM public.booking_services WHERE booking_id = p_booking_id;
  DELETE FROM public.coupon_usage WHERE booking_id = p_booking_id;
  DELETE FROM public.admin_notifications WHERE booking_id = p_booking_id;

  -- Delete the booking
  DELETE FROM public.bookings WHERE id = p_booking_id;
END;
$$;
