import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PlatformSettings {
  footer_text: string;
  footer_url: string;
  footer_secondary_text: string;
}

const DEFAULTS: PlatformSettings = {
  footer_text: "",
  footer_url: "",
  footer_secondary_text: "",
};

/** Read-only hook for public pages */
export function usePlatformSettings() {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", ["footer_text", "footer_url", "footer_secondary_text"]);

      if (!error && data) {
        const map: Record<string, string> = {};
        data.forEach((row: any) => { map[row.key] = row.value ?? ""; });
        setSettings({
          footer_text: map.footer_text ?? DEFAULTS.footer_text,
          footer_url: map.footer_url ?? DEFAULTS.footer_url,
          footer_secondary_text: map.footer_secondary_text ?? DEFAULTS.footer_secondary_text,
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  return { settings, loading };
}

/** Admin hook with save capability */
export function usePlatformSettingsAdmin() {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", ["footer_text", "footer_url", "footer_secondary_text"]);

      if (!error && data) {
        const map: Record<string, string> = {};
        data.forEach((row: any) => { map[row.key] = row.value ?? ""; });
        setSettings({
          footer_text: map.footer_text ?? DEFAULTS.footer_text,
          footer_url: map.footer_url ?? DEFAULTS.footer_url,
          footer_secondary_text: map.footer_secondary_text ?? DEFAULTS.footer_secondary_text,
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  const save = useCallback(async (newSettings: PlatformSettings) => {
    setSaving(true);
    const entries = Object.entries(newSettings) as [string, string][];
    
    for (const [key, value] of entries) {
      await supabase
        .from("platform_settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", key);
    }

    setSettings(newSettings);
    setSaving(false);
  }, []);

  return { settings, setSettings, loading, saving, save };
}
