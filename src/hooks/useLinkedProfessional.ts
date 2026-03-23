import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

/**
 * Checks if the current authenticated user is linked to a professional
 * via the email field on the professionals table.
 * Returns the professional_id if linked, null otherwise.
 */
export function useLinkedProfessional() {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkLink = useCallback(async (email: string, tid: string) => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_professional_by_user_email", {
      p_user_email: email,
      p_tenant_id: tid,
    });
    setProfessionalId(!error && data ? data : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tenantLoading) return;

    if (!tenantId) {
      setProfessionalId(null);
      setLoading(false);
      return;
    }

    // Check current session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        checkLink(session.user.email, tenantId);
      } else {
        setProfessionalId(null);
        setLoading(false);
      }
    });

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email && tenantId) {
        checkLink(session.user.email, tenantId);
      } else {
        setProfessionalId(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [tenantId, tenantLoading, checkLink]);

  return { professionalId, isProfessional: !!professionalId, loading };
}
