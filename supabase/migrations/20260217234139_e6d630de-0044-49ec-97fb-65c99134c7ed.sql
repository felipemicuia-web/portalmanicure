-- Partial unique index: prevents two non-cancelled bookings for same professional/date/time
CREATE UNIQUE INDEX idx_unique_booking_slot 
ON public.bookings (professional_id, booking_date, booking_time) 
WHERE (status != 'cancelled');

-- Enable realtime for bookings table so clients can see slot changes instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;