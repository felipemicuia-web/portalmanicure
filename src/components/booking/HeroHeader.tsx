import { Link } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { LogOut, User as UserIcon, Shield, Menu, X, Calendar, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/hooks/useAdmin";
import { useBranding } from "@/hooks/useBranding";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface HeroHeaderProps {
  user: User | null;
  activePage: "booking" | "profile" | "my-bookings";
  onPageChange: (page: "booking" | "profile" | "my-bookings") => void;
  onLogout: () => void;
}

export function HeroHeader({ user, activePage, onPageChange, onLogout }: HeroHeaderProps) {
  const { branding } = useBranding();
  const { isAdmin } = useAdmin(user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const logoSizePx = Math.round((branding.logoSize || 80) * 1.4);

  const handlePageChange = (page: "booking" | "profile" | "my-bookings") => {
    onPageChange(page);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    setMobileMenuOpen(false);
  };

  return (
    <section className="relative w-full overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, hsl(230 50% 12%) 0%, hsl(230 50% 8%) 100%)",
        }}
      />

      {/* Top bar inside hero — menu button */}
      <div className="relative z-20 flex items-center justify-end px-3 sm:px-5 pt-3 sm:pt-4">
        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={() => onPageChange("booking")}
                className={cn(
                  "text-sm px-3 py-1.5 rounded-lg transition-all duration-200",
                  activePage === "booking"
                    ? "bg-white/20 font-bold shadow-lg text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                Agendar
              </button>
              <button
                onClick={() => onPageChange("profile")}
                className={cn(
                  "text-sm px-3 py-1.5 rounded-lg transition-all duration-200",
                  activePage === "profile"
                    ? "bg-white/20 font-bold shadow-lg text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                Perfil
              </button>
              <button
                onClick={() => onPageChange("my-bookings")}
                className={cn(
                  "text-sm px-3 py-1.5 rounded-lg transition-all duration-200",
                  activePage === "my-bookings"
                    ? "bg-white/20 font-bold shadow-lg text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                )}
              >
                Meus Agendamentos
              </button>
              {isAdmin && (
                <Link to="/admin">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-white/80 hover:text-white hover:bg-white/10 border border-primary/30"
                  >
                    <Shield className="w-4 h-4" />
                    Admin
                  </Button>
                </Link>
              )}
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

        {/* Mobile buttons */}
        <div className="flex md:hidden items-center gap-2">
          {!user && (
            <Link to="/auth">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/30 shadow-lg h-9 px-3"
              >
                <UserIcon className="w-4 h-4" />
                <span className="hidden xs:inline">Entrar</span>
              </Button>
            </Link>
          )}
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white/90 hover:bg-white/10 h-10 w-10 p-0"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {user && mobileMenuOpen && (
        <div className="relative z-20 mx-3 mt-2 p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 animate-in slide-in-from-top-2 duration-200 md:hidden">
          <button
            onClick={() => handlePageChange("booking")}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all w-full",
              activePage === "booking" ? "bg-white/20 font-semibold text-white" : "text-white/80 hover:bg-white/10"
            )}
          >
            <Calendar className="w-5 h-5" />
            <span>Agendar</span>
          </button>
          <button
            onClick={() => handlePageChange("profile")}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all w-full",
              activePage === "profile" ? "bg-white/20 font-semibold text-white" : "text-white/80 hover:bg-white/10"
            )}
          >
            <UserIcon className="w-5 h-5" />
            <span>Perfil</span>
          </button>
          <button
            onClick={() => handlePageChange("my-bookings")}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all w-full",
              activePage === "my-bookings" ? "bg-white/20 font-semibold text-white" : "text-white/80 hover:bg-white/10"
            )}
          >
            <CalendarCheck className="w-5 h-5" />
            <span>Meus Agendamentos</span>
          </button>
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-white/80 hover:bg-white/10 transition-all"
            >
              <Shield className="w-5 h-5" />
              <span>Admin</span>
            </Link>
          )}
          <div className="border-t border-white/10 mt-2 pt-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-white/80 hover:bg-white/10 w-full text-left transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}

      {/* Hero content — logo + text */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 pt-4 pb-10 sm:pt-6 sm:pb-14 text-center">
        {branding.logoUrl ? (
          <div
            className="mb-4 flex-shrink-0"
            style={{
              width: `${logoSizePx}px`,
              height: `${logoSizePx}px`,
              filter: "drop-shadow(0 0 18px rgba(255,255,255,0.25))",
            }}
          >
            <img
              src={branding.logoUrl}
              alt={branding.siteName}
              className="w-full h-full object-contain"
              style={{ imageRendering: "auto", background: "transparent" }}
            />
          </div>
        ) : (
          <div
            className="mb-4 rounded-2xl border border-white/20 flex items-center justify-center"
            style={{
              width: `${Math.min(logoSizePx, 72)}px`,
              height: `${Math.min(logoSizePx, 72)}px`,
              filter: "drop-shadow(0 0 18px rgba(255,255,255,0.25))",
            }}
          >
            <span className="text-4xl">💅</span>
          </div>
        )}

        <h1
          className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-wide"
          style={{
            background: "linear-gradient(135deg, #f5c6aa 0%, #e8b88a 40%, #d4a574 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))",
          }}
        >
          Manicures De Sucesso
        </h1>

        <p className="mt-2 text-sm sm:text-base text-white/70 max-w-md">
          Plataforma profissional para agendamentos premium
        </p>
      </div>
    </section>
  );
}
