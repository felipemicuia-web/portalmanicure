import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useTenantPath } from "@/contexts/TenantScopeProvider";
import { useLinkedProfessional } from "@/hooks/useLinkedProfessional";
import { ProfessionalAgenda } from "@/components/professional/ProfessionalAgenda";
import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, CalendarDays } from "lucide-react";

export default function ProfessionalAgendaPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { professionalId, isProfessional, loading } = useLinkedProfessional();
  const navigate = useNavigate();
  const tp = useTenantPath();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="galaxy-bg" />
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin relative z-10" />
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
          <p className="text-muted-foreground mb-6">Faça login para acessar sua agenda.</p>
          <Button onClick={() => navigate(tp("/auth"))}>Fazer Login</Button>
        </div>
      </div>
    );
  }

  if (!isProfessional) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="galaxy-bg" />
        <div className="glass-panel p-8 text-center relative z-10">
          <Shield className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground mb-6">
            Seu e-mail não está vinculado a nenhum profissional neste estabelecimento.
          </p>
          <Button onClick={() => navigate(tp("/"))}>Voltar ao Início</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="galaxy-bg" />
      <div className="relative z-10">
        <header className="sticky top-0 z-50 glass-panel border-b border-border/50">
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(tp("/"))} className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              <h1 className="font-semibold text-base sm:text-lg">Minha Agenda</h1>
            </div>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <ProfessionalAgenda professionalId={professionalId!} />
        </main>
      </div>
    </div>
  );
}
