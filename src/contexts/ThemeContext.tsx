import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { TENANT_DEFAULT_ID } from "@/config/tenant";

// Theme presets - single source of truth
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  card: string;
  muted: string;
  border: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
}

export interface AnimationPreset {
  id: string;
  name: string;
  description: string;
}

export const animationPresets: AnimationPreset[] = [
  { id: "auto", name: "🎨 Automática", description: "Animação padrão do tema" },
  { id: "none", name: "⛔ Sem Animação", description: "Fundo limpo sem partículas" },
  { id: "stars", name: "✨ Estrelas", description: "Estrelas brilhando no céu" },
  { id: "bubbles", name: "🫧 Bolhas", description: "Bolhas subindo suavemente" },
  { id: "petals", name: "🌸 Pétalas", description: "Pétalas de flor caindo" },
  { id: "leaves", name: "🍃 Folhas", description: "Folhas caindo suavemente" },
  { id: "rays", name: "☀️ Raios de Luz", description: "Feixes de luz quentes" },
  { id: "snow", name: "❄️ Neve", description: "Flocos de neve descendo" },
  { id: "butterflies", name: "🦋 Borboletas", description: "Borboletas flutuando" },
  { id: "sparkles", name: "💫 Brilhos", description: "Partículas cintilantes" },
  { id: "fireflies", name: "🔥 Vagalumes", description: "Luzes flutuando na escuridão" },
  { id: "hearts", name: "💖 Corações", description: "Corações subindo suavemente" },
  { id: "confetti", name: "🎉 Confete", description: "Confetes coloridos caindo" },
];

export const themePresets: ThemePreset[] = [
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
    id: "rosa",
    name: "🌸 Rosa Elegante",
    description: "Pétalas flutuantes e tons rosados",
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
    id: "oceano",
    name: "🌊 Oceano",
    description: "Bolhas subindo do fundo do mar",
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
    id: "floresta",
    name: "🌿 Floresta",
    description: "Folhas caindo suavemente",
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
    id: "pordosol",
    name: "🌅 Pôr do Sol",
    description: "Raios de luz quentes",
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
    id: "meianoite",
    name: "🌙 Meia-Noite",
    description: "Flocos de neve brilhantes",
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
    id: "lavanda",
    name: "💜 Lavanda",
    description: "Borboletas flutuantes",
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
  {
    id: "preto",
    name: "🖤 Preto Absoluto",
    description: "Elegância total em preto",
    colors: {
      primary: "0 0% 75%",
      secondary: "0 0% 50%",
      accent: "0 0% 90%",
      background: "0 0% 3%",
      card: "0 0% 7%",
      muted: "0 0% 15%",
      border: "0 0% 15%",
    },
  },
  {
    id: "branco",
    name: "🤍 Branco Clean",
    description: "Minimalista e luminoso",
    colors: {
      primary: "220 60% 50%",
      secondary: "200 50% 60%",
      accent: "45 90% 50%",
      background: "220 20% 95%",
      card: "220 15% 98%",
      muted: "220 10% 90%",
      border: "220 10% 85%",
    },
  },
  {
    id: "vermelho",
    name: "❤️ Vermelho Intenso",
    description: "Paixão e energia vibrante",
    colors: {
      primary: "0 75% 50%",
      secondary: "350 60% 55%",
      accent: "35 90% 55%",
      background: "0 20% 6%",
      card: "0 15% 10%",
      muted: "0 10% 18%",
      border: "0 8% 20%",
    },
  },
  {
    id: "dourado",
    name: "👑 Dourado Royal",
    description: "Luxo e sofisticação",
    colors: {
      primary: "42 80% 50%",
      secondary: "30 60% 45%",
      accent: "50 90% 60%",
      background: "35 15% 6%",
      card: "35 12% 10%",
      muted: "35 8% 18%",
      border: "35 8% 20%",
    },
  },
  {
    id: "neon",
    name: "💚 Neon Cyber",
    description: "Estilo cyberpunk futurista",
    colors: {
      primary: "150 100% 50%",
      secondary: "280 100% 60%",
      accent: "50 100% 55%",
      background: "240 20% 4%",
      card: "240 15% 7%",
      muted: "240 10% 15%",
      border: "240 8% 18%",
    },
  },
  {
    id: "terracota",
    name: "🏺 Terracota",
    description: "Tons terrosos e acolhedores",
    colors: {
      primary: "15 55% 50%",
      secondary: "30 40% 55%",
      accent: "45 60% 55%",
      background: "20 15% 7%",
      card: "20 12% 11%",
      muted: "20 8% 20%",
      border: "20 6% 22%",
    },
  },
];

