import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Checks if the current authenticated user is linked to a professional
 * via the email field on the professionals table.
 * Returns the professional_id if linked, null otherwise.
 */
export function useLinkedProfessional() {
  const { user, loading: authLoading } = useAuth();
  const { tenantId, loading: tenantLoading } = useTenant();
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for both auth and tenant to finish loading
    if (authLoading || tenantLoading) {
      return;
    }

    if (!user?.email || !tenantId) {
      setProfessionalId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log("[useLinkedProfessional] Checking email:", user.email, "tenant:", tenantId);
    supabase
      .rpc("get_professional_by_user_email", {
        p_user_email: user.email,
        p_tenant_id: tenantId,
      })
      .then(({ data, error }) => {
        console.log("[useLinkedProfessional] Result:", { data, error });
        setProfessionalId(!error && data ? data : null);
        setLoading(false);
      });
  }, [user?.email, tenantId, authLoading, tenantLoading]);

  return { professionalId, isProfessional: !!professionalId, loading };
}
