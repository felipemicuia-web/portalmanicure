import { Professional } from "@/types/booking";
import { Label } from "@/components/ui/label";
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
    <div className="glass-panel p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text">
          Selecione um profissional
        </h2>
        <p className="text-muted-foreground text-xs sm:text-sm">Escolha quem vai te atender.</p>
      </div>

      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="w-full">
          <Label htmlFor="professional" className="text-xs sm:text-sm opacity-90 mb-2 sm:mb-3 block font-medium">
            Profissional
          </Label>
          <div id="professional" className="grid grid-cols-1 gap-2 sm:gap-3">
            {professionals.map((p) => {
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
                    className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 active:scale-[0.98]"
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
                    <span className={cn(
                      "font-semibold text-sm sm:text-base flex-1 text-left truncate",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {p.name}
                    </span>
                  </button>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleViewProfile(e, p.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-primary text-xs"
                      title="Ver perfil"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Ver perfil</span>
                    </button>
                    <ChevronRight className={cn(
                      "w-5 h-5 transition-transform",
                      isSelected ? "text-primary translate-x-1" : "text-muted-foreground"
                    )} />
                  </div>
                </div>
              );
            })}

            {professionals.length === 0 && (
              <div className="col-span-full text-sm text-muted-foreground text-center py-4">
                Nenhum profissional disponível no momento.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={onNext}
            disabled={!selectedId}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 px-5 sm:px-6 h-11 sm:h-12 font-semibold text-sm sm:text-base w-full sm:w-auto"
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}
