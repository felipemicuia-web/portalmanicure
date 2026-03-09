
-- ============================================
-- Platform Stats Functions for Superadmin Console
-- ============================================

-- 1. Global platform statistics
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Only superadmins can view platform stats';
  END IF;

  RETURN json_build_object(
    'total_tenants', (SELECT count(*) FROM tenants),
    'active_tenants', (SELECT count(*) FROM tenants WHERE status = 'active'),
    'inactive_tenants', (SELECT count(*) FROM tenants WHERE status = 'inactive'),
    'suspended_tenants', (SELECT count(*) FROM tenants WHERE status = 'suspended'),
    'total_internal_users', (SELECT count(*) FROM tenant_users WHERE status = 'active'),
    'total_profiles', (SELECT count(*) FROM profiles),
    'total_bookings', (SELECT count(*) FROM bookings WHERE deleted_at IS NULL),
    'bookings_today', (SELECT count(*) FROM bookings WHERE deleted_at IS NULL AND booking_date = CURRENT_DATE),
    'bookings_7d', (SELECT count(*) FROM bookings WHERE deleted_at IS NULL AND booking_date >= CURRENT_DATE - 7),
    'bookings_30d', (SELECT count(*) FROM bookings WHERE deleted_at IS NULL AND booking_date >= CURRENT_DATE - 30),
    'total_services', (SELECT count(*) FROM services WHERE active = true),
    'total_professionals', (SELECT count(*) FROM professionals WHERE active = true),
    'total_active_coupons', (SELECT count(*) FROM coupons WHERE active = true),
    'tenants_without_owner', (SELECT count(*) FROM tenants t WHERE NOT EXISTS (SELECT 1 FROM tenant_users tu WHERE tu.tenant_id = t.id AND tu.role = 'owner' AND tu.status = 'active')),
    'tenants_without_bookings', (SELECT count(*) FROM tenants t WHERE NOT EXISTS (SELECT 1 FROM bookings b WHERE b.tenant_id = t.id AND b.deleted_at IS NULL)),
    'tenants_created_7d', (SELECT count(*) FROM tenants WHERE created_at >= now() - interval '7 days')
  );
END;
$$;

-- 2. Rich tenant list with stats
CREATE OR REPLACE FUNCTION public.get_platform_tenant_list()
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Only superadmins can view platform tenant list';
  END IF;

  RETURN (
    SELECT json_agg(row_data ORDER BY row_data->>'created_at' DESC)
    FROM (
      SELECT json_build_object(
        'id', t.id,
        'name', t.name,
        'slug', t.slug,
        'status', t.status,
        'plan', t.plan,
        'active', t.active,
        'custom_domain', t.custom_domain,
        'logo_url', t.logo_url,
        'created_at', t.created_at,
        'updated_at', t.updated_at,
        'owner_user_id', (SELECT tu.user_id FROM tenant_users tu WHERE tu.tenant_id = t.id AND tu.role = 'owner' AND tu.status = 'active' LIMIT 1),
        'staff_count', (SELECT count(*) FROM tenant_users tu WHERE tu.tenant_id = t.id AND tu.status = 'active'),
        'client_count', (SELECT count(*) FROM profiles p WHERE p.tenant_id = t.id),
        'booking_count', (SELECT count(*) FROM bookings b WHERE b.tenant_id = t.id AND b.deleted_at IS NULL),
        'service_count', (SELECT count(*) FROM services s WHERE s.tenant_id = t.id AND s.active = true),
        'professional_count', (SELECT count(*) FROM professionals pr WHERE pr.tenant_id = t.id AND pr.active = true),
        'last_booking_date', (SELECT MAX(b.booking_date) FROM bookings b WHERE b.tenant_id = t.id AND b.deleted_at IS NULL)
      ) AS row_data
      FROM tenants t
    ) sub
  );
END;
$$;

