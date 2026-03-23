import { ReactNode, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { useTenantPath } from "@/contexts/TenantScopeProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Shield, UserX } from "lucide-react";

interface RequireAuthProps {
  children: ReactNode;
  fallbackPath?: string;
  /** If true, skip tenant profile check (for superadmin/platform routes) */
  skipTenantCheck?: boolean;
}

export function RequireAuth({ children, fallbackPath, skipTenantCheck = false }: RequireAuthProps) {
  const { user, loading, signOut } = useAuth();
  const { tenantId, loading: tenantLoading } = useTenant();
  const navigate = useNavigate();
  const tp = useTenantPath();
  const authPath = fallbackPath || tp("/auth");

  const [hasTenantProfile, setHasTenantProfile] = useState<boolean | null>(null);

  // Check tenant profile when user and tenant are resolved
  useEffect(() => {
    if (skipTenantCheck || !user || !tenantId) {
      setHasTenantProfile(null);
      return;
    }

    setHasTenantProfile(null); // reset while checking

    supabase
      .rpc("user_has_profile_in_tenant", {
        _user_id: user.id,
        _tenant_id: tenantId,
      })
      .then(({ data }) => {
        setHasTenantProfile(!!data);
      });
  }, [user, tenantId, skipTenantCheck]);

  const isLoading = loading || tenantLoading || (!skipTenantCheck && tenantId && user && hasTenantProfile === null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="galaxy-bg" />
        <div className="glass-panel p-8 text-center relative z-10">
          <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-6">
            Faça login para acessar esta página.
          </p>
          <Button onClick={() => navigate(authPath)}>Fazer Login</Button>
        </div>
      </div>
    );
  }

  if (skipTenantCheck) {
    return <>{children}</>;
  }

  // User is authenticated but has no profile in the current tenant
  if (tenantId && hasTenantProfile === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="galaxy-bg" />
        <div className="glass-panel p-8 text-center relative z-10 max-w-md">
          <UserX className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Conta não encontrada</h1>
          <p className="text-muted-foreground mb-6">
            Sua conta não está registrada neste estabelecimento. 
            Cadastre-se primeiro para ter acesso.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate(authPath)}>
              Cadastrar neste estabelecimento
            </Button>
            <Button variant="ghost" onClick={async () => {
              await signOut();
              navigate(authPath);
            }}>
              Entrar com outra conta
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
