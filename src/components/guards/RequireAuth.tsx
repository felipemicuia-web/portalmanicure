import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

interface RequireAuthProps {
  children: ReactNode;
  fallbackPath?: string;
}

export function RequireAuth({ children, fallbackPath = "/auth" }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
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
          <Button onClick={() => navigate(fallbackPath)}>Fazer Login</Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
