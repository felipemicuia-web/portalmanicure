/**
 * Centralized API for superadmin platform operations.
 * All functions here require superadmin access enforced at the DB level.
 *
 * SQL Dependencies (for migration):
 *   - Tables: tenants, tenant_users, profiles, bookings, services, professionals, coupons
 *   - Functions: is_superadmin(), set_tenant_status(), get_tenant_stats(),
 *                get_tenant_detail_stats(), onboard_tenant(), get_platform_stats(),
 *                get_platform_tenant_list(), get_platform_booking_activity(),
 *                get_platform_tenant_growth()
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
  updated_at: string;
  custom_domain: string | null;
  logo_url: string | null;
  owner_user_id: string | null;
  staff_count: number;
  client_count: number;
  booking_count: number;
  service_count: number;
  professional_count: number;
  last_booking_date: string | null;
}

export interface PlatformStats {
  total_tenants: number;
  active_tenants: number;
  inactive_tenants: number;
  suspended_tenants: number;
  total_internal_users: number;
  total_profiles: number;
  total_bookings: number;
  bookings_today: number;
  bookings_7d: number;
  bookings_30d: number;
  total_services: number;
  total_professionals: number;
  total_active_coupons: number;
  tenants_without_owner: number;
  tenants_without_bookings: number;
  tenants_created_7d: number;
}

export interface TenantDetailStats {
  internal_users: number;
  total_profiles: number;
  blocked_profiles: number;
  total_bookings: number;
  bookings_today: number;
  bookings_7d: number;
  bookings_30d: number;
  total_services: number;
  total_professionals: number;
  total_coupons: number;
  owner_user_id: string | null;
  last_booking_date: string | null;
  staff_roles: { user_id: string; role: string }[] | null;
}

export interface TenantStats {
  internal_users: number;
  total_profiles: number;
  total_bookings: number;
  owner_user_id: string | null;
}

export interface BookingActivity {
  date: string;
  bookings: number;
}

export interface TenantGrowth {
  week: string;
  tenants: number;
  profiles: number;
}

export type TenantStatus = "active" | "inactive" | "suspended";

export const TENANT_STATUS_CONFIG: Record<TenantStatus, { label: string; color: string; description: string }> = {
  active: { label: "Ativo", color: "default", description: "Tenant funciona normalmente" },
  inactive: { label: "Inativo", color: "secondary", description: "Tenant desativado — não aceita novos agendamentos" },
  suspended: { label: "Suspenso", color: "destructive", description: "Bloqueado pela plataforma — nenhuma operação permitida" },
};

/* ─── Global Stats ─── */

export async function fetchPlatformStats(): Promise<PlatformStats> {
  const { data, error } = await supabase.rpc("get_platform_stats" as any);
  if (error) throw error;
  return data as PlatformStats;
}

export async function fetchPlatformTenantList(): Promise<PlatformTenant[]> {
  const { data, error } = await supabase.rpc("get_platform_tenant_list" as any);
  if (error) throw error;
  return (data ?? []) as PlatformTenant[];
}

export async function fetchBookingActivity(): Promise<BookingActivity[]> {
  const { data, error } = await supabase.rpc("get_platform_booking_activity" as any);
  if (error) throw error;
  return (data ?? []) as BookingActivity[];
}

export async function fetchTenantGrowth(): Promise<TenantGrowth[]> {
  const { data, error } = await supabase.rpc("get_platform_tenant_growth" as any);
  if (error) throw error;
  return (data ?? []) as TenantGrowth[];
}

/* ─── Tenant Detail ─── */

export async function fetchTenantDetailStats(tenantId: string): Promise<TenantDetailStats> {
  const { data, error } = await supabase.rpc("get_tenant_detail_stats" as any, { p_tenant_id: tenantId });
  if (error) throw error;
  return data as TenantDetailStats;
}

export async function fetchTenantStats(tenantId: string): Promise<TenantStats> {
  const { data, error } = await supabase.rpc("get_tenant_stats" as any, { p_tenant_id: tenantId });
  if (error) throw error;
  return data as TenantStats;
}

/* ─── Legacy fetch (kept for compatibility) ─── */

export async function fetchAllTenants(): Promise<PlatformTenant[]> {
  return fetchPlatformTenantList();
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
  ownerUserId: string;
  customDomain?: string;
}): Promise<string> {
  if (!params.ownerUserId) {
    throw new Error("Owner é obrigatório para criar um tenant.");
  }
  const { data, error } = await supabase.rpc("onboard_tenant" as any, {
    p_name: params.name,
    p_slug: params.slug,
    p_owner_user_id: params.ownerUserId,
    p_custom_domain: params.customDomain || null,
  });
  if (error) throw error;
  return data as string;
}
