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
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email || !tenantId) {
      setProfessionalId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .rpc("get_professional_by_user_email", {
        p_user_email: user.email,
        p_tenant_id: tenantId,
      })
      .then(({ data, error }) => {
        setProfessionalId(!error && data ? data : null);
        setLoading(false);
      });
  }, [user?.email, tenantId]);

  return { professionalId, isProfessional: !!professionalId, loading };
}