function applyThemeToDOM(colors: ThemeColors) {
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

export function getPresetById(id: string): ThemePreset {
  return themePresets.find((p) => p.id === id) || themePresets[0];
}

// Default animation for each theme
const THEME_DEFAULT_ANIMATION: Record<string, string> = {
  galaxy: "stars",
  rosa: "petals",
  oceano: "bubbles",
  floresta: "leaves",
  pordosol: "rays",
  meianoite: "snow",
  lavanda: "butterflies",
  preto: "sparkles",
  branco: "none",
  vermelho: "fireflies",
  dourado: "sparkles",
  neon: "sparkles",
  terracota: "fireflies",
};

export function getDefaultAnimationForTheme(themeId: string): string {
  return THEME_DEFAULT_ANIMATION[themeId] || "stars";
}

interface ThemeContextType {
  currentThemeId: string;
  animationId: string;
  resolvedAnimationId: string;
  loading: boolean;
  setTheme: (themeId: string) => Promise<void>;
  setAnimation: (animationId: string) => Promise<void>;
  canEditTheme: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  currentThemeId: "galaxy",
  animationId: "auto",
  resolvedAnimationId: "stars",
  loading: true,
  setTheme: async () => {},
  setAnimation: async () => {},
  canEditTheme: false,
});

export function useThemeContext() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentThemeId, setCurrentThemeId] = useState("galaxy");
  const [animationId, setAnimationId] = useState("auto");
  const [loading, setLoading] = useState(true);
  const { tenantId, isSuperAdmin, loading: tenantLoading } = useTenant();
  const canEditTheme = !!tenantId && (!isSuperAdmin || tenantId === TENANT_DEFAULT_ID);
  const currentThemeIdRef = useRef(currentThemeId);

  const resolvedAnimationId = animationId === "auto"
    ? getDefaultAnimationForTheme(currentThemeId)
    : animationId;

  // Keep ref in sync
  useEffect(() => {
    currentThemeIdRef.current = currentThemeId;
  }, [currentThemeId]);

  // Apply theme by id — localStorage keys are now tenant-scoped
  const applyById = useCallback((id: string, tid?: string) => {
    const preset = getPresetById(id);
    setCurrentThemeId(preset.id);
    applyThemeToDOM(preset.colors);
    const scopeKey = tid || tenantId;
    if (scopeKey) {
      localStorage.setItem(`site-theme-id-${scopeKey}`, preset.id);
    }
  }, [tenantId]);

  // Load initial theme from DB
  useEffect(() => {
    if (tenantLoading) return;

    if (!tenantId) {
      const fallbackPreset = getPresetById("galaxy");
      setCurrentThemeId(fallbackPreset.id);
      applyThemeToDOM(fallbackPreset.colors);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function loadTheme() {
      const cached = localStorage.getItem(`site-theme-id-${tenantId}`);
      const cachedPreset = getPresetById(cached || "galaxy");

      setCurrentThemeId(cachedPreset.id);
      applyThemeToDOM(cachedPreset.colors);

      const { data } = await supabase
        .from("work_settings")
        .select("theme_id, animation_id")
        .eq("tenant_id", tenantId!)
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (data?.theme_id) {
        applyById(data.theme_id, tenantId);
      } else {
        applyById("galaxy", tenantId);
      }

      setAnimationId((data as any)?.animation_id || "auto");
      setLoading(false);
    }

    loadTheme();

    return () => {
      cancelled = true;
    };
  }, [tenantId, tenantLoading, applyById]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (tenantLoading || !tenantId) return;

    const channel = supabase
      .channel(`theme-${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "work_settings",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const p = payload.new as any;
          if (p?.theme_id && p.theme_id !== currentThemeIdRef.current) {
            applyById(p.theme_id, tenantId);
          }
          if (p?.animation_id !== undefined) {
            setAnimationId(p.animation_id || "auto");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, tenantLoading, applyById]);

  // Save theme to DB
  const setTheme = useCallback(
    async (themeId: string) => {
      if (!tenantId || (isSuperAdmin && tenantId !== TENANT_DEFAULT_ID)) return;
      applyById(themeId, tenantId);

      await supabase
        .from("work_settings")
        .update({ theme_id: themeId })
        .eq("tenant_id", tenantId);
    },
    [tenantId, isSuperAdmin, applyById]
  );

  // Save animation to DB
  const setAnimation = useCallback(
    async (newAnimationId: string) => {
      if (!tenantId || (isSuperAdmin && tenantId !== TENANT_DEFAULT_ID)) return;
      setAnimationId(newAnimationId);

      await supabase
        .from("work_settings")
        .update({ animation_id: newAnimationId })
        .eq("tenant_id", tenantId);
    },
    [tenantId, isSuperAdmin]
  );

  return (
    <ThemeContext.Provider value={{ currentThemeId, animationId, resolvedAnimationId, loading, setTheme, setAnimation, canEditTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
