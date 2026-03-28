/**
 * Integration system types.
 * Matches the database schema from the integration tables.
 */

// ── Provider (public catalog) ──────────────────────────────

export interface IntegrationProvider {
  id: string;
  code: string;
  name: string;
  category: string;
  integration_type: "event_driven" | "utility";
  description: string | null;
  icon_name: string;
  supports_test_mode: boolean;
  requires_secret: boolean;
  config_schema_json: ConfigField[];
  created_at: string;
  updated_at: string;
}

export interface ConfigField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "boolean";
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

// ── Provider Admin (superadmin only) ───────────────────────

export interface IntegrationProviderAdmin {
  id: string;
  provider_id: string;
  is_active_global: boolean;
  internal_notes: string | null;
  default_sandbox_url: string | null;
  max_retries: number;
  rate_limit_per_minute: number;
  created_at: string;
  updated_at: string;
}

// ── Tenant Integration ─────────────────────────────────────

export type IntegrationStatus = "disabled" | "test_mode" | "live";

export interface TenantIntegration {
  id: string;
  tenant_id: string;
  provider_id: string;
  status: IntegrationStatus;
  config_json: Record<string, unknown>;
  last_test_at: string | null;
  last_success_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  provider?: IntegrationProvider;
  provider_admin?: IntegrationProviderAdmin;
}

// ── Integration Events ─────────────────────────────────────

export interface TenantIntegrationEvent {
  id: string;
  tenant_integration_id: string;
  tenant_id: string;
  event_code: string;
  is_enabled: boolean;
  schedule_config_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const AVAILABLE_EVENTS: { code: string; label: string; description: string; scheduled?: boolean }[] = [
  { code: "booking_created", label: "Agendamento Criado", description: "Disparado ao criar um novo agendamento" },
  { code: "booking_confirmed", label: "Agendamento Confirmado", description: "Disparado ao confirmar um agendamento" },
  { code: "booking_cancelled", label: "Agendamento Cancelado", description: "Disparado ao cancelar um agendamento" },
  { code: "booking_reminder_before", label: "Lembrete de Agendamento", description: "Enviado antes do horário do atendimento", scheduled: true },
  { code: "professional_created", label: "Profissional Criado", description: "Disparado ao cadastrar novo profissional" },
  { code: "customer_created", label: "Cliente Cadastrado", description: "Disparado ao cadastrar novo cliente" },
];

// ── Integration Logs ───────────────────────────────────────

export type LogStatus = "success" | "error" | "skipped" | "pending";
export type LogMode = "test_mode" | "live";

export interface IntegrationLog {
  id: string;
  tenant_id: string;
  provider_id: string;
  tenant_integration_id: string | null;
  event_code: string | null;
  booking_id: string | null;
  mode_used: LogMode;
  status: LogStatus;
  request_summary: Record<string, unknown> | null;
  response_summary: Record<string, unknown> | null;
  error_message: string | null;
  duration_ms: number | null;
  executed_at: string;
  // Joined
  provider?: { code: string; name: string };
}

// ── Secret Status (never contains actual value) ────────────

export interface SecretStatus {
  secret_key: string;
  status: "configured" | "not_configured";
  created_at?: string;
  updated_at?: string;
}
