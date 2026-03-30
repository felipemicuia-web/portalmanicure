import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Palette, Check, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenant } from "@/contexts/TenantContext";
import { useThemeContext, themePresets, animationPresets, ThemePreset, AnimationPreset } from "@/contexts/ThemeContext";

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
        <div className="w-8 h-8 rounded-full border border-white/20" style={{ backgroundColor: `hsl(${preset.colors.primary})` }} />
        <div className="w-8 h-8 rounded-full border border-white/20" style={{ backgroundColor: `hsl(${preset.colors.secondary})` }} />
        <div className="w-8 h-8 rounded-full border border-white/20" style={{ backgroundColor: `hsl(${preset.colors.accent})` }} />
      </div>

      <h3 className="font-bold text-lg mb-1" style={{ color: `hsl(${preset.colors.primary})` }}>{preset.name}</h3>
      <p className="text-sm" style={{ color: `hsl(${preset.colors.secondary})` }}>{preset.description}</p>

      <div className="mt-3 flex gap-2">
        <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: `hsl(${preset.colors.primary})` }} />
        <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: `hsl(${preset.colors.secondary})` }} />
        <div className="w-6 h-2 rounded-full" style={{ backgroundColor: `hsl(${preset.colors.accent})` }} />
      </div>
    </button>
  );
}

function AnimationCard({
  preset,
  isSelected,
  onClick,
}: {
  preset: AnimationPreset;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-full p-3 rounded-xl border-2 transition-all duration-200 text-left",
        "hover:scale-[1.02] hover:shadow-lg",
        isSelected
          ? "border-green-500 shadow-lg shadow-green-500/20 bg-green-500/10"
          : "border-border/50 hover:border-primary/30 bg-card/50"
      )}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
      <h4 className="font-semibold text-foreground text-sm">{preset.name}</h4>
      <p className="text-xs text-muted-foreground mt-0.5">{preset.description}</p>
    </button>
  );
}

export function AdminTheme() {
  const { currentThemeId, animationId, setTheme, setAnimation, canEditTheme } = useThemeContext();
  const { isSuperAdmin } = useTenant();
  const { toast } = useToast();

  const blocked = () => {
    toast({
      title: "Alteração bloqueada",
      description: "Contas superadmin não podem alterar o tema dos tenants.",
    });
  };

  const handleSelectTheme = async (preset: ThemePreset) => {
    if (!canEditTheme) return blocked();
    await setTheme(preset.id);
    toast({ title: "Tema aplicado!", description: `O tema "${preset.name}" foi salvo.` });
  };

  const handleSelectAnimation = async (preset: AnimationPreset) => {
    if (!canEditTheme) return blocked();
    await setAnimation(preset.id);
    toast({ title: "Animação aplicada!", description: `A animação "${preset.name}" foi salva.` });
  };

  const handleReset = async () => {
    if (!canEditTheme) return blocked();
    await setTheme("galaxy");
    await setAnimation("auto");
    toast({ title: "Tema restaurado", description: "O tema Galaxy Premium com animação automática foi restaurado." });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-4 sm:p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Palette className="w-6 h-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold">Escolha o Estilo do Site</h2>
              <p className="text-muted-foreground text-sm">
                {isSuperAdmin
                  ? "Conta superadmin não pode alterar o tema dos tenants"
                  : "Escolha cores e animações para personalizar seu site"}
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleReset} disabled={!canEditTheme} className="gap-2 text-muted-foreground disabled:opacity-50">
            <RotateCcw className="w-4 h-4" />
            Restaurar Padrão
          </Button>
        </div>
      </div>

      {/* Themes */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Cores do Tema
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {themePresets.map((preset) => (
            <ThemeCard
              key={preset.id}
              preset={preset}
              isSelected={currentThemeId === preset.id}
              onClick={() => handleSelectTheme(preset)}
            />
          ))}
        </div>
      </div>

      {/* Animations */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Animação de Fundo
        </h3>
        <p className="text-sm text-muted-foreground">
          Escolha uma animação independente ou use "Automática" para seguir o tema.
        </p>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {animationPresets.map((preset) => (
            <AnimationCard
              key={preset.id}
              preset={preset}
              isSelected={animationId === preset.id}
              onClick={() => handleSelectAnimation(preset)}
            />
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="glass-panel p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Tema:{" "}
          <span className="font-semibold text-foreground">
            {themePresets.find((p) => p.id === currentThemeId)?.name || "Galaxy Premium"}
          </span>
          {" · "}Animação:{" "}
          <span className="font-semibold text-foreground">
            {animationPresets.find((a) => a.id === animationId)?.name || "Automática"}
          </span>
        </p>
      </div>
    </div>
  );
}
