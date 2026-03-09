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

      // Check if user is tenant admin via is_tenant_admin function
      const { data, error } = await supabase.rpc("is_tenant_admin", {
        _user_id: user.id,
        _tenant_id: tenantId,
      });

      setIsAdmin(!error && !!data);
      setLoading(false);
    }

    checkAdmin();
  }, [user, tenantId, tenantLoading]);

  return { isAdmin, loading: loading || tenantLoading };
}
