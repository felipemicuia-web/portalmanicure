
-- =============================================
-- MULTI-TENANT ARCHITECTURE MIGRATION
-- =============================================

-- 1. Enable multi-membership: Drop single-user constraint, add composite unique
ALTER TABLE public.tenant_users DROP CONSTRAINT IF EXISTS tenant_users_user_id_key;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_users_tenant_user_unique'
  ) THEN
    ALTER TABLE public.tenant_users ADD CONSTRAINT tenant_users_tenant_user_unique UNIQUE (tenant_id, user_id);
  END IF;
END $$;

-- 2. Add status and updated_at to tenant_users
ALTER TABLE public.tenant_users ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.tenant_users ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 3. Performance indexes
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_status ON public.tenant_users(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_role ON public.tenant_users(tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant ON public.bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_tenant ON public.services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_professionals_tenant ON public.professionals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_tenant ON public.coupons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tenant ON public.reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_followers_tenant ON public.followers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_tenant ON public.admin_notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_professional_services_tenant ON public.professional_services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_professional_photos_tenant ON public.professional_photos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_booking_services_tenant ON public.booking_services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_tenant ON public.gallery_photos(tenant_id);

-- 4. Update get_user_tenant_id to filter by active status
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.tenant_users
  WHERE user_id = _user_id
    AND status = 'active'
  LIMIT 1;
$$;

-- 5. Update user_belongs_to_tenant to check status
CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_users
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND status = 'active'
  );
$$;

-- 6. Create get_user_role_in_tenant function
CREATE OR REPLACE FUNCTION public.get_user_role_in_tenant(_user_id uuid, _tenant_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.tenant_users
  WHERE user_id = _user_id
    AND tenant_id = _tenant_id
    AND status = 'active'
  LIMIT 1;
$$;

-- 7. Update is_tenant_admin to check status
CREATE OR REPLACE FUNCTION public.is_tenant_admin(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_users
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND role IN ('admin', 'owner')
      AND status = 'active'
  );
$$;

-- 8. Create secure onboard_tenant function
CREATE OR REPLACE FUNCTION public.onboard_tenant(
  p_name text,
  p_slug text,
  p_owner_user_id uuid DEFAULT NULL,
  p_custom_domain text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  IF NOT public.is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Only superadmins can create tenants';
  END IF;
  IF p_slug IS NULL OR p_slug = '' THEN
    RAISE EXCEPTION 'Slug is required';
  END IF;
  INSERT INTO public.tenants (name, slug, custom_domain)
  VALUES (p_name, p_slug, p_custom_domain)
  RETURNING id INTO v_tenant_id;
  INSERT INTO public.work_settings (tenant_id) VALUES (v_tenant_id);
  IF p_owner_user_id IS NOT NULL THEN
    INSERT INTO public.tenant_users (tenant_id, user_id, role, status)
    VALUES (v_tenant_id, p_owner_user_id, 'owner', 'active');
    INSERT INTO public.profiles (user_id, tenant_id)
    VALUES (p_owner_user_id, v_tenant_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN v_tenant_id;
END;
$$;

-- 9. Create function to add user to tenant
CREATE OR REPLACE FUNCTION public.add_user_to_tenant(
  p_tenant_id uuid,
  p_user_id uuid,
  p_role text DEFAULT 'user'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_superadmin(auth.uid()) OR public.is_tenant_admin(auth.uid(), p_tenant_id)) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  INSERT INTO public.tenant_users (tenant_id, user_id, role, status)
  VALUES (p_tenant_id, p_user_id, p_role, 'active')
  ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = p_role, status = 'active', updated_at = now();
  INSERT INTO public.profiles (user_id, tenant_id)
  VALUES (p_user_id, p_tenant_id)
  ON CONFLICT DO NOTHING;
END;
$$;

-- 10. Create function to change user role in tenant
CREATE OR REPLACE FUNCTION public.change_tenant_role(
  p_tenant_id uuid,
  p_user_id uuid,
  p_new_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_superadmin(auth.uid()) OR public.is_tenant_admin(auth.uid(), p_tenant_id)) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  IF p_new_role = 'owner' AND NOT public.is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Only superadmins can assign owner role';
  END IF;
  UPDATE public.tenant_users
  SET role = p_new_role, updated_at = now()
  WHERE tenant_id = p_tenant_id AND user_id = p_user_id;
END;
$$;

-- 11. Update ALL RLS policies to use user_belongs_to_tenant

-- professionals
DROP POLICY IF EXISTS "Professionals viewable within tenant" ON public.professionals;
CREATE POLICY "Professionals viewable within tenant" ON public.professionals
  FOR SELECT TO authenticated USING (user_belongs_to_tenant(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));
DROP POLICY IF EXISTS "Tenant admins can insert professionals" ON public.professionals;
CREATE POLICY "Tenant admins can insert professionals" ON public.professionals
  FOR INSERT TO authenticated WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Tenant admins can update professionals" ON public.professionals;
CREATE POLICY "Tenant admins can update professionals" ON public.professionals
  FOR UPDATE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Tenant admins can delete professionals" ON public.professionals;
CREATE POLICY "Tenant admins can delete professionals" ON public.professionals
  FOR DELETE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));

-- services
DROP POLICY IF EXISTS "Services viewable within tenant" ON public.services;
CREATE POLICY "Services viewable within tenant" ON public.services
  FOR SELECT TO authenticated USING (user_belongs_to_tenant(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));
DROP POLICY IF EXISTS "Tenant admins can insert services" ON public.services;
CREATE POLICY "Tenant admins can insert services" ON public.services
  FOR INSERT TO authenticated WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Tenant admins can update services" ON public.services;
CREATE POLICY "Tenant admins can update services" ON public.services
  FOR UPDATE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Tenant admins can delete services" ON public.services;
CREATE POLICY "Tenant admins can delete services" ON public.services
  FOR DELETE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));

