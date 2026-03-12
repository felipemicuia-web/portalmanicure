import { useState, useMemo } from "react";
import { Professional } from "@/types/booking";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, ChevronRight, ExternalLink, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface ProfessionalSelectProps {
  professionals: Professional[];
  selectedId: string;
  onSelect: (id: string) => void;
  onNext: () => void;
  showFilter?: boolean;
}

export function ProfessionalSelect({
  professionals,
  selectedId,
  onSelect,
  onNext,
  showFilter = false,
}: ProfessionalSelectProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSubtitle, setActiveSubtitle] = useState<string | null>(null);

  const handleViewProfile = (e: React.MouseEvent, professionalId: string) => {
    e.stopPropagation();
    navigate(`/professional/${professionalId}`);
  };

  // Extract unique subtitles for filter tabs
  const subtitleTabs = useMemo(() => {
    const subs = professionals
      .map((p) => p.subtitle)
      .filter((s): s is string => !!s && s.trim().length > 0);
    return Array.from(new Set(subs));
  }, [professionals]);

  // Filter professionals
  const filtered = useMemo(() => {
    if (!showFilter) return professionals;
    
    let result = professionals;

    if (activeSubtitle) {
      result = result.filter((p) => p.subtitle === activeSubtitle);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.subtitle && p.subtitle.toLowerCase().includes(term))
      );
    }

    return result;
  }, [professionals, showFilter, activeSubtitle, searchTerm]);

  return (
    <div className="glass-panel p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text">
          Selecione um profissional
        </h2>
        <p className="text-muted-foreground text-xs sm:text-sm">Escolha quem vai te atender.</p>
      </div>

      {showFilter && (
        <div className="space-y-3">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou especialidade..."
              className="pl-9 pr-9 h-10"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Subtitle filter tabs */}
          {subtitleTabs.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveSubtitle(null)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                  !activeSubtitle
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground"
                )}
              >
                Todas
              </button>
              {subtitleTabs.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setActiveSubtitle(activeSubtitle === sub ? null : sub)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                    activeSubtitle === sub
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground"
                  )}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="w-full">
          <Label htmlFor="professional" className="text-xs sm:text-sm opacity-90 mb-2 sm:mb-3 block font-medium">
            Profissional
          </Label>
          <div id="professional" className="grid grid-cols-1 gap-2 sm:gap-3">
            {filtered.map((p) => {
              const isSelected = selectedId === p.id;
              const initials = p.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 w-full",
                    isSelected
                      ? "bg-primary/20 border-primary shadow-lg shadow-primary/25 ring-2 ring-primary/40"
                      : "bg-transparent border-border/40 hover:border-border hover:bg-muted/30"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(p.id)}
                    className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 active:scale-[0.98]"
                  >
                    <Avatar className={cn(
                      "rounded-lg border-2 border-background/50 flex-shrink-0",
                      "h-12 w-12 sm:h-16 sm:w-16"
                    )}>
                      {p.photo_url ? (
                        <AvatarImage src={p.photo_url} alt={p.name} className="object-cover" />
                      ) : null}
                      <AvatarFallback className="rounded-lg bg-muted text-muted-foreground text-sm sm:text-lg font-semibold">
                        {initials || <User className="w-5 h-5 sm:w-6 sm:h-6" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "font-semibold text-sm sm:text-base text-left truncate block",
                        isSelected ? "text-primary" : "text-foreground"
                      )}>
                        {p.name}
                      </span>
                      {p.subtitle && (
                        <span className="text-xs text-muted-foreground text-left truncate block mt-0.5">
                          {p.subtitle}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleViewProfile(e, p.id)}
                        className="flex items-center gap-1 mt-1 text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Ver perfil</span>
                      </button>
                    </div>
                  </button>
                  
                  <div className="flex items-center shrink-0">
                    <ChevronRight className={cn(
                      "w-5 h-5 transition-transform",
                      isSelected ? "text-primary translate-x-1" : "text-muted-foreground"
                    )} />
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="col-span-full text-sm text-muted-foreground text-center py-4">
                {showFilter && (searchTerm || activeSubtitle)
                  ? "Nenhum profissional encontrado com esse filtro."
                  : "Nenhum profissional disponível no momento."}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <Button
            onClick={onNext}
            disabled={!selectedId}
            className="btn-glow bg-gradient-to-r from-primary via-primary/90 to-primary/70 hover:from-primary hover:to-primary/80 shadow-xl shadow-primary/30 px-6 sm:px-8 h-12 sm:h-14 font-extrabold text-sm sm:text-base tracking-wide w-full sm:w-auto rounded-xl"
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}
