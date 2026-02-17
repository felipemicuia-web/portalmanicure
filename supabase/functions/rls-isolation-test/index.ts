import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get caller identity
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a client scoped to this user (respects RLS)
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    // Get user's tenant
    const { data: userTenant } = await supabaseAdmin.rpc("get_user_tenant_id", { _user_id: user.id });
    
    // Get or create test tenant
    const testTenantId = "11111111-1111-1111-1111-111111111111";
    
    // Ensure test tenant exists (via admin)
    await supabaseAdmin.from("tenants").upsert({
      id: testTenantId,
      slug: "test-isolation",
      name: "Tenant Teste Isolamento",
      active: true,
    }, { onConflict: "slug" });

    // Seed test data via admin (bypasses RLS)
    // Create a test professional in test tenant
    const { data: testProf } = await supabaseAdmin.from("professionals").upsert({
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      tenant_id: testTenantId,
      name: "Prof RLS Test",
      active: true,
    }, { onConflict: "id" }).select().single();

    // Create test booking in test tenant (need a real user - use admin to insert directly)
    const testBookingId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    await supabaseAdmin.from("bookings").upsert({
      id: testBookingId,
      tenant_id: testTenantId,
      user_id: user.id, // Use current user but wrong tenant
      professional_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      booking_date: "2026-03-01",
      booking_time: "10:00",
      duration_minutes: 30,
      client_name: "RLS Test Client",
      client_phone: "11999999999",
      status: "confirmed",
    }, { onConflict: "id" });

    // Create test profile in test tenant
    const testProfileId = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
    await supabaseAdmin.from("profiles").upsert({
      id: testProfileId,
      tenant_id: testTenantId,
      user_id: "ffffffff-ffff-ffff-ffff-ffffffffffff", // fake user
      name: "RLS Test Profile",
    }, { onConflict: "id" });

    const results: Record<string, unknown> = {
      caller: { id: user.id, email: user.email },
      caller_tenant: userTenant,
      test_tenant: testTenantId,
    };

    // ==========================================
    // TEST 1: SELECT profiles cross-tenant
    // User should see 0 profiles from test tenant
    // ==========================================
    const { data: profilesCross, error: profilesCrossErr } = await supabaseUser
      .from("profiles")
      .select("id, tenant_id, name")
      .eq("tenant_id", testTenantId);

    results["TEST_1_SELECT_profiles_cross_tenant"] = {
      expected: "0 rows",
      actual_count: profilesCross?.length ?? 0,
      data: profilesCross,
      error: profilesCrossErr?.message ?? null,
      PASS: (profilesCross?.length ?? 0) === 0 && !profilesCrossErr,
    };

    // ==========================================
    // TEST 2: SELECT bookings cross-tenant
    // User should see 0 bookings from test tenant
    // (even though user_id matches, tenant doesn't)
    // ==========================================
    const { data: bookingsCross, error: bookingsCrossErr } = await supabaseUser
      .from("bookings")
      .select("id, tenant_id, client_name")
      .eq("tenant_id", testTenantId);

    results["TEST_2_SELECT_bookings_cross_tenant"] = {
      expected: "0 rows (tenant mismatch blocks even own user_id)",
      actual_count: bookingsCross?.length ?? 0,
      data: bookingsCross,
      error: bookingsCrossErr?.message ?? null,
      PASS: (bookingsCross?.length ?? 0) === 0 && !bookingsCrossErr,
    };

    // ==========================================
    // TEST 3: UPDATE bookings cross-tenant
    // Should affect 0 rows
    // ==========================================
    const { data: updateCross, error: updateCrossErr, count: updateCount } = await supabaseUser
      .from("bookings")
      .update({ notes: "HACKED" })
      .eq("tenant_id", testTenantId)
      .eq("id", testBookingId)
      .select();

    results["TEST_3_UPDATE_bookings_cross_tenant"] = {
      expected: "0 rows updated or RLS error",
      actual_rows_affected: updateCross?.length ?? 0,
      error: updateCrossErr?.message ?? null,
      PASS: (updateCross?.length ?? 0) === 0,
    };

    // ==========================================
    // TEST 4: DELETE profiles cross-tenant
    // Should affect 0 rows
    // ==========================================
    const { data: deleteCross, error: deleteCrossErr, count: deleteCount } = await supabaseUser
      .from("profiles")
      .delete()
      .eq("tenant_id", testTenantId)
      .eq("id", testProfileId)
      .select();

    results["TEST_4_DELETE_profiles_cross_tenant"] = {
      expected: "0 rows deleted or RLS error",
      actual_rows_affected: deleteCross?.length ?? 0,
      error: deleteCrossErr?.message ?? null,
      PASS: (deleteCross?.length ?? 0) === 0,
    };

    // ==========================================
    // TEST 5: INSERT booking cross-tenant
    // Should fail with RLS violation
    // ==========================================
    const { data: insertCross, error: insertCrossErr } = await supabaseUser
      .from("bookings")
      .insert({
        user_id: user.id,
        tenant_id: testTenantId, // WRONG tenant
        professional_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
        booking_date: "2026-04-01",
        booking_time: "14:00",
        duration_minutes: 30,
        client_name: "Hacker",
        client_phone: "11999999999",
      })
      .select();

    results["TEST_5_INSERT_booking_cross_tenant"] = {
      expected: "RLS violation error",
      data: insertCross,
      error: insertCrossErr?.message ?? null,
      PASS: !!insertCrossErr,
    };

    // ==========================================
    // TEST 6: UPDATE profile tenant_id (immutability)
    // Should fail - can't change tenant_id to another tenant
    // ==========================================
    const { data: myProfile } = await supabaseUser
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    let test6Result: Record<string, unknown> = { skipped: "No profile found for user" };
    if (myProfile) {
      const { data: changeTenant, error: changeTenantErr } = await supabaseUser
        .from("profiles")
        .update({ tenant_id: testTenantId })
        .eq("id", myProfile.id)
        .select();

      test6Result = {
        expected: "0 rows or RLS error (WITH CHECK prevents tenant change)",
        actual_rows_affected: changeTenant?.length ?? 0,
        error: changeTenantErr?.message ?? null,
        PASS: (changeTenant?.length ?? 0) === 0 || !!changeTenantErr,
      };
    }
    results["TEST_6_UPDATE_profile_change_tenant"] = test6Result;

    // ==========================================
    // TEST 7: User without tenant_users
    // We can't fully simulate this here since we're authenticated as a real user
    // But we can verify get_user_tenant_id returns NULL for nonexistent user
    // ==========================================
    const { data: orphanTenant } = await supabaseAdmin.rpc("get_user_tenant_id", {
      _user_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    });
    results["TEST_7_orphan_user_tenant_resolution"] = {
      expected: "NULL (no tenant)",
      actual: orphanTenant,
      note: "When get_user_tenant_id returns NULL, all policies with tenant_id = NULL comparison fail (SQL NULL != anything)",
      PASS: orphanTenant === null,
    };

    // ==========================================
    // POSITIVE TEST: User CAN see own tenant data
    // ==========================================
    const { data: ownProfiles, error: ownProfilesErr } = await supabaseUser
      .from("profiles")
      .select("id, tenant_id, name")
      .eq("user_id", user.id);

    results["POSITIVE_own_profile_visible"] = {
      expected: ">0 rows (user sees own data)",
      actual_count: ownProfiles?.length ?? 0,
      data: ownProfiles,
      error: ownProfilesErr?.message ?? null,
      PASS: (ownProfiles?.length ?? 0) > 0,
    };

    const { data: ownBookings, error: ownBookingsErr } = await supabaseUser
      .from("bookings")
      .select("id, tenant_id, client_name")
      .eq("user_id", user.id)
      .eq("tenant_id", userTenant);

    results["POSITIVE_own_bookings_visible"] = {
      expected: ">0 rows (user sees own bookings)",
      actual_count: ownBookings?.length ?? 0,
      error: ownBookingsErr?.message ?? null,
      PASS: (ownBookings?.length ?? 0) > 0,
    };

    // Cleanup test data
    await supabaseAdmin.from("bookings").delete().eq("id", testBookingId);
    await supabaseAdmin.from("profiles").delete().eq("id", testProfileId);
    await supabaseAdmin.from("professionals").delete().eq("id", "cccccccc-cccc-cccc-cccc-cccccccccccc");

    // Summary
    const allTests = Object.entries(results).filter(([k]) => k.startsWith("TEST_") || k.startsWith("POSITIVE_"));
    const passCount = allTests.filter(([, v]) => (v as any)?.PASS === true).length;
    const failCount = allTests.filter(([, v]) => (v as any)?.PASS === false).length;

    results["SUMMARY"] = {
      total: allTests.length,
      passed: passCount,
      failed: failCount,
      all_pass: failCount === 0,
    };

    return new Response(JSON.stringify(results, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
