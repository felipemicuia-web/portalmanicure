import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-integration-source",
};

/** Truncate and sanitize payload for logging (max 4KB) */
function sanitize(obj: unknown, maxBytes = 4096): unknown {
  if (!obj) return null;
  const REDACT_KEYS = [
    "authorization",
    "token",
    "api_key",
    "apikey",
    "secret",
    "password",
    "key",
    "encrypted_value",
    "service_role",
  ];
  const clean = JSON.parse(JSON.stringify(obj), (k, v) => {
    if (REDACT_KEYS.includes(k.toLowerCase())) return "***REDACTED***";
    return v;
  });
  let str = JSON.stringify(clean);
  if (str.length > maxBytes) str = str.slice(0, maxBytes) + "…[truncated]";
  return JSON.parse(str.endsWith("…[truncated]") ? `{"_truncated":true}` : str);
}

/** Decrypt secret value using AES-256-GCM */
async function decryptSecret(
  encrypted: string,
  encryptionKey: string
): Promise<string> {
  try {
    const data = JSON.parse(atob(encrypted));
    const keyData = new TextEncoder().encode(encryptionKey.padEnd(32).slice(0, 32));
    const key = await crypto.subtle.importKey("raw", keyData, "AES-GCM", false, ["decrypt"]);
    const iv = Uint8Array.from(atob(data.iv), (c) => c.charCodeAt(0));
    const ct = Uint8Array.from(atob(data.ct), (c) => c.charCodeAt(0));
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return new TextDecoder().decode(plain);
  } catch {
    throw new Error("Failed to decrypt secret");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const encryptionKey = Deno.env.get("INTEGRATION_ENCRYPTION_KEY") || "";

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = await req.json();
    const { event_code, tenant_id, record_id, table_name } = body;

    if (!event_code || !tenant_id) {
      return new Response(JSON.stringify({ error: "Missing event_code or tenant_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticate: db-trigger uses service_role key, manual calls use JWT
    const source = req.headers.get("x-integration-source");
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (source === "db-trigger") {
      if (token !== serviceRoleKey && token !== anonKey) {
        return new Response("Forbidden", { status: 403, headers: corsHeaders });
      }
    } else {
      // Manual invocation — validate JWT and tenant admin
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
      if (claimsErr || !claims?.claims?.sub) {
        return new Response("Unauthorized", { status: 401, headers: corsHeaders });
      }
      const userId = claims.claims.sub as string;
      const { data: isAdmin } = await adminClient.rpc("is_tenant_admin", {
        _user_id: userId,
        _tenant_id: tenant_id,
      });
      if (!isAdmin) {
        return new Response("Forbidden", { status: 403, headers: corsHeaders });
      }
    }

    // Verify tenant is active
    const { data: tenant } = await adminClient
      .from("tenants")
      .select("id, status")
      .eq("id", tenant_id)
      .eq("status", "active")
      .single();

    if (!tenant) {
      return new Response(JSON.stringify({ skipped: true, reason: "Tenant not active" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all tenant integrations that are not disabled
    const { data: integrations } = await adminClient
      .from("tenant_integrations")
      .select("id, provider_id, status, config_json")
      .eq("tenant_id", tenant_id)
      .neq("status", "disabled");

    if (!integrations || integrations.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let processed = 0;

    for (const integration of integrations) {
      // Check if provider is globally active
      const { data: providerAdmin } = await adminClient
        .from("integration_provider_admin")
        .select("is_active_global, default_sandbox_url, max_retries")
        .eq("provider_id", integration.provider_id)
        .single();

      if (!providerAdmin?.is_active_global) {
        await adminClient.from("integration_logs").insert({
          tenant_id,
          provider_id: integration.provider_id,
          tenant_integration_id: integration.id,
          event_code,
          booking_id: table_name === "bookings" ? record_id : null,
          mode_used: integration.status as string,
          status: "skipped",
          error_message: "Provider globally disabled",
          duration_ms: Date.now() - startTime,
        });
        continue;
      }

      // Check if this event is enabled for this integration
      const { data: eventConfig } = await adminClient
        .from("tenant_integration_events")
        .select("id, is_enabled")
        .eq("tenant_integration_id", integration.id)
        .eq("event_code", event_code)
        .single();

      if (!eventConfig?.is_enabled) {
        continue; // Event not configured, silently skip
      }

      // Get provider info
      const { data: provider } = await adminClient
        .from("integration_providers")
        .select("code, integration_type")
        .eq("id", integration.provider_id)
        .single();

      if (!provider || provider.integration_type !== "event_driven") {
        continue;
      }

      // Load secrets if needed
      const { data: secrets } = await adminClient
        .from("integration_secrets")
        .select("secret_key, encrypted_value")
        .eq("tenant_integration_id", integration.id);

      const decryptedSecrets: Record<string, string> = {};
      if (secrets && encryptionKey) {
        for (const s of secrets) {
          try {
            decryptedSecrets[s.secret_key] = await decryptSecret(s.encrypted_value, encryptionKey);
          } catch {
            // Log decryption failure but continue
          }
        }
      }

      // Build execution context
      const isTestMode = integration.status === "test_mode";
      const requestPayload = {
        provider_code: provider.code,
        event_code,
        tenant_id,
        record_id,
        config: integration.config_json,
        is_test: isTestMode,
      };

      let responseData: unknown = null;
      let execStatus = "success";
      let errorMsg: string | null = null;

      try {
        if (isTestMode) {
          // Simulate execution
          responseData = {
            mock: true,
            provider: provider.code,
            event: event_code,
            message: `Test mode: ${provider.code} would process ${event_code}`,
            config_keys: Object.keys(integration.config_json || {}),
            secrets_configured: Object.keys(decryptedSecrets),
          };
        } else {
          // Live execution — dispatch to provider-specific logic
          switch (provider.code) {
            case "webhook": {
              const webhookUrl = (integration.config_json as Record<string, string>)?.webhook_url;
              if (!webhookUrl) throw new Error("Webhook URL not configured");

              // Fetch record data for payload
              let recordData: unknown = null;
              if (table_name && record_id) {
                const { data } = await adminClient.from(table_name).select("*").eq("id", record_id).single();
                recordData = sanitize(data);
              }

              const webhookPayload = {
                event: event_code,
                tenant_id,
                record_id,
                data: recordData,
                timestamp: new Date().toISOString(),
              };

              const customHeaders: Record<string, string> = {};
              try {
                const h = (integration.config_json as Record<string, string>)?.custom_headers;
                if (h) Object.assign(customHeaders, JSON.parse(h));
              } catch { /* ignore invalid headers */ }

              const resp = await fetch(webhookUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...customHeaders,
                },
                body: JSON.stringify(webhookPayload),
              });

              responseData = {
                status: resp.status,
                statusText: resp.statusText,
              };

              if (!resp.ok) {
                throw new Error(`Webhook returned ${resp.status}: ${resp.statusText}`);
              }
              break;
            }

            case "whatsapp":
            case "email":
              // Placeholder for future provider implementations
              responseData = {
                pending_implementation: true,
                provider: provider.code,
                message: `Provider ${provider.code} execution not yet implemented. Configure webhook as alternative.`,
              };
              execStatus = "skipped";
              errorMsg = `Provider ${provider.code} not yet implemented`;
              break;

            default:
              responseData = { unknown_provider: provider.code };
              execStatus = "skipped";
              errorMsg = `Unknown provider: ${provider.code}`;
          }
        }
      } catch (err) {
        execStatus = "error";
        errorMsg = err instanceof Error ? err.message : "Unknown error";
      }

      const durationMs = Date.now() - startTime;

      // Write log
      await adminClient.from("integration_logs").insert({
        tenant_id,
        provider_id: integration.provider_id,
        tenant_integration_id: integration.id,
        event_code,
        booking_id: table_name === "bookings" ? record_id : null,
        mode_used: isTestMode ? "test_mode" : "live",
        status: execStatus,
        request_summary: sanitize(requestPayload),
        response_summary: sanitize(responseData),
        error_message: errorMsg?.slice(0, 2048) || null,
        duration_ms: durationMs,
      });

      // Update last_test_at or last_success_at
      if (isTestMode) {
        await adminClient
          .from("tenant_integrations")
          .update({ last_test_at: new Date().toISOString() })
          .eq("id", integration.id);
      } else if (execStatus === "success") {
        await adminClient
          .from("tenant_integrations")
          .update({ last_success_at: new Date().toISOString() })
          .eq("id", integration.id);
      }

      processed++;
    }

    return new Response(JSON.stringify({ processed }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("execute-integration error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
