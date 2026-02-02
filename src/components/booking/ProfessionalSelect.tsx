import { Professional } from "@/types/booking";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
          <Select value={selectedId} onValueChange={onSelect}>
            <SelectTrigger 
              id="professional" 
              className="w-full bg-input/80 border-border/60 hover:border-border transition-all duration-200 h-12 text-base"
            >
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
              {professionals.map((p) => (
                <SelectItem 
                  key={p.id} 
                  value={p.id}
                  className="hover:bg-primary/20 focus:bg-primary/20 cursor-pointer transition-colors"
                >
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={onNext} 
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 px-6 h-12 font-semibold"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
