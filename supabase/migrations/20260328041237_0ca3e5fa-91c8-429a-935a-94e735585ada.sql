
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- ============================================
-- 1. integration_providers (public catalog)
-- ============================================
CREATE TABLE public.integration_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'messaging',
  integration_type text NOT NULL DEFAULT 'event_driven'
    CHECK (integration_type IN ('event_driven', 'utility')),
  description text,
  icon_name text NOT NULL DEFAULT 'Plug',
  supports_test_mode boolean NOT NULL DEFAULT true,
  requires_secret boolean NOT NULL DEFAULT false,
  config_schema_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_providers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. integration_provider_admin (superadmin only)
-- ============================================
CREATE TABLE public.integration_provider_admin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL UNIQUE REFERENCES public.integration_providers(id) ON DELETE CASCADE,
  is_active_global boolean NOT NULL DEFAULT false,
  internal_notes text,
  default_sandbox_url text,
  max_retries integer NOT NULL DEFAULT 2,
  rate_limit_per_minute integer NOT NULL DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_provider_admin ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. tenant_integrations (config per tenant)
-- ============================================
CREATE TABLE public.tenant_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.integration_providers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'disabled'
    CHECK (status IN ('disabled', 'test_mode', 'live')),
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_test_at timestamptz,
  last_success_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, provider_id)
);

ALTER TABLE public.tenant_integrations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. tenant_integration_events
-- ============================================
CREATE TABLE public.tenant_integration_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_integration_id uuid NOT NULL REFERENCES public.tenant_integrations(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  event_code text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT false,
  schedule_config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_integration_id, event_code)
);

ALTER TABLE public.tenant_integration_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. integration_secrets (zero RLS policies - only service_role)
-- ============================================
CREATE TABLE public.integration_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_integration_id uuid NOT NULL REFERENCES public.tenant_integrations(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  secret_key text NOT NULL,
  encrypted_value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_integration_id, secret_key)
);

ALTER TABLE public.integration_secrets ENABLE ROW LEVEL SECURITY;
-- NO RLS POLICIES — only accessible via service_role key in edge functions

-- ============================================
-- 6. integration_logs
-- ============================================
CREATE TABLE public.integration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.integration_providers(id),
  tenant_integration_id uuid REFERENCES public.tenant_integrations(id) ON DELETE SET NULL,
  event_code text,
  booking_id uuid,
  mode_used text NOT NULL CHECK (mode_used IN ('test_mode', 'live')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('success', 'error', 'skipped', 'pending')),
  request_summary jsonb,
  response_summary jsonb,
  error_message text,
  duration_ms integer,
  executed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_integration_logs_tenant ON public.integration_logs(tenant_id);
CREATE INDEX idx_integration_logs_executed ON public.integration_logs(executed_at DESC);
CREATE INDEX idx_integration_logs_provider ON public.integration_logs(provider_id);

-- ============================================
-- 7. integration_processed_events (anti-duplicate for reminders)
-- ============================================
CREATE TABLE public.integration_processed_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_integration_id uuid NOT NULL REFERENCES public.tenant_integrations(id) ON DELETE CASCADE,
  event_code text NOT NULL,
  booking_id uuid NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_integration_id, event_code, booking_id)
);

ALTER TABLE public.integration_processed_events ENABLE ROW LEVEL SECURITY;
-- NO RLS POLICIES for frontend — only edge functions via service_role

-- ============================================
-- RLS POLICIES
-- ============================================

-- integration_providers
CREATE POLICY "Superadmin full access on providers"
  ON public.integration_providers FOR ALL TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

CREATE POLICY "Authenticated view active providers"
  ON public.integration_providers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.integration_provider_admin ipa
      WHERE ipa.provider_id = integration_providers.id
        AND ipa.is_active_global = true
    )
  );

-- integration_provider_admin
CREATE POLICY "Superadmin only on provider admin"
  ON public.integration_provider_admin FOR ALL TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

-- tenant_integrations
CREATE POLICY "Tenant admin manage own integrations"
  ON public.tenant_integrations FOR ALL TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Superadmin manage all integrations"
  ON public.tenant_integrations FOR ALL TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

-- tenant_integration_events
CREATE POLICY "Tenant admin manage own events"
  ON public.tenant_integration_events FOR ALL TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Superadmin manage all events"
  ON public.tenant_integration_events FOR ALL TO authenticated
  USING (is_superadmin(auth.uid()))
  WITH CHECK (is_superadmin(auth.uid()));

