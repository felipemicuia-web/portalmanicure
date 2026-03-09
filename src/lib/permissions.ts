/**
 * Permission helpers for multi-tenant RBAC.
 * 
 * Global roles (platform_admins table):
 *   - super_admin: full platform access
 * 
 * Tenant roles (tenant_users.role):
 *   - owner: full tenant control
 *   - admin: manage tenant resources
 *   - user: regular user within tenant
 */

export const TENANT_ROLES = ["owner", "admin", "user"] as const;
export type TenantRole = (typeof TENANT_ROLES)[number];

export const ADMIN_ROLES: TenantRole[] = ["owner", "admin"];

/** Check if a tenant role has admin-level access */
export function isTenantAdminRole(role: string | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

/** Check if a tenant role has at least the specified level */
export function hasMinimumRole(
  currentRole: string | null | undefined,
  requiredRole: TenantRole
): boolean {
  if (!currentRole) return false;
  const hierarchy: Record<string, number> = { owner: 3, admin: 2, user: 1 };
  return (hierarchy[currentRole] ?? 0) >= (hierarchy[requiredRole] ?? 0);
}

/** Get display label for a role */
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    owner: "Proprietário",
    admin: "Administrador",
    user: "Usuário",
    super_admin: "Super Admin",
  };
  return labels[role] ?? role;
}
