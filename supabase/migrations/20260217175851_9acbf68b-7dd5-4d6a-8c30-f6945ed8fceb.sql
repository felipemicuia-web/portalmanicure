
-- ============================================================
-- FASE 1: Criar tabelas tenants e tenant_users
-- ============================================================

-- Tabela de tenants (cada cliente/empresa)
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  custom_domain text UNIQUE,
  name text NOT NULL,
  logo_url text,
  plan text NOT NULL DEFAULT 'free',
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Tabela de associação usuário <-> tenant
CREATE TABLE public.tenant_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- Função SECURITY DEFINER para obter o tenant_id do usuário
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
  LIMIT 1;
$$;

-- Função para verificar se o usuário pertence a um tenant
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
  );
$$;

-- Função para verificar se usuário é admin do tenant
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
  );
$$;

-- ============================================================
-- FASE 2: Adicionar tenant_id em todas as tabelas existentes
-- ============================================================

-- 1. professionals
ALTER TABLE public.professionals ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_professionals_tenant ON public.professionals(tenant_id);

-- 2. services
ALTER TABLE public.services ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_services_tenant ON public.services(tenant_id);

-- 3. bookings
ALTER TABLE public.bookings ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_bookings_tenant ON public.bookings(tenant_id);

-- 4. booking_services (inherits tenant from booking, but adding for direct queries)
ALTER TABLE public.booking_services ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_booking_services_tenant ON public.booking_services(tenant_id);

-- 5. work_settings
ALTER TABLE public.work_settings ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_work_settings_tenant ON public.work_settings(tenant_id);

-- 6. gallery_photos
ALTER TABLE public.gallery_photos ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_gallery_photos_tenant ON public.gallery_photos(tenant_id);

-- 7. professional_photos
ALTER TABLE public.professional_photos ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_professional_photos_tenant ON public.professional_photos(tenant_id);

-- 8. professional_services
ALTER TABLE public.professional_services ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_professional_services_tenant ON public.professional_services(tenant_id);

-- 9. professional_blocked_dates
ALTER TABLE public.professional_blocked_dates ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_professional_blocked_dates_tenant ON public.professional_blocked_dates(tenant_id);

-- 10. followers
ALTER TABLE public.followers ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_followers_tenant ON public.followers(tenant_id);

-- 11. reviews
ALTER TABLE public.reviews ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_reviews_tenant ON public.reviews(tenant_id);

-- 12. photo_likes
ALTER TABLE public.photo_likes ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_photo_likes_tenant ON public.photo_likes(tenant_id);

-- 13. photo_comments
ALTER TABLE public.photo_comments ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_photo_comments_tenant ON public.photo_comments(tenant_id);

-- 14. admin_notifications
ALTER TABLE public.admin_notifications ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_admin_notifications_tenant ON public.admin_notifications(tenant_id);

-- 15. profiles
ALTER TABLE public.profiles ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_profiles_tenant ON public.profiles(tenant_id);

-- 16. user_roles
ALTER TABLE public.user_roles ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_user_roles_tenant ON public.user_roles(tenant_id);

-- ============================================================
-- Criar tenant padrão e migrar dados existentes
-- ============================================================

INSERT INTO public.tenants (id, slug, name, plan, active)
VALUES ('00000000-0000-0000-0000-000000000001', 'default', 'Default Tenant', 'pro', true);

-- Associar usuários existentes ao tenant padrão
INSERT INTO public.tenant_users (tenant_id, user_id, role)
SELECT '00000000-0000-0000-0000-000000000001', ur.user_id, 
  CASE WHEN ur.role = 'admin' THEN 'admin' ELSE 'user' END
FROM public.user_roles ur
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- Associar profiles sem user_roles ao tenant padrão como user
INSERT INTO public.tenant_users (tenant_id, user_id, role)
SELECT '00000000-0000-0000-0000-000000000001', p.user_id, 'user'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.tenant_users tu WHERE tu.user_id = p.user_id
)
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- Atualizar todos os registros existentes com o tenant padrão
UPDATE public.professionals SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.services SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.bookings SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.booking_services SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.work_settings SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.gallery_photos SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.professional_photos SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.professional_services SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.professional_blocked_dates SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.followers SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.reviews SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.photo_likes SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.photo_comments SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.admin_notifications SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.profiles SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE public.user_roles SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;

-- ============================================================
-- FASE 3: Reescrever TODAS as RLS policies com isolamento por tenant
-- ============================================================

-- === TENANTS ===
CREATE POLICY "Anyone can view active tenants" ON public.tenants
  FOR SELECT USING (active = true);

CREATE POLICY "Tenant admins can update their tenant" ON public.tenants
  FOR UPDATE USING (is_tenant_admin(auth.uid(), id));

