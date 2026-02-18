import { Professional } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface ProfessionalSelectProps {
  professionals: Professional[];
  selectedId: string;
  onSelect: (id: string) => void;
  onNext: () => void;
}

export function ProfessionalSelect({
  professionals,
  selectedId,
  onSelect,
  onNext,
}: ProfessionalSelectProps) {
  const navigate = useNavigate();

  const handleViewProfile = (e: React.MouseEvent, professionalId: string) => {
    e.stopPropagation();
    navigate(`/professional/${professionalId}`);
  };

  return (
    <div className="glass-panel space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
          Escolha seu profissional
        </h2>
        <p className="text-muted-foreground text-sm">Selecione quem vai te atender</p>
      </div>

      <div className="flex flex-col gap-3">
        {professionals.map((p) => {
          const isSelected = selectedId === p.id;
          const initials = p.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className={cn(
                "flex items-center gap-4 p-4 sm:p-5 rounded-2xl border transition-all duration-300 w-full text-left group",
                isSelected
                  ? "border-primary/60 bg-primary/10 shadow-lg shadow-primary/10 ring-1 ring-primary/30"
                  : "border-border/30 bg-card/30 hover:border-border/50 hover:bg-card/50 active:scale-[0.98]"
              )}
            >
              <Avatar className={cn(
                "rounded-2xl border-2 flex-shrink-0 transition-all duration-300",
                "h-14 w-14 sm:h-16 sm:w-16",
                isSelected ? "border-primary/50" : "border-border/30"
              )}>
                {p.photo_url ? (
                  <AvatarImage src={p.photo_url} alt={p.name} className="object-cover" />
                ) : null}
                <AvatarFallback className="rounded-2xl bg-muted text-muted-foreground text-base sm:text-lg font-semibold">
                  {initials || <User className="w-5 h-5 sm:w-6 sm:h-6" />}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <span className={cn(
                  "font-bold text-base sm:text-lg block truncate transition-colors",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {p.name}
                </span>
                {p.subtitle && (
                  <span className="text-xs sm:text-sm text-muted-foreground block truncate mt-0.5">
                    {p.subtitle}
                  </span>
                )}
                <span
                  onClick={(e) => handleViewProfile(e, p.id)}
                  className="inline-flex items-center gap-1 mt-1.5 text-xs text-primary/80 hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ver perfil
                </span>
              </div>
              
              <ChevronRight className={cn(
                "w-5 h-5 shrink-0 transition-all duration-300",
                isSelected ? "text-primary translate-x-1" : "text-muted-foreground/40 group-hover:text-muted-foreground"
              )} />
            </button>
          );
        })}

        {professionals.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8">
            Nenhum profissional disponível no momento.
          </div>
        )}
      </div>

      <div className="pt-2">
        <Button
          onClick={onNext}
          disabled={!selectedId}
          className="btn-glow w-full h-13 sm:h-14 text-base font-bold rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 disabled:opacity-40 disabled:shadow-none"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
