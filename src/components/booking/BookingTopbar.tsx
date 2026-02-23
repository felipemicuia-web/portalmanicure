import { Link } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { LogOut, User as UserIcon, Shield, Menu, X, Calendar, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/hooks/useAdmin";
import { useBranding } from "@/hooks/useBranding";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface BookingTopbarProps {
  user: User | null;
  activePage: "booking" | "profile" | "my-bookings";
  onPageChange: (page: "booking" | "profile" | "my-bookings") => void;
  onLogout: () => void;
}

export function BookingTopbar({ 
  user, 
  activePage, 
  onPageChange,
  onLogout 
}: BookingTopbarProps) {
  const { isAdmin } = useAdmin(user);
  const { branding } = useBranding();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handlePageChange = (page: "booking" | "profile" | "my-bookings") => {
    onPageChange(page);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    setMobileMenuOpen(false);
  };

  const logoSizePx = branding.logoSize || 80;

  return (
    <header className="sticky top-0 z-50 topbar-gradient">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Centered Brand */}
          <div className="flex-1 flex items-center justify-center md:justify-start">
            <div className="flex items-center gap-2 group">
              {branding.logoUrl && (
                <div
                  className="flex items-center justify-center overflow-hidden flex-shrink-0"
                  style={{
                    width: `${logoSizePx}px`,
                    height: `${logoSizePx}px`,
                  }}
                >
                  <img
                    src={branding.logoUrl}
                    alt={branding.siteName}
                    className="w-full h-full object-contain"
                    style={{ imageRendering: "auto", background: "transparent" }}
                  />
                </div>
              )}
              {!branding.logoUrl && (
                <div
                  className="rounded-2xl bg-transparent border border-white/20 flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0"
                  style={{
                    width: `${Math.min(logoSizePx, 56)}px`,
                    height: `${Math.min(logoSizePx, 56)}px`,
                  }}
                >
                  <span className="text-2xl sm:text-3xl">💅</span>
                </div>
              )}
              {branding.showBrandName && (
                <div>
                  <div className="font-bold tracking-wide text-base sm:text-lg text-white">
                    {branding.siteName}
                  </div>
                  <div className="text-[10px] sm:text-xs text-white/70 hidden sm:block">
                    {branding.siteSubtitle}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right side: Navigation */}
          <div className="flex items-center gap-2 justify-end">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-3 lg:gap-4">
              {user ? (
                <>
                  <button
                    onClick={() => onPageChange("booking")}
                    className={cn(
                      "text-sm px-3 py-1.5 rounded-lg transition-all duration-200",
                      activePage === "booking" 
                        ? "bg-white/20 font-bold shadow-lg" 
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
                        ? "bg-white/20 font-bold shadow-lg" 
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
                        ? "bg-white/20 font-bold shadow-lg" 
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
        </div>

        {/* Mobile Menu Dropdown */}
        {user && mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-white/10 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handlePageChange("booking")}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all",
                  activePage === "booking" 
                    ? "bg-white/20 font-semibold" 
                    : "text-white/80 hover:bg-white/10"
                )}
              >
                <Calendar className="w-5 h-5" />
                <span>Agendar</span>
              </button>
              <button
                onClick={() => handlePageChange("profile")}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all",
                  activePage === "profile" 
                    ? "bg-white/20 font-semibold" 
                    : "text-white/80 hover:bg-white/10"
                )}
              >
                <UserIcon className="w-5 h-5" />
                <span>Perfil</span>
              </button>
              <button
                onClick={() => handlePageChange("my-bookings")}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all",
                  activePage === "my-bookings" 
                    ? "bg-white/20 font-semibold" 
                    : "text-white/80 hover:bg-white/10"
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
          </div>
        )}
      </div>
    </header>
  );
}
