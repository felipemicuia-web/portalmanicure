import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ valid: false, error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client for auth
    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ valid: false, error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Admin client for coupon operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { code, tenant_id, total_price, action } = await req.json();

    if (!code || !tenant_id) {
      return new Response(
        JSON.stringify({ valid: false, error: "Código e tenant são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const upperCode = String(code).trim().toUpperCase();

    // Fetch coupon
    const { data: coupon, error: couponError } = await adminClient
      .from("coupons")
      .select("*")
      .eq("tenant_id", tenant_id)
      .eq("code", upperCode)
      .single();

    if (couponError || !coupon) {
      return new Response(
        JSON.stringify({ valid: false, error: "Cupom não encontrado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check active
    if (!coupon.active) {
      return new Response(
        JSON.stringify({ valid: false, error: "Este cupom está inativo" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiry
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, error: "Este cupom expirou" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check usage limit (skip for unlimited coupons)
    if (coupon.max_uses < 999999 && coupon.current_uses >= coupon.max_uses) {
      return new Response(
        JSON.stringify({ valid: false, error: "Este cupom já atingiu o limite de uso" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already used this coupon (for single-use)
    if (coupon.max_uses === 1) {
      const { data: existingUsage } = await adminClient
        .from("coupon_usage")
        .select("id")
        .eq("coupon_id", coupon.id)
        .eq("user_id", user.id)
        .limit(1);

      if (existingUsage && existingUsage.length > 0) {
        return new Response(
          JSON.stringify({ valid: false, error: "Você já utilizou este cupom" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Calculate discount
    const subtotal = Number(total_price) || 0;
    let discountAmount = 0;

    if (coupon.discount_type === "fixed") {
      discountAmount = Math.min(Number(coupon.discount_value), subtotal);
    } else {
      discountAmount = Math.round((subtotal * Number(coupon.discount_value)) / 100 * 100) / 100;
      discountAmount = Math.min(discountAmount, subtotal);
    }

    const finalTotal = Math.max(subtotal - discountAmount, 0);

    // If action is "apply" (on confirm), increment usage
    if (action === "apply") {
      const { error: updateError } = await adminClient
        .from("coupons")
        .update({ current_uses: coupon.current_uses + 1 })
        .eq("id", coupon.id)
        .eq("current_uses", coupon.current_uses); // optimistic lock

      if (updateError) {
        return new Response(
          JSON.stringify({ valid: false, error: "Erro ao aplicar cupom. Tente novamente." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Auto-deactivate if usage reached limit (skip for unlimited)
      if (coupon.max_uses < 999999 && coupon.current_uses + 1 >= coupon.max_uses) {
        await adminClient
          .from("coupons")
          .update({ active: false })
          .eq("id", coupon.id);
      }
    }

    return new Response(
      JSON.stringify({
        valid: true,
        coupon_id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: Number(coupon.discount_value),
        discount_amount: discountAmount,
        final_total: finalTotal,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ valid: false, error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
