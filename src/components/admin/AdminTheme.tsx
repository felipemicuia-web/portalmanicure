import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Palette, Check, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import {
  themePresets,
  applyTheme,
  useTenantTheme,
  THEME_STORAGE_KEY,
  THEME_ID_KEY,
  type ThemePreset,
} from "@/hooks/useTheme";

function ThemeCard({
  preset,
  isSelected,
  onClick,
}: {
  preset: ThemePreset;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-full p-4 rounded-xl border-2 transition-all duration-200 text-left",
        "hover:scale-[1.02] hover:shadow-lg",
        isSelected
          ? "border-green-500 shadow-lg shadow-green-500/20"
          : "border-transparent hover:border-white/20"
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${preset.colors.card}), hsl(${preset.colors.background}))`,
      }}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
      <div className="flex gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-full border border-white/20"
          style={{ backgroundColor: `hsl(${preset.colors.primary})` }}
        />
        <div
          className="w-8 h-8 rounded-full border border-white/20"
          style={{ backgroundColor: `hsl(${preset.colors.secondary})` }}
        />
        <div
          className="w-8 h-8 rounded-full border border-white/20"
          style={{ backgroundColor: `hsl(${preset.colors.accent})` }}
        />
      </div>
      <h3 className="font-bold text-white text-lg mb-1">{preset.name}</h3>
      <p className="text-sm text-white/70">{preset.description}</p>
      <div className="mt-3 flex gap-2">
        <div
          className="flex-1 h-2 rounded-full"
          style={{ backgroundColor: `hsl(${preset.colors.primary})` }}
        />
        <div
          className="flex-1 h-2 rounded-full"
          style={{ backgroundColor: `hsl(${preset.colors.secondary})` }}
        />
        <div
          className="w-6 h-2 rounded-full"
          style={{ backgroundColor: `hsl(${preset.colors.accent})` }}
        />
      </div>
    </button>
  );
}

export function AdminTheme() {
  const { themeId } = useTenantTheme();
  const [saving, setSaving] = useState(false);
  const { tenantId } = useTenant();
  const { toast } = useToast();

  const handleSelectTheme = async (preset: ThemePreset) => {
    if (!tenantId || saving) return;
    setSaving(true);

    // Apply immediately in the admin UI
    applyTheme(preset.colors);
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preset.colors));
    localStorage.setItem(THEME_ID_KEY, preset.id);

    // Persist to DB (realtime will propagate to all users)
    const { error } = await supabase
      .from("work_settings")
      .update({ theme_id: preset.id } as any)
      .eq("tenant_id", tenantId);

    setSaving(false);

    if (error) {
      toast({
        title: "Erro ao salvar tema",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Tema aplicado!",
      description: `O tema "${preset.name}" foi salvo para todos os usuários.`,
    });
  };

  const handleReset = () => handleSelectTheme(themePresets[0]);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-4 sm:p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Palette className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold">Escolha o Estilo do Site</h2>
              <p className="text-muted-foreground text-sm">
                O tema selecionado será aplicado para todos os usuários
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleReset}
            disabled={saving}
            className="gap-2 text-muted-foreground"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            Restaurar Padrão
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themePresets.map((preset) => (
          <ThemeCard
            key={preset.id}
            preset={preset}
            isSelected={themeId === preset.id}
            onClick={() => handleSelectTheme(preset)}
          />
        ))}
      </div>

      <div className="glass-panel p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Tema atual:{" "}
          <span className="font-semibold text-foreground">
            {themePresets.find((p) => p.id === themeId)?.name || "Galaxy Premium"}
          </span>
        </p>
      </div>
    </div>
  );
}
