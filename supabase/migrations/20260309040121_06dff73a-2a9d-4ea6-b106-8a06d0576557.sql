
-- ============================================================
-- MIGRATION: Security Hardening - RLS & Role Integrity
-- ============================================================

-- -------------------------------------------------------
-- BLOCO 1: Remover policy de self-register insegura
-- -------------------------------------------------------

DROP POLICY IF EXISTS "Users can self-register into tenant" ON public.tenant_users;


-- -------------------------------------------------------
-- BLOCO 2: Criar função segura join_active_tenant()
-- Substitui o self-register direto.
-- Qualquer usuário autenticado pode chamar, mas:
--   - só pode ingressar em tenants ativos
--   - UNIQUE (user_id) impede dupla filiação
--   - role sempre será 'user' (não pode escalar)
-- -------------------------------------------------------

CREATE OR REPLACE FUNCTION public.join_active_tenant(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar que o tenant existe e está ativo
  IF NOT EXISTS (
    SELECT 1 FROM public.tenants
    WHERE id = p_tenant_id AND active = true
  ) THEN
    RAISE EXCEPTION 'Tenant not found or inactive';
  END IF;

  -- Inserir membership com role fixo 'user' 
  -- UNIQUE (user_id) bloqueia se já estiver em outro tenant
  -- ON CONFLICT (user_id) garante idempotência: chamar duas vezes é seguro
  INSERT INTO public.tenant_users (tenant_id, user_id, role, status)
  VALUES (p_tenant_id, auth.uid(), 'user', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  -- Criar perfil se ainda não existir
  INSERT INTO public.profiles (user_id, tenant_id)
  VALUES (auth.uid(), p_tenant_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;


-- -------------------------------------------------------
-- BLOCO 3: Corrigir policy INSERT de profiles
-- De: apenas auth.uid() = user_id
-- Para: user_id correto + deve pertencer ao tenant
-- SECURITY DEFINER functions (join_active_tenant, onboard_tenant,
-- add_user_to_tenant) bypassam RLS, então não são afetadas.
-- -------------------------------------------------------

DROP POLICY IF EXISTS "Users can create own profile in tenant" ON public.profiles;

CREATE POLICY "Users can create own profile in tenant"
ON public.profiles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND user_belongs_to_tenant(auth.uid(), tenant_id)
);


-- -------------------------------------------------------
-- BLOCO 4: Adicionar CHECK constraint em tenant_users.role
-- Garante integridade no banco — nenhum INSERT/UPDATE
-- poderá usar um role arbitrário.
-- -------------------------------------------------------

ALTER TABLE public.tenant_users
  DROP CONSTRAINT IF EXISTS tenant_users_role_check;

ALTER TABLE public.tenant_users
  ADD CONSTRAINT tenant_users_role_check
  CHECK (role IN ('owner', 'admin', 'user'));


-- -------------------------------------------------------
-- BLOCO 5: Adicionar CHECK constraint em tenant_users.status
-- Complementar ao role para garantir valores válidos.
-- -------------------------------------------------------

ALTER TABLE public.tenant_users
  DROP CONSTRAINT IF EXISTS tenant_users_status_check;

ALTER TABLE public.tenant_users
  ADD CONSTRAINT tenant_users_status_check
  CHECK (status IN ('active', 'inactive', 'suspended'));


-- -------------------------------------------------------
-- BLOCO 6: user_roles — decisão: MANTER mas sem uso ativo
-- Justificativa:
--   - Sistema real de autorização usa tenant_users + is_tenant_admin()
--   - user_roles / has_role() é paralelo e legado
--   - Remover requer cleanup adicional e não agrega segurança
--   - Mantemos a tabela, removemos o fallback no código
-- Ação aqui: apenas garantir que a policy não exponha dados
-- -------------------------------------------------------

-- Sem mudanças em user_roles (tabela mantida, sem cleanup necessário no banco)
-- O cleanup é feito no frontend (useAdmin.ts) no próximo bloco.


-- -------------------------------------------------------
-- BLOCO 7: Adicionar trigger de validação de telefone
-- (triggers estavam ausentes conforme auditoria)
-- -------------------------------------------------------

-- Trigger em bookings
DROP TRIGGER IF EXISTS validate_booking_phone_trigger ON public.bookings;
CREATE TRIGGER validate_booking_phone_trigger
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_booking_phone();

-- Trigger em profiles
DROP TRIGGER IF EXISTS validate_profile_phone_trigger ON public.profiles;
CREATE TRIGGER validate_profile_phone_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_phone();
