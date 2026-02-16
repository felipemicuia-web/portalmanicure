import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminProfessionals } from "@/components/admin/AdminProfessionals";
import { AdminServices } from "@/components/admin/AdminServices";
import { AdminBookings } from "@/components/admin/AdminBookings";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import { AdminTheme } from "@/components/admin/AdminTheme";
import { AdminWorkHours } from "@/components/admin/AdminWorkHours";
import { AdminProfessionalSchedule } from "@/components/admin/AdminProfessionalSchedule";
import { AdminWhatsAppTemplate } from "@/components/admin/AdminWhatsAppTemplate";
import { AdminBranding } from "@/components/admin/AdminBranding";
import { AdminUsers } from "@/components/admin/AdminUsers";
import {
  Users,
  Sparkles,
  CalendarDays,
  Shield,
  LogOut,
  Home,
  Bell,
  Palette,
  Clock,
  UserCog,
  MessageCircle,
  ImageIcon,
  UsersRound,
} from "lucide-react";

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin, loading: adminLoading } = useAdmin(user);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
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
    toast({ title: "Até logo!", description: "Você saiu da sua conta" });
    navigate("/");
  };

  if (loading || adminLoading) {
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
          <p className="text-muted-foreground mb-6">
            Faça login para acessar o painel administrativo.
          </p>
          <Button onClick={() => navigate("/auth")}>Fazer Login</Button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="galaxy-bg" />
        <div className="glass-panel p-8 text-center relative z-10">
          <Shield className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground mb-6">
            Você não tem permissão para acessar o painel administrativo.
          </p>
          <Button onClick={() => navigate("/")}>Voltar ao Início</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="galaxy-bg" />

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold gradient-text">Painel Admin</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="gap-1"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Início</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 py-6">
          <Tabs defaultValue="bookings" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-10 glass-panel p-1 h-auto">
              <TabsTrigger value="bookings" className="gap-1.5 text-xs sm:text-sm py-2.5 px-1 sm:px-3 flex-col sm:flex-row">
                <CalendarDays className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">Agenda</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-1.5 text-xs sm:text-sm py-2.5 px-1 sm:px-3 flex-col sm:flex-row relative">
                <Bell className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">Avisos</span>
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="gap-1.5 text-xs sm:text-sm py-2.5 px-1 sm:px-3 flex-col sm:flex-row">
                <MessageCircle className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">WhatsApp</span>
              </TabsTrigger>
              <TabsTrigger value="hours" className="gap-1.5 text-xs sm:text-sm py-2.5 px-1 sm:px-3 flex-col sm:flex-row">
                <Clock className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">Horários</span>
              </TabsTrigger>
              <TabsTrigger value="schedules" className="gap-1.5 text-xs sm:text-sm py-2.5 px-1 sm:px-3 flex-col sm:flex-row">
                <UserCog className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">Folgas</span>
              </TabsTrigger>
              <TabsTrigger value="professionals" className="gap-1.5 text-xs sm:text-sm py-2.5 px-1 sm:px-3 flex-col sm:flex-row">
                <Users className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">Profissionais</span>
              </TabsTrigger>
              <TabsTrigger value="services" className="gap-1.5 text-xs sm:text-sm py-2.5 px-1 sm:px-3 flex-col sm:flex-row">
                <Sparkles className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">Serviços</span>
              </TabsTrigger>
              <TabsTrigger value="branding" className="gap-1.5 text-xs sm:text-sm py-2.5 px-1 sm:px-3 flex-col sm:flex-row">
                <ImageIcon className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">Logo</span>
              </TabsTrigger>
              <TabsTrigger value="theme" className="gap-1.5 text-xs sm:text-sm py-2.5 px-1 sm:px-3 flex-col sm:flex-row">
                <Palette className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">Cores</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-1.5 text-xs sm:text-sm py-2.5 px-1 sm:px-3 flex-col sm:flex-row">
                <UsersRound className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">Clientes</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookings">
              <AdminBookings />
            </TabsContent>

            <TabsContent value="notifications">
              <AdminNotifications />
            </TabsContent>

            <TabsContent value="whatsapp">
              <AdminWhatsAppTemplate />
            </TabsContent>

            <TabsContent value="hours">
              <AdminWorkHours />
            </TabsContent>

            <TabsContent value="schedules">
              <AdminProfessionalSchedule />
            </TabsContent>

            <TabsContent value="professionals">
              <AdminProfessionals />
            </TabsContent>

            <TabsContent value="services">
              <AdminServices />
            </TabsContent>

            <TabsContent value="branding">
              <AdminBranding />
            </TabsContent>

            <TabsContent value="theme">
              <AdminTheme />
            </TabsContent>

            <TabsContent value="users">
              <AdminUsers />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