-- bookings
DROP POLICY IF EXISTS "Users can view own bookings in tenant" ON public.bookings;
CREATE POLICY "Users can view own bookings in tenant" ON public.bookings
  FOR SELECT TO authenticated USING (auth.uid() = user_id AND user_belongs_to_tenant(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Tenant admins can view all bookings" ON public.bookings;
CREATE POLICY "Tenant admins can view all bookings" ON public.bookings
  FOR SELECT TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));
DROP POLICY IF EXISTS "Users can create bookings in tenant" ON public.bookings;
CREATE POLICY "Users can create bookings in tenant" ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND user_belongs_to_tenant(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Users can update own bookings in tenant" ON public.bookings;
CREATE POLICY "Users can update own bookings in tenant" ON public.bookings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id AND user_belongs_to_tenant(auth.uid(), tenant_id)) WITH CHECK (user_belongs_to_tenant(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Tenant admins can update all bookings" ON public.bookings;
CREATE POLICY "Tenant admins can update all bookings" ON public.bookings
  FOR UPDATE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Tenant admins can hard delete bookings" ON public.bookings;
CREATE POLICY "Tenant admins can hard delete bookings" ON public.bookings
  FOR DELETE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id) AND deleted_at IS NOT NULL);

-- booking_services
DROP POLICY IF EXISTS "Users can view booking services in tenant" ON public.booking_services;
CREATE POLICY "Users can view booking services in tenant" ON public.booking_services
  FOR SELECT TO authenticated USING (user_belongs_to_tenant(auth.uid(), tenant_id) AND EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_services.booking_id AND bookings.user_id = auth.uid()));
DROP POLICY IF EXISTS "Tenant admins can manage booking services" ON public.booking_services;
CREATE POLICY "Tenant admins can manage booking services" ON public.booking_services
  FOR ALL TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Users can create booking services in tenant" ON public.booking_services;
CREATE POLICY "Users can create booking services in tenant" ON public.booking_services
  FOR INSERT TO authenticated WITH CHECK (user_belongs_to_tenant(auth.uid(), tenant_id) AND EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_services.booking_id AND bookings.user_id = auth.uid()));

-- work_settings
DROP POLICY IF EXISTS "Work settings viewable within tenant" ON public.work_settings;
CREATE POLICY "Work settings viewable within tenant" ON public.work_settings
  FOR SELECT TO authenticated USING (user_belongs_to_tenant(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));
DROP POLICY IF EXISTS "Tenant admins can insert work settings" ON public.work_settings;
CREATE POLICY "Tenant admins can insert work settings" ON public.work_settings
  FOR INSERT TO authenticated WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Tenant admins can update work settings" ON public.work_settings;
CREATE POLICY "Tenant admins can update work settings" ON public.work_settings
  FOR UPDATE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

-- profiles
DROP POLICY IF EXISTS "Users can view own profile in tenant" ON public.profiles;
CREATE POLICY "Users can view own profile in tenant" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id AND user_belongs_to_tenant(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Tenant admins can view profiles in tenant" ON public.profiles;
CREATE POLICY "Tenant admins can view profiles in tenant" ON public.profiles
  FOR SELECT TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));
