
-- ========================================
-- Platform Plans & Features Schema
-- ========================================

-- Plans table
CREATE TABLE public.platform_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  monthly_price numeric NOT NULL DEFAULT 0,
  annual_price numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_highlighted boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans" ON public.platform_plans
  FOR SELECT TO public USING (is_active = true OR is_superadmin(auth.uid()));

CREATE POLICY "Superadmins can manage plans" ON public.platform_plans
  FOR ALL TO authenticated USING (is_superadmin(auth.uid())) WITH CHECK (is_superadmin(auth.uid()));

-- Plan features table
CREATE TABLE public.plan_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.platform_plans(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  feature_label text NOT NULL,
  included boolean NOT NULL DEFAULT true,
  limit_value integer,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(plan_id, feature_key)
);

ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plan features" ON public.plan_features
  FOR SELECT TO public USING (true);

CREATE POLICY "Superadmins can manage plan features" ON public.plan_features
  FOR ALL TO authenticated USING (is_superadmin(auth.uid())) WITH CHECK (is_superadmin(auth.uid()));

-- Tenant subscription linking
CREATE TABLE public.tenant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.platform_plans(id),
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  renewal_date timestamptz,
  billing_cycle text NOT NULL DEFAULT 'monthly',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage subscriptions" ON public.tenant_subscriptions
  FOR ALL TO authenticated USING (is_superadmin(auth.uid())) WITH CHECK (is_superadmin(auth.uid()));

CREATE POLICY "Tenant admins can view own subscription" ON public.tenant_subscriptions
  FOR SELECT TO authenticated USING (is_tenant_admin(auth.uid(), tenant_id));

-- Seed initial plans
INSERT INTO public.platform_plans (name, slug, description, monthly_price, annual_price, is_active, is_highlighted, display_order) VALUES
  ('COM', 'com', 'Plano básico para começar a usar a plataforma com os recursos essenciais.', 49.90, 478.80, true, false, 1),
  ('COM VOCÊ', 'com-voce', 'Plano completo com todos os recursos avançados para escalar seu negócio.', 99.90, 958.80, true, true, 2);

-- Seed features for COM
INSERT INTO public.plan_features (plan_id, feature_key, feature_label, included, display_order)
SELECT p.id, f.key, f.label, f.included, f.ord
FROM public.platform_plans p,
(VALUES
  ('basic_scheduling', 'Agendamento básico', true, 1),
  ('visual_customization', 'Personalização visual', true, 2),
  ('single_professional', 'Até 1 profissional', true, 3),
  ('basic_reports', 'Relatórios básicos', true, 4),
  ('custom_domain', 'Domínio personalizado', false, 5),
  ('advanced_reports', 'Relatórios avançados', false, 6),
  ('integrations', 'Integrações', false, 7),
  ('automations', 'Automações', false, 8),
  ('priority_support', 'Suporte prioritário', false, 9),
  ('multi_users', 'Múltiplos usuários', false, 10),
  ('advanced_metrics', 'Métricas avançadas', false, 11)
) AS f(key, label, included, ord)
WHERE p.slug = 'com';

-- Seed features for COM VOCÊ
INSERT INTO public.plan_features (plan_id, feature_key, feature_label, included, display_order)
SELECT p.id, f.key, f.label, f.included, f.ord
FROM public.platform_plans p,
(VALUES
  ('basic_scheduling', 'Agendamento básico', true, 1),
  ('visual_customization', 'Personalização visual', true, 2),
  ('unlimited_professionals', 'Profissionais ilimitados', true, 3),
  ('basic_reports', 'Relatórios básicos', true, 4),
  ('custom_domain', 'Domínio personalizado', true, 5),
  ('advanced_reports', 'Relatórios avançados', true, 6),
  ('integrations', 'Integrações', true, 7),
  ('automations', 'Automações', true, 8),
  ('priority_support', 'Suporte prioritário', true, 9),
  ('multi_users', 'Múltiplos usuários', true, 10),
  ('advanced_metrics', 'Métricas avançadas', true, 11)
) AS f(key, label, included, ord)
WHERE p.slug = 'com-voce';

-- RPC: get plan insights for superadmin
CREATE OR REPLACE FUNCTION public.get_plan_insights()
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'Only superadmins can view plan insights';
  END IF;

  RETURN (
    SELECT json_build_object(
      'total_tenants', (SELECT count(*) FROM tenants),
      'active_tenants', (SELECT count(*) FROM tenants WHERE status = 'active'),
      'trial_tenants', (SELECT count(*) FROM tenants WHERE status = 'trial'),
      'suspended_tenants', (SELECT count(*) FROM tenants WHERE status = 'suspended'),
      'inactive_tenants', (SELECT count(*) FROM tenants WHERE status = 'inactive'),
      'plans', (
        SELECT json_agg(plan_data ORDER BY plan_data->>'display_order')
        FROM (
          SELECT json_build_object(
            'id', pp.id,
            'name', pp.name,
            'slug', pp.slug,
            'monthly_price', pp.monthly_price,
            'annual_price', pp.annual_price,
            'is_highlighted', pp.is_highlighted,
            'tenant_count', COALESCE(tc.cnt, 0),
            'monthly_revenue', COALESCE(tc.cnt, 0) * pp.monthly_price,
            'annual_revenue', COALESCE(tc.cnt, 0) * pp.annual_price
          ) AS plan_data
          FROM platform_plans pp
          LEFT JOIN (
            SELECT ts.plan_id, count(*) AS cnt
            FROM tenant_subscriptions ts
            JOIN tenants t ON t.id = ts.tenant_id
            WHERE ts.status = 'active' AND t.status = 'active'
            GROUP BY ts.plan_id
          ) tc ON tc.plan_id = pp.id
          WHERE pp.is_active = true
        ) sub
      ),
      'total_monthly_revenue', (
        SELECT COALESCE(SUM(pp.monthly_price), 0)
        FROM tenant_subscriptions ts
        JOIN platform_plans pp ON pp.id = ts.plan_id
        JOIN tenants t ON t.id = ts.tenant_id
        WHERE ts.status = 'active' AND t.status = 'active'
      ),
      'total_annual_revenue', (
        SELECT COALESCE(SUM(pp.annual_price), 0)
        FROM tenant_subscriptions ts
        JOIN platform_plans pp ON pp.id = ts.plan_id
        JOIN tenants t ON t.id = ts.tenant_id
        WHERE ts.status = 'active' AND t.status = 'active'
      ),
      'avg_ticket', (
        SELECT CASE WHEN count(*) > 0 THEN ROUND(SUM(pp.monthly_price) / count(*), 2) ELSE 0 END
        FROM tenant_subscriptions ts
        JOIN platform_plans pp ON pp.id = ts.plan_id
        JOIN tenants t ON t.id = ts.tenant_id
        WHERE ts.status = 'active' AND t.status = 'active'
      ),
      'tenants_created_30d', (SELECT count(*) FROM tenants WHERE created_at >= now() - interval '30 days')
    )
  );
END;
$$;
