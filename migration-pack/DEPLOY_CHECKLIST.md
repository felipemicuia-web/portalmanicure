# 🚀 Checklist de Deploy — Supabase Novo

## Pré-requisitos
- [ ] Supabase project criado (dashboard.supabase.com)
- [ ] URL + anon key + service_role key anotados

## 1. Executar Migration
- [ ] Abrir **SQL Editor** no Supabase Dashboard
- [ ] Colar e executar `001_full_schema.sql` **inteiro**
- [ ] Verificar que não houve erros

## 2. Configurar Auth
- [ ] Em **Auth → Settings → Email**:
  - Enable Email Signup: ✅
  - Auto Confirm Email: ✅ (ou desativar se quiser confirmação)
- [ ] Em **Auth → URL Configuration**:
  - Site URL: `https://seu-dominio.com`
  - Redirect URLs: `https://seu-dominio.com/**`

## 3. Configurar .env do frontend
```env
VITE_SUPABASE_URL=https://SEU-PROJECT-ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-anon-key
```

## 4. Criar Admin Inicial
Após o primeiro signup, promova o usuário a admin:
```sql
-- Substituir USER_ID pelo UUID do primeiro usuário
UPDATE tenant_users 
SET role = 'admin' 
WHERE user_id = 'USER_ID' 
  AND tenant_id = '00000000-0000-0000-0000-000000000001';

INSERT INTO user_roles (user_id, tenant_id, role)
VALUES ('USER_ID', '00000000-0000-0000-0000-000000000001', 'admin');
```

## 5. Migrar Dados (opcional)
Se quiser levar dados do Lovable Cloud:
```sql
-- Exportar do projeto atual (via SQL Editor do Cloud):
-- COPY professionals TO STDOUT WITH CSV HEADER;
-- COPY services TO STDOUT WITH CSV HEADER;
-- etc.
-- Depois importar no novo Supabase
```

## 6. Verificar
- [ ] Criar conta → ver profissionais/serviços
- [ ] Login admin → painel funcional
- [ ] Criar agendamento → sucesso

## 7. Ativar Multi-Tenant (futuro)
No código frontend:
1. Editar `src/config/tenant.ts`:
   ```ts
   export const MULTI_TENANT_MODE = true;
   ```
2. Criar novos tenants no banco:
   ```sql
   INSERT INTO tenants (slug, name, plan) VALUES ('cliente1', 'Salão da Maria', 'pro');
   ```
3. Configurar DNS: `cliente1.seudominio.com` → seu app
4. O TenantContext resolve automaticamente por subdomínio/domínio

## Fluxo de Signup (definitivo)
```
1. supabase.auth.signUp() → cria auth.user
2. tenant_users.upsert({ user_id, tenant_id, role: 'user' }, onConflict: 'user_id')
3. profiles.upsert({ user_id, name, phone, tenant_id })
```
Ordem crítica: tenant_users ANTES de profiles (RLS depende disso).
