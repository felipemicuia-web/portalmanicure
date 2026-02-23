import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

export const FONT_OPTIONS = [
  { value: "Inter", label: "Inter", url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" },
  { value: "Poppins", label: "Poppins", url: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" },
  { value: "Montserrat", label: "Montserrat", url: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" },
  { value: "Playfair Display", label: "Playfair Display", url: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap" },
  { value: "Raleway", label: "Raleway", url: "https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700;800;900&display=swap" },
  { value: "Nunito", label: "Nunito", url: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap" },
  { value: "Lato", label: "Lato", url: "https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap" },
  { value: "Roboto", label: "Roboto", url: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap" },
  { value: "Dancing Script", label: "Dancing Script", url: "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&display=swap" },
  { value: "Great Vibes", label: "Great Vibes", url: "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" },
];

export interface Branding {
  siteName: string;
  siteSubtitle: string;
  logoUrl: string | null;
  logoDisplayMode: "icon" | "banner";
  siteFont: string;
  showBrandName: boolean;
  logoSize: number;
  heroTitle: string;
  heroSubtitle: string;
  heroFont: string;
  heroBackgroundUrl: string | null;
}

const DEFAULT_BRANDING: Branding = {
  siteName: "Agendamento",
  siteSubtitle: "Agende seu horário",
  logoUrl: null,
  logoDisplayMode: "icon",
  siteFont: "Inter",
  showBrandName: true,
  logoSize: 80,
  heroTitle: "Manicures De Sucesso",
  heroSubtitle: "Plataforma profissional para agendamentos premium",
  heroFont: "Playfair Display",
  heroBackgroundUrl: null,
};

function loadFont(fontName: string) {
  const fontOption = FONT_OPTIONS.find(f => f.value === fontName);
  if (!fontOption) return;
  
  const existingLink = document.querySelector(`link[data-font="${fontName}"]`);
  if (existingLink) return;
  
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = fontOption.url;
  link.setAttribute("data-font", fontName);
  document.head.appendChild(link);
}

function applyFont(fontName: string) {
  loadFont(fontName);
  const fallback = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
  document.documentElement.style.setProperty("--font-sans", `'${fontName}', ${fallback}`);
}

export function useBranding() {
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);
  const { tenantId, loading: tenantLoading } = useTenant();

  useEffect(() => {
    async function fetch() {
      if (tenantLoading || !tenantId) return;

      const { data } = await supabase
        .from("work_settings")
        .select("site_name, site_subtitle, logo_url, logo_display_mode, site_font, show_brand_name, logo_size, hero_title, hero_subtitle, hero_font, hero_background_url")
        .eq("tenant_id", tenantId)
        .limit(1)
        .single();

      if (data) {
        const font = (data as any).site_font || "Inter";
        const d = data as any;
        setBranding({
          siteName: data.site_name || "Agendamento",
          siteSubtitle: data.site_subtitle || "Agende seu horário",
          logoUrl: data.logo_url,
          logoDisplayMode: (data.logo_display_mode as "icon" | "banner") || "icon",
          siteFont: font,
          showBrandName: d.show_brand_name ?? true,
          logoSize: d.logo_size ?? 80,
          heroTitle: d.hero_title || "Manicures De Sucesso",
          heroSubtitle: d.hero_subtitle || "Plataforma profissional para agendamentos premium",
          heroFont: d.hero_font || "Playfair Display",
          heroBackgroundUrl: d.hero_background_url || null,
        });
        applyFont(font);
      }
      setLoading(false);
    }
    fetch();
  }, [tenantId, tenantLoading]);

  return { branding, loading: loading || tenantLoading, applyFont };
}
