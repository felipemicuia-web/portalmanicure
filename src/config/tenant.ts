/**
 * Tenant Configuration
 * 
 * MULTI_TENANT_MODE:
 *   false = Single-tenant mode (all users share one fixed tenant)
 *   true  = Multi-tenant mode (tenant resolved by subdomain/domain/path)
 * 
 * To activate multi-tenant later:
 *   1. Set MULTI_TENANT_MODE = true
 *   2. Create new tenants in the `tenants` table
 *   3. Configure DNS/subdomains pointing to the app
 *   4. The TenantContext will automatically resolve by subdomain/domain
 */
export const MULTI_TENANT_MODE = false;

export const TENANT_DEFAULT_ID = "00000000-0000-0000-0000-000000000001";
export const TENANT_DEFAULT_SLUG = "default";
export const TENANT_DEFAULT_NAME = "Default Tenant";
