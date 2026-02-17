
-- ============================================================
-- HARDENING MULTI-TENANT: FASE COMPLETA
-- ============================================================

-- ============================================================
-- 1. SINGLE-TENANT POR USUÁRIO: UNIQUE(user_id) em tenant_users
-- ============================================================
-- Remove duplicatas antes de aplicar constraint
DELETE FROM public.tenant_users a
USING public.tenant_users b
WHERE a.id < b.id AND a.user_id = b.user_id;

ALTER TABLE public.tenant_users
  DROP CONSTRAINT IF EXISTS tenant_users_tenant_id_user_id_key;

ALTER TABLE public.tenant_users
  ADD CONSTRAINT tenant_users_user_id_unique UNIQUE (user_id);

-- ============================================================
-- 2. tenant_id NOT NULL em todas as 16 tabelas
-- ============================================================
ALTER TABLE public.professionals ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.services ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.booking_services ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.user_roles ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.work_settings ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.admin_notifications ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.gallery_photos ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.professional_photos ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.professional_services ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.professional_blocked_dates ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.followers ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.reviews ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.photo_likes ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.photo_comments ALTER COLUMN tenant_id SET NOT NULL;

-- ============================================================
-- 3. ÍNDICES em tenant_id + compostos
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_professionals_tenant ON public.professionals (tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_tenant ON public.services (tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant ON public.bookings (tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_user ON public.bookings (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_date ON public.bookings (tenant_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_booking_services_tenant ON public.booking_services (tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON public.profiles (tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_user ON public.profiles (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant ON public.user_roles (tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_user ON public.user_roles (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_work_settings_tenant ON public.work_settings (tenant_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_tenant ON public.admin_notifications (tenant_id);
CREATE INDEX IF NOT EXISTS idx_gallery_photos_tenant ON public.gallery_photos (tenant_id);
CREATE INDEX IF NOT EXISTS idx_professional_photos_tenant ON public.professional_photos (tenant_id);
CREATE INDEX IF NOT EXISTS idx_professional_services_tenant ON public.professional_services (tenant_id);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_tenant ON public.professional_blocked_dates (tenant_id);
CREATE INDEX IF NOT EXISTS idx_followers_tenant ON public.followers (tenant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tenant ON public.reviews (tenant_id);
CREATE INDEX IF NOT EXISTS idx_photo_likes_tenant ON public.photo_likes (tenant_id);
CREATE INDEX IF NOT EXISTS idx_photo_comments_tenant ON public.photo_comments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON public.tenant_users (user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON public.tenant_users (tenant_id);

-- ============================================================
-- 4. REESCREVER TODAS AS RLS POLICIES
--    - Remover OR tenant_id IS NULL
--    - Adicionar WITH CHECK em UPDATE
--    - Isolar profiles e user_roles por tenant
-- ============================================================

-- 4.1 professionals
DROP POLICY IF EXISTS "Professionals viewable within tenant" ON public.professionals;
DROP POLICY IF EXISTS "Tenant admins can insert professionals" ON public.professionals;
DROP POLICY IF EXISTS "Tenant admins can update professionals" ON public.professionals;
DROP POLICY IF EXISTS "Tenant admins can delete professionals" ON public.professionals;

CREATE POLICY "Professionals viewable within tenant" ON public.professionals
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can insert professionals" ON public.professionals
  FOR INSERT WITH CHECK (is_tenant_admin(auth.uid(), tenant_id) AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can update professionals" ON public.professionals
  FOR UPDATE USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can delete professionals" ON public.professionals
  FOR DELETE USING (is_tenant_admin(auth.uid(), tenant_id));

-- 4.2 services
DROP POLICY IF EXISTS "Services viewable within tenant" ON public.services;
DROP POLICY IF EXISTS "Tenant admins can insert services" ON public.services;
DROP POLICY IF EXISTS "Tenant admins can update services" ON public.services;
DROP POLICY IF EXISTS "Tenant admins can delete services" ON public.services;

CREATE POLICY "Services viewable within tenant" ON public.services
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can insert services" ON public.services
  FOR INSERT WITH CHECK (is_tenant_admin(auth.uid(), tenant_id) AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can update services" ON public.services
  FOR UPDATE USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can delete services" ON public.services
  FOR DELETE USING (is_tenant_admin(auth.uid(), tenant_id));

-- 4.3 bookings
DROP POLICY IF EXISTS "Users can view own bookings in tenant" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings in tenant" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings in tenant" ON public.bookings;
DROP POLICY IF EXISTS "Tenant admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Tenant admins can update all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Tenant admins can delete all bookings" ON public.bookings;

CREATE POLICY "Users can view own bookings in tenant" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can create bookings in tenant" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can update own bookings in tenant" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can view all bookings" ON public.bookings
  FOR SELECT USING (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Tenant admins can update all bookings" ON public.bookings
  FOR UPDATE USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can delete all bookings" ON public.bookings
  FOR DELETE USING (is_tenant_admin(auth.uid(), tenant_id));

-- 4.4 booking_services
DROP POLICY IF EXISTS "Users can view booking services in tenant" ON public.booking_services;
DROP POLICY IF EXISTS "Users can create booking services in tenant" ON public.booking_services;
DROP POLICY IF EXISTS "Tenant admins can manage booking services" ON public.booking_services;

CREATE POLICY "Users can view booking services in tenant" ON public.booking_services
  FOR SELECT USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_services.booking_id AND bookings.user_id = auth.uid() AND bookings.tenant_id = booking_services.tenant_id)
  );
CREATE POLICY "Users can create booking services in tenant" ON public.booking_services
  FOR INSERT WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    AND EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_services.booking_id AND bookings.user_id = auth.uid() AND bookings.tenant_id = booking_services.tenant_id)
  );
CREATE POLICY "Tenant admins can manage booking services" ON public.booking_services
  FOR ALL USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- 4.5 profiles (ISOLADO POR TENANT)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Tenant admins can view profiles in tenant" ON public.profiles;
DROP POLICY IF EXISTS "Tenant admins can delete profiles in tenant" ON public.profiles;

CREATE POLICY "Users can view own profile in tenant" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can create own profile in tenant" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can update own profile in tenant" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can view profiles in tenant" ON public.profiles
  FOR SELECT USING (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Tenant admins can delete profiles in tenant" ON public.profiles
  FOR DELETE USING (is_tenant_admin(auth.uid(), tenant_id));

-- 4.6 user_roles (ISOLADO POR TENANT)
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Tenant admins can view roles in tenant" ON public.user_roles;
DROP POLICY IF EXISTS "Tenant admins can manage roles in tenant" ON public.user_roles;

CREATE POLICY "Users can view own roles in tenant" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can view roles in tenant" ON public.user_roles
  FOR SELECT USING (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Tenant admins can manage roles in tenant" ON public.user_roles
  FOR ALL USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- 4.7 work_settings
DROP POLICY IF EXISTS "Work settings viewable within tenant" ON public.work_settings;
DROP POLICY IF EXISTS "Tenant admins can update work settings" ON public.work_settings;
DROP POLICY IF EXISTS "Tenant admins can insert work settings" ON public.work_settings;

CREATE POLICY "Work settings viewable within tenant" ON public.work_settings
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can update work settings" ON public.work_settings
  FOR UPDATE USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can insert work settings" ON public.work_settings
  FOR INSERT WITH CHECK (is_tenant_admin(auth.uid(), tenant_id) AND tenant_id = get_user_tenant_id(auth.uid()));

-- 4.8 admin_notifications
DROP POLICY IF EXISTS "Tenant admins can view notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Users can create notifications in tenant" ON public.admin_notifications;
DROP POLICY IF EXISTS "Tenant admins can update notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Tenant admins can delete notifications" ON public.admin_notifications;

CREATE POLICY "Tenant admins can view notifications" ON public.admin_notifications
  FOR SELECT USING (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Users can create notifications in tenant" ON public.admin_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can update notifications" ON public.admin_notifications
  FOR UPDATE USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can delete notifications" ON public.admin_notifications
  FOR DELETE USING (is_tenant_admin(auth.uid(), tenant_id));

-- 4.9 gallery_photos
DROP POLICY IF EXISTS "Gallery photos viewable within tenant" ON public.gallery_photos;
DROP POLICY IF EXISTS "Users can create gallery photos in tenant" ON public.gallery_photos;
DROP POLICY IF EXISTS "Users can delete own gallery photos" ON public.gallery_photos;

CREATE POLICY "Gallery photos viewable within tenant" ON public.gallery_photos
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can create gallery photos in tenant" ON public.gallery_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can delete own gallery photos" ON public.gallery_photos
  FOR DELETE USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

-- 4.10 professional_photos
DROP POLICY IF EXISTS "Professional photos viewable within tenant" ON public.professional_photos;
DROP POLICY IF EXISTS "Tenant admins can insert professional photos" ON public.professional_photos;
DROP POLICY IF EXISTS "Tenant admins can update professional photos" ON public.professional_photos;
DROP POLICY IF EXISTS "Tenant admins can delete professional photos" ON public.professional_photos;

CREATE POLICY "Professional photos viewable within tenant" ON public.professional_photos
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can insert professional photos" ON public.professional_photos
  FOR INSERT WITH CHECK (is_tenant_admin(auth.uid(), tenant_id) AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can update professional photos" ON public.professional_photos
  FOR UPDATE USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can delete professional photos" ON public.professional_photos
  FOR DELETE USING (is_tenant_admin(auth.uid(), tenant_id));

-- 4.11 professional_services
DROP POLICY IF EXISTS "Professional services viewable within tenant" ON public.professional_services;
DROP POLICY IF EXISTS "Tenant admins can manage professional services" ON public.professional_services;

CREATE POLICY "Professional services viewable within tenant" ON public.professional_services
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can manage professional services" ON public.professional_services
  FOR ALL USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- 4.12 professional_blocked_dates
DROP POLICY IF EXISTS "Blocked dates viewable within tenant" ON public.professional_blocked_dates;
DROP POLICY IF EXISTS "Tenant admins can manage blocked dates" ON public.professional_blocked_dates;

CREATE POLICY "Blocked dates viewable within tenant" ON public.professional_blocked_dates
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can manage blocked dates" ON public.professional_blocked_dates
  FOR ALL USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- 4.13 followers
DROP POLICY IF EXISTS "Followers viewable within tenant" ON public.followers;
DROP POLICY IF EXISTS "Users can follow in tenant" ON public.followers;
DROP POLICY IF EXISTS "Users can unfollow" ON public.followers;

CREATE POLICY "Followers viewable within tenant" ON public.followers
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can follow in tenant" ON public.followers
  FOR INSERT WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can unfollow in tenant" ON public.followers
  FOR DELETE USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

-- 4.14 reviews
DROP POLICY IF EXISTS "Reviews viewable within tenant" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews in tenant" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;

CREATE POLICY "Reviews viewable within tenant" ON public.reviews
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can create reviews in tenant" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can update own reviews in tenant" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can delete own reviews in tenant" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

-- 4.15 photo_likes
DROP POLICY IF EXISTS "Photo likes viewable within tenant" ON public.photo_likes;
DROP POLICY IF EXISTS "Users can like photos in tenant" ON public.photo_likes;
DROP POLICY IF EXISTS "Users can remove own likes" ON public.photo_likes;

CREATE POLICY "Photo likes viewable within tenant" ON public.photo_likes
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can like photos in tenant" ON public.photo_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can remove own likes in tenant" ON public.photo_likes
  FOR DELETE USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

-- 4.16 photo_comments
DROP POLICY IF EXISTS "Photo comments viewable within tenant" ON public.photo_comments;
DROP POLICY IF EXISTS "Users can comment in tenant" ON public.photo_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.photo_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.photo_comments;
DROP POLICY IF EXISTS "Tenant admins can delete comments" ON public.photo_comments;

CREATE POLICY "Photo comments viewable within tenant" ON public.photo_comments
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can comment in tenant" ON public.photo_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can update own comments in tenant" ON public.photo_comments
  FOR UPDATE USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can delete own comments in tenant" ON public.photo_comments
  FOR DELETE USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can delete comments in tenant" ON public.photo_comments
  FOR DELETE USING (is_tenant_admin(auth.uid(), tenant_id));
