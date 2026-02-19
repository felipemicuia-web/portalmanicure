-- ============================================================
-- MIGRATION PACK — Portal Manicure
-- Full schema for deploying to a new Supabase project
-- Generated: 2026-02-19
-- ============================================================

-- ============================================================
-- 1. ENUM TYPES
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- ============================================================
-- 2. TABLES (in dependency order)
-- ============================================================

-- TENANTS (root table — no FK dependencies)
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  custom_domain TEXT,
  logo_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (slug)
);

-- TENANT_USERS
CREATE TABLE public.tenant_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- USER_ROLES
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PROFILES
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  notes TEXT,
  blocked BOOLEAN NOT NULL DEFAULT false,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- PROFESSIONALS
CREATE TABLE public.professionals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  photo_url TEXT,
  bio TEXT,
  subtitle TEXT,
  instagram TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  working_days INTEGER[],
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SERVICES
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PROFESSIONAL_SERVICES (junction)
CREATE TABLE public.professional_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (professional_id, service_id)
);

-- COUPONS
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL,
  discount_value NUMERIC NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 1,
  current_uses INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code),
  CHECK (discount_value > 0),
  CHECK (discount_type IN ('fixed', 'percentage')),
  CHECK (discount_type <> 'percentage' OR (discount_value >= 1 AND discount_value <= 100))
);

-- BOOKINGS
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  total_price NUMERIC NOT NULL DEFAULT 0,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  coupon_id UUID REFERENCES public.coupons(id),
  coupon_code TEXT,
  discount_type TEXT,
  discount_value NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (status IN ('confirmed', 'cancelled', 'completed'))
);

-- BOOKING_SERVICES (junction)
CREATE TABLE public.booking_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- COUPON_USAGE
CREATE TABLE public.coupon_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id),
  booking_id UUID NOT NULL REFERENCES public.bookings(id),
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PROFESSIONAL_PHOTOS
CREATE TABLE public.professional_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PROFESSIONAL_BLOCKED_DATES
CREATE TABLE public.professional_blocked_dates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason TEXT,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (professional_id, blocked_date)
);

-- GALLERY_PHOTOS
CREATE TABLE public.gallery_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FOLLOWERS
CREATE TABLE public.followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, professional_id)
);

-- REVIEWS
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  comment TEXT,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PHOTO_LIKES
CREATE TABLE public.photo_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES public.professional_photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (photo_id, user_id)
);

-- PHOTO_COMMENTS
CREATE TABLE public.photo_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES public.professional_photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ADMIN_NOTIFICATIONS
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- WORK_SETTINGS
CREATE TABLE public.work_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '18:00',
  interval_minutes INTEGER NOT NULL DEFAULT 10,
  slot_step_minutes INTEGER NOT NULL DEFAULT 30,
  lunch_start TIME,
  lunch_end TIME,
  working_days INTEGER[] NOT NULL DEFAULT ARRAY[1,2,3,4,5,6],
  site_name TEXT DEFAULT 'Agendamento',
  site_subtitle TEXT DEFAULT 'Agende seu horário',
  logo_url TEXT,
  logo_display_mode TEXT NOT NULL DEFAULT 'icon',
  site_font TEXT DEFAULT 'Inter',
  theme_id TEXT NOT NULL DEFAULT 'galaxy',
  whatsapp_template TEXT DEFAULT 'Olá {nome}! 👋

Seu agendamento foi confirmado! ✅

