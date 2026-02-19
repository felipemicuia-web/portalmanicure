
-- FIX: Change SELECT policies from RESTRICTIVE to PERMISSIVE
-- PostgreSQL requires at least one PERMISSIVE policy to grant access

-- === PROFESSIONALS ===
DROP POLICY IF EXISTS "Professionals viewable within tenant" ON public.professionals;
CREATE POLICY "Professionals viewable within tenant"
  ON public.professionals FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- === SERVICES ===
DROP POLICY IF EXISTS "Services viewable within tenant" ON public.services;
CREATE POLICY "Services viewable within tenant"
  ON public.services FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- === BOOKINGS (user own + admin) ===
DROP POLICY IF EXISTS "Users can view own bookings in tenant" ON public.bookings;
CREATE POLICY "Users can view own bookings in tenant"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Tenant admins can view all bookings" ON public.bookings;
CREATE POLICY "Tenant admins can view all bookings"
  ON public.bookings FOR SELECT
  USING (is_tenant_admin(auth.uid(), tenant_id));

-- === WORK_SETTINGS ===
DROP POLICY IF EXISTS "Work settings viewable within tenant" ON public.work_settings;
CREATE POLICY "Work settings viewable within tenant"
  ON public.work_settings FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- === PROFILES ===
DROP POLICY IF EXISTS "Users can view own profile in tenant" ON public.profiles;
CREATE POLICY "Users can view own profile in tenant"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Tenant admins can view profiles in tenant" ON public.profiles;
CREATE POLICY "Tenant admins can view profiles in tenant"
  ON public.profiles FOR SELECT
  USING (is_tenant_admin(auth.uid(), tenant_id));

-- === PROFESSIONAL_SERVICES ===
DROP POLICY IF EXISTS "Professional services viewable within tenant" ON public.professional_services;
CREATE POLICY "Professional services viewable within tenant"
  ON public.professional_services FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- === PROFESSIONAL_PHOTOS ===
DROP POLICY IF EXISTS "Professional photos viewable within tenant" ON public.professional_photos;
CREATE POLICY "Professional photos viewable within tenant"
  ON public.professional_photos FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- === REVIEWS ===
DROP POLICY IF EXISTS "Reviews viewable within tenant" ON public.reviews;
CREATE POLICY "Reviews viewable within tenant"
  ON public.reviews FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- === FOLLOWERS ===
DROP POLICY IF EXISTS "Followers viewable within tenant" ON public.followers;
CREATE POLICY "Followers viewable within tenant"
  ON public.followers FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- === COUPONS ===
DROP POLICY IF EXISTS "Coupons viewable within tenant" ON public.coupons;
CREATE POLICY "Coupons viewable within tenant"
  ON public.coupons FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- === TENANTS (public read for resolution) ===
DROP POLICY IF EXISTS "Anyone can view active tenants" ON public.tenants;
CREATE POLICY "Anyone can view active tenants"
  ON public.tenants FOR SELECT TO anon, authenticated
  USING (active = true);

-- === TENANT_USERS ===
DROP POLICY IF EXISTS "Users can view their own tenant memberships" ON public.tenant_users;
CREATE POLICY "Users can view their own tenant memberships"
  ON public.tenant_users FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Tenant admins can view all members" ON public.tenant_users;
CREATE POLICY "Tenant admins can view all members"
  ON public.tenant_users FOR SELECT
  USING (is_tenant_admin(auth.uid(), tenant_id));

-- === USER_ROLES ===
DROP POLICY IF EXISTS "Users can view own roles in tenant" ON public.user_roles;
CREATE POLICY "Users can view own roles in tenant"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Tenant admins can view roles in tenant" ON public.user_roles;
CREATE POLICY "Tenant admins can view roles in tenant"
  ON public.user_roles FOR SELECT
  USING (is_tenant_admin(auth.uid(), tenant_id));

-- === BOOKING_SERVICES ===
DROP POLICY IF EXISTS "Users can view booking services in tenant" ON public.booking_services;
CREATE POLICY "Users can view booking services in tenant"
  ON public.booking_services FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND EXISTS (
    SELECT 1 FROM bookings WHERE bookings.id = booking_services.booking_id AND bookings.user_id = auth.uid() AND bookings.tenant_id = booking_services.tenant_id
  ));

-- === COUPON_USAGE ===
DROP POLICY IF EXISTS "Coupon usage viewable by admins" ON public.coupon_usage;
CREATE POLICY "Coupon usage viewable by admins"
  ON public.coupon_usage FOR SELECT
  USING (is_tenant_admin(auth.uid(), tenant_id));

-- === GALLERY_PHOTOS ===
DROP POLICY IF EXISTS "Gallery photos viewable within tenant" ON public.gallery_photos;
CREATE POLICY "Gallery photos viewable within tenant"
  ON public.gallery_photos FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- === PHOTO_LIKES ===
DROP POLICY IF EXISTS "Photo likes viewable within tenant" ON public.photo_likes;
CREATE POLICY "Photo likes viewable within tenant"
  ON public.photo_likes FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- === PHOTO_COMMENTS ===
DROP POLICY IF EXISTS "Photo comments viewable within tenant" ON public.photo_comments;
CREATE POLICY "Photo comments viewable within tenant"
  ON public.photo_comments FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- === ADMIN_NOTIFICATIONS ===
DROP POLICY IF EXISTS "Tenant admins can view notifications" ON public.admin_notifications;
CREATE POLICY "Tenant admins can view notifications"
  ON public.admin_notifications FOR SELECT
  USING (is_tenant_admin(auth.uid(), tenant_id));

-- === PROFESSIONAL_BLOCKED_DATES ===
DROP POLICY IF EXISTS "Blocked dates viewable within tenant" ON public.professional_blocked_dates;
CREATE POLICY "Blocked dates viewable within tenant"
  ON public.professional_blocked_dates FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));
