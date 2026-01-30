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
    <div className="glass-panel p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold mb-1">Selecione os serviços</h2>
          <p className="text-muted-foreground text-sm">
            Escolha pelo menos 1 serviço para continuar.
          </p>
        </div>
        <Button variant="ghost" onClick={onPrev} className="gap-1">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
      </div>

      <div className="flex flex-col gap-3 mt-2.5">
        {services.map((service) => {
          const isSelected = selectedIds.includes(service.id);
          return (
            <article
              key={service.id}
              className={cn(
                "grid grid-cols-[72px_1fr_auto] gap-3.5 items-center p-3 rounded-xl border border-border/50 bg-card/50",
                isSelected && "service-selected"
              )}
            >
              <div
                className={cn(
                  "w-[72px] h-[72px] rounded-xl bg-muted/30 border border-border/50",
                  "bg-cover bg-center bg-no-repeat",
                  !service.image_url && "opacity-75"
                )}
                style={service.image_url ? { backgroundImage: `url(${service.image_url})` } : {}}
              />

              <div className="min-w-0">
                <h3 className="font-medium text-base mb-1 truncate">{service.name}</h3>
                <p className="text-muted-foreground text-sm truncate">
                  {service.description || ""}
                </p>
              </div>

              <div className="text-right flex flex-col gap-1.5 items-end">
                <div className="font-bold">R$ {formatPrice(service.price)}</div>
                <div className="text-muted-foreground text-xs">
                  {formatDuration(service.duration_minutes)}
                </div>
                <Button
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => onToggle(service.id)}
                  className={cn(
                    isSelected
                      ? "bg-green-600 hover:bg-green-700 border-green-600"
                      : "border-green-500 text-green-500 hover:bg-green-500/10"
                  )}
                >
                  {isSelected ? "Selecionado" : "Selecionar"}
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={onNext} className="bg-primary hover:bg-primary/90">
          Continuar
        </Button>
      </div>
    </div>
  );
}
