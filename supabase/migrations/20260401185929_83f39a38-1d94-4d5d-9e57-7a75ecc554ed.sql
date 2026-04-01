
-- 1. service_packages: package definitions
CREATE TABLE public.service_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  validity_days integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. service_package_items: services included in a package with credit qty
CREATE TABLE public.service_package_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.service_packages(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  credits_quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (package_id, service_id)
);

-- 3. client_package_purchases: client purchase records
CREATE TABLE public.client_package_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  package_id uuid NOT NULL REFERENCES public.service_packages(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending_activation',
  purchase_date timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  activated_by uuid,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_purchase_status CHECK (status IN ('pending_activation', 'active', 'expired', 'cancelled', 'finished'))
);

-- 4. client_package_credits: credit balances per service per purchase
CREATE TABLE public.client_package_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES public.client_package_purchases(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  credits_total integer NOT NULL DEFAULT 0,
  credits_used integer NOT NULL DEFAULT 0,
  credits_remaining integer NOT NULL GENERATED ALWAYS AS (credits_total - credits_used) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (purchase_id, service_id)
);

-- 5. package_credit_movements: audit log
CREATE TABLE public.package_credit_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id uuid NOT NULL REFERENCES public.client_package_credits(id) ON DELETE CASCADE,
  purchase_id uuid NOT NULL REFERENCES public.client_package_purchases(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  movement_type text NOT NULL,
  quantity integer NOT NULL,
  booking_id uuid REFERENCES public.bookings(id),
  performed_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_movement_type CHECK (movement_type IN ('activation', 'booking_use', 'refund', 'manual_adjustment'))
);

-- Add package_purchase_id to bookings for linking
ALTER TABLE public.bookings ADD COLUMN package_purchase_id uuid REFERENCES public.client_package_purchases(id);

-- Enable RLS on all tables
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_package_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_package_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_credit_movements ENABLE ROW LEVEL SECURITY;

-- RLS: service_packages
CREATE POLICY "Packages are public readable" ON public.service_packages FOR SELECT TO public USING (true);
CREATE POLICY "Tenant admins can insert packages" ON public.service_packages FOR INSERT TO authenticated WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Tenant admins can update packages" ON public.service_packages FOR UPDATE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Tenant admins can delete packages" ON public.service_packages FOR DELETE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));

-- RLS: service_package_items
CREATE POLICY "Package items are public readable" ON public.service_package_items FOR SELECT TO public USING (true);
CREATE POLICY "Tenant admins can insert package items" ON public.service_package_items FOR INSERT TO authenticated WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Tenant admins can update package items" ON public.service_package_items FOR UPDATE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Tenant admins can delete package items" ON public.service_package_items FOR DELETE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));

-- RLS: client_package_purchases
CREATE POLICY "Admins can view tenant purchases" ON public.client_package_purchases FOR SELECT TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));
CREATE POLICY "Clients can view own purchases" ON public.client_package_purchases FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "Admins can insert purchases" ON public.client_package_purchases FOR INSERT TO authenticated WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Clients can insert own purchases" ON public.client_package_purchases FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id AND user_has_profile_in_tenant(auth.uid(), tenant_id));
CREATE POLICY "Admins can update purchases" ON public.client_package_purchases FOR UPDATE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

-- RLS: client_package_credits
CREATE POLICY "Admins can view tenant credits" ON public.client_package_credits FOR SELECT TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));
CREATE POLICY "Clients can view own credits" ON public.client_package_credits FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM client_package_purchases cpp WHERE cpp.id = client_package_credits.purchase_id AND cpp.client_id = auth.uid()));
CREATE POLICY "Admins can insert credits" ON public.client_package_credits FOR INSERT TO authenticated WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "Admins can update credits" ON public.client_package_credits FOR UPDATE TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id)) WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

