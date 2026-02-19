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
    return `domain:${hostname}`;
  }

  // Check subdomain pattern
  const parts = hostname.split(".");
  if (parts.length >= 3 && parts[0] !== "www") {
    const subdomain = parts[0];
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
    // ── SINGLE-TENANT MODE: skip DB lookup, use fixed values ──
    if (!MULTI_TENANT_MODE) {
      setTenantId(TENANT_DEFAULT_ID);
      setTenantSlug(TENANT_DEFAULT_SLUG);
      setTenantName(TENANT_DEFAULT_NAME);
      setLoading(false);

      if (import.meta.env.DEV) {
        console.log(
          `%c[Tenant] Single-tenant mode → ID: ${TENANT_DEFAULT_ID}`,
          "color: #22c55e; font-weight: bold;"
        );
      }
      return;
    }

    // ── MULTI-TENANT MODE: resolve from URL ──
    async function resolveTenant() {
      try {
        const slug = resolveSlugFromUrl();

        let query;
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
          setTenantId(TENANT_DEFAULT_ID);
          setTenantSlug(TENANT_DEFAULT_SLUG);
          setTenantName(TENANT_DEFAULT_NAME);
          logger.error("Tenant not found, falling back to default:", slug);
        } else {
          setTenantId(data.id);
          setTenantSlug(data.slug);
          setTenantName(data.name);
        }
      } catch (err) {
        logger.error("Error resolving tenant:", err);
        // Always fallback to default on error
        setTenantId(TENANT_DEFAULT_ID);
        setTenantSlug(TENANT_DEFAULT_SLUG);
        setTenantName(TENANT_DEFAULT_NAME);
      } finally {
        setLoading(false);
      }
    }

    resolveTenant();
  }, []);

  // Dev debug log
  useEffect(() => {
    if (import.meta.env.DEV && tenantId) {
      console.log(
        `%c[Tenant] Active → slug: ${tenantSlug} | id: ${tenantId}`,
        "color: #3b82f6; font-weight: bold;"
      );
    }
  }, [tenantId, tenantSlug]);

  return (
    <TenantContext.Provider value={{ tenantId, tenantSlug, tenantName, loading }}>
      {children}
    </TenantContext.Provider>
  );
}
