import { Service } from "@/types/booking";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

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
    <div className="glass-panel p-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text">
            Selecione os serviços
          </h2>
          <p className="text-muted-foreground text-sm">
            Escolha pelo menos 1 serviço para continuar.
          </p>
        </div>
        <Button variant="ghost" onClick={onPrev} className="gap-1.5 hover:bg-white/10">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </div>

      <div className="flex flex-col gap-4 mt-3">
        {services.map((service) => {
          const isSelected = selectedIds.includes(service.id);
          return (
            <article
              key={service.id}
              className={cn(
                "grid grid-cols-[80px_1fr_auto] gap-4 items-center p-4 rounded-2xl border transition-all duration-300 cursor-pointer card-hover",
                isSelected 
                  ? "service-selected" 
                  : "border-border/40 bg-card/40 hover:border-border/60 hover:bg-card/60"
              )}
              onClick={() => onToggle(service.id)}
            >
              <div
                className={cn(
                  "w-20 h-20 rounded-xl border border-border/30 overflow-hidden",
                  "bg-cover bg-center bg-no-repeat",
                  !service.image_url && "bg-gradient-to-br from-primary/20 to-secondary/20"
                )}
                style={service.image_url ? { backgroundImage: `url(${service.image_url})` } : {}}
              >
                {!service.image_url && (
                  <div className="w-full h-full flex items-center justify-center text-3xl opacity-50">
                    💅
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h3 className="font-semibold text-base mb-1.5 truncate">{service.name}</h3>
                <p className="text-muted-foreground text-sm truncate">
                  {service.description || "Serviço de beleza profissional"}
                </p>
              </div>

              <div className="text-right flex flex-col gap-2 items-end">
                <div className="font-bold text-lg bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent">
                  R$ {formatPrice(service.price)}
                </div>
                <div className="text-muted-foreground text-xs flex items-center gap-1">
                  ⏱ {formatDuration(service.duration_minutes)}
                </div>
                <Button
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(service.id);
                  }}
                  className={cn(
                    "transition-all duration-300 font-medium",
                    isSelected
                      ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border-0 shadow-lg shadow-green-500/25"
                      : "border-green-500/50 text-green-400 hover:bg-green-500/15 hover:border-green-500"
                  )}
                >
                  {isSelected ? "✓ Selecionado" : "Selecionar"}
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="flex justify-end pt-3">
        <Button 
          onClick={onNext} 
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 px-6 font-semibold"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
