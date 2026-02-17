import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

interface TenantContextType {
  tenantId: string | null;
  tenantSlug: string | null;
  tenantName: string | null;
  loading: boolean;
}

const TenantContext = createContext<TenantContextType>({
  tenantId: null,
  tenantSlug: null,
  tenantName: null,
  loading: true,
});

export function useTenant() {
  return useContext(TenantContext);
}

/**
 * Resolves tenant from:
 * 1. Subdomain (e.g., cliente.app.com)
 * 2. Custom domain (e.g., meusite.com.br)
 * 3. URL path (e.g., /t/slug)
 * 4. Falls back to 'default' tenant
 */
function resolveSlugFromUrl(): string {
  const hostname = window.location.hostname;

  // Check for custom domain (not lovable.app, not localhost)
  if (!hostname.includes("lovable.app") && hostname !== "localhost" && !hostname.includes("127.0.0.1")) {
    // Will resolve by custom_domain in the query below
    return `domain:${hostname}`;
  }

  // Check subdomain pattern: <slug>.app.com or <slug>-preview--xxx.lovable.app
  const parts = hostname.split(".");
  if (parts.length >= 3 && parts[0] !== "www") {
    const subdomain = parts[0];
    // Ignore lovable preview subdomains
    if (!subdomain.includes("preview--") && !subdomain.includes("id-preview")) {
      return subdomain;
    }
  }

  // Check URL path pattern: /t/<slug>
  const pathMatch = window.location.pathname.match(/^\/t\/([a-zA-Z0-9_-]+)/);
  if (pathMatch) {
    return pathMatch[1];
  }

  return "default";
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function resolveTenant() {
      try {
        const slug = resolveSlugFromUrl();

        let query = supabase
          .from("tenants")
          .select("id, slug, name")
          .eq("active", true)
          .limit(1)
          .single();

        if (slug.startsWith("domain:")) {
          const domain = slug.replace("domain:", "");
          query = supabase
            .from("tenants")
            .select("id, slug, name")
            .eq("active", true)
            .eq("custom_domain", domain)
            .limit(1)
            .single();
        } else {
          query = supabase
            .from("tenants")
            .select("id, slug, name")
            .eq("active", true)
            .eq("slug", slug)
            .limit(1)
            .single();
        }

        const { data, error } = await query;

        if (error || !data) {
          // Fallback to default tenant
          const { data: defaultTenant } = await supabase
            .from("tenants")
            .select("id, slug, name")
            .eq("slug", "default")
            .single();

          if (defaultTenant) {
            setTenantId(defaultTenant.id);
            setTenantSlug(defaultTenant.slug);
            setTenantName(defaultTenant.name);
          }
        } else {
          setTenantId(data.id);
          setTenantSlug(data.slug);
          setTenantName(data.name);
        }
      } catch (err) {
        logger.error("Error resolving tenant:", err);
      } finally {
        setLoading(false);
      }
    }

    resolveTenant();
  }, []);

  return (
    <TenantContext.Provider value={{ tenantId, tenantSlug, tenantName, loading }}>
      {children}
    </TenantContext.Provider>
  );
}
