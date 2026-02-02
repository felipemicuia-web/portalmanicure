import { Professional } from "@/types/booking";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

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

      <div className="flex flex-col gap-4">
        <div className="w-full">
          <Label htmlFor="professional" className="text-sm opacity-90 mb-3 block font-medium">
            Profissional
          </Label>
          <div id="professional" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {professionals.map((p) => {
              const isSelected = selectedId === p.id;
              const initials = p.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <Button
                  key={p.id}
                  type="button"
                  variant={isSelected ? "default" : "secondary"}
                  onClick={() => onSelect(p.id)}
                  className={`h-auto py-3 px-4 justify-start gap-3 ${
                    isSelected
                      ? "shadow-lg shadow-primary/20 ring-2 ring-primary/50"
                      : "hover:bg-secondary/80"
                  }`}
                >
                  <Avatar className="h-10 w-10 border-2 border-background/50">
                    {p.photo_url ? (
                      <AvatarImage src={p.photo_url} alt={p.name} />
                    ) : null}
                    <AvatarFallback className="bg-muted text-muted-foreground text-sm font-semibold">
                      {initials || <User className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-base">{p.name}</span>
                </Button>
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
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 px-6 h-12 font-semibold"
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}
