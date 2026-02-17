
-- Ajuste 1: tenants UPDATE com WITH CHECK
DROP POLICY IF EXISTS "Tenant admins can update their tenant" ON public.tenants;
CREATE POLICY "Tenant admins can update their tenant" ON public.tenants
  FOR UPDATE
  TO authenticated
  USING (is_tenant_admin(auth.uid(), id))
  WITH CHECK (is_tenant_admin(auth.uid(), id));

-- Ajuste 2: tenants SELECT - restringir para authenticated + membros do tenant
-- Mantém visível para resolução de tenant (login/signup), mas só authenticated
DROP POLICY IF EXISTS "Anyone can view active tenants" ON public.tenants;
CREATE POLICY "Authenticated users can view active tenants" ON public.tenants
  FOR SELECT
  TO authenticated
  USING (active = true);

-- Ajuste 3: Adicionar TO authenticated em TODAS as policies que faltam
-- (as policies criadas anteriormente usaram TO public por padrão)

-- professionals
DROP POLICY IF EXISTS "Professionals viewable within tenant" ON public.professionals;
DROP POLICY IF EXISTS "Tenant admins can insert professionals" ON public.professionals;
DROP POLICY IF EXISTS "Tenant admins can update professionals" ON public.professionals;
DROP POLICY IF EXISTS "Tenant admins can delete professionals" ON public.professionals;

CREATE POLICY "Professionals viewable within tenant" ON public.professionals
  FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can insert professionals" ON public.professionals
  FOR INSERT TO authenticated WITH CHECK (is_tenant_admin(auth.uid(), tenant_id) AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can update professionals" ON public.professionals
  FOR UPDATE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can delete professionals" ON public.professionals
  FOR DELETE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));

-- services
DROP POLICY IF EXISTS "Services viewable within tenant" ON public.services;
DROP POLICY IF EXISTS "Tenant admins can insert services" ON public.services;
DROP POLICY IF EXISTS "Tenant admins can update services" ON public.services;
DROP POLICY IF EXISTS "Tenant admins can delete services" ON public.services;

CREATE POLICY "Services viewable within tenant" ON public.services
  FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can insert services" ON public.services
  FOR INSERT TO authenticated WITH CHECK (is_tenant_admin(auth.uid(), tenant_id) AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can update services" ON public.services
  FOR UPDATE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can delete services" ON public.services
  FOR DELETE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));

-- bookings
DROP POLICY IF EXISTS "Users can view own bookings in tenant" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings in tenant" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings in tenant" ON public.bookings;
DROP POLICY IF EXISTS "Tenant admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Tenant admins can update all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Tenant admins can delete all bookings" ON public.bookings;

CREATE POLICY "Users can view own bookings in tenant" ON public.bookings
  FOR SELECT TO authenticated USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can create bookings in tenant" ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can update own bookings in tenant" ON public.bookings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can view all bookings" ON public.bookings
  FOR SELECT TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Tenant admins can update all bookings" ON public.bookings
  FOR UPDATE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can delete all bookings" ON public.bookings
  FOR DELETE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));

-- profiles
DROP POLICY IF EXISTS "Users can view own profile in tenant" ON public.profiles;
DROP POLICY IF EXISTS "Users can create own profile in tenant" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile in tenant" ON public.profiles;
DROP POLICY IF EXISTS "Tenant admins can view profiles in tenant" ON public.profiles;
DROP POLICY IF EXISTS "Tenant admins can delete profiles in tenant" ON public.profiles;

CREATE POLICY "Users can view own profile in tenant" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can create own profile in tenant" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can update own profile in tenant" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can view profiles in tenant" ON public.profiles
  FOR SELECT TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Tenant admins can delete profiles in tenant" ON public.profiles
  FOR DELETE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));

-- booking_services
DROP POLICY IF EXISTS "Users can view booking services in tenant" ON public.booking_services;
DROP POLICY IF EXISTS "Users can create booking services in tenant" ON public.booking_services;
DROP POLICY IF EXISTS "Tenant admins can manage booking services" ON public.booking_services;

CREATE POLICY "Users can view booking services in tenant" ON public.booking_services
  FOR SELECT TO authenticated USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_services.booking_id AND bookings.user_id = auth.uid() AND bookings.tenant_id = booking_services.tenant_id)
  );
CREATE POLICY "Users can create booking services in tenant" ON public.booking_services
  FOR INSERT TO authenticated WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    AND EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_services.booking_id AND bookings.user_id = auth.uid() AND bookings.tenant_id = booking_services.tenant_id)
  );
CREATE POLICY "Tenant admins can manage booking services" ON public.booking_services
  FOR ALL TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- user_roles
DROP POLICY IF EXISTS "Users can view own roles in tenant" ON public.user_roles;
DROP POLICY IF EXISTS "Tenant admins can view roles in tenant" ON public.user_roles;
DROP POLICY IF EXISTS "Tenant admins can manage roles in tenant" ON public.user_roles;

CREATE POLICY "Users can view own roles in tenant" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can view roles in tenant" ON public.user_roles
  FOR SELECT TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Tenant admins can manage roles in tenant" ON public.user_roles
  FOR ALL TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- work_settings
DROP POLICY IF EXISTS "Work settings viewable within tenant" ON public.work_settings;
DROP POLICY IF EXISTS "Tenant admins can update work settings" ON public.work_settings;
DROP POLICY IF EXISTS "Tenant admins can insert work settings" ON public.work_settings;

