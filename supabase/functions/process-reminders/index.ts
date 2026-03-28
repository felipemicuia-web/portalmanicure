import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-integration-source",
};

function sanitize(obj: unknown, maxBytes = 4096): unknown {
  if (!obj) return null;
  const REDACT_KEYS = ["authorization", "token", "api_key", "secret", "password", "key", "encrypted_value"];
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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Authenticate — only pg-cron with service_role key
  const source = req.headers.get("x-integration-source");
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  if (source !== "pg-cron" || token !== serviceRoleKey) {
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const EVENT_CODE = "booking_reminder_before";
  let processed = 0;

  try {
    // Find all tenant integrations that:
    // 1. Are not disabled
    // 2. Have booking_reminder_before event enabled
    // 3. Have a globally active provider
    const { data: enabledEvents } = await adminClient
      .from("tenant_integration_events")
      .select(`
        id,
        tenant_id,
        tenant_integration_id,
        schedule_config_json,
        tenant_integrations!inner (
          id,
          provider_id,
          status,
          config_json
        )
      `)
      .eq("event_code", EVENT_CODE)
      .eq("is_enabled", true)
      .neq("tenant_integrations.status", "disabled");

    if (!enabledEvents || enabledEvents.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "No active reminder events" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const event of enabledEvents) {
      const integration = event.tenant_integrations as any;
      const minutesBefore = (event.schedule_config_json as any)?.minutes_before || 30;

      // Check provider is globally active
      const { data: providerAdmin } = await adminClient
        .from("integration_provider_admin")
        .select("is_active_global")
        .eq("provider_id", integration.provider_id)
        .single();

      if (!providerAdmin?.is_active_global) continue;

      // Find bookings that need a reminder:
      // booking_date + booking_time is within [now, now + minutesBefore minutes]
      // AND not already processed
      const now = new Date();
      const futureLimit = new Date(now.getTime() + minutesBefore * 60 * 1000);

      const { data: bookings } = await adminClient
        .from("bookings")
        .select("id, booking_date, booking_time, client_name, client_phone, tenant_id, professional_id")
        .eq("tenant_id", event.tenant_id)
        .eq("status", "confirmed")
        .is("deleted_at", null)
        .gte("booking_date", now.toISOString().split("T")[0])
        .lte("booking_date", futureLimit.toISOString().split("T")[0]);

      if (!bookings || bookings.length === 0) continue;

      for (const booking of bookings) {
        // Calculate booking datetime
        const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`);
        const diffMs = bookingDateTime.getTime() - now.getTime();
        const diffMinutes = diffMs / 60000;

        // Only process if within the reminder window (0 to minutesBefore)
        if (diffMinutes < 0 || diffMinutes > minutesBefore) continue;

        // Check idempotency — skip if already processed
        const { data: alreadyProcessed } = await adminClient
          .from("integration_processed_events")
          .select("id")
          .eq("tenant_integration_id", integration.id)
          .eq("event_code", EVENT_CODE)
          .eq("booking_id", booking.id)
          .maybeSingle();

        if (alreadyProcessed) continue;

        // Mark as processed BEFORE execution (prevent duplicate on retry)
        await adminClient.from("integration_processed_events").insert({
          tenant_integration_id: integration.id,
          event_code: EVENT_CODE,
          booking_id: booking.id,
        });

        const startTime = Date.now();
        const isTestMode = integration.status === "test_mode";
        let execStatus = "success";
        let errorMsg: string | null = null;
        let responseData: unknown = null;

        try {
          if (isTestMode) {
            responseData = {
              mock: true,
              event: EVENT_CODE,
              booking_id: booking.id,
              minutes_before: minutesBefore,
              message: `Test: reminder would be sent to ${booking.client_name}`,
            };
          } else {
            // For now, log that reminder would fire
            // Real implementation depends on provider (WhatsApp, email, etc.)
            responseData = {
              event: EVENT_CODE,
              booking_id: booking.id,
              client_name: booking.client_name,
              booking_date: booking.booking_date,
              booking_time: booking.booking_time,
              minutes_before: minutesBefore,
              message: "Reminder dispatched (provider execution pending implementation)",
            };
            execStatus = "success";
          }
        } catch (err) {
          execStatus = "error";
          errorMsg = err instanceof Error ? err.message : "Unknown error";
        }

        // Log
        await adminClient.from("integration_logs").insert({
          tenant_id: event.tenant_id,
          provider_id: integration.provider_id,
          tenant_integration_id: integration.id,
          event_code: EVENT_CODE,
          booking_id: booking.id,
          mode_used: isTestMode ? "test_mode" : "live",
          status: execStatus,
          request_summary: sanitize({ booking_id: booking.id, minutes_before: minutesBefore }),
          response_summary: sanitize(responseData),
          error_message: errorMsg,
          duration_ms: Date.now() - startTime,
        });

        processed++;
      }
    }

    return new Response(JSON.stringify({ processed }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("process-reminders error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