-- integration_logs
CREATE POLICY "Tenant admin view own logs"
  ON public.integration_logs FOR SELECT TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Superadmin view all logs"
  ON public.integration_logs FOR SELECT TO authenticated
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Superadmin delete logs"
  ON public.integration_logs FOR DELETE TO authenticated
  USING (is_superadmin(auth.uid()));

-- ============================================
-- Updated_at triggers
-- ============================================
CREATE TRIGGER set_updated_at_integration_providers
  BEFORE UPDATE ON public.integration_providers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_integration_provider_admin
  BEFORE UPDATE ON public.integration_provider_admin
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_tenant_integrations
  BEFORE UPDATE ON public.tenant_integrations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_tenant_integration_events
  BEFORE UPDATE ON public.tenant_integration_events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_integration_secrets
  BEFORE UPDATE ON public.integration_secrets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- DB Trigger for immediate event dispatch via pg_net
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_integration_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_event_code text;
  v_payload jsonb;
  v_supabase_url text;
  v_service_key text;
BEGIN
  -- Map table + operation to event code
  IF TG_TABLE_NAME = 'bookings' THEN
    IF TG_OP = 'INSERT' THEN
      v_event_code := 'booking_created';
    ELSIF TG_OP = 'UPDATE' THEN
      IF OLD.status IS DISTINCT FROM NEW.status THEN
        IF NEW.status = 'confirmed' THEN v_event_code := 'booking_confirmed';
        ELSIF NEW.status = 'cancelled' THEN v_event_code := 'booking_cancelled';
        END IF;
      END IF;
      IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
        v_event_code := 'booking_cancelled';
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'professionals' AND TG_OP = 'INSERT' THEN
    v_event_code := 'professional_created';
  ELSIF TG_TABLE_NAME = 'profiles' AND TG_OP = 'INSERT' THEN
    v_event_code := 'customer_created';
  END IF;

  IF v_event_code IS NULL THEN
    RETURN NEW;
  END IF;

  v_payload := jsonb_build_object(
    'event_code', v_event_code,
    'tenant_id', NEW.tenant_id,
    'record_id', NEW.id,
    'table_name', TG_TABLE_NAME,
    'triggered_at', now()::text
  );

  -- Read URL and key from Supabase vault/settings
  v_supabase_url := coalesce(
    current_setting('app.settings.supabase_url', true),
    'https://iejruggwbogoyfdkymrj.supabase.co'
  );
  v_service_key := coalesce(
    current_setting('app.settings.service_role_key', true),
    ''
  );

  -- Only dispatch if we have a valid key
  IF v_service_key != '' THEN
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/execute-integration',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key,
        'X-Integration-Source', 'db-trigger'
      ),
      body := v_payload
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Attach triggers to relevant tables
CREATE TRIGGER trg_integration_bookings
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_integration_event();

CREATE TRIGGER trg_integration_professionals
  AFTER INSERT ON public.professionals
  FOR EACH ROW EXECUTE FUNCTION public.notify_integration_event();

CREATE TRIGGER trg_integration_profiles
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.notify_integration_event();

-- ============================================
-- Seed initial providers
-- ============================================
INSERT INTO public.integration_providers (code, name, category, integration_type, description, icon_name, supports_test_mode, requires_secret, config_schema_json) VALUES
  ('whatsapp', 'WhatsApp', 'messaging', 'event_driven', 'Envio de mensagens via WhatsApp Business API', 'MessageCircle', true, true, '[{"key":"phone_number_id","label":"Phone Number ID","type":"text","required":true},{"key":"template_name","label":"Nome do Template","type":"text","required":false}]'::jsonb),
  ('email', 'E-mail', 'notification', 'event_driven', 'Envio de e-mails transacionais', 'Mail', true, true, '[{"key":"from_email","label":"E-mail de Envio","type":"text","required":true},{"key":"from_name","label":"Nome do Remetente","type":"text","required":false}]'::jsonb),
  ('webhook', 'Webhook', 'automation', 'event_driven', 'Envio de dados para URLs externas via HTTP POST', 'Globe', true, false, '[{"key":"webhook_url","label":"URL do Webhook","type":"text","required":true},{"key":"custom_headers","label":"Headers Customizados (JSON)","type":"textarea","required":false}]'::jsonb),
  ('google_maps', 'Google Maps', 'maps', 'utility', 'Exibição de mapas e geolocalização', 'MapPin', false, true, '[{"key":"map_style","label":"Estilo do Mapa","type":"select","options":["roadmap","satellite","hybrid","terrain"],"required":false}]'::jsonb);

-- Seed provider admin records
INSERT INTO public.integration_provider_admin (provider_id, is_active_global, internal_notes)
SELECT id, false, 'Provider registrado. Ativar quando configuração estiver pronta.'
FROM public.integration_providers;
