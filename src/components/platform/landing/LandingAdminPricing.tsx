import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { LandingPricing, LandingPlanItem } from "@/types/landing";

interface Props {
  content: LandingPricing;
  onChange: (v: LandingPricing) => void;
}

export function LandingAdminPricing({ content, onChange }: Props) {
  const updatePlan = (index: number, field: keyof LandingPlanItem, value: any) => {
    const plans = [...content.plans];
    plans[index] = { ...plans[index], [field]: value };
    onChange({ ...content, plans });
  };

  const updatePlanFeature = (planIndex: number, featureIndex: number, value: string) => {
    const plans = [...content.plans];
    const features = [...plans[planIndex].features];
    features[featureIndex] = value;
    plans[planIndex] = { ...plans[planIndex], features };
    onChange({ ...content, plans });
  };

  const addPlanFeature = (planIndex: number) => {
    const plans = [...content.plans];
    plans[planIndex] = { ...plans[planIndex], features: [...plans[planIndex].features, "Novo recurso"] };
    onChange({ ...content, plans });
  };

  const removePlanFeature = (planIndex: number, featureIndex: number) => {
    const plans = [...content.plans];
    plans[planIndex] = { ...plans[planIndex], features: plans[planIndex].features.filter((_, i) => i !== featureIndex) };
    onChange({ ...content, plans });
  };

  const addPlan = () => {
    onChange({
      ...content,
      plans: [...content.plans, {
        name: "Novo Plano",
        price: "R$ 0",
        period: "/mês",
        description: "Descrição",
        features: ["Recurso 1"],
        ctaText: "Começar",
        highlighted: false,
      }],
    });
  };

  const removePlan = (index: number) => {
    onChange({ ...content, plans: content.plans.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Preços</h3>
        <div className="flex items-center gap-2">
          <Label htmlFor="pricing-enabled" className="text-sm">Ativo</Label>
          <Switch id="pricing-enabled" checked={content.enabled} onCheckedChange={(enabled) => onChange({ ...content, enabled })} />
        </div>
      </div>

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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Planos ({content.plans.length})</Label>
          <Button variant="outline" size="sm" onClick={addPlan} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Adicionar plano
          </Button>
        </div>

        {content.plans.map((plan, pi) => (
          <div key={pi} className="p-4 border border-border/50 rounded-lg space-y-3 bg-background/50">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">{plan.name || "Plano"}</h4>
              <div className="flex items-center gap-2">
                <Label htmlFor={`plan-hl-${pi}`} className="text-xs">Destaque</Label>
                <Switch id={`plan-hl-${pi}`} checked={plan.highlighted} onCheckedChange={(v) => updatePlan(pi, "highlighted", v)} />
                <Button variant="ghost" size="icon" onClick={() => removePlan(pi)} className="text-destructive hover:text-destructive h-8 w-8">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Nome</Label>
                <Input value={plan.name} onChange={(e) => updatePlan(pi, "name", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Preço</Label>
                <Input value={plan.price} onChange={(e) => updatePlan(pi, "price", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Período</Label>
                <Input value={plan.period} onChange={(e) => updatePlan(pi, "period", e.target.value)} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Descrição</Label>
                <Input value={plan.description} onChange={(e) => updatePlan(pi, "description", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Texto do botão</Label>
                <Input value={plan.ctaText} onChange={(e) => updatePlan(pi, "ctaText", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Recursos</Label>
                <Button variant="ghost" size="sm" onClick={() => addPlanFeature(pi)} className="gap-1 h-7 text-xs">
                  <Plus className="w-3 h-3" /> Recurso
                </Button>
              </div>
              {plan.features.map((f, fi) => (
                <div key={fi} className="flex items-center gap-2">
                  <Input value={f} onChange={(e) => updatePlanFeature(pi, fi, e.target.value)} className="flex-1 h-8 text-sm" />
                  <Button variant="ghost" size="icon" onClick={() => removePlanFeature(pi, fi)} className="shrink-0 text-destructive hover:text-destructive h-8 w-8">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