-- RLS: package_credit_movements
CREATE POLICY "Admins can view tenant movements" ON public.package_credit_movements FOR SELECT TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));
CREATE POLICY "Clients can view own movements" ON public.package_credit_movements FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM client_package_purchases cpp WHERE cpp.id = package_credit_movements.purchase_id AND cpp.client_id = auth.uid()));
CREATE POLICY "Admins can insert movements" ON public.package_credit_movements FOR INSERT TO authenticated WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "System can insert movements" ON public.package_credit_movements FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM client_package_purchases cpp WHERE cpp.id = package_credit_movements.purchase_id AND cpp.client_id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_service_packages BEFORE UPDATE ON public.service_packages FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at_client_package_purchases BEFORE UPDATE ON public.client_package_purchases FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_updated_at_client_package_credits BEFORE UPDATE ON public.client_package_credits FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Function to activate a package purchase (admin action)
CREATE OR REPLACE FUNCTION public.activate_package_purchase(p_purchase_id uuid, p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase record;
  v_item record;
  v_credit_id uuid;
BEGIN
  IF NOT is_tenant_admin(auth.uid(), p_tenant_id) THEN
    RAISE EXCEPTION 'Only admins can activate packages';
  END IF;

  SELECT * INTO v_purchase FROM client_package_purchases
  WHERE id = p_purchase_id AND tenant_id = p_tenant_id AND status = 'pending_activation';

  IF v_purchase IS NULL THEN
    RAISE EXCEPTION 'Purchase not found or not pending activation';
  END IF;

  -- Update purchase status
  UPDATE client_package_purchases
  SET status = 'active',
      activated_at = now(),
      activated_by = auth.uid(),
      expires_at = CASE
        WHEN (SELECT validity_days FROM service_packages WHERE id = v_purchase.package_id) IS NOT NULL
        THEN now() + ((SELECT validity_days FROM service_packages WHERE id = v_purchase.package_id) || ' days')::interval
        ELSE NULL
      END
  WHERE id = p_purchase_id;

  -- Create credits for each service in the package
  FOR v_item IN
    SELECT * FROM service_package_items WHERE package_id = v_purchase.package_id AND tenant_id = p_tenant_id
  LOOP
    INSERT INTO client_package_credits (purchase_id, service_id, tenant_id, credits_total, credits_used)
    VALUES (p_purchase_id, v_item.service_id, p_tenant_id, v_item.credits_quantity, 0)
    RETURNING id INTO v_credit_id;

    -- Log activation movement
    INSERT INTO package_credit_movements (credit_id, purchase_id, tenant_id, movement_type, quantity, performed_by)
    VALUES (v_credit_id, p_purchase_id, p_tenant_id, 'activation', v_item.credits_quantity, auth.uid());
  END LOOP;
END;
$$;

-- Function to consume a credit on booking
CREATE OR REPLACE FUNCTION public.consume_package_credit(p_purchase_id uuid, p_service_id uuid, p_booking_id uuid, p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credit record;
BEGIN
  SELECT * INTO v_credit FROM client_package_credits
  WHERE purchase_id = p_purchase_id AND service_id = p_service_id AND tenant_id = p_tenant_id;

  IF v_credit IS NULL THEN
    RAISE EXCEPTION 'No credits found for this service in this purchase';
  END IF;

  IF v_credit.credits_total - v_credit.credits_used <= 0 THEN
    RAISE EXCEPTION 'No remaining credits for this service';
  END IF;

  -- Increment used
  UPDATE client_package_credits
  SET credits_used = credits_used + 1
  WHERE id = v_credit.id;

  -- Log movement
  INSERT INTO package_credit_movements (credit_id, purchase_id, tenant_id, movement_type, quantity, booking_id, performed_by)
  VALUES (v_credit.id, p_purchase_id, p_tenant_id, 'booking_use', 1, p_booking_id, auth.uid());

  -- Link booking to purchase
  UPDATE bookings SET package_purchase_id = p_purchase_id WHERE id = p_booking_id;

  -- Check if all credits used -> mark purchase as finished
  IF NOT EXISTS (
    SELECT 1 FROM client_package_credits
    WHERE purchase_id = p_purchase_id AND (credits_total - credits_used) > 0
  ) THEN
    UPDATE client_package_purchases SET status = 'finished' WHERE id = p_purchase_id;
  END IF;
END;
$$;
