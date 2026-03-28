/**
 * Integration service layer.
 * All sensitive operations go through edge functions.
 * Frontend only reads non-sensitive data via Supabase client (RLS-protected).
 */

import { supabase } from "@/integrations/supabase/client";
import type {
  IntegrationProvider,
  IntegrationProviderAdmin,
  TenantIntegration,
  TenantIntegrationEvent,
  IntegrationLog,
  IntegrationStatus,
  SecretStatus,
} from "@/types/integrations";

// ── Providers (catalog) ────────────────────────────────────

export async function fetchProviders(): Promise<IntegrationProvider[]> {
  const { data, error } = await supabase
    .from("integration_providers")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data || []) as unknown as IntegrationProvider[];
}

export async function fetchProviderAdmin(): Promise<(IntegrationProviderAdmin & { provider: IntegrationProvider })[]> {
  const { data, error } = await supabase
    .from("integration_provider_admin")
    .select("*, integration_providers!inner(*)");
  if (error) throw error;
  return (data || []).map((row: any) => ({
    ...row,
    provider: row.integration_providers,
  }));
}

export async function updateProviderAdmin(
  id: string,
  updates: Partial<IntegrationProviderAdmin>
): Promise<void> {
  const { error } = await supabase
    .from("integration_provider_admin")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}

export async function updateProvider(
  id: string,
  updates: Partial<IntegrationProvider>
): Promise<void> {
  const { error } = await supabase
    .from("integration_providers")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}

// ── Tenant Integrations ────────────────────────────────────

export async function fetchTenantIntegrations(tenantId: string): Promise<TenantIntegration[]> {
  const { data, error } = await supabase
    .from("tenant_integrations")
    .select("*, integration_providers(*)")
    .eq("tenant_id", tenantId);
  if (error) throw error;
  return (data || []).map((row: any) => ({
    ...row,
    provider: row.integration_providers,
  }));
}

export async function upsertTenantIntegration(
  tenantId: string,
  providerId: string,
  status: IntegrationStatus
): Promise<TenantIntegration> {
  const { data, error } = await supabase
    .from("tenant_integrations")
    .upsert(
      { tenant_id: tenantId, provider_id: providerId, status },
      { onConflict: "tenant_id,provider_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data as unknown as TenantIntegration;
}

export async function updateTenantIntegration(
  id: string,
  updates: { status?: IntegrationStatus; config_json?: Record<string, unknown> }
): Promise<void> {
  const { error } = await supabase
    .from("tenant_integrations")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}

// ── Events ─────────────────────────────────────────────────

export async function fetchIntegrationEvents(
  tenantIntegrationId: string
): Promise<TenantIntegrationEvent[]> {
  const { data, error } = await supabase
    .from("tenant_integration_events")
    .select("*")
    .eq("tenant_integration_id", tenantIntegrationId)
    .order("event_code");
  if (error) throw error;
  return (data || []) as unknown as TenantIntegrationEvent[];
}

export async function upsertIntegrationEvent(
  tenantIntegrationId: string,
  tenantId: string,
  eventCode: string,
  isEnabled: boolean,
  scheduleConfig?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from("tenant_integration_events")
    .upsert(
      {
        tenant_integration_id: tenantIntegrationId,
        tenant_id: tenantId,
        event_code: eventCode,
        is_enabled: isEnabled,
        schedule_config_json: scheduleConfig || {},
      },
      { onConflict: "tenant_integration_id,event_code" }
    );
  if (error) throw error;
}

// ── Secrets (via edge function only) ───────────────────────

export async function listSecrets(tenantIntegrationId: string): Promise<SecretStatus[]> {
  const { data, error } = await supabase.functions.invoke("manage-secrets", {
    body: { action: "list", tenant_integration_id: tenantIntegrationId },
  });
  if (error) throw error;
  return data?.secrets || [];
}

export async function setSecret(
  tenantIntegrationId: string,
  secretKey: string,
  secretValue: string
): Promise<void> {
  const { error } = await supabase.functions.invoke("manage-secrets", {
    body: {
      action: "set",
      tenant_integration_id: tenantIntegrationId,
      secret_key: secretKey,
      secret_value: secretValue,
    },
  });
  if (error) throw error;
}

export async function deleteSecret(
  tenantIntegrationId: string,
  secretKey: string
): Promise<void> {
  const { error } = await supabase.functions.invoke("manage-secrets", {
    body: {
      action: "delete",
      tenant_integration_id: tenantIntegrationId,
      secret_key: secretKey,
    },
  });
  if (error) throw error;
}

// ── Test ───────────────────────────────────────────────────

export async function testIntegration(
  tenantIntegrationId: string,
  eventCode: string
): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.functions.invoke("test-integration", {
    body: { tenant_integration_id: tenantIntegrationId, event_code: eventCode },
  });
  if (error) throw error;
  return data;
}

// ── Logs ───────────────────────────────────────────────────

export async function fetchLogs(params: {
  tenantId?: string;
  providerId?: string;
  status?: string;
  modeUsed?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: IntegrationLog[]; count: number }> {
  let query = supabase
    .from("integration_logs")
    .select("*, integration_providers!inner(code, name)", { count: "exact" });

  if (params.tenantId) query = query.eq("tenant_id", params.tenantId);
  if (params.providerId) query = query.eq("provider_id", params.providerId);
  if (params.status) query = query.eq("status", params.status);
  if (params.modeUsed) query = query.eq("mode_used", params.modeUsed);

  const limit = params.limit || 25;
  const offset = params.offset || 0;
  query = query.order("executed_at", { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  const logs = (data || []).map((row: any) => ({
    ...row,
    provider: row.integration_providers,
  }));

  return { logs, count: count || 0 };
}

export async function deleteLogs(olderThanDays: number): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const { error, count } = await supabase
    .from("integration_logs")
    .delete({ count: "exact" })
    .lt("executed_at", cutoff.toISOString());

  if (error) throw error;
  return count || 0;
}
