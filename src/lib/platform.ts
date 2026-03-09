/**
 * Centralized API for superadmin platform operations.
 * All functions here require superadmin access enforced at the DB level.
 *
 * Migration dependencies:
 *   - Tables: tenants, tenant_users, profiles, bookings
 *   - Functions: is_superadmin(), set_tenant_status(), get_tenant_stats(), onboard_tenant()
 *   - Policies: superadmin SELECT on tenants (including inactive/suspended)
 */

import { supabase } from "@/integrations/supabase/client";

/* ─── Types ─── */

export interface PlatformTenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  active: boolean;
  created_at: string;
  custom_domain: string | null;
  logo_url: string | null;
}

export interface TenantStats {
  internal_users: number;
  total_profiles: number;
  total_bookings: number;
  owner_user_id: string | null;
}

export type TenantStatus = "active" | "inactive" | "suspended";

export const TENANT_STATUS_CONFIG: Record<TenantStatus, { label: string; color: string; description: string }> = {
  active: { label: "Ativo", color: "default", description: "Tenant funciona normalmente" },
  inactive: { label: "Inativo", color: "secondary", description: "Tenant desativado — não aceita novos agendamentos" },
  suspended: { label: "Suspenso", color: "destructive", description: "Bloqueado pela plataforma — nenhuma operação permitida" },
};

/* ─── Queries ─── */

export async function fetchAllTenants(): Promise<PlatformTenant[]> {
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PlatformTenant[];
}

export async function fetchTenantStats(tenantId: string): Promise<TenantStats> {
  const { data, error } = await supabase.rpc("get_tenant_stats" as any, { p_tenant_id: tenantId });
  if (error) throw error;
  return data as TenantStats;
}

/* ─── Mutations ─── */

export async function changeTenantStatus(tenantId: string, status: TenantStatus): Promise<void> {
  const { error } = await supabase.rpc("set_tenant_status" as any, {
    p_tenant_id: tenantId,
    p_status: status,
  });
  if (error) throw error;
}

export async function updateTenantDetails(
  tenantId: string,
  updates: { name?: string; slug?: string; custom_domain?: string | null; plan?: string }
): Promise<void> {
  const { error } = await supabase
    .from("tenants")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", tenantId);
  if (error) throw error;
}

export async function createTenant(params: {
  name: string;
  slug: string;
  ownerUserId?: string;
  customDomain?: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc("onboard_tenant" as any, {
    p_name: params.name,
    p_slug: params.slug,
    p_owner_user_id: params.ownerUserId || null,
    p_custom_domain: params.customDomain || null,
  });
  if (error) throw error;
  return data as string;
}