DROP POLICY IF EXISTS "Users can create own profile in tenant" ON public.profiles;
CREATE POLICY "Users can create own profile in tenant" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own profile in tenant" ON public.profiles;
CREATE POLICY "Users can update own profile in tenant" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id AND user_belongs_to_tenant(auth.uid(), tenant_id)) WITH CHECK (user_belongs_to_tenant(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Tenant admins can delete profiles in tenant" ON public.profiles;
CREATE POLICY "Tenant admins can delete profiles in tenant" ON public.profiles
  FOR DELETE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));

-- coupons
DROP POLICY IF EXISTS "Coupons viewable within tenant" ON public.coupons;
CREATE POLICY "Coupons viewable within tenant" ON public.coupons
  FOR SELECT TO authenticated USING (user_belongs_to_tenant(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));
DROP POLICY IF EXISTS "Tenant admins can insert coupons" ON public.coupons;
CREATE POLICY "Tenant admins can insert coupons" ON public.coupons
  FOR INSERT TO authenticated WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Tenant admins can update coupons" ON public.coupons;
CREATE POLICY "Tenant admins can update coupons" ON public.coupons
  FOR UPDATE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Tenant admins can delete coupons" ON public.coupons;
CREATE POLICY "Tenant admins can delete coupons" ON public.coupons
  FOR DELETE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));

-- coupon_usage
DROP POLICY IF EXISTS "Coupon usage viewable by admins" ON public.coupon_usage;
CREATE POLICY "Coupon usage viewable by admins" ON public.coupon_usage
  FOR SELECT TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));
DROP POLICY IF EXISTS "Users can create coupon usage in tenant" ON public.coupon_usage;
CREATE POLICY "Users can create coupon usage in tenant" ON public.coupon_usage
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND user_belongs_to_tenant(auth.uid(), tenant_id));

