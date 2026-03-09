-- Remove policies that require user_belongs_to_tenant() for end-user operations

-- 1. PROFILES
DROP POLICY IF EXISTS "Users can create own profile in tenant" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile in tenant" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile in tenant" ON public.profiles;

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

-- 2. BOOKINGS
DROP POLICY IF EXISTS "Users can create bookings in tenant" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings in tenant" ON public.bookings;
DROP POLICY IF EXISTS "Users can view own bookings in tenant" ON public.bookings;

CREATE POLICY "Users can insert own bookings" 
ON public.bookings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" 
ON public.bookings FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own bookings" 
ON public.bookings FOR SELECT 
USING (auth.uid() = user_id);

-- 3. BOOKING_SERVICES
DROP POLICY IF EXISTS "Users can create booking services in tenant" ON public.booking_services;
DROP POLICY IF EXISTS "Users can view booking services in tenant" ON public.booking_services;

CREATE POLICY "Users can insert own booking services" 
ON public.booking_services FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.user_id = auth.uid()));

CREATE POLICY "Users can view own booking services" 
ON public.booking_services FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.user_id = auth.uid()));

-- 4. COUPON_USAGE
DROP POLICY IF EXISTS "Users can create coupon usage in tenant" ON public.coupon_usage;
CREATE POLICY "Users can insert own coupon usage" 
ON public.coupon_usage FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. SOCIAL & INTERACTIONS (Reviews, Followers, Likes, Comments, Notifications)
DROP POLICY IF EXISTS "Reviews viewable within tenant" ON public.reviews;
DROP POLICY IF EXISTS "Users can create reviews in tenant" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete own reviews in tenant" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews in tenant" ON public.reviews;

CREATE POLICY "Reviews are public" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Followers viewable within tenant" ON public.followers;
DROP POLICY IF EXISTS "Users can follow in tenant" ON public.followers;
DROP POLICY IF EXISTS "Users can unfollow in tenant" ON public.followers;

CREATE POLICY "Followers are public" ON public.followers FOR SELECT USING (true);
CREATE POLICY "Users can insert own followers" ON public.followers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own followers" ON public.followers FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Photo likes viewable within tenant" ON public.photo_likes;
DROP POLICY IF EXISTS "Users can like photos in tenant" ON public.photo_likes;
DROP POLICY IF EXISTS "Users can remove own likes in tenant" ON public.photo_likes;

CREATE POLICY "Photo likes are public" ON public.photo_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own likes" ON public.photo_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.photo_likes FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Photo comments viewable within tenant" ON public.photo_comments;
DROP POLICY IF EXISTS "Users can comment in tenant" ON public.photo_comments;
DROP POLICY IF EXISTS "Users can delete own comments in tenant" ON public.photo_comments;
DROP POLICY IF EXISTS "Users can update own comments in tenant" ON public.photo_comments;

CREATE POLICY "Photo comments are public" ON public.photo_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert own comments" ON public.photo_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.photo_comments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.photo_comments FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create notifications in tenant" ON public.admin_notifications;
CREATE POLICY "Users can insert own notifications" ON public.admin_notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. CATALOG (Make read-only data public for all users to browse professionals and services)
DROP POLICY IF EXISTS "Professionals viewable within tenant" ON public.professionals;
CREATE POLICY "Professionals are public" ON public.professionals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Services viewable within tenant" ON public.services;
CREATE POLICY "Services are public" ON public.services FOR SELECT USING (true);

DROP POLICY IF EXISTS "Professional services viewable within tenant" ON public.professional_services;
CREATE POLICY "Professional services are public" ON public.professional_services FOR SELECT USING (true);

DROP POLICY IF EXISTS "Work settings viewable within tenant" ON public.work_settings;
CREATE POLICY "Work settings are public" ON public.work_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Professional photos viewable within tenant" ON public.professional_photos;
CREATE POLICY "Professional photos are public" ON public.professional_photos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Gallery photos viewable within tenant" ON public.gallery_photos;
CREATE POLICY "Gallery photos are public" ON public.gallery_photos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Blocked dates viewable within tenant" ON public.professional_blocked_dates;
CREATE POLICY "Blocked dates are public" ON public.professional_blocked_dates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Coupons viewable within tenant" ON public.coupons;
CREATE POLICY "Coupons are public" ON public.coupons FOR SELECT USING (true);
