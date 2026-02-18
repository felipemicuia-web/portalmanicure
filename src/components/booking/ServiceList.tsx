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
    <div className="glass-panel space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
            Serviços
          </h2>
          <p className="text-muted-foreground text-sm">
            Escolha pelo menos 1 serviço
          </p>
        </div>
        <Button variant="ghost" onClick={onPrev} size="sm" className="gap-1.5 hover:bg-muted/30 flex-shrink-0 h-9 px-3 rounded-xl">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {services.map((service) => {
          const isSelected = selectedIds.includes(service.id);
          return (
            <article
              key={service.id}
              className={cn(
                "flex gap-4 items-start p-4 sm:p-5 rounded-2xl border transition-all duration-300 cursor-pointer group",
                isSelected 
                  ? "service-selected" 
                  : "border-border/30 bg-card/30 hover:border-border/50 hover:bg-card/50 active:scale-[0.99]"
              )}
              onClick={() => onToggle(service.id)}
            >
              {/* Image */}
              <div
                className={cn(
                  "rounded-xl border border-border/20 overflow-hidden flex-shrink-0",
                  "w-16 h-16 sm:w-20 sm:h-20",
                  "bg-cover bg-center bg-no-repeat",
                  !service.image_url && "bg-gradient-to-br from-primary/15 to-secondary/15"
                )}
                style={service.image_url ? { backgroundImage: `url(${service.image_url})` } : {}}
              >
                {!service.image_url && (
                  <div className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl opacity-40">
                    💅
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div>
                  <h3 className="font-bold text-sm sm:text-base mb-0.5 line-clamp-1">{service.name}</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2">
                    {service.description || "Serviço de beleza profissional"}
                  </p>
                </div>
                
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-base sm:text-lg text-foreground">
                      R$ {formatPrice(service.price)}
                    </span>
                    <span className="text-muted-foreground text-[10px] sm:text-xs flex items-center gap-1 bg-muted/30 px-2 py-0.5 rounded-full">
                      ⏱ {formatDuration(service.duration_minutes)}
                    </span>
                  </div>
                  
                  {/* Selection indicator */}
                  <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                    isSelected
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-muted/30 text-muted-foreground border border-border/30 group-hover:border-border/50"
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

      {/* Selected summary */}
      {selectedIds.length > 0 && (
        <div className="bg-primary/8 border border-primary/15 rounded-2xl p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {selectedIds.length} {selectedIds.length === 1 ? 'serviço' : 'serviços'}
            </span>
            <span className="font-extrabold text-base text-foreground">
              R$ {formatPrice(services.filter(s => selectedIds.includes(s.id)).reduce((acc, s) => acc + Number(s.price), 0))}
            </span>
          </div>
        </div>
      )}

      <div className="pt-1">
        <Button 
          onClick={onNext} 
          disabled={selectedIds.length === 0}
          className="btn-glow w-full h-13 sm:h-14 text-base font-bold rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 disabled:opacity-40 disabled:shadow-none"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
