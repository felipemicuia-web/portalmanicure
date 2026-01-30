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
    <div className="glass-panel p-5 space-y-4">
      <div>
        <h2 className="text-xl font-semibold mb-1">Selecione um profissional</h2>
        <p className="text-muted-foreground text-sm">Escolha quem vai te atender.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div className="flex-1 w-full sm:w-auto">
          <Label htmlFor="professional" className="text-sm opacity-90 mb-1.5 block">
            Profissional
          </Label>
          <Select value={selectedId} onValueChange={onSelect}>
            <SelectTrigger id="professional" className="w-full bg-input border-border">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {professionals.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={onNext} className="bg-primary hover:bg-primary/90">
          Continuar
        </Button>
      </div>
    </div>
  );
}
