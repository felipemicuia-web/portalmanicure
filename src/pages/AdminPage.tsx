import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AdminProfessionals } from "@/components/admin/AdminProfessionals";
import { AdminServices } from "@/components/admin/AdminServices";
import { AdminBookings } from "@/components/admin/AdminBookings";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import { AdminTheme } from "@/components/admin/AdminTheme";
import { AdminWorkHours } from "@/components/admin/AdminWorkHours";
import { AdminProfessionalSchedule } from "@/components/admin/AdminProfessionalSchedule";
import { AdminWhatsAppTemplate } from "@/components/admin/AdminWhatsAppTemplate";
import { AdminHeroHeader } from "@/components/admin/AdminHeroHeader";

import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminCoupons } from "@/components/admin/AdminCoupons";
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
  Image,
  UsersRound,
  Menu,
  ChevronLeft,
  Ticket,
  type LucideIcon,
} from "lucide-react";

const MENU_ITEMS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "bookings", label: "Agenda", icon: CalendarDays },
  { value: "notifications", label: "Avisos", icon: Bell },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "hours", label: "Horários", icon: Clock },
  { value: "schedules", label: "Folgas", icon: UserCog },
  { value: "professionals", label: "Profissionais", icon: Users },
  { value: "services", label: "Serviços", icon: Sparkles },
  { value: "hero", label: "Hero Header", icon: Image },
  { value: "theme", label: "Cores", icon: Palette },
  { value: "coupons", label: "Cupons", icon: Ticket },
  { value: "users", label: "Clientes", icon: UsersRound },
];

const TAB_CONTENT: Record<string, React.ReactNode> = {
  bookings: <AdminBookings />,
  notifications: <AdminNotifications />,
  whatsapp: <AdminWhatsAppTemplate />,
  hours: <AdminWorkHours />,
  schedules: <AdminProfessionalSchedule />,
  professionals: <AdminProfessionals />,
  services: <AdminServices />,
  hero: <AdminHeroHeader />,
  theme: <AdminTheme />,
  coupons: <AdminCoupons />,
  users: <AdminUsers />,
};

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("bookings");
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAdmin, loading: adminLoading } = useAdmin(user);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

  const activeItem = MENU_ITEMS.find((m) => m.value === activeTab);
  const ActiveIcon = activeItem?.icon ?? CalendarDays;

  return (
    <div className="min-h-screen bg-background">
      <div className="galaxy-bg" />

      <div className="relative z-10 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-56 lg:w-64 min-h-screen border-r border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 h-screen">
          <div className="p-4 border-b border-border/50 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="font-bold gradient-text">Painel Admin</h1>
          </div>
          <nav className="flex-1 py-2 overflow-y-auto">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => setActiveTab(item.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold border-r-2 border-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="p-3 border-t border-border/50 space-y-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="w-full justify-start gap-2"
            >
              <Home className="w-4 h-4" />
              Início
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </aside>

        {/* Main area */}
        <div className="flex-1 min-w-0">
          {/* Mobile Header */}
          <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 md:hidden">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 p-0">
                    <div className="p-4 border-b border-border/50 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      <h2 className="font-bold gradient-text">Painel Admin</h2>
                    </div>
                    <nav className="py-2">
                      {MENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.value;
                        return (
                          <button
                            key={item.value}
                            onClick={() => {
                              setActiveTab(item.value);
                              setMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm transition-colors ${
                              isActive
                                ? "bg-primary/10 text-primary font-semibold border-l-3 border-primary"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            }`}
                          >
                            <Icon className="w-5 h-5 shrink-0" />
                            {item.label}
                          </button>
                        );
                      })}
                    </nav>
                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50 space-y-1 bg-background">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setMenuOpen(false); navigate("/"); }}
                        className="w-full justify-start gap-2"
                      >
                        <Home className="w-4 h-4" />
                        Início
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setMenuOpen(false); handleLogout(); }}
                        className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                      >
                        <LogOut className="w-4 h-4" />
                        Sair
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
                <div className="flex items-center gap-2">
                  <ActiveIcon className="w-5 h-5 text-primary" />
                  <h1 className="text-lg font-semibold">{activeItem?.label}</h1>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-9 w-9">
                  <Home className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Desktop Header */}
          <header className="hidden md:block sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
            <div className="px-6 py-3 flex items-center gap-2">
              <ActiveIcon className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">{activeItem?.label}</h2>
            </div>
          </header>

          {/* Content */}
          <main className="p-4 sm:p-6 max-w-5xl">
            {TAB_CONTENT[activeTab]}
          </main>
        </div>
      </div>
    </div>
  );
}