📅 *Data:* {data}
🕐 *Horário:* {horario}
👤 *Profissional:* {profissional}
💰 *Valor:* {valor}
⏱️ *Duração:* {duracao} minutos
{obs}
Aguardamos você! 💅✨',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. INDEXES
-- ============================================================
CREATE INDEX idx_bookings_tenant ON public.bookings (tenant_id);
CREATE INDEX idx_bookings_tenant_date ON public.bookings (tenant_id, booking_date);
CREATE INDEX idx_bookings_tenant_user ON public.bookings (tenant_id, user_id);
CREATE INDEX idx_bookings_deleted_at ON public.bookings (deleted_at);
CREATE UNIQUE INDEX idx_unique_booking_slot ON public.bookings (professional_id, booking_date, booking_time) WHERE status <> 'cancelled';
CREATE INDEX idx_booking_services_tenant ON public.booking_services (tenant_id);
CREATE INDEX idx_coupons_tenant_code ON public.coupons (tenant_id, code);
CREATE INDEX idx_coupon_usage_coupon ON public.coupon_usage (coupon_id);
CREATE INDEX idx_coupon_usage_user ON public.coupon_usage (user_id);
CREATE INDEX idx_followers_tenant ON public.followers (tenant_id);
CREATE INDEX idx_gallery_photos_tenant ON public.gallery_photos (tenant_id);
CREATE INDEX idx_photo_comments_photo_id ON public.photo_comments (photo_id);
CREATE INDEX idx_photo_comments_tenant ON public.photo_comments (tenant_id);
CREATE INDEX idx_photo_likes_photo_id ON public.photo_likes (photo_id);
CREATE INDEX idx_photo_likes_tenant ON public.photo_likes (tenant_id);
CREATE INDEX idx_blocked_dates_tenant ON public.professional_blocked_dates (tenant_id);
CREATE INDEX idx_professional_photos_professional_id ON public.professional_photos (professional_id);
CREATE INDEX idx_professional_photos_tenant ON public.professional_photos (tenant_id);
CREATE INDEX idx_professional_services_tenant ON public.professional_services (tenant_id);
CREATE INDEX idx_professionals_tenant ON public.professionals (tenant_id);
CREATE INDEX idx_profiles_tenant ON public.profiles (tenant_id);
CREATE INDEX idx_profiles_user_id ON public.profiles (user_id);
CREATE INDEX idx_reviews_professional ON public.reviews (professional_id);
CREATE INDEX idx_reviews_tenant ON public.reviews (tenant_id);
CREATE INDEX idx_services_tenant ON public.services (tenant_id);
CREATE INDEX idx_admin_notifications_tenant ON public.admin_notifications (tenant_id);
CREATE INDEX idx_tenant_users_tenant ON public.tenant_users (tenant_id);
CREATE INDEX idx_user_roles_tenant ON public.user_roles (tenant_id);