-- === TENANT_USERS ===
CREATE POLICY "Users can view their own tenant memberships" ON public.tenant_users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Tenant admins can view all members" ON public.tenant_users
  FOR SELECT USING (is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can manage members" ON public.tenant_users
  FOR ALL USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

-- === PROFESSIONALS ===
DROP POLICY IF EXISTS "Professionals are viewable by everyone" ON public.professionals;
DROP POLICY IF EXISTS "Admins can insert professionals" ON public.professionals;
DROP POLICY IF EXISTS "Admins can update professionals" ON public.professionals;
DROP POLICY IF EXISTS "Admins can delete professionals" ON public.professionals;

CREATE POLICY "Professionals viewable within tenant" ON public.professionals
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()) OR tenant_id IS NULL);

CREATE POLICY "Tenant admins can insert professionals" ON public.professionals
  FOR INSERT WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can update professionals" ON public.professionals
  FOR UPDATE USING (is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can delete professionals" ON public.professionals
  FOR DELETE USING (is_tenant_admin(auth.uid(), tenant_id));

-- === SERVICES ===
DROP POLICY IF EXISTS "Services are viewable by everyone" ON public.services;
DROP POLICY IF EXISTS "Admins can insert services" ON public.services;
DROP POLICY IF EXISTS "Admins can update services" ON public.services;
DROP POLICY IF EXISTS "Admins can delete services" ON public.services;

CREATE POLICY "Services viewable within tenant" ON public.services
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()) OR tenant_id IS NULL);

CREATE POLICY "Tenant admins can insert services" ON public.services
  FOR INSERT WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can update services" ON public.services
  FOR UPDATE USING (is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can delete services" ON public.services
  FOR DELETE USING (is_tenant_admin(auth.uid(), tenant_id));

-- === BOOKINGS ===
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can delete all bookings" ON public.bookings;

CREATE POLICY "Users can view own bookings in tenant" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create bookings in tenant" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update own bookings in tenant" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant admins can view all bookings" ON public.bookings
  FOR SELECT USING (is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can update all bookings" ON public.bookings
  FOR UPDATE USING (is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can delete all bookings" ON public.bookings
  FOR DELETE USING (is_tenant_admin(auth.uid(), tenant_id));

-- === BOOKING_SERVICES ===
DROP POLICY IF EXISTS "Users can view their booking services" ON public.booking_services;
DROP POLICY IF EXISTS "Users can create their booking services" ON public.booking_services;

CREATE POLICY "Users can view booking services in tenant" ON public.booking_services
  FOR SELECT USING (
    tenant_id = get_user_tenant_id(auth.uid()) AND
    EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_services.booking_id AND bookings.user_id = auth.uid())
  );

CREATE POLICY "Users can create booking services in tenant" ON public.booking_services
  FOR INSERT WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) AND
    EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_services.booking_id AND bookings.user_id = auth.uid())
  );

CREATE POLICY "Tenant admins can manage booking services" ON public.booking_services
  FOR ALL USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

-- === WORK_SETTINGS ===
DROP POLICY IF EXISTS "Anyone can view work settings" ON public.work_settings;
DROP POLICY IF EXISTS "Admins can update work settings" ON public.work_settings;
DROP POLICY IF EXISTS "Admins can insert work settings" ON public.work_settings;

CREATE POLICY "Work settings viewable within tenant" ON public.work_settings
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()) OR tenant_id IS NULL);

CREATE POLICY "Tenant admins can update work settings" ON public.work_settings
  FOR UPDATE USING (is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can insert work settings" ON public.work_settings
  FOR INSERT WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

-- === PROFILES ===
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Tenant admins can view profiles in tenant" ON public.profiles
  FOR SELECT USING (is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can delete profiles in tenant" ON public.profiles
  FOR DELETE USING (is_tenant_admin(auth.uid(), tenant_id));

-- === USER_ROLES ===
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Tenant admins can view roles in tenant" ON public.user_roles
  FOR SELECT USING (is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can manage roles in tenant" ON public.user_roles
  FOR ALL USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

-- === GALLERY_PHOTOS ===
DROP POLICY IF EXISTS "Users can create their own gallery photos" ON public.gallery_photos;
DROP POLICY IF EXISTS "Users can delete their own gallery photos" ON public.gallery_photos;
DROP POLICY IF EXISTS "Users can view their own gallery photos with full details" ON public.gallery_photos;
DROP POLICY IF EXISTS "Gallery photos are viewable by everyone" ON public.gallery_photos;

CREATE POLICY "Gallery photos viewable within tenant" ON public.gallery_photos
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()) OR tenant_id IS NULL);

CREATE POLICY "Users can create gallery photos in tenant" ON public.gallery_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete own gallery photos" ON public.gallery_photos
  FOR DELETE USING (auth.uid() = user_id);

-- === PROFESSIONAL_PHOTOS ===
DROP POLICY IF EXISTS "Anyone can view professional photos" ON public.professional_photos;
DROP POLICY IF EXISTS "Admins can insert professional photos" ON public.professional_photos;
DROP POLICY IF EXISTS "Admins can update professional photos" ON public.professional_photos;
DROP POLICY IF EXISTS "Admins can delete professional photos" ON public.professional_photos;

CREATE POLICY "Professional photos viewable within tenant" ON public.professional_photos
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()) OR tenant_id IS NULL);

