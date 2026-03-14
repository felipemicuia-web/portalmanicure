/**
 * API layer for platform plans, features, and insights.
 * All mutation functions require superadmin access enforced at DB level.
 */

import { supabase } from "@/integrations/supabase/client";

/* ─── Types ─── */

export interface PlatformPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthly_price: number;
  annual_price: number;
  is_active: boolean;
  is_highlighted: boolean;
  display_order: number;
  limits: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PlanFeature {
  id: string;
  plan_id: string;
  feature_key: string;
  feature_label: string;
  included: boolean;
  limit_value: number | null;
  display_order: number;
  created_at: string;
}

export interface TenantSubscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: string;
  started_at: string;
  renewal_date: string | null;
  billing_cycle: string;
  created_at: string;
  updated_at: string;
}

export interface PlanInsightData {
  id: string;
  name: string;
  slug: string;
  monthly_price: number;
  annual_price: number;
  is_highlighted: boolean;
  tenant_count: number;
  monthly_revenue: number;
  annual_revenue: number;
}

export interface PlanInsights {
  total_tenants: number;
  active_tenants: number;
  trial_tenants: number;
  suspended_tenants: number;
  inactive_tenants: number;
  plans: PlanInsightData[] | null;
  total_monthly_revenue: number;
  total_annual_revenue: number;
  avg_ticket: number;
  tenants_created_30d: number;
}

/* ─── Read ─── */

export async function fetchPlans(): Promise<PlatformPlan[]> {
  const { data, error } = await supabase
    .from("platform_plans" as any)
    .select("*")
    .order("display_order");
  if (error) throw error;
  return (data ?? []) as unknown as PlatformPlan[];
}

export async function fetchPlanFeatures(planId: string): Promise<PlanFeature[]> {
  const { data, error } = await supabase
    .from("plan_features" as any)
    .select("*")
    .eq("plan_id", planId)
    .order("display_order");
  if (error) throw error;
  return (data ?? []) as unknown as PlanFeature[];
}

export async function fetchAllPlanFeatures(): Promise<PlanFeature[]> {
  const { data, error } = await supabase
    .from("plan_features" as any)
    .select("*")
    .order("display_order");
  if (error) throw error;
  return (data ?? []) as unknown as PlanFeature[];
}

export async function fetchPlanInsights(): Promise<PlanInsights> {
  const { data, error } = await supabase.rpc("get_plan_insights" as any);
  if (error) throw error;
  return data as PlanInsights;
}

export async function fetchTenantSubscriptions(): Promise<(TenantSubscription & { plan_name?: string })[]> {
  const { data, error } = await supabase
    .from("tenant_subscriptions" as any)
    .select("*, platform_plans(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as any[]).map((d) => ({
    ...d,
    plan_name: d.platform_plans?.name ?? null,
  }));
}

/* ─── Mutations ─── */

export async function updatePlan(
  planId: string,
  updates: Partial<Pick<PlatformPlan, "name" | "description" | "monthly_price" | "annual_price" | "is_active" | "is_highlighted" | "display_order" | "limits">>
): Promise<void> {
  const { error } = await supabase
    .from("platform_plans" as any)
    .update({ ...updates, updated_at: new Date().toISOString() } as any)
    .eq("id", planId);
  if (error) throw error;
}

export async function createPlan(plan: {
  name: string;
  slug: string;
  description?: string;
  monthly_price: number;
  annual_price: number;
  display_order?: number;
}): Promise<string> {
  const { data, error } = await supabase
    .from("platform_plans" as any)
    .insert(plan as any)
    .select("id")
    .single();
  if (error) throw error;
  return (data as any).id;
}

export async function upsertPlanFeature(feature: {
  plan_id: string;
  feature_key: string;
  feature_label: string;
  included: boolean;
  limit_value?: number | null;
  display_order?: number;
}): Promise<void> {
  const { error } = await supabase
    .from("plan_features" as any)
    .upsert(feature as any, { onConflict: "plan_id,feature_key" });
  if (error) throw error;
}

export async function deletePlanFeature(featureId: string): Promise<void> {
  const { error } = await supabase
    .from("plan_features" as any)
    .delete()
    .eq("id", featureId);
  if (error) throw error;
}

export async function assignPlanToTenant(tenantId: string, planId: string, billingCycle: string = "monthly"): Promise<void> {
  // Deactivate existing subscriptions
  await supabase
    .from("tenant_subscriptions" as any)
    .update({ status: "cancelled", updated_at: new Date().toISOString() } as any)
    .eq("tenant_id", tenantId)
    .eq("status", "active");

  const { error } = await supabase
    .from("tenant_subscriptions" as any)
    .insert({
      tenant_id: tenantId,
      plan_id: planId,
      status: "active",
      billing_cycle: billingCycle,
      started_at: new Date().toISOString(),
    } as any);
  if (error) throw error;
}
