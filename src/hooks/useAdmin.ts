import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useTenant } from "@/contexts/TenantContext";

export function useAdmin(user: User | null) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { tenantId, loading: tenantLoading } = useTenant();

  useEffect(() => {
    async function checkAdmin() {
      if (!user || tenantLoading || !tenantId) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Check tenant admin OR superadmin in parallel
      const [adminRes, superRes] = await Promise.all([
        supabase.rpc("is_tenant_admin", {
          _user_id: user.id,
          _tenant_id: tenantId,
        }),
        supabase.rpc("is_superadmin", { _user_id: user.id }),
      ]);

      setIsAdmin((!adminRes.error && !!adminRes.data) || (!superRes.error && !!superRes.data));
      setLoading(false);
    }

    checkAdmin();
  }, [user, tenantId, tenantLoading]);

  return { isAdmin, loading: loading || tenantLoading };
}
