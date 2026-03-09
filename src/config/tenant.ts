/**
 * Tenant Configuration
 * 
 * MULTI_TENANT_MODE:
 *   false = Single-tenant mode (all users share one fixed tenant)
 *   true  = Multi-tenant mode (tenant resolved by subdomain/domain/path)
 * 
 * To activate multi-tenant:
 *   1. Set MULTI_TENANT_MODE = true
 *   2. Create new tenants via the Platform Console (/platform)
 *   3. Configure DNS/subdomains pointing to the app
 *   4. The TenantContext will automatically resolve by subdomain/domain/path
 * 
 * Architecture overview:
 *   - Tenant resolution: TenantContext (subdomain → domain → /t/slug → default)
 *   - Auth state: AuthContext (centralized session management)
 *   - Permissions: usePermissions() hook + guards (RequireAuth, RequireSuperAdmin, RequireTenantRole)
 *   - Data isolation: RLS policies using user_belongs_to_tenant() + is_tenant_admin()
 *   - Onboarding: onboard_tenant() SQL function (creates tenant + work_settings + optional owner)
 *   - Global admin: platform_admins table + is_superadmin() function
 * 
 * Key SQL functions:
 *   - user_belongs_to_tenant(user_id, tenant_id) → boolean
 *   - get_user_role_in_tenant(user_id, tenant_id) → text
 *   - is_tenant_admin(user_id, tenant_id) → boolean
 *   - is_superadmin(user_id) → boolean
 *   - onboard_tenant(name, slug, owner_user_id?, custom_domain?) → uuid
 *   - add_user_to_tenant(tenant_id, user_id, role?) → void
 *   - change_tenant_role(tenant_id, user_id, new_role) → void
 * 
 * Environment variables (auto-configured):
 *   - VITE_SUPABASE_URL
 *   - VITE_SUPABASE_PUBLISHABLE_KEY
 *   - VITE_SUPABASE_PROJECT_ID
 */
export const MULTI_TENANT_MODE = false;

export const TENANT_DEFAULT_ID = "00000000-0000-0000-0000-000000000001";
export const TENANT_DEFAULT_SLUG = "default";
export const TENANT_DEFAULT_NAME = "Default Tenant";
