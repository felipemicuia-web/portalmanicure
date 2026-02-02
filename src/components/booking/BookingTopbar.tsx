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
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Brand */}
          <div className="flex items-center gap-3 group">
            <div 
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 border border-white/20 flex items-center justify-center text-2xl shadow-lg group-hover:scale-105 transition-transform duration-300"
              aria-hidden="true"
              style={{ boxShadow: '0 8px 32px rgba(124,58,237,.3), inset 0 1px 0 rgba(255,255,255,.2)' }}
            >
              💅
            </div>
            <div>
              <div className="font-bold tracking-wide text-lg bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text">
                Agendamento Manicure
              </div>
              <div className="text-xs text-white/70">
                Agende seu horário em poucos cliques
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-4 flex-wrap">
            {user ? (
              <>
                <button
                  onClick={() => onPageChange("booking")}
                  className={`text-sm px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    activePage === "booking" 
                      ? "bg-white/20 font-bold shadow-lg" 
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  Agendamentos
                </button>
                <button
                  onClick={() => onPageChange("profile")}
                  className={`text-sm px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    activePage === "profile" 
                      ? "bg-white/20 font-bold shadow-lg" 
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  Perfil
                </button>
                <button
                  onClick={() => onPageChange("notifications")}
                  className={`text-sm px-3 py-1.5 rounded-lg transition-all duration-200 ${
                    activePage === "notifications" 
                      ? "bg-white/20 font-bold shadow-lg" 
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  Notificações
                </button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onLogout}
                  className="gap-1.5 text-white/80 hover:text-white hover:bg-white/10 border border-white/10"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1.5 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/30 shadow-lg"
                >
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
