import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { hasMinimumRole, TenantRole } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

interface RequireTenantRoleProps {
  children: ReactNode;
  minimumRole: TenantRole;
}

/**
 * Guard that requires the user to have at least the specified role in the active tenant.
 * Superadmins always pass.
 */
export function RequireTenantRole({ children, minimumRole }: RequireTenantRoleProps) {
  const { user, loading: authLoading } = useAuth();
  const { membershipRole, isSuperAdmin, loading: tenantLoading } = useTenant();
  const navigate = useNavigate();

  if (authLoading || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="glass-panel p-8 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-6">Faça login para acessar.</p>
          <Button onClick={() => navigate("/auth")}>Fazer Login</Button>
        </div>
      </div>
    );
  }

  const hasAccess = isSuperAdmin || hasMinimumRole(membershipRole, minimumRole);

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="galaxy-bg" />
        <div className="glass-panel p-8 text-center relative z-10">
          <Shield className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground mb-6">
            Você não tem permissão para acessar esta área.
          </p>
          <Button onClick={() => navigate("/")}>Voltar ao Início</Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
