
-- =============================================================
-- MIGRATION: Final multi-tenant architecture refactoring
-- Separates internal staff (tenant_users) from end-clients (profiles)
-- =============================================================

-- =============================================
-- 1. FIX profiles UNIQUE CONSTRAINT
-- Drop UNIQUE(user_id), add UNIQUE(user_id, tenant_id)
-- =============================================
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_key;

-- Add composite unique (allows same user in multiple tenants)
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_tenant_unique UNIQUE (user_id, tenant_id);

-- Drop redundant indexes
DROP INDEX IF EXISTS idx_profiles_user;
DROP INDEX IF EXISTS idx_profiles_tenant_user;

-- =============================================
-- 2. CREATE user_has_profile_in_tenant() FUNCTION
-- Used by RLS for end-client authorization
-- =============================================
CREATE OR REPLACE FUNCTION public.user_has_profile_in_tenant(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND blocked = false
  );
$$;

-- =============================================
-- 3. REFACTOR profiles RLS POLICIES
-- =============================================
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Tenant admins can view profiles in tenant" ON public.profiles;
DROP POLICY IF EXISTS "Tenant admins can delete profiles in tenant" ON public.profiles;

-- Client: can create own profile in any active tenant
CREATE POLICY "Clients can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (SELECT 1 FROM public.tenants WHERE id = tenant_id AND active = true)
);

-- Client: can view own profiles
CREATE POLICY "Clients can view own profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Client: can update own profiles
CREATE POLICY "Clients can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admin: can view all profiles in their tenant
CREATE POLICY "Admins can view tenant profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));

-- Admin: can update profiles in tenant (block/unblock)
CREATE POLICY "Admins can update tenant profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (is_tenant_admin(auth.uid(), tenant_id))
WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

-- Admin: can delete profiles in tenant
CREATE POLICY "Admins can delete tenant profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (is_tenant_admin(auth.uid(), tenant_id));

-- =============================================
-- 4. REFACTOR bookings RLS POLICIES
-- =============================================
DROP POLICY IF EXISTS "Users can insert own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Tenant admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Tenant admins can update all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Tenant admins can hard delete bookings" ON public.bookings;

-- Client: can insert booking only if they have a valid profile in that tenant
CREATE POLICY "Clients can insert own bookings"
ON public.bookings FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND user_has_profile_in_tenant(auth.uid(), tenant_id)
);

-- Client: can view own bookings
CREATE POLICY "Clients can view own bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Client: can update own bookings
CREATE POLICY "Clients can update own bookings"
ON public.bookings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admin: can view all bookings in tenant
CREATE POLICY "Admins can view tenant bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));

-- Admin: can update all bookings in tenant
CREATE POLICY "Admins can update tenant bookings"
ON public.bookings FOR UPDATE
TO authenticated
USING (is_tenant_admin(auth.uid(), tenant_id))
WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

-- Admin: can hard-delete trashed bookings
CREATE POLICY "Admins can delete trashed bookings"
ON public.bookings FOR DELETE
TO authenticated
USING (is_tenant_admin(auth.uid(), tenant_id) AND deleted_at IS NOT NULL);

-- =============================================
-- 5. REFACTOR coupon_usage RLS POLICIES
-- =============================================
DROP POLICY IF EXISTS "Users can insert own coupon usage" ON public.coupon_usage;
DROP POLICY IF EXISTS "Coupon usage viewable by admins" ON public.coupon_usage;

CREATE POLICY "Clients can insert own coupon usage"
ON public.coupon_usage FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND user_has_profile_in_tenant(auth.uid(), tenant_id));

CREATE POLICY "Admins can view tenant coupon usage"
ON public.coupon_usage FOR SELECT
TO authenticated
USING (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));

-- =============================================
-- 6. REFACTOR admin_notifications INSERT POLICY
-- =============================================
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.admin_notifications;

CREATE POLICY "Clients can insert own notifications"
ON public.admin_notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND user_has_profile_in_tenant(auth.uid(), tenant_id));

-- =============================================
-- 7. REFACTOR gallery_photos (client uses profiles not tenant_users)
-- =============================================
DROP POLICY IF EXISTS "Users can create gallery photos in tenant" ON public.gallery_photos;
DROP POLICY IF EXISTS "Users can delete own gallery photos" ON public.gallery_photos;

CREATE POLICY "Users can create gallery photos"
ON public.gallery_photos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND user_has_profile_in_tenant(auth.uid(), tenant_id));

CREATE POLICY "Users can delete own gallery photos"
ON public.gallery_photos FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
