import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";

export interface PaymentSettings {
  id?: string;
  enabled: boolean;
  title: string;
  description: string;
  payment_url: string;
  button_text: string;
  open_in_new_tab: boolean;
  warning_message: string | null;
}

const DEFAULT_SETTINGS: PaymentSettings = {
  enabled: false,
  title: "Pagamento Adiantado",
  description: "",
  payment_url: "",
  button_text: "Pagar Agora",
  open_in_new_tab: true,
  warning_message: null,
};

export function usePaymentSettings() {
  const [settings, setSettings] = useState<PaymentSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { tenantId, loading: tenantLoading } = useTenant();
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("tenant_payment_settings" as any)
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (!error && data) {
      const d = data as any;
      setSettings({
        id: d.id,
        enabled: d.enabled ?? false,
        title: d.title ?? DEFAULT_SETTINGS.title,
        description: d.description ?? "",
        payment_url: d.payment_url ?? "",
        button_text: d.button_text ?? DEFAULT_SETTINGS.button_text,
        open_in_new_tab: d.open_in_new_tab ?? true,
        warning_message: d.warning_message ?? null,
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

  const saveSettings = async (values: PaymentSettings) => {
    if (!tenantId) return false;
    setSaving(true);

    try {
      const payload = {
        tenant_id: tenantId,
        enabled: values.enabled,
        title: values.title.trim(),
        description: values.description.trim(),
        payment_url: values.payment_url.trim(),
        button_text: values.button_text.trim(),
        open_in_new_tab: values.open_in_new_tab,
        warning_message: values.warning_message?.trim() || null,
      };

      let result;
      if (settings.id) {
        result = await supabase
          .from("tenant_payment_settings" as any)
          .update(payload)
          .eq("id", settings.id)
          .eq("tenant_id", tenantId);
      } else {
        result = await supabase
          .from("tenant_payment_settings" as any)
          .insert(payload);
      }

      if (result.error) {
        toast({ title: "Erro ao salvar", description: result.error.message, variant: "destructive" });
        return false;
      }

      toast({ title: "Salvo!", description: "Configuração de pagamento atualizada." });
      await fetchSettings();
      return true;
    } finally {
      setSaving(false);
    }
  };

  return { settings, loading: loading || tenantLoading, saving, saveSettings };
}

/**
 * Read-only hook for public booking flow.
 * Returns payment config only if enabled + valid URL.
 */
export function usePublicPaymentSettings() {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { tenantId, loading: tenantLoading } = useTenant();

  useEffect(() => {
    async function fetch() {
      if (!tenantId) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("tenant_payment_settings" as any)
        .select("enabled, title, description, payment_url, button_text, open_in_new_tab, warning_message")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (!error && data) {
        const d = data as any;
        const url = (d.payment_url || "").trim();
        const isValid = d.enabled === true && url.length > 0 && isValidUrl(url);
        setSettings(isValid ? {
          enabled: true,
          title: d.title || "Pagamento Adiantado",
          description: d.description || "",
          payment_url: url,
          button_text: d.button_text || "Pagar Agora",
          open_in_new_tab: d.open_in_new_tab ?? true,
          warning_message: d.warning_message || null,
        } : null);
      } else {
        setSettings(null);
      }
      setLoading(false);
    }

    if (!tenantLoading) fetch();
  }, [tenantId, tenantLoading]);

  return { paymentSettings: settings, loading: loading || tenantLoading };
}

export function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
