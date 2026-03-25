import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { LandingHero, LandingStat } from "@/types/landing";

interface Props {
  content: LandingHero;
  onChange: (v: LandingHero) => void;
}

export function LandingAdminHero({ content, onChange }: Props) {
  const updateStat = (index: number, field: keyof LandingStat, value: string) => {
    const stats = [...content.stats];
    stats[index] = { ...stats[index], [field]: value };
    onChange({ ...content, stats });
  };

  const addStat = () => {
    onChange({ ...content, stats: [...content.stats, { label: "Novo", value: "0" }] });
  };

  const removeStat = (index: number) => {
    onChange({ ...content, stats: content.stats.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">Hero Principal</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Badge</Label>
          <Input value={content.badgeText} onChange={(e) => onChange({ ...content, badgeText: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Destaque (texto colorido)</Label>
          <Input value={content.highlight} onChange={(e) => onChange({ ...content, highlight: e.target.value })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Título principal</Label>
        <Input value={content.title} onChange={(e) => onChange({ ...content, title: e.target.value })} />
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea value={content.description} onChange={(e) => onChange({ ...content, description: e.target.value })} rows={3} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Texto botão principal</Label>
          <Input value={content.ctaText} onChange={(e) => onChange({ ...content, ctaText: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Texto botão secundário</Label>
          <Input value={content.secondaryCtaText} onChange={(e) => onChange({ ...content, secondaryCtaText: e.target.value })} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Estatísticas</Label>
          <Button variant="outline" size="sm" onClick={addStat} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Adicionar
          </Button>
        </div>
        {content.stats.map((stat, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input value={stat.value} onChange={(e) => updateStat(i, "value", e.target.value)} placeholder="10K+" className="w-28" />
            <Input value={stat.label} onChange={(e) => updateStat(i, "label", e.target.value)} placeholder="Label" className="flex-1" />
            <Button variant="ghost" size="icon" onClick={() => removeStat(i)} className="shrink-0 text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
