import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";
import { isTenantAdminRole, hasMinimumRole, TenantRole } from "@/lib/permissions";

/**
 * Central permissions hook.
 * Combines auth, tenant, and role state into actionable permission checks.
 */
export function usePermissions() {
  const { user } = useAuth();
  const { tenantId, tenantSlug, tenantName, membershipRole, isSuperAdmin, loading } = useTenant();

  return {
    // State
    user,
    tenantId,
    tenantSlug,
    tenantName,
    membershipRole,
    isSuperAdmin,
    loading,

    // Checks
    isAuthenticated: !!user,
    isTenantAdmin: isTenantAdminRole(membershipRole) || isSuperAdmin,
    isTenantOwner: membershipRole === "owner" || isSuperAdmin,
    hasTenantAccess: !!membershipRole || isSuperAdmin,

    // Helpers
    hasMinRole: (role: TenantRole) => hasMinimumRole(membershipRole, role) || isSuperAdmin,

    /** Returns the tenant_id or throws — use in mutations */
    requireTenantId: (): string => {
      if (!tenantId) throw new Error("No active tenant");
      return tenantId;
    },
  };
}
