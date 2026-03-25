import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { LandingHeader, LandingMenuItem } from "@/types/landing";

interface Props {
  content: LandingHeader;
  onChange: (v: LandingHeader) => void;
}

export function LandingAdminHeader({ content, onChange }: Props) {
  const updateMenuItem = (index: number, field: keyof LandingMenuItem, value: string) => {
    const items = [...content.menuItems];
    items[index] = { ...items[index], [field]: value };
    onChange({ ...content, menuItems: items });
  };

  const addMenuItem = () => {
    onChange({ ...content, menuItems: [...content.menuItems, { label: "Novo item", href: "#" }] });
  };

  const removeMenuItem = (index: number) => {
    onChange({ ...content, menuItems: content.menuItems.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">Header</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nome da marca</Label>
          <Input value={content.brandName} onChange={(e) => onChange({ ...content, brandName: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>URL do logo</Label>
          <Input value={content.logoUrl} onChange={(e) => onChange({ ...content, logoUrl: e.target.value })} placeholder="https://..." />
        </div>
        <div className="space-y-2">
          <Label>Texto botão login</Label>
          <Input value={content.loginButtonText} onChange={(e) => onChange({ ...content, loginButtonText: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Texto botão CTA</Label>
          <Input value={content.ctaButtonText} onChange={(e) => onChange({ ...content, ctaButtonText: e.target.value })} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Itens do menu</Label>
          <Button variant="outline" size="sm" onClick={addMenuItem} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Adicionar
          </Button>
        </div>
        {content.menuItems.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input value={item.label} onChange={(e) => updateMenuItem(i, "label", e.target.value)} placeholder="Label" className="flex-1" />
            <Input value={item.href} onChange={(e) => updateMenuItem(i, "href", e.target.value)} placeholder="#ancora" className="flex-1" />
            <Button variant="ghost" size="icon" onClick={() => removeMenuItem(i)} className="shrink-0 text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
