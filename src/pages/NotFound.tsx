import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate("/", { replace: true }), 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="galaxy-bg" />
      <div className="text-center relative z-10 space-y-4 px-4">
        <h1 className="text-5xl font-bold text-primary">404</h1>
        <p className="text-lg text-muted-foreground">Página não encontrada</p>
        <Button onClick={() => navigate("/", { replace: true })} className="gap-2">
          <Home className="w-4 h-4" />
          Voltar para o início
        </Button>
        <p className="text-xs text-muted-foreground">Redirecionando automaticamente...</p>
      </div>
    </div>
  );
};

export default NotFound;
