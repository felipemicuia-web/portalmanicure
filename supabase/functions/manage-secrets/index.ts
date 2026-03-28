import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Encrypt with AES-256-GCM */
async function encryptValue(value: string, encryptionKey: string): Promise<string> {
  const keyData = new TextEncoder().encode(encryptionKey.padEnd(32).slice(0, 32));
  const key = await crypto.subtle.importKey("raw", keyData, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(value);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const result = {
    iv: btoa(String.fromCharCode(...iv)),
    ct: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
  };
  return btoa(JSON.stringify(result));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const encryptionKey = Deno.env.get("INTEGRATION_ENCRYPTION_KEY");

  if (!encryptionKey) {
    return new Response(
      JSON.stringify({ error: "Encryption not configured. Contact platform admin." }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Authenticate caller
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }
    const userId = claims.claims.sub as string;

    const body = await req.json();
    const { action, tenant_integration_id, secret_key, secret_value } = body;

    if (!action || !tenant_integration_id) {
      return new Response(JSON.stringify({ error: "Missing action or tenant_integration_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Load integration to get tenant_id
    const { data: integration } = await adminClient
      .from("tenant_integrations")
      .select("id, tenant_id")
      .eq("id", tenant_integration_id)
      .single();

    if (!integration) {
      return new Response(JSON.stringify({ error: "Integration not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify tenant admin or superadmin
    const [{ data: isAdmin }, { data: isSuperadmin }] = await Promise.all([
      adminClient.rpc("is_tenant_admin", { _user_id: userId, _tenant_id: integration.tenant_id }),
      adminClient.rpc("is_superadmin", { _user_id: userId }),
    ]);

    if (!isAdmin && !isSuperadmin) {
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }

    switch (action) {
      case "set": {
        if (!secret_key || !secret_value) {
          return new Response(JSON.stringify({ error: "Missing secret_key or secret_value" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const encrypted = await encryptValue(secret_value, encryptionKey);

        const { error } = await adminClient
          .from("integration_secrets")
          .upsert(
            {
              tenant_integration_id,
              tenant_id: integration.tenant_id,
              secret_key,
              encrypted_value: encrypted,
            },
            { onConflict: "tenant_integration_id,secret_key" }
          );

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, secret_key, status: "configured" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        if (!secret_key) {
          return new Response(JSON.stringify({ error: "Missing secret_key" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        await adminClient
          .from("integration_secrets")
          .delete()
          .eq("tenant_integration_id", tenant_integration_id)
          .eq("secret_key", secret_key);

        return new Response(JSON.stringify({ success: true, secret_key, status: "removed" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list": {
        // Returns ONLY key names and status — NEVER the encrypted value
        const { data: secrets } = await adminClient
          .from("integration_secrets")
          .select("secret_key, created_at, updated_at")
          .eq("tenant_integration_id", tenant_integration_id);

        const result = (secrets || []).map((s) => ({
          secret_key: s.secret_key,
          status: "configured",
          created_at: s.created_at,
          updated_at: s.updated_at,
        }));

        return new Response(JSON.stringify({ secrets: result }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action. Use: set, delete, list" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("manage-secrets error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
