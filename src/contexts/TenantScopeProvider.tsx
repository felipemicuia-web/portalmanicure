import { useState, useEffect, ReactNode, createContext, useContext } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TenantContext } from "@/contexts/TenantContext";
import { logger } from "@/lib/logger";

/**
 * Context for the tenant base path prefix.
 * When inside /tenant/:slug/*, basePath = "/tenant/:slug"
 * When at root, basePath = ""
 */
const TenantBasePathContext = createContext<string>("");

export function useTenantBasePath() {
  return useContext(TenantBasePathContext);
}

/**
 * Hook that returns a function to build tenant-aware paths.
 * Usage: const tenantPath = useTenantPath(); tenantPath("/auth") => "/tenant/my-salon/auth"
 */
export function useTenantPath() {
  const basePath = useTenantBasePath();
  return (path: string) => `${basePath}${path}`;
}

interface TenantScopeProviderProps {
  children: ReactNode;
}

/**
 * Wraps routes under /tenant/:slug/* and overrides TenantContext
 * with the tenant resolved from the URL slug.
 */
export function TenantScopeProvider({ children }: TenantScopeProviderProps) {
  const { slug } = useParams<{ slug: string }>();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [membershipRole, setMembershipRole] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Resolve tenant from slug
  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    // Reset state immediately to prevent stale tenant data
    setTenantId(null);
    setTenantSlug(null);
    setTenantName(null);
    setMembershipRole(null);
    setIsSuperAdmin(false);
    setNotFound(false);
    setLoading(true);

    async function resolve() {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, slug, name")
        .eq("slug", slug)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        logger.error("[TenantScope] Tenant not found for slug:", slug);
        setNotFound(true);
        setLoading(false);
        return;
      }

      setTenantId(data.id);
      setTenantSlug(data.slug);
      setTenantName(data.name);
      setLoading(false);
    }

    resolve();
  }, [slug]);

  // Resolve user role when auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id;
      if (!userId) {
        setMembershipRole(null);
        setIsSuperAdmin(false);
        return;
      }

      supabase.rpc("is_superadmin", { _user_id: userId }).then(({ data }) => {
        setIsSuperAdmin(!!data);
      });

      if (tenantId) {
        supabase.rpc("get_user_role_in_tenant" as any, {
          _user_id: userId,
          _tenant_id: tenantId,
        }).then(({ data: roleData }) => {
          setMembershipRole((roleData as string) || null);
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [tenantId]);

  const basePath = `/tenant/${slug || ""}`;

  if (notFound && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 relative z-10">
        <div className="glass-panel max-w-md w-full text-center p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <span className="text-2xl">🏢</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">Estabelecimento não encontrado</h1>
          <p className="text-sm text-muted-foreground">
            O endereço <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">/tenant/{slug}</span> não corresponde a nenhum estabelecimento ativo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TenantContext.Provider
      value={{
        tenantId,
        tenantSlug,
        tenantName,
        membershipRole,
        isSuperAdmin,
        loading,
      }}
    >
      <TenantBasePathContext.Provider value={basePath}>
        {children}
      </TenantBasePathContext.Provider>
    </TenantContext.Provider>
  );
}
