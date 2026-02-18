import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

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

export const THEME_STORAGE_KEY = "site-theme-colors";
export const THEME_ID_KEY = "site-theme-id";

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

export const defaultTheme: ThemeColors = themePresets[0].colors;

export function applyTheme(colors: ThemeColors) {
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

/**
 * Hook that loads the tenant theme from DB and subscribes to realtime changes.
 * Used globally (ThemeLoader) so all users see the admin's chosen theme.
 */
export function useTenantTheme() {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [themeId, setThemeId] = useState<string>("galaxy");
  const [loading, setLoading] = useState(true);

  // Fetch initial theme from DB
  useEffect(() => {
    if (tenantLoading || !tenantId) return;

    async function fetchTheme() {
      const { data } = await supabase
        .from("work_settings")
        .select("theme_id")
        .eq("tenant_id", tenantId!)
        .maybeSingle();

      const id = (data as any)?.theme_id || "galaxy";
      setThemeId(id);

      const preset = themePresets.find((p) => p.id === id) || themePresets[0];
      applyTheme(preset.colors);
      // Also sync localStorage for ThemedBackground
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preset.colors));
      localStorage.setItem(THEME_ID_KEY, id);
      setLoading(false);
    }

    fetchTheme();
  }, [tenantId, tenantLoading]);

  // Realtime subscription: instant theme updates for all users
  useEffect(() => {
    if (!tenantId) return;

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
          if (newThemeId && newThemeId !== themeId) {
            setThemeId(newThemeId);
            const preset = themePresets.find((p) => p.id === newThemeId) || themePresets[0];
            applyTheme(preset.colors);
            localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preset.colors));
            localStorage.setItem(THEME_ID_KEY, newThemeId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, themeId]);

  return { themeId, loading: loading || tenantLoading };
}