-- 3. Detailed tenant stats (enhanced version)
CREATE OR REPLACE FUNCTION public.get_tenant_detail_stats(p_tenant_id uuid)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Only superadmins can view tenant detail stats';
  END IF;

  RETURN json_build_object(
    'internal_users', (SELECT count(*) FROM tenant_users WHERE tenant_id = p_tenant_id AND status = 'active'),
    'total_profiles', (SELECT count(*) FROM profiles WHERE tenant_id = p_tenant_id),
    'blocked_profiles', (SELECT count(*) FROM profiles WHERE tenant_id = p_tenant_id AND blocked = true),
    'total_bookings', (SELECT count(*) FROM bookings WHERE tenant_id = p_tenant_id AND deleted_at IS NULL),
    'bookings_today', (SELECT count(*) FROM bookings WHERE tenant_id = p_tenant_id AND deleted_at IS NULL AND booking_date = CURRENT_DATE),
    'bookings_7d', (SELECT count(*) FROM bookings WHERE tenant_id = p_tenant_id AND deleted_at IS NULL AND booking_date >= CURRENT_DATE - 7),
    'bookings_30d', (SELECT count(*) FROM bookings WHERE tenant_id = p_tenant_id AND deleted_at IS NULL AND booking_date >= CURRENT_DATE - 30),
    'total_services', (SELECT count(*) FROM services WHERE tenant_id = p_tenant_id AND active = true),
    'total_professionals', (SELECT count(*) FROM professionals WHERE tenant_id = p_tenant_id AND active = true),
    'total_coupons', (SELECT count(*) FROM coupons WHERE tenant_id = p_tenant_id AND active = true),
    'owner_user_id', (SELECT user_id FROM tenant_users WHERE tenant_id = p_tenant_id AND role = 'owner' AND status = 'active' LIMIT 1),
    'last_booking_date', (SELECT MAX(booking_date) FROM bookings WHERE tenant_id = p_tenant_id AND deleted_at IS NULL),
    'staff_roles', (
      SELECT json_agg(json_build_object('user_id', user_id, 'role', role))
      FROM tenant_users WHERE tenant_id = p_tenant_id AND status = 'active'
    )
  );
END;
$$;

-- 4. Booking activity over time (last 30 days) for charts
CREATE OR REPLACE FUNCTION public.get_platform_booking_activity()
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Only superadmins can view platform activity';
  END IF;

  RETURN (
    SELECT json_agg(row_data ORDER BY row_data->>'date')
    FROM (
      SELECT json_build_object(
        'date', d.dt::date,
        'bookings', COALESCE(cnt.c, 0)
      ) AS row_data
      FROM generate_series(CURRENT_DATE - 29, CURRENT_DATE, '1 day') d(dt)
      LEFT JOIN (
        SELECT booking_date, count(*) AS c
        FROM bookings
        WHERE deleted_at IS NULL AND booking_date >= CURRENT_DATE - 29
        GROUP BY booking_date
      ) cnt ON cnt.booking_date = d.dt::date
    ) sub
  );
END;
$$;

-- 5. Tenant creation over time (last 90 days, weekly)
CREATE OR REPLACE FUNCTION public.get_platform_tenant_growth()
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Only superadmins can view platform growth';
  END IF;

  RETURN (
    SELECT json_agg(row_data ORDER BY row_data->>'week')
    FROM (
      SELECT json_build_object(
        'week', date_trunc('week', d.dt)::date,
        'tenants', COALESCE(cnt.c, 0),
        'profiles', COALESCE(pcnt.c, 0)
      ) AS row_data
      FROM generate_series(CURRENT_DATE - 89, CURRENT_DATE, '7 days') d(dt)
      LEFT JOIN (
        SELECT date_trunc('week', created_at)::date AS w, count(*) AS c
        FROM tenants
        WHERE created_at >= now() - interval '90 days'
        GROUP BY w
      ) cnt ON cnt.w = date_trunc('week', d.dt)::date
      LEFT JOIN (
        SELECT date_trunc('week', created_at)::date AS w, count(*) AS c
        FROM profiles
        WHERE created_at >= now() - interval '90 days'
        GROUP BY w
      ) pcnt ON pcnt.w = date_trunc('week', d.dt)::date
    ) sub
  );
END;
$$;
