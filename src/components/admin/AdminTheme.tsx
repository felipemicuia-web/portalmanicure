import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Palette, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    card: string;
    muted: string;
    border: string;
  };
}

const themePresets: ThemePreset[] = [
  {
    id: "galaxy",
    name: "🌌 Galaxy Premium",
    description: "Roxo e ciano com fundo espacial",
    colors: {
      primary: "263 70% 58%",
      secondary: "187 70% 53%",
      accent: "45 96% 53%",
      background: "240 15% 5%",
      card: "240 12% 8%",
      muted: "240 10% 20%",
      border: "240 10% 20%",
    },
  },
  {
    id: "rose-gold",
    name: "🌸 Rosa Elegante",
    description: "Rosa suave com toques dourados",
    colors: {
      primary: "340 65% 55%",
      secondary: "30 80% 65%",
      accent: "45 90% 55%",
      background: "340 20% 8%",
      card: "340 15% 12%",
      muted: "340 10% 20%",
      border: "340 10% 22%",
    },
  },
  {
    id: "ocean",
    name: "🌊 Oceano",
    description: "Azul profundo e verde água",
    colors: {
      primary: "200 80% 50%",
      secondary: "175 70% 45%",
      accent: "45 85% 55%",
      background: "210 25% 6%",
      card: "210 20% 10%",
      muted: "210 15% 18%",
      border: "210 12% 20%",
    },
  },
  {
    id: "forest",
    name: "🌿 Floresta",
    description: "Verde natural e tons terrosos",
    colors: {
      primary: "145 60% 42%",
      secondary: "80 45% 50%",
      accent: "35 80% 55%",
      background: "150 20% 6%",
      card: "150 15% 10%",
      muted: "150 10% 18%",
      border: "150 8% 20%",
    },
  },
  {
    id: "sunset",
    name: "🌅 Pôr do Sol",
    description: "Laranja quente e vermelho",
    colors: {
      primary: "25 90% 55%",
      secondary: "350 75% 55%",
      accent: "45 95% 55%",
      background: "15 20% 6%",
      card: "15 18% 10%",
      muted: "15 12% 18%",
      border: "15 10% 20%",
    },
  },
  {
    id: "midnight",
    name: "🌙 Meia-Noite",
    description: "Azul escuro e prata",
    colors: {
      primary: "220 70% 55%",
      secondary: "210 20% 70%",
      accent: "45 70% 55%",
      background: "225 30% 5%",
      card: "225 25% 9%",
      muted: "225 15% 18%",
      border: "225 12% 20%",
    },
  },
  {
    id: "lavender",
    name: "💜 Lavanda",
    description: "Lilás suave e tons pastel",
    colors: {
      primary: "280 60% 60%",
      secondary: "320 50% 60%",
      accent: "45 80% 60%",
      background: "280 20% 7%",
      card: "280 15% 11%",
      muted: "280 10% 20%",
      border: "280 8% 22%",
    },
  },
];

const THEME_STORAGE_KEY = "site-theme-colors";
const THEME_ID_KEY = "site-theme-id";

function applyTheme(colors: ThemePreset["colors"]) {
  const root = document.documentElement;
  root.style.setProperty("--primary", colors.primary);
  root.style.setProperty("--secondary", colors.secondary);
  root.style.setProperty("--accent", colors.accent);
  root.style.setProperty("--background", colors.background);
  root.style.setProperty("--card", colors.card);
  root.style.setProperty("--muted", colors.muted);
  root.style.setProperty("--border", colors.border);
  root.style.setProperty("--ring", colors.primary);
  root.style.setProperty("--sidebar-primary", colors.primary);
  root.style.setProperty("--sidebar-accent", colors.secondary);
  root.style.setProperty("--popover", colors.card);
  root.style.setProperty("--input", colors.background);
}

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
      {/* Selected Badge */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Color Preview Dots */}
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

      {/* Theme Name & Description */}
      <h3 className="font-bold text-white text-lg mb-1">{preset.name}</h3>
      <p className="text-sm text-white/70">{preset.description}</p>

      {/* Mini Preview */}
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
  const [selectedTheme, setSelectedTheme] = useState<string>("galaxy");
  const { toast } = useToast();

  useEffect(() => {
    const storedId = localStorage.getItem(THEME_ID_KEY);
    if (storedId) {
      setSelectedTheme(storedId);
    }
  }, []);

  const handleSelectTheme = (preset: ThemePreset) => {
    setSelectedTheme(preset.id);
    applyTheme(preset.colors);
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preset.colors));
    localStorage.setItem(THEME_ID_KEY, preset.id);
    toast({
      title: "Tema aplicado!",
      description: `O tema "${preset.name}" foi salvo com sucesso.`,
    });
  };

  const handleReset = () => {
    const defaultPreset = themePresets[0];
    setSelectedTheme(defaultPreset.id);
    applyTheme(defaultPreset.colors);
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(defaultPreset.colors));
    localStorage.setItem(THEME_ID_KEY, defaultPreset.id);
    toast({
      title: "Tema restaurado",
      description: "O tema padrão Galaxy Premium foi restaurado.",
    });
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
                Clique em um tema para aplicar instantaneamente
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleReset}
            className="gap-2 text-muted-foreground"
          >
            <RotateCcw className="w-4 h-4" />
            Restaurar Padrão
          </Button>
        </div>
      </div>

      {/* Theme Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themePresets.map((preset) => (
          <ThemeCard
            key={preset.id}
            preset={preset}
            isSelected={selectedTheme === preset.id}
            onClick={() => handleSelectTheme(preset)}
          />
        ))}
      </div>

      {/* Current Theme Info */}
      <div className="glass-panel p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Tema atual:{" "}
          <span className="font-semibold text-foreground">
            {themePresets.find((p) => p.id === selectedTheme)?.name || "Galaxy Premium"}
          </span>
        </p>
      </div>
    </div>
  );
}
