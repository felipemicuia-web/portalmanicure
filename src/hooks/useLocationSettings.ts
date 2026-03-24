import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { isValidUrl } from "@/hooks/usePaymentSettings";

export interface LocationSettings {
  id?: string;
  enabled: boolean;
  title: string;
  address: string;
  google_maps_url: string;
  embed_url: string;
  description: string;
  button_text: string;
  open_in_new_tab: boolean;
}

const DEFAULT_SETTINGS: LocationSettings = {
  enabled: false,
  title: "Nossa Localização",
  address: "",
  google_maps_url: "",
  embed_url: "",
  description: "",
  button_text: "Ver no Google Maps",
  open_in_new_tab: true,
};

export function useLocationSettings() {
  const [settings, setSettings] = useState<LocationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { tenantId, loading: tenantLoading } = useTenant();
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("tenant_location_settings" as any)
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (!error && data) {
      const d = data as any;
      setSettings({
        id: d.id,
        enabled: d.enabled ?? false,
        title: d.title ?? DEFAULT_SETTINGS.title,
        address: d.address ?? "",
        google_maps_url: d.google_maps_url ?? "",
        embed_url: d.embed_url ?? "",
        description: d.description ?? "",
        button_text: d.button_text ?? DEFAULT_SETTINGS.button_text,
        open_in_new_tab: d.open_in_new_tab ?? true,
      });
    } else {
      setSettings(DEFAULT_SETTINGS);
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    if (!tenantLoading && tenantId) {
      fetchSettings();
    } else if (!tenantLoading) {
      setLoading(false);
    }
  }, [tenantId, tenantLoading, fetchSettings]);

  const saveSettings = async (values: LocationSettings) => {
    if (!tenantId) return false;
    setSaving(true);

    try {
      const payload = {
        tenant_id: tenantId,
        enabled: values.enabled,
        title: values.title.trim(),
        address: values.address.trim(),
        google_maps_url: values.google_maps_url.trim(),
        embed_url: values.embed_url.trim(),
        description: values.description.trim() || null,
        button_text: values.button_text.trim(),
        open_in_new_tab: values.open_in_new_tab,
      };

      let result;
      if (settings.id) {
        result = await supabase
          .from("tenant_location_settings" as any)
          .update(payload)
          .eq("id", settings.id)
          .eq("tenant_id", tenantId);
      } else {
        result = await supabase
          .from("tenant_location_settings" as any)
          .insert(payload);
      }

      if (result.error) {
        toast({ title: "Erro ao salvar", description: result.error.message, variant: "destructive" });
        return false;
      }

      toast({ title: "Salvo!", description: "Localização atualizada com sucesso." });
      await fetchSettings();
      return true;
    } finally {
      setSaving(false);
    }
  };

  return { settings, loading: loading || tenantLoading, saving, saveSettings };
}

/**
 * Read-only hook for public booking page.
 * Returns location config only if enabled + valid address.
 */
export function usePublicLocationSettings() {
  const [location, setLocation] = useState<LocationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { tenantId, loading: tenantLoading } = useTenant();

  useEffect(() => {
    async function fetch() {
      if (!tenantId) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("tenant_location_settings" as any)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("enabled", true)
        .maybeSingle();

      if (!error && data) {
        const d = data as any;
        const address = (d.address || "").trim();
        if (address) {
          setLocation({
            id: d.id,
            enabled: true,
            title: d.title || "Nossa Localização",
            address,
            google_maps_url: d.google_maps_url || "",
            embed_url: d.embed_url || "",
            description: d.description || "",
            button_text: d.button_text || "Ver no Google Maps",
            open_in_new_tab: d.open_in_new_tab ?? true,
          });
        } else {
          setLocation(null);
        }
      } else {
        setLocation(null);
      }
      setLoading(false);
    }

    if (!tenantLoading) fetch();
  }, [tenantId, tenantLoading]);

  return { location, loading: loading || tenantLoading };
}
