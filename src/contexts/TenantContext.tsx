import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import {
  MULTI_TENANT_MODE,
  TENANT_DEFAULT_ID,
  TENANT_DEFAULT_SLUG,
  TENANT_DEFAULT_NAME,
} from "@/config/tenant";

interface TenantContextType {
  tenantId: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
  membershipRole: string | null;
  isSuperAdmin: boolean;
  loading: boolean;
}

export const TenantContext = createContext<TenantContextType>({
  tenantId: null,
  tenantSlug: null,
  tenantName: null,
  membershipRole: null,
  isSuperAdmin: false,
  loading: true,
});

export function useTenant() {
  return useContext(TenantContext);
}

function resolveSlugFromUrl(): string {
  const hostname = window.location.hostname;
  if (!hostname.includes("lovable.app") && hostname !== "localhost" && !hostname.includes("127.0.0.1")) {
    return `domain:${hostname}`;
  }
  const parts = hostname.split(".");
  if (parts.length >= 3 && parts[0] !== "www") {
    const subdomain = parts[0];
    if (!subdomain.includes("preview--") && !subdomain.includes("id-preview")) {
      return subdomain;
    }
  }
  const pathMatch = window.location.pathname.match(/^\/t\/([a-zA-Z0-9_-]+)/);
  if (pathMatch) return pathMatch[1];
  return "default";
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [membershipRole, setMembershipRole] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Resolve tenant — always resolve from DB, never fallback silently
  useEffect(() => {
    async function resolveTenant() {
      try {
        const slug = resolveSlugFromUrl();
        let query;
        if (slug.startsWith("domain:")) {
          const domain = slug.replace("domain:", "");
          query = supabase.from("tenants").select("id, slug, name").eq("active", true).eq("custom_domain", domain).limit(1).single();
        } else {
          query = supabase.from("tenants").select("id, slug, name").eq("active", true).eq("slug", slug).limit(1).single();
        }
        const { data, error } = await query;
        if (error || !data) {
          // Fallback to default tenant
          logger.warn("Tenant not found for slug:", slug, "— falling back to default");
          setTenantId(TENANT_DEFAULT_ID);
          setTenantSlug(TENANT_DEFAULT_SLUG);
          setTenantName(TENANT_DEFAULT_NAME);
        } else {
          setTenantId(data.id);
          setTenantSlug(data.slug);
          setTenantName(data.name);
        }
      } catch (err) {
        logger.error("Error resolving tenant:", err);
        setTenantId(TENANT_DEFAULT_ID);
        setTenantSlug(TENANT_DEFAULT_SLUG);
        setTenantName(TENANT_DEFAULT_NAME);
      } finally {
        setLoading(false);
      }
    }
    resolveTenant();
  }, []);

  // Resolve user role + superadmin status when auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id;
      if (!userId) {
        setMembershipRole(null);
        setIsSuperAdmin(false);
        return;
      }

      // Fire and forget - don't await inside onAuthStateChange
      supabase.rpc("is_superadmin", { _user_id: userId }).then(({ data: superData }) => {
        setIsSuperAdmin(!!superData);
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

  // Dev debug
  useEffect(() => {
    if (import.meta.env.DEV && tenantId) {
      console.log(
        `%c[Tenant] Active → slug: ${tenantSlug} | id: ${tenantId} | role: ${membershipRole} | superadmin: ${isSuperAdmin}`,
        "color: #3b82f6; font-weight: bold;"
      );
    }
  }, [tenantId, tenantSlug, membershipRole, isSuperAdmin]);

  return (
    <TenantContext.Provider value={{ tenantId, tenantSlug, tenantName, membershipRole, isSuperAdmin, loading }}>
      {children}
    </TenantContext.Provider>
  );
}