-- ============================================================
-- 4. SECURITY DEFINER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT tenant_id FROM public.tenant_users WHERE user_id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE user_id = _user_id AND tenant_id = _tenant_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE user_id = _user_id AND tenant_id = _tenant_id AND role IN ('admin', 'owner')
  );
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.resolve_tenant(p_slug TEXT DEFAULT NULL, p_domain TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT id FROM public.tenants
  WHERE active = true
    AND ((p_slug IS NOT NULL AND slug = p_slug) OR (p_domain IS NOT NULL AND custom_domain = p_domain))
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.validate_phone_format(phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN phone ~ '^[0-9]{10,15}$' OR phone ~ '^\+?[0-9\s\-\(\)]{10,20}$';
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_booking_phone()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT public.validate_phone_format(NEW.client_phone) THEN
    RAISE EXCEPTION 'Formato de telefone inválido. Use apenas números (10-15 dígitos).';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_profile_phone()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone != '' AND NOT public.validate_phone_format(NEW.phone) THEN
    RAISE EXCEPTION 'Formato de telefone inválido. Use apenas números (10-15 dígitos).';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_photo_like_count(p_photo_id UUID)
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COUNT(*)::INTEGER FROM public.photo_likes WHERE photo_id = p_photo_id;
$$;

CREATE OR REPLACE FUNCTION public.has_liked_photo(p_photo_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.photo_likes WHERE photo_id = p_photo_id AND user_id = p_user_id);
$$;

CREATE OR REPLACE FUNCTION public.get_follower_count(p_professional_id UUID)
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COUNT(*)::INTEGER FROM public.followers WHERE professional_id = p_professional_id;
$$;

CREATE OR REPLACE FUNCTION public.is_following(p_user_id UUID, p_professional_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM public.followers WHERE user_id = p_user_id AND professional_id = p_professional_id);
$$;

CREATE OR REPLACE FUNCTION public.get_average_rating(p_professional_id UUID)
RETURNS NUMERIC
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0) FROM public.reviews WHERE professional_id = p_professional_id;
$$;

CREATE OR REPLACE FUNCTION public.get_public_gallery_photos(limit_count INTEGER DEFAULT 50)
RETURNS TABLE(id UUID, image_url TEXT, caption TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql STABLE
SET search_path = 'public'
AS $$
  SELECT gp.id, gp.image_url, gp.caption, gp.created_at
  FROM public.gallery_photos gp ORDER BY gp.created_at DESC LIMIT limit_count;
$$;

CREATE OR REPLACE FUNCTION public.hard_delete_booking(p_booking_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_tenant_id UUID;
  v_deleted_at TIMESTAMPTZ;
BEGIN
  SELECT tenant_id, deleted_at INTO v_tenant_id, v_deleted_at
  FROM public.bookings WHERE id = p_booking_id;

  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'Booking not found'; END IF;
  IF v_deleted_at IS NULL THEN RAISE EXCEPTION 'Booking must be in trash before permanent deletion'; END IF;
  IF NOT public.is_tenant_admin(auth.uid(), v_tenant_id) THEN
    RAISE EXCEPTION 'Only admins can permanently delete bookings';
  END IF;

  DELETE FROM public.booking_services WHERE booking_id = p_booking_id;
  DELETE FROM public.coupon_usage WHERE booking_id = p_booking_id;
  DELETE FROM public.admin_notifications WHERE booking_id = p_booking_id;
  DELETE FROM public.bookings WHERE id = p_booking_id;
END;
$$;

-- ============================================================
-- 5. ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. RLS POLICIES (all PERMISSIVE)
-- ============================================================

-- === TENANTS ===
CREATE POLICY "Anyone can view active tenants" ON public.tenants FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "Tenant admins can update their tenant" ON public.tenants FOR UPDATE TO authenticated USING (is_tenant_admin(auth.uid(), id)) WITH CHECK (is_tenant_admin(auth.uid(), id));

-- === TENANT_USERS ===
CREATE POLICY "Users can view their own tenant memberships" ON public.tenant_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Tenant admins can view all members" ON public.tenant_users FOR SELECT USING (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Users can self-register into tenant" ON public.tenant_users FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Tenant admins can manage members" ON public.tenant_users FOR ALL TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

-- === USER_ROLES ===
CREATE POLICY "Users can view own roles in tenant" ON public.user_roles FOR SELECT USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can view roles in tenant" ON public.user_roles FOR SELECT USING (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Tenant admins can manage roles in tenant" ON public.user_roles FOR ALL TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- === PROFILES ===
CREATE POLICY "Users can view own profile in tenant" ON public.profiles FOR SELECT USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can view profiles in tenant" ON public.profiles FOR SELECT USING (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Users can create own profile in tenant" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile in tenant" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid())) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can delete profiles in tenant" ON public.profiles FOR DELETE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));

-- === PROFESSIONALS ===
CREATE POLICY "Professionals viewable within tenant" ON public.professionals FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can insert professionals" ON public.professionals FOR INSERT TO authenticated WITH CHECK (is_tenant_admin(auth.uid(), tenant_id) AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can update professionals" ON public.professionals FOR UPDATE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can delete professionals" ON public.professionals FOR DELETE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));

-- === SERVICES ===
CREATE POLICY "Services viewable within tenant" ON public.services FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can insert services" ON public.services FOR INSERT TO authenticated WITH CHECK (is_tenant_admin(auth.uid(), tenant_id) AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can update services" ON public.services FOR UPDATE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can delete services" ON public.services FOR DELETE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));

-- === PROFESSIONAL_SERVICES ===
CREATE POLICY "Professional services viewable within tenant" ON public.professional_services FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can manage professional services" ON public.professional_services FOR ALL TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- === BOOKINGS ===
CREATE POLICY "Users can view own bookings in tenant" ON public.bookings FOR SELECT USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can view all bookings" ON public.bookings FOR SELECT USING (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Users can create bookings in tenant" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can update own bookings in tenant" ON public.bookings FOR UPDATE TO authenticated USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid())) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can update all bookings" ON public.bookings FOR UPDATE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can hard delete bookings" ON public.bookings FOR DELETE USING (is_tenant_admin(auth.uid(), tenant_id) AND deleted_at IS NOT NULL);

-- === BOOKING_SERVICES ===
CREATE POLICY "Users can view booking services in tenant" ON public.booking_services FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()) AND EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_services.booking_id AND bookings.user_id = auth.uid() AND bookings.tenant_id = booking_services.tenant_id));
CREATE POLICY "Users can create booking services in tenant" ON public.booking_services FOR INSERT TO authenticated WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_services.booking_id AND bookings.user_id = auth.uid() AND bookings.tenant_id = booking_services.tenant_id));
CREATE POLICY "Tenant admins can manage booking services" ON public.booking_services FOR ALL TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- === COUPONS ===
CREATE POLICY "Coupons viewable within tenant" ON public.coupons FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can insert coupons" ON public.coupons FOR INSERT TO authenticated WITH CHECK (is_tenant_admin(auth.uid(), tenant_id) AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can update coupons" ON public.coupons FOR UPDATE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can delete coupons" ON public.coupons FOR DELETE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));

