/**
 * Tenant utility functions.
 * Centralizes tenant-related logic to avoid duplication across components.
 */

import { supabase } from "@/integrations/supabase/client";

/** Fetch the current user's role within a specific tenant */
export async function fetchUserRoleInTenant(
  userId: string,
  tenantId: string
): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_user_role_in_tenant" as any, {
    _user_id: userId,
    _tenant_id: tenantId,
  });
  if (error) return null;
  return data as string | null;
}

/** Check if the current user is a superadmin */
export async function checkIsSuperAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_superadmin", {
    _user_id: userId,
  });
  return !error && !!data;
}

/** Create a new tenant via secure server-side function (superadmin only) */
export async function onboardTenant(params: {
  name: string;
  slug: string;
  ownerUserId?: string;
  customDomain?: string;
}): Promise<{ tenantId: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc("onboard_tenant" as any, {
    p_name: params.name,
    p_slug: params.slug,
    p_owner_user_id: params.ownerUserId || null,
    p_custom_domain: params.customDomain || null,
  });

  if (error) return { tenantId: null, error: error.message };
  return { tenantId: data as string, error: null };
}

/** Add a user to a tenant with a specific role (admin action) */
export async function addUserToTenant(
  tenantId: string,
  userId: string,
  role: string = "user"
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("add_user_to_tenant" as any, {
    p_tenant_id: tenantId,
    p_user_id: userId,
    p_role: role,
  });
  return { error: error?.message || null };
}

/** Change a user's role within a tenant */
export async function changeUserTenantRole(
  tenantId: string,
  userId: string,
  newRole: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("change_tenant_role" as any, {
    p_tenant_id: tenantId,
    p_user_id: userId,
    p_new_role: newRole,
  });
  return { error: error?.message || null };
}