CREATE POLICY "Tenant admins can insert professional photos" ON public.professional_photos
  FOR INSERT WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can update professional photos" ON public.professional_photos
  FOR UPDATE USING (is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can delete professional photos" ON public.professional_photos
  FOR DELETE USING (is_tenant_admin(auth.uid(), tenant_id));

-- === PROFESSIONAL_SERVICES ===
DROP POLICY IF EXISTS "Anyone can view professional services" ON public.professional_services;
DROP POLICY IF EXISTS "Admins can manage professional services" ON public.professional_services;

CREATE POLICY "Professional services viewable within tenant" ON public.professional_services
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()) OR tenant_id IS NULL);

CREATE POLICY "Tenant admins can manage professional services" ON public.professional_services
  FOR ALL USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

-- === PROFESSIONAL_BLOCKED_DATES ===
DROP POLICY IF EXISTS "Anyone can view blocked dates" ON public.professional_blocked_dates;
DROP POLICY IF EXISTS "Admins can manage blocked dates" ON public.professional_blocked_dates;

CREATE POLICY "Blocked dates viewable within tenant" ON public.professional_blocked_dates
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()) OR tenant_id IS NULL);

CREATE POLICY "Tenant admins can manage blocked dates" ON public.professional_blocked_dates
  FOR ALL USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

-- === FOLLOWERS ===
DROP POLICY IF EXISTS "Anyone can view followers count" ON public.followers;
DROP POLICY IF EXISTS "Users can follow professionals" ON public.followers;
DROP POLICY IF EXISTS "Users can unfollow professionals" ON public.followers;

CREATE POLICY "Followers viewable within tenant" ON public.followers
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()) OR tenant_id IS NULL);

CREATE POLICY "Users can follow in tenant" ON public.followers
  FOR INSERT WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can unfollow" ON public.followers
  FOR DELETE USING (auth.uid() = user_id);

-- === REVIEWS ===
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can create their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;

CREATE POLICY "Reviews viewable within tenant" ON public.reviews
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()) OR tenant_id IS NULL);

CREATE POLICY "Users can create reviews in tenant" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

-- === PHOTO_LIKES ===
DROP POLICY IF EXISTS "Anyone can view photo likes" ON public.photo_likes;
DROP POLICY IF EXISTS "Authenticated users can like photos" ON public.photo_likes;
DROP POLICY IF EXISTS "Users can remove their likes" ON public.photo_likes;

CREATE POLICY "Photo likes viewable within tenant" ON public.photo_likes
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()) OR tenant_id IS NULL);

CREATE POLICY "Users can like photos in tenant" ON public.photo_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can remove own likes" ON public.photo_likes
  FOR DELETE USING (auth.uid() = user_id);

-- === PHOTO_COMMENTS ===
DROP POLICY IF EXISTS "Anyone can view photo comments" ON public.photo_comments;
DROP POLICY IF EXISTS "Authenticated users can comment" ON public.photo_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.photo_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.photo_comments;
DROP POLICY IF EXISTS "Admins can delete any comment" ON public.photo_comments;

CREATE POLICY "Photo comments viewable within tenant" ON public.photo_comments
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()) OR tenant_id IS NULL);

CREATE POLICY "Users can comment in tenant" ON public.photo_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update own comments" ON public.photo_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.photo_comments
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Tenant admins can delete comments" ON public.photo_comments
  FOR DELETE USING (is_tenant_admin(auth.uid(), tenant_id));

-- === ADMIN_NOTIFICATIONS ===
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Admins can update notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Admins can delete notifications" ON public.admin_notifications;

CREATE POLICY "Tenant admins can view notifications" ON public.admin_notifications
  FOR SELECT USING (is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Users can create notifications in tenant" ON public.admin_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant admins can update notifications" ON public.admin_notifications
  FOR UPDATE USING (is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can delete notifications" ON public.admin_notifications
  FOR DELETE USING (is_tenant_admin(auth.uid(), tenant_id));

-- ============================================================
-- Trigger para updated_at no tenants
-- ============================================================
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Função para resolver tenant por slug ou domínio (para edge functions)
-- ============================================================
CREATE OR REPLACE FUNCTION public.resolve_tenant(p_slug text DEFAULT NULL, p_domain text DEFAULT NULL)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.tenants
  WHERE active = true
    AND (
      (p_slug IS NOT NULL AND slug = p_slug)
      OR (p_domain IS NOT NULL AND custom_domain = p_domain)
    )
  LIMIT 1;
$$;
