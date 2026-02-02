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
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelect(p.id)}
                  className={`flex items-center gap-4 p-3 rounded-xl border-2 transition-all duration-200 ${
                    isSelected
                      ? "bg-primary/20 border-primary shadow-lg shadow-primary/25 ring-2 ring-primary/40"
                      : "bg-transparent border-border/40 hover:border-border hover:bg-muted/30"
                  }`}
                >
                  <Avatar className="h-16 w-16 rounded-lg border-2 border-background/50">
                    {p.photo_url ? (
                      <AvatarImage src={p.photo_url} alt={p.name} className="object-cover" />
                    ) : null}
                    <AvatarFallback className="rounded-lg bg-muted text-muted-foreground text-lg font-semibold">
                      {initials || <User className="w-6 h-6" />}
                    </AvatarFallback>
                  </Avatar>
                  <span className={`font-semibold text-base ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {p.name}
                  </span>
                </button>
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
