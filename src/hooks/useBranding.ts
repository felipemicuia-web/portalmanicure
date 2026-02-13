import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Branding {
  siteName: string;
  siteSubtitle: string;
  logoUrl: string | null;
  logoDisplayMode: "icon" | "banner";
}

const DEFAULT_BRANDING: Branding = {
  siteName: "Agendamento",
  siteSubtitle: "Agende seu horário",
  logoUrl: null,
  logoDisplayMode: "icon",
};

export function useBranding() {
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("work_settings")
        .select("site_name, site_subtitle, logo_url, logo_display_mode")
        .limit(1)
        .single();

      if (data) {
        setBranding({
          siteName: data.site_name || "Agendamento",
          siteSubtitle: data.site_subtitle || "Agende seu horário",
          logoUrl: data.logo_url,
          logoDisplayMode: (data.logo_display_mode as "icon" | "banner") || "icon",
        });
      }
      setLoading(false);
    }
    fetch();
  }, []);

  return { branding, loading };
}