-- === COUPON_USAGE ===
CREATE POLICY "Coupon usage viewable by admins" ON public.coupon_usage FOR SELECT USING (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Users can create coupon usage in tenant" ON public.coupon_usage FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

-- === PROFESSIONAL_PHOTOS ===
CREATE POLICY "Professional photos viewable within tenant" ON public.professional_photos FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can insert professional photos" ON public.professional_photos FOR INSERT TO authenticated WITH CHECK (is_tenant_admin(auth.uid(), tenant_id) AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can update professional photos" ON public.professional_photos FOR UPDATE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can delete professional photos" ON public.professional_photos FOR DELETE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));

-- === PROFESSIONAL_BLOCKED_DATES ===
CREATE POLICY "Blocked dates viewable within tenant" ON public.professional_blocked_dates FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can manage blocked dates" ON public.professional_blocked_dates FOR ALL TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- === GALLERY_PHOTOS ===
CREATE POLICY "Gallery photos viewable within tenant" ON public.gallery_photos FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can create gallery photos in tenant" ON public.gallery_photos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can delete own gallery photos" ON public.gallery_photos FOR DELETE TO authenticated USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

-- === FOLLOWERS ===
CREATE POLICY "Followers viewable within tenant" ON public.followers FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can follow in tenant" ON public.followers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can unfollow in tenant" ON public.followers FOR DELETE TO authenticated USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

-- === REVIEWS ===
CREATE POLICY "Reviews viewable within tenant" ON public.reviews FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can create reviews in tenant" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can update own reviews in tenant" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid())) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can delete own reviews in tenant" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can delete any review in tenant" ON public.reviews FOR DELETE USING (is_tenant_admin(auth.uid(), tenant_id));

-- === PHOTO_LIKES ===
CREATE POLICY "Photo likes viewable within tenant" ON public.photo_likes FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can like photos in tenant" ON public.photo_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can remove own likes in tenant" ON public.photo_likes FOR DELETE TO authenticated USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

-- === PHOTO_COMMENTS ===
CREATE POLICY "Photo comments viewable within tenant" ON public.photo_comments FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can comment in tenant" ON public.photo_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can update own comments in tenant" ON public.photo_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid())) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can delete own comments in tenant" ON public.photo_comments FOR DELETE TO authenticated USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can delete comments in tenant" ON public.photo_comments FOR DELETE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));

-- === ADMIN_NOTIFICATIONS ===
CREATE POLICY "Tenant admins can view notifications" ON public.admin_notifications FOR SELECT USING (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Users can create notifications in tenant" ON public.admin_notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can update notifications" ON public.admin_notifications FOR UPDATE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can delete notifications" ON public.admin_notifications FOR DELETE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));

-- === WORK_SETTINGS ===
CREATE POLICY "Work settings viewable within tenant" ON public.work_settings FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can insert work settings" ON public.work_settings FOR INSERT TO authenticated WITH CHECK (is_tenant_admin(auth.uid(), tenant_id) AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Tenant admins can update work settings" ON public.work_settings FOR UPDATE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- ============================================================
-- 7. STORAGE BUCKETS + POLICIES
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Gallery images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins can upload professional avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update professional avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete professional avatars" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can upload their own gallery photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gallery' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own gallery photos" ON storage.objects FOR DELETE USING (bucket_id = 'gallery' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- ============================================================
-- 8. SEED: DEFAULT TENANT
-- ============================================================
INSERT INTO public.tenants (id, slug, name, plan, active)
VALUES ('00000000-0000-0000-0000-000000000001', 'default', 'Default Tenant', 'free', true)
ON CONFLICT (id) DO NOTHING;
