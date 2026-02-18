
-- Add soft delete columns to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by uuid DEFAULT NULL;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_bookings_deleted_at ON public.bookings (deleted_at);

-- Drop existing admin delete policy (it currently allows hard delete for admins)
DROP POLICY IF EXISTS "Tenant admins can delete all bookings" ON public.bookings;

-- Only admins can hard delete bookings (for permanent deletion from trash)
CREATE POLICY "Tenant admins can hard delete bookings"
  ON public.bookings
  FOR DELETE
  USING (is_tenant_admin(auth.uid(), tenant_id) AND deleted_at IS NOT NULL);
