import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTheme, hexToHsl, hslToHex } from "@/hooks/useTheme";
import { Palette, RotateCcw, Save, Eye } from "lucide-react";

interface ColorPickerProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorPicker({ label, description, value, onChange }: ColorPickerProps) {
  const hexValue = hslToHex(value);

  return (
    <div className="glass-panel p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg border border-border shadow-inner"
            style={{ backgroundColor: hexValue }}
          />
          <input
            type="color"
            value={hexValue}
            onChange={(e) => onChange(hexToHsl(e.target.value))}
            className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
          />
        </div>
      </div>
      <div className="text-xs font-mono text-muted-foreground bg-muted/30 px-2 py-1 rounded">
        HSL: {value}
      </div>
    </div>
  );
}

export function AdminTheme() {
  const { theme, updateTheme, resetTheme, defaultTheme } = useTheme();
  const { toast } = useToast();
  const [localTheme, setLocalTheme] = useState(theme);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalTheme(theme);
  }, [theme]);

  const handleColorChange = (key: keyof typeof theme, value: string) => {
    setLocalTheme((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handlePreview = () => {
    updateTheme(localTheme);
    toast({
      title: "Pré-visualização aplicada",
      description: "As cores estão sendo exibidas temporariamente.",
    });
  };

  const handleSave = () => {
    updateTheme(localTheme);
    setHasChanges(false);
    toast({
      title: "Tema salvo!",
      description: "As novas cores foram aplicadas ao site.",
    });
  };

  const handleReset = () => {
    resetTheme();
    setLocalTheme(defaultTheme);
    setHasChanges(false);
    toast({
      title: "Tema restaurado",
      description: "As cores originais foram restauradas.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-2">
          <Palette className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Personalização de Cores</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Customize as cores do site em tempo real. As alterações serão salvas e aplicadas para todos os visitantes.
        </p>
      </div>

      {/* Color Pickers */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ColorPicker
          label="Cor Primária"
          description="Botões principais, destaques e links"
          value={localTheme.primary}
          onChange={(v) => handleColorChange("primary", v)}
        />
        <ColorPicker
          label="Cor Secundária"
          description="Elementos secundários e acentos"
          value={localTheme.secondary}
          onChange={(v) => handleColorChange("secondary", v)}
        />
        <ColorPicker
          label="Cor de Destaque"
          description="Badges, indicadores e ícones especiais"
          value={localTheme.accent}
          onChange={(v) => handleColorChange("accent", v)}
        />
        <ColorPicker
          label="Fundo Principal"
          description="Cor de fundo do site"
          value={localTheme.background}
          onChange={(v) => handleColorChange("background", v)}
        />
        <ColorPicker
          label="Fundo dos Cards"
          description="Painéis, cards e modais"
          value={localTheme.card}
          onChange={(v) => handleColorChange("card", v)}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={handlePreview}
          disabled={!hasChanges}
          className="gap-2"
        >
          <Eye className="w-4 h-4" />
          Pré-visualizar
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          Salvar Tema
        </Button>
        <Button
          variant="ghost"
          onClick={handleReset}
          className="gap-2 text-destructive hover:text-destructive"
        >
          <RotateCcw className="w-4 h-4" />
          Restaurar Padrão
        </Button>
      </div>

      {/* Preview Section */}
      <div className="glass-panel p-4 sm:p-6 space-y-4">
        <h3 className="font-semibold">Pré-visualização</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Button className="w-full">Botão Primário</Button>
            <Button variant="secondary" className="w-full">Botão Secundário</Button>
            <Button variant="outline" className="w-full">Botão Outline</Button>
          </div>
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-primary text-primary-foreground text-center text-sm">
              Cor Primária
            </div>
            <div className="p-3 rounded-lg bg-secondary text-secondary-foreground text-center text-sm">
              Cor Secundária
            </div>
            <div className="p-3 rounded-lg bg-accent text-accent-foreground text-center text-sm">
              Cor de Destaque
            </div>
          </div>
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-card border border-border text-card-foreground text-center text-sm">
              Card
            </div>
            <div className="p-3 rounded-lg bg-muted text-muted-foreground text-center text-sm">
              Muted
            </div>
            <div className="p-3 rounded-lg bg-destructive text-destructive-foreground text-center text-sm">
              Destructive
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
