import { Professional } from "@/types/booking";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
  return (
    <div className="glass-panel p-6 space-y-5">
      <div>
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text">
          Selecione um profissional
        </h2>
        <p className="text-muted-foreground text-sm">Escolha quem vai te atender.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="flex-1 w-full sm:w-auto glow-ring rounded-lg">
          <Label htmlFor="professional" className="text-sm opacity-90 mb-2 block font-medium">
            Profissional
          </Label>
          <div id="professional" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {professionals.map((p) => {
              const isSelected = selectedId === p.id;
              return (
                <Button
                  key={p.id}
                  type="button"
                  variant={isSelected ? "default" : "secondary"}
                  onClick={() => onSelect(p.id)}
                  className={
                    isSelected
                      ? "h-12 justify-start px-4 font-semibold shadow-lg shadow-primary/20"
                      : "h-12 justify-start px-4"
                  }
                >
                  {p.name}
                </Button>
              );
            })}

            {professionals.length === 0 && (
              <div className="text-sm text-muted-foreground">
                Nenhum profissional disponível no momento.
              </div>
            )}
          </div>
        </div>

        <Button 
          onClick={onNext}
          disabled={!selectedId}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 px-6 h-12 font-semibold"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
