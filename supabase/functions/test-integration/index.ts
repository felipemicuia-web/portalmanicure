import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function sanitize(obj: unknown, maxBytes = 4096): unknown {
  if (!obj) return null;
  const REDACT_KEYS = ["authorization", "token", "api_key", "apikey", "secret", "password", "key", "encrypted_value"];
  const clean = JSON.parse(JSON.stringify(obj), (k, v) => {
    if (REDACT_KEYS.includes(k.toLowerCase())) return "***REDACTED***";
    return v;
  });
  let str = JSON.stringify(clean);
  if (str.length > maxBytes) str = str.slice(0, maxBytes);
  try { return JSON.parse(str); } catch { return { _truncated: true }; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    // Authenticate — only tenant admin or superadmin can test
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const body = await req.json();
    const { tenant_integration_id, event_code } = body;

    if (!tenant_integration_id || !event_code) {
      return new Response(JSON.stringify({ error: "Missing tenant_integration_id or event_code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Load integration
    const { data: integration, error: intErr } = await adminClient
      .from("tenant_integrations")
      .select("id, tenant_id, provider_id, status, config_json")
      .eq("id", tenant_integration_id)
      .single();

    if (intErr || !integration) {
      return new Response(JSON.stringify({ error: "Integration not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is tenant admin or superadmin
    const [{ data: isAdmin }, { data: isSuperadmin }] = await Promise.all([
      adminClient.rpc("is_tenant_admin", { _user_id: userId, _tenant_id: integration.tenant_id }),
      adminClient.rpc("is_superadmin", { _user_id: userId }),
    ]);

    if (!isAdmin && !isSuperadmin) {
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }

    // Load provider
    const { data: provider } = await adminClient
      .from("integration_providers")
      .select("code, name, integration_type")
      .eq("id", integration.provider_id)
      .single();

    // Load secrets (check if configured, don't expose values)
    const { data: secrets } = await adminClient
      .from("integration_secrets")
      .select("secret_key")
      .eq("tenant_integration_id", integration.id);

    // Build test result
    const testResult = {
      mock: true,
      provider: provider?.code || "unknown",
      provider_name: provider?.name || "Unknown",
      event_code,
      integration_status: integration.status,
      config_keys: Object.keys(integration.config_json || {}),
      config_values_set: Object.entries(integration.config_json || {})
        .filter(([, v]) => v !== null && v !== "")
        .map(([k]) => k),
      secrets_configured: (secrets || []).map((s) => s.secret_key),
      validation: {
        has_config: Object.keys(integration.config_json || {}).length > 0,
        has_secrets: (secrets || []).length > 0,
        is_event_driven: provider?.integration_type === "event_driven",
        status_allows_execution: integration.status !== "disabled",
      },
      message: `Test OK: ${provider?.name} would process event '${event_code}' for this tenant.`,
      tested_at: new Date().toISOString(),
    };

    const durationMs = Date.now() - startTime;

    // Write log
    await adminClient.from("integration_logs").insert({
      tenant_id: integration.tenant_id,
      provider_id: integration.provider_id,
      tenant_integration_id: integration.id,
      event_code,
      mode_used: "test_mode",
      status: "success",
      request_summary: sanitize({ action: "manual_test", event_code, user_id: userId }),
      response_summary: sanitize(testResult),
      duration_ms: durationMs,
    });

    // Update last_test_at
    await adminClient
      .from("tenant_integrations")
      .update({ last_test_at: new Date().toISOString() })
      .eq("id", integration.id);

    return new Response(JSON.stringify(testResult), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("test-integration error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
