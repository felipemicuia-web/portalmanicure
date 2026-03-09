
-- FINAL SECURITY CORRECTION: disable self-join backend helper
-- Keep membership creation only through controlled admin/superadmin functions.

DROP FUNCTION IF EXISTS public.join_active_tenant(uuid);
