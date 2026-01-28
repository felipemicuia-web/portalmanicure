import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { User, Session } from "@supabase/supabase-js";
import { LogOut, UserCircle, Sparkles, Calendar } from "lucide-react";
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[linear-gradient(135deg,hsl(350_30%_97%)_0%,hsl(340_40%_94%)_50%,hsl(25_30%_95%)_100%)] p-4 relative overflow-hidden">
      {/* Decorative nail polish elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
      
      {/* Sparkle decorations */}
      <div className="absolute top-20 right-20 text-primary/30 animate-pulse">
        <Sparkles className="w-6 h-6" />
      </div>
      <div className="absolute bottom-32 left-20 text-accent/30 animate-pulse delay-300">
        <Sparkles className="w-4 h-4" />
      </div>
      
      <div className="relative text-center max-w-2xl mx-auto">
        {/* Logo/Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/30">
              <span className="text-4xl">💅</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 text-accent-foreground" />
            </div>
          </div>
        </div>

        <h1 className="mb-4 text-4xl md:text-5xl font-bold text-foreground tracking-tight">
          Bem-vindo ao site de agendamento
        </h1>
        <h2 className="mb-2 text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Manicure Ana
        </h2>
        
        <p className="mb-8 text-lg text-muted-foreground max-w-md mx-auto">
          {user 
            ? `Olá, ${user.email}! Agende seus horários de manicure e pedicure.` 
            : "Unhas lindas e bem cuidadas para você! Faça login para agendar."}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur border border-border shadow-sm">
                <UserCircle className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">{user.email}</span>
              </div>
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="gap-2 rounded-full"
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
                className="font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 rounded-full px-8 gap-2"
              >
                <Calendar className="w-5 h-5" />
                Agendar Horário
              </Button>
              <Button 
                onClick={() => navigate("/auth")}
                variant="outline"
                size="lg"
                className="rounded-full px-8 gap-2"
              >
                <UserCircle className="w-5 h-5" />
                Entrar
              </Button>
            </>
          )}
        </div>

        {/* Services preview */}
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          {["Manicure", "Pedicure", "Unhas em Gel", "Nail Art"].map((service) => (
            <span 
              key={service}
              className="px-4 py-2 bg-card/60 backdrop-blur rounded-full text-sm font-medium text-muted-foreground border border-border/50 shadow-sm"
            >
              {service}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
