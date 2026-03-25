import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { LandingBenefits, LandingCard, SectionDisplayMode } from "@/types/landing";
import { SectionImageUpload } from "./SectionImageUpload";

const ICON_OPTIONS = ["Clock", "Smartphone", "Shield", "BarChart3", "Globe", "Star", "Calendar", "Users", "Scissors", "Zap", "Heart", "Award"];

interface Props {
  content: LandingBenefits;
  onChange: (v: LandingBenefits) => void;
}

export function LandingAdminBenefits({ content, onChange }: Props) {
  const updateCard = (index: number, field: keyof LandingCard, value: string) => {
    const cards = [...content.cards];
    cards[index] = { ...cards[index], [field]: value };
    onChange({ ...content, cards });
  };

  const addCard = () => {
    onChange({ ...content, cards: [...content.cards, { title: "Novo benefício", description: "Descrição", icon: "Star" }] });
  };

  const removeCard = (index: number) => {
    onChange({ ...content, cards: content.cards.filter((_, i) => i !== index) });
  };

  const mode = content.displayMode || "text";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Benefícios</h3>
        <div className="flex items-center gap-2">
          <Label htmlFor="benefits-enabled" className="text-sm">Ativo</Label>
          <Switch id="benefits-enabled" checked={content.enabled} onCheckedChange={(enabled) => onChange({ ...content, enabled })} />
        </div>
      </div>

      <SectionImageUpload
        imageUrl={content.imageUrl || ""}
        displayMode={mode}
        onImageChange={(url) => onChange({ ...content, imageUrl: url })}
        onDisplayModeChange={(m) => onChange({ ...content, displayMode: m })}
        sectionLabel="beneficios"
      />

      {(mode === "text" || mode === "both") && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Badge</Label>
              <Input value={content.badgeText} onChange={(e) => onChange({ ...content, badgeText: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={content.title} onChange={(e) => onChange({ ...content, title: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Subtítulo</Label>
            <Input value={content.subtitle} onChange={(e) => onChange({ ...content, subtitle: e.target.value })} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Cards ({content.cards.length})</Label>
              <Button variant="outline" size="sm" onClick={addCard} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </Button>
            </div>
            {content.cards.map((card, i) => (
              <div key={i} className="p-3 border border-border/50 rounded-lg space-y-2 bg-background/50">
                <div className="flex items-center gap-2">
                  <select
                    value={card.icon}
                    onChange={(e) => updateCard(i, "icon", e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {ICON_OPTIONS.map((ic) => (
                      <option key={ic} value={ic}>{ic}</option>
                    ))}
                  </select>
                  <Input value={card.title} onChange={(e) => updateCard(i, "title", e.target.value)} placeholder="Título" className="flex-1" />
                  <Button variant="ghost" size="icon" onClick={() => removeCard(i)} className="shrink-0 text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Textarea value={card.description} onChange={(e) => updateCard(i, "description", e.target.value)} placeholder="Descrição" rows={2} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
