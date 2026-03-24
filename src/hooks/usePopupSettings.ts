import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { isValidUrl } from "@/hooks/usePaymentSettings";

export interface PopupSettings {
  id?: string;
  enabled: boolean;
  title: string;
  trigger_image_url: string;
  modal_image_url: string;
  description: string;
  button_text: string;
  button_url: string;
  open_button_in_new_tab: boolean;
  position: string;
}

const DEFAULT_SETTINGS: PopupSettings = {
  enabled: false,
  title: "",
  trigger_image_url: "",
  modal_image_url: "",
  description: "",
  button_text: "",
  button_url: "",
  open_button_in_new_tab: true,
  position: "bottom",
};

export function usePopupSettings() {
  const [settings, setSettings] = useState<PopupSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { tenantId, loading: tenantLoading } = useTenant();
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("tenant_popups" as any)
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const d = data as any;
      setSettings({
        id: d.id,
        enabled: d.enabled ?? false,
        title: d.title ?? "",
        trigger_image_url: d.trigger_image_url ?? "",
        modal_image_url: d.modal_image_url ?? "",
        description: d.description ?? "",
        button_text: d.button_text ?? "",
        button_url: d.button_url ?? "",
        open_button_in_new_tab: d.open_button_in_new_tab ?? true,
        position: d.position ?? "bottom",
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

  const saveSettings = async (values: PopupSettings) => {
    if (!tenantId) return false;
    setSaving(true);

    try {
      const payload = {
        tenant_id: tenantId,
        enabled: values.enabled,
        title: values.title.trim() || null,
        trigger_image_url: values.trigger_image_url.trim(),
        modal_image_url: values.modal_image_url.trim() || null,
        description: values.description.trim() || null,
        button_text: values.button_text.trim() || null,
        button_url: values.button_url.trim() || null,
        open_button_in_new_tab: values.open_button_in_new_tab,
        position: values.position,
      };

      let result;
      if (settings.id) {
        result = await supabase
          .from("tenant_popups" as any)
          .update(payload)
          .eq("id", settings.id)
          .eq("tenant_id", tenantId);
      } else {
        result = await supabase
          .from("tenant_popups" as any)
          .insert(payload);
      }

      if (result.error) {
        toast({ title: "Erro ao salvar", description: result.error.message, variant: "destructive" });
        return false;
      }

      toast({ title: "Salvo!", description: "Pop-up atualizado com sucesso." });
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
 * Returns popup config only if enabled + valid trigger image URL.
 */
export function usePublicPopupSettings() {
  const [popup, setPopup] = useState<PopupSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { tenantId, loading: tenantLoading } = useTenant();

  useEffect(() => {
    async function fetch() {
      if (!tenantId) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("tenant_popups" as any)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("enabled", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const d = data as any;
        const triggerUrl = (d.trigger_image_url || "").trim();
        if (triggerUrl && isValidUrl(triggerUrl)) {
          setPopup({
            id: d.id,
            enabled: true,
            title: d.title || "",
            trigger_image_url: triggerUrl,
            modal_image_url: d.modal_image_url || "",
            description: d.description || "",
            button_text: d.button_text || "",
            button_url: d.button_url || "",
            open_button_in_new_tab: d.open_button_in_new_tab ?? true,
            position: d.position || "bottom",
          });
        } else {
          setPopup(null);
        }
      } else {
        setPopup(null);
      }
      setLoading(false);
    }

    if (!tenantLoading) fetch();
  }, [tenantId, tenantLoading]);

  return { popup, loading: loading || tenantLoading };
}