CREATE POLICY "Work settings viewable within tenant" ON public.work_settings
  FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can update work settings" ON public.work_settings
  FOR UPDATE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can insert work settings" ON public.work_settings
  FOR INSERT TO authenticated WITH CHECK (is_tenant_admin(auth.uid(), tenant_id) AND tenant_id = get_user_tenant_id(auth.uid()));

-- admin_notifications
DROP POLICY IF EXISTS "Tenant admins can view notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Users can create notifications in tenant" ON public.admin_notifications;
DROP POLICY IF EXISTS "Tenant admins can update notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Tenant admins can delete notifications" ON public.admin_notifications;

CREATE POLICY "Tenant admins can view notifications" ON public.admin_notifications
  FOR SELECT TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Users can create notifications in tenant" ON public.admin_notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can update notifications" ON public.admin_notifications
  FOR UPDATE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can delete notifications" ON public.admin_notifications
  FOR DELETE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));

-- gallery_photos
DROP POLICY IF EXISTS "Gallery photos viewable within tenant" ON public.gallery_photos;
DROP POLICY IF EXISTS "Users can create gallery photos in tenant" ON public.gallery_photos;
DROP POLICY IF EXISTS "Users can delete own gallery photos" ON public.gallery_photos;

CREATE POLICY "Gallery photos viewable within tenant" ON public.gallery_photos
  FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can create gallery photos in tenant" ON public.gallery_photos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can delete own gallery photos" ON public.gallery_photos
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

-- professional_photos
DROP POLICY IF EXISTS "Professional photos viewable within tenant" ON public.professional_photos;
DROP POLICY IF EXISTS "Tenant admins can insert professional photos" ON public.professional_photos;
DROP POLICY IF EXISTS "Tenant admins can update professional photos" ON public.professional_photos;
DROP POLICY IF EXISTS "Tenant admins can delete professional photos" ON public.professional_photos;

CREATE POLICY "Professional photos viewable within tenant" ON public.professional_photos
  FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can insert professional photos" ON public.professional_photos
  FOR INSERT TO authenticated WITH CHECK (is_tenant_admin(auth.uid(), tenant_id) AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can update professional photos" ON public.professional_photos
  FOR UPDATE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can delete professional photos" ON public.professional_photos
  FOR DELETE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));

-- professional_services
DROP POLICY IF EXISTS "Professional services viewable within tenant" ON public.professional_services;
DROP POLICY IF EXISTS "Tenant admins can manage professional services" ON public.professional_services;

CREATE POLICY "Professional services viewable within tenant" ON public.professional_services
  FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can manage professional services" ON public.professional_services
  FOR ALL TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- professional_blocked_dates
DROP POLICY IF EXISTS "Blocked dates viewable within tenant" ON public.professional_blocked_dates;
DROP POLICY IF EXISTS "Tenant admins can manage blocked dates" ON public.professional_blocked_dates;

CREATE POLICY "Blocked dates viewable within tenant" ON public.professional_blocked_dates
  FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can manage blocked dates" ON public.professional_blocked_dates
  FOR ALL TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- followers
DROP POLICY IF EXISTS "Followers viewable within tenant" ON public.followers;
DROP POLICY IF EXISTS "Users can follow in tenant" ON public.followers;
DROP POLICY IF EXISTS "Users can unfollow in tenant" ON public.followers;

CREATE POLICY "Followers viewable within tenant" ON public.followers
  FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can follow in tenant" ON public.followers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can unfollow in tenant" ON public.followers
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

-- reviews
DROP POLICY IF EXISTS "Reviews viewable within tenant" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews in tenant" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews in tenant" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete own reviews in tenant" ON public.reviews;

CREATE POLICY "Reviews viewable within tenant" ON public.reviews
  FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can create reviews in tenant" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can update own reviews in tenant" ON public.reviews
  FOR UPDATE TO authenticated USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can delete own reviews in tenant" ON public.reviews
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

-- photo_likes
DROP POLICY IF EXISTS "Photo likes viewable within tenant" ON public.photo_likes;
DROP POLICY IF EXISTS "Users can like photos in tenant" ON public.photo_likes;
DROP POLICY IF EXISTS "Users can remove own likes in tenant" ON public.photo_likes;

CREATE POLICY "Photo likes viewable within tenant" ON public.photo_likes
  FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can like photos in tenant" ON public.photo_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can remove own likes in tenant" ON public.photo_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

-- photo_comments
DROP POLICY IF EXISTS "Photo comments viewable within tenant" ON public.photo_comments;
DROP POLICY IF EXISTS "Users can comment in tenant" ON public.photo_comments;
DROP POLICY IF EXISTS "Users can update own comments in tenant" ON public.photo_comments;
DROP POLICY IF EXISTS "Users can delete own comments in tenant" ON public.photo_comments;
DROP POLICY IF EXISTS "Tenant admins can delete comments in tenant" ON public.photo_comments;

CREATE POLICY "Photo comments viewable within tenant" ON public.photo_comments
  FOR SELECT TO authenticated USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can comment in tenant" ON public.photo_comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can update own comments in tenant" ON public.photo_comments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can delete own comments in tenant" ON public.photo_comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can delete comments in tenant" ON public.photo_comments
  FOR DELETE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));

-- tenant_users
DROP POLICY IF EXISTS "Users can view their own tenant memberships" ON public.tenant_users;
DROP POLICY IF EXISTS "Tenant admins can view all members" ON public.tenant_users;
DROP POLICY IF EXISTS "Tenant admins can manage members" ON public.tenant_users;

CREATE POLICY "Users can view their own tenant memberships" ON public.tenant_users
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Tenant admins can view all members" ON public.tenant_users
  FOR SELECT TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Tenant admins can manage members" ON public.tenant_users
  FOR ALL TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));