-- followers
DROP POLICY IF EXISTS "Followers viewable within tenant" ON public.followers;
CREATE POLICY "Followers viewable within tenant" ON public.followers
  FOR SELECT TO authenticated USING (user_belongs_to_tenant(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Users can follow in tenant" ON public.followers;
CREATE POLICY "Users can follow in tenant" ON public.followers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND user_belongs_to_tenant(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Users can unfollow in tenant" ON public.followers;
CREATE POLICY "Users can unfollow in tenant" ON public.followers
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND user_belongs_to_tenant(auth.uid(), tenant_id));

-- reviews
DROP POLICY IF EXISTS "Reviews viewable within tenant" ON public.reviews;
CREATE POLICY "Reviews viewable within tenant" ON public.reviews
  FOR SELECT TO authenticated USING (user_belongs_to_tenant(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Users can create reviews in tenant" ON public.reviews;
CREATE POLICY "Users can create reviews in tenant" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND user_belongs_to_tenant(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Users can update own reviews in tenant" ON public.reviews;
CREATE POLICY "Users can update own reviews in tenant" ON public.reviews
  FOR UPDATE TO authenticated USING (auth.uid() = user_id AND user_belongs_to_tenant(auth.uid(), tenant_id)) WITH CHECK (user_belongs_to_tenant(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Users can delete own reviews in tenant" ON public.reviews;
CREATE POLICY "Users can delete own reviews in tenant" ON public.reviews
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND user_belongs_to_tenant(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Tenant admins can delete any review in tenant" ON public.reviews;
CREATE POLICY "Tenant admins can delete any review in tenant" ON public.reviews
  FOR DELETE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));

-- photo_likes
DROP POLICY IF EXISTS "Photo likes viewable within tenant" ON public.photo_likes;
CREATE POLICY "Photo likes viewable within tenant" ON public.photo_likes
  FOR SELECT TO authenticated USING (user_belongs_to_tenant(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Users can like photos in tenant" ON public.photo_likes;
CREATE POLICY "Users can like photos in tenant" ON public.photo_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND user_belongs_to_tenant(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Users can remove own likes in tenant" ON public.photo_likes;
CREATE POLICY "Users can remove own likes in tenant" ON public.photo_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND user_belongs_to_tenant(auth.uid(), tenant_id));

-- photo_comments
DROP POLICY IF EXISTS "Photo comments viewable within tenant" ON public.photo_comments;
CREATE POLICY "Photo comments viewable within tenant" ON public.photo_comments
  FOR SELECT TO authenticated USING (user_belongs_to_tenant(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Users can comment in tenant" ON public.photo_comments;
CREATE POLICY "Users can comment in tenant" ON public.photo_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND user_belongs_to_tenant(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Users can update own comments in tenant" ON public.photo_comments;
CREATE POLICY "Users can update own comments in tenant" ON public.photo_comments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id AND user_belongs_to_tenant(auth.uid(), tenant_id)) WITH CHECK (user_belongs_to_tenant(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Users can delete own comments in tenant" ON public.photo_comments;
CREATE POLICY "Users can delete own comments in tenant" ON public.photo_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND user_belongs_to_tenant(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Tenant admins can delete comments in tenant" ON public.photo_comments;
CREATE POLICY "Tenant admins can delete comments in tenant" ON public.photo_comments
  FOR DELETE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));

-- gallery_photos
DROP POLICY IF EXISTS "Gallery photos viewable within tenant" ON public.gallery_photos;
CREATE POLICY "Gallery photos viewable within tenant" ON public.gallery_photos
  FOR SELECT TO authenticated USING (user_belongs_to_tenant(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Users can create gallery photos in tenant" ON public.gallery_photos;
CREATE POLICY "Users can create gallery photos in tenant" ON public.gallery_photos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND user_belongs_to_tenant(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Users can delete own gallery photos" ON public.gallery_photos;
CREATE POLICY "Users can delete own gallery photos" ON public.gallery_photos
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND user_belongs_to_tenant(auth.uid(), tenant_id));

-- professional_blocked_dates
DROP POLICY IF EXISTS "Blocked dates viewable within tenant" ON public.professional_blocked_dates;
CREATE POLICY "Blocked dates viewable within tenant" ON public.professional_blocked_dates
  FOR SELECT TO authenticated USING (user_belongs_to_tenant(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));
DROP POLICY IF EXISTS "Tenant admins can manage blocked dates" ON public.professional_blocked_dates;
CREATE POLICY "Tenant admins can manage blocked dates" ON public.professional_blocked_dates
  FOR ALL TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

-- professional_photos
DROP POLICY IF EXISTS "Professional photos viewable within tenant" ON public.professional_photos;
CREATE POLICY "Professional photos viewable within tenant" ON public.professional_photos
  FOR SELECT TO authenticated USING (user_belongs_to_tenant(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Tenant admins can insert professional photos" ON public.professional_photos;
CREATE POLICY "Tenant admins can insert professional photos" ON public.professional_photos
  FOR INSERT TO authenticated WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Tenant admins can update professional photos" ON public.professional_photos;
CREATE POLICY "Tenant admins can update professional photos" ON public.professional_photos
  FOR UPDATE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Tenant admins can delete professional photos" ON public.professional_photos;
CREATE POLICY "Tenant admins can delete professional photos" ON public.professional_photos
  FOR DELETE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));

-- professional_services
DROP POLICY IF EXISTS "Professional services viewable within tenant" ON public.professional_services;
CREATE POLICY "Professional services viewable within tenant" ON public.professional_services
  FOR SELECT TO authenticated USING (user_belongs_to_tenant(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Tenant admins can manage professional services" ON public.professional_services;
CREATE POLICY "Tenant admins can manage professional services" ON public.professional_services
  FOR ALL TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

-- user_roles
DROP POLICY IF EXISTS "Users can view own roles in tenant" ON public.user_roles;
CREATE POLICY "Users can view own roles in tenant" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id AND user_belongs_to_tenant(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Tenant admins can view roles in tenant" ON public.user_roles;
CREATE POLICY "Tenant admins can view roles in tenant" ON public.user_roles
  FOR SELECT TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));
DROP POLICY IF EXISTS "Tenant admins can manage roles in tenant" ON public.user_roles;
CREATE POLICY "Tenant admins can manage roles in tenant" ON public.user_roles
  FOR ALL TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

-- admin_notifications
DROP POLICY IF EXISTS "Tenant admins can view notifications" ON public.admin_notifications;
CREATE POLICY "Tenant admins can view notifications" ON public.admin_notifications
  FOR SELECT TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));
DROP POLICY IF EXISTS "Users can create notifications in tenant" ON public.admin_notifications;
CREATE POLICY "Users can create notifications in tenant" ON public.admin_notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND user_belongs_to_tenant(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Tenant admins can update notifications" ON public.admin_notifications;
CREATE POLICY "Tenant admins can update notifications" ON public.admin_notifications
  FOR UPDATE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));
DROP POLICY IF EXISTS "Tenant admins can delete notifications" ON public.admin_notifications;
CREATE POLICY "Tenant admins can delete notifications" ON public.admin_notifications
  FOR DELETE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));

-- platform_admins: allow superadmins to manage
DROP POLICY IF EXISTS "Superadmins can manage platform_admins" ON public.platform_admins;
CREATE POLICY "Superadmins can manage platform_admins" ON public.platform_admins
  FOR ALL TO authenticated USING (is_superadmin(auth.uid())) WITH CHECK (is_superadmin(auth.uid()));
