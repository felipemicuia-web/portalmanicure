import { Link } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BookingTopbarProps {
  user: User | null;
  activePage: "booking" | "profile" | "notifications";
  onPageChange: (page: "booking" | "profile" | "notifications") => void;
  onLogout: () => void;
}

export function BookingTopbar({ 
  user, 
  activePage, 
  onPageChange,
  onLogout 
}: BookingTopbarProps) {
  return (
    <header className="sticky top-0 z-50 topbar-gradient">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-full bg-card/50 border border-border/50 flex items-center justify-center text-2xl"
              aria-hidden="true"
            >
              💅
            </div>
            <div>
              <div className="font-bold tracking-wide">Agendamento Manicure</div>
              <div className="text-xs text-foreground/80">
                Agende seu horário em poucos cliques
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-3 flex-wrap">
            {user ? (
              <>
                <button
                  onClick={() => onPageChange("booking")}
                  className={`text-sm ${activePage === "booking" ? "font-bold underline" : "opacity-80"}`}
                >
                  Agendamentos
                </button>
                <button
                  onClick={() => onPageChange("profile")}
                  className={`text-sm ${activePage === "profile" ? "font-bold underline" : "opacity-80"}`}
                >
                  Perfil
                </button>
                <button
                  onClick={() => onPageChange("notifications")}
                  className={`text-sm ${activePage === "notifications" ? "font-bold underline" : "opacity-80"}`}
                >
                  Notificações
                </button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onLogout}
                  className="gap-1.5 text-foreground/80 hover:text-foreground"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <UserIcon className="w-4 h-4" />
                  Entrar
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
