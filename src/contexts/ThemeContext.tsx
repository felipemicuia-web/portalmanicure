import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

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

interface ThemeContextType {
  currentThemeId: string;
  loading: boolean;
  setTheme: (themeId: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  currentThemeId: "galaxy",
  loading: true,
  setTheme: async () => {},
});

export function useThemeContext() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentThemeId, setCurrentThemeId] = useState("galaxy");
  const [loading, setLoading] = useState(true);
  const { tenantId, loading: tenantLoading } = useTenant();

  // Apply theme by id
  const applyById = useCallback((id: string) => {
    const preset = getPresetById(id);
    setCurrentThemeId(preset.id);
    applyThemeToDOM(preset.colors);
    // Keep localStorage in sync for fast initial paint
    localStorage.setItem("site-theme-id", preset.id);
    localStorage.setItem("site-theme-colors", JSON.stringify(preset.colors));
  }, []);

  // Load initial theme from DB
  useEffect(() => {
    if (tenantLoading || !tenantId) return;

    async function loadTheme() {
      const { data } = await supabase
        .from("work_settings")
        .select("theme_id")
        .eq("tenant_id", tenantId!)
        .limit(1)
        .single();

      if (data?.theme_id) {
        applyById(data.theme_id);
      }
      setLoading(false);
    }
    loadTheme();
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
          const newThemeId = (payload.new as any)?.theme_id;
          if (newThemeId && newThemeId !== currentThemeId) {
            applyById(newThemeId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, tenantLoading, applyById, currentThemeId]);

  // Save theme to DB (admin action)
  const setTheme = useCallback(
    async (themeId: string) => {
      if (!tenantId) return;
      // Optimistic: apply immediately
      applyById(themeId);

      await supabase
        .from("work_settings")
        .update({ theme_id: themeId })
        .eq("tenant_id", tenantId);
    },
    [tenantId, applyById]
  );

  return (
    <ThemeContext.Provider value={{ currentThemeId, loading, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
