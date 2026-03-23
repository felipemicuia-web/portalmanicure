import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { logger } from "@/lib/logger";

/**
 * Checks if the current authenticated user is linked to a professional
 * via the email field on the professionals table.
 * Returns the professional_id if linked, null otherwise.
 */
export function useLinkedProfessional() {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkLink = useCallback(async (tid: string, authEmail?: string | null) => {
    setLoading(true);

    const normalizedEmail = authEmail?.trim().toLowerCase() || null;
    logger.info("[ProfessionalLink] Checking professional link", {
      authEmail: normalizedEmail,
      tenantId: tid,
    });

    const { data, error } = await supabase.rpc("get_my_linked_professional" as any, {
      p_tenant_id: tid,
    });

    if (error) {
      logger.error("[ProfessionalLink] Failed to resolve linked professional", {
        authEmail: normalizedEmail,
        tenantId: tid,
        error,
      });
      setProfessionalId(null);
      setLoading(false);
      return;
    }

    const nextProfessionalId = data || null;
    setProfessionalId(nextProfessionalId);

    logger.info("[ProfessionalLink] Professional resolution result", {
      authEmail: normalizedEmail,
      tenantId: tid,
      foundProfessional: !!nextProfessionalId,
      professionalId: nextProfessionalId,
      topbarReason: nextProfessionalId
        ? "professional linked successfully"
        : "no active professional linked to authenticated user in current tenant",
    });

    setLoading(false);
  }, []);

  useEffect(() => {
    if (tenantLoading) return;

    if (!tenantId) {
      setProfessionalId(null);
      setLoading(false);
      return;
    }

    const applySession = async (session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) => {
      const normalizedEmail = session?.user?.email?.trim().toLowerCase() || null;

      if (normalizedEmail) {
        await checkLink(tenantId, normalizedEmail);
        return;
      }

      logger.info("[ProfessionalLink] Skipping professional resolution", {
        authEmail: normalizedEmail,
        tenantId,
        reason: session?.user ? "authenticated user has no email" : "no authenticated user",
      });

      setProfessionalId(null);
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      void applySession(session);
    });

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session);
    });

    return () => subscription.unsubscribe();
  }, [tenantId, tenantLoading, checkLink]);

  return { professionalId, isProfessional: !!professionalId, loading };
}
