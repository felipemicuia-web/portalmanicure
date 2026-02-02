import { Service } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, Check } from "lucide-react";

interface ServiceListProps {
  services: Service[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

function formatPrice(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function ServiceList({
  services,
  selectedIds,
  onToggle,
  onPrev,
  onNext,
}: ServiceListProps) {
  return (
    <div className="glass-panel p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text">
            Selecione os serviços
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Escolha pelo menos 1 serviço.
          </p>
        </div>
        <Button variant="ghost" onClick={onPrev} size="sm" className="gap-1 hover:bg-white/10 flex-shrink-0 h-9 px-2 sm:px-3">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden xs:inline">Voltar</span>
        </Button>
      </div>

      <div className="flex flex-col gap-3 mt-2 sm:mt-3">
        {services.map((service) => {
          const isSelected = selectedIds.includes(service.id);
          return (
            <article
              key={service.id}
              className={cn(
                "flex gap-3 sm:gap-4 items-start p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-300 cursor-pointer",
                isSelected 
                  ? "service-selected" 
                  : "border-border/40 bg-card/40 hover:border-border/60 hover:bg-card/60 active:scale-[0.99]"
              )}
              onClick={() => onToggle(service.id)}
            >
              {/* Image - smaller on mobile */}
              <div
                className={cn(
                  "rounded-lg sm:rounded-xl border border-border/30 overflow-hidden flex-shrink-0",
                  "w-14 h-14 sm:w-20 sm:h-20",
                  "bg-cover bg-center bg-no-repeat",
                  !service.image_url && "bg-gradient-to-br from-primary/20 to-secondary/20"
                )}
                style={service.image_url ? { backgroundImage: `url(${service.image_url})` } : {}}
              >
                {!service.image_url && (
                  <div className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl opacity-50">
                    💅
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div>
                  <h3 className="font-semibold text-sm sm:text-base mb-0.5 sm:mb-1 line-clamp-1">{service.name}</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2">
                    {service.description || "Serviço de beleza profissional"}
                  </p>
                </div>
                
                {/* Price and duration row */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="font-bold text-base sm:text-lg bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent">
                      R$ {formatPrice(service.price)}
                    </span>
                    <span className="text-muted-foreground text-[10px] sm:text-xs flex items-center gap-1">
                      ⏱ {formatDuration(service.duration_minutes)}
                    </span>
                  </div>
                  
                  {/* Selection indicator */}
                  <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all",
                    isSelected
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-muted/50 text-muted-foreground border border-border/50"
                  )}>
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline">Selecionado</span>
                      </>
                    ) : (
                      <span>Selecionar</span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Selected summary - mobile friendly */}
      {selectedIds.length > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {selectedIds.length} {selectedIds.length === 1 ? 'serviço' : 'serviços'}
            </span>
            <span className="font-bold text-primary">
              Total: R$ {formatPrice(services.filter(s => selectedIds.includes(s.id)).reduce((acc, s) => acc + Number(s.price), 0))}
            </span>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2 sm:pt-3">
        <Button 
          onClick={onNext} 
          disabled={selectedIds.length === 0}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 px-5 sm:px-6 h-11 sm:h-12 font-semibold text-sm sm:text-base w-full sm:w-auto"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
