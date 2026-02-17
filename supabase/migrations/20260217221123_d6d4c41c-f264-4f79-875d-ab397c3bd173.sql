
-- Coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('fixed', 'percentage')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  max_uses INTEGER NOT NULL DEFAULT 1,
  current_uses INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_coupon_code_per_tenant UNIQUE (tenant_id, code),
  CONSTRAINT valid_percentage CHECK (discount_type != 'percentage' OR (discount_value >= 1 AND discount_value <= 100))
);

-- Coupon usage tracking
CREATE TABLE public.coupon_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id),
  booking_id UUID NOT NULL REFERENCES public.bookings(id),
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add coupon fields to bookings
ALTER TABLE public.bookings
  ADD COLUMN coupon_id UUID REFERENCES public.coupons(id),
  ADD COLUMN coupon_code TEXT,
  ADD COLUMN discount_type TEXT,
  ADD COLUMN discount_value NUMERIC DEFAULT 0,
  ADD COLUMN discount_amount NUMERIC DEFAULT 0;

-- RLS for coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coupons viewable within tenant"
  ON public.coupons FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant admins can insert coupons"
  ON public.coupons FOR INSERT TO authenticated
  WITH CHECK (is_tenant_admin(auth.uid(), tenant_id) AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant admins can update coupons"
  ON public.coupons FOR UPDATE TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Tenant admins can delete coupons"
  ON public.coupons FOR DELETE TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id));

-- RLS for coupon_usage
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coupon usage viewable by admins"
  ON public.coupon_usage FOR SELECT TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Users can create coupon usage in tenant"
  ON public.coupon_usage FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

-- Indexes
CREATE INDEX idx_coupons_tenant_code ON public.coupons(tenant_id, code);
CREATE INDEX idx_coupon_usage_coupon ON public.coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_user ON public.coupon_usage(user_id);

-- Updated_at trigger for coupons
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
