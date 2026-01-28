import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { User, Session } from "@supabase/supabase-js";
import { LogOut, UserCircle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Até logo!",
      description: "Você saiu da sua conta",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative text-center max-w-2xl mx-auto">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/20">
              <Sparkles className="w-10 h-10 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
              <span className="text-xs text-accent-foreground">✨</span>
            </div>
          </div>
        </div>

        <h1 className="mb-4 text-4xl md:text-5xl font-bold text-foreground tracking-tight">
          Bem-vindo ao seu App
        </h1>
        
        <p className="mb-8 text-lg text-muted-foreground max-w-md mx-auto">
          {user 
            ? `Olá, ${user.email}! Sua sessão está ativa.` 
            : "Crie uma conta ou faça login para começar a usar."}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border border-border">
                <UserCircle className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">{user.email}</span>
              </div>
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </>
          ) : (
            <>
              <Button 
                onClick={() => navigate("/auth")}
                size="lg"
                className="font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                <UserCircle className="w-5 h-5 mr-2" />
                Entrar ou Cadastrar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
