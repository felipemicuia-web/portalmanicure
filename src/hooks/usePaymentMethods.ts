import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";

export interface PaymentMethod {
  id: string;
  name: string;
  enabled: boolean;
  display_order: number;
}

export function usePaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { tenantId, loading: tenantLoading } = useTenant();
  const { toast } = useToast();

  const fetchMethods = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("tenant_payment_methods" as any)
      .select("id, name, enabled, display_order")
      .eq("tenant_id", tenantId)
      .order("display_order", { ascending: true });

    if (!error && data) {
      setMethods((data as any[]).map((d) => ({
        id: d.id,
        name: d.name,
        enabled: d.enabled,
        display_order: d.display_order,
      })));
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    if (!tenantLoading && tenantId) fetchMethods();
    else if (!tenantLoading) setLoading(false);
  }, [tenantId, tenantLoading, fetchMethods]);

  const addMethod = async (name: string) => {
    if (!tenantId) return;
    setSaving(true);
    const maxOrder = methods.length > 0 ? Math.max(...methods.map((m) => m.display_order)) + 1 : 0;
    const { error } = await supabase
      .from("tenant_payment_methods" as any)
      .insert({ tenant_id: tenantId, name: name.trim(), display_order: maxOrder });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Adicionado!" });
      await fetchMethods();
    }
    setSaving(false);
  };

  const toggleMethod = async (id: string, enabled: boolean) => {
    const { error } = await supabase
      .from("tenant_payment_methods" as any)
      .update({ enabled })
      .eq("id", id);
    if (!error) await fetchMethods();
  };

  const removeMethod = async (id: string) => {
    const { error } = await supabase
      .from("tenant_payment_methods" as any)
      .delete()
      .eq("id", id);
    if (!error) await fetchMethods();
  };

  return { methods, loading: loading || tenantLoading, saving, addMethod, toggleMethod, removeMethod };
}

/** Public hook: returns only enabled methods */
export function usePublicPaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const { tenantId, loading: tenantLoading } = useTenant();

  useEffect(() => {
    async function fetch() {
      if (!tenantId) { setLoading(false); return; }
      const { data } = await supabase
        .from("tenant_payment_methods" as any)
        .select("id, name, enabled, display_order")
        .eq("tenant_id", tenantId)
        .eq("enabled", true)
        .order("display_order", { ascending: true });
      if (data) {
        setMethods((data as any[]).map((d) => ({
          id: d.id, name: d.name, enabled: true, display_order: d.display_order,
        })));
      }
      setLoading(false);
    }
    if (!tenantLoading) fetch();
  }, [tenantId, tenantLoading]);

  return { methods, loading: loading || tenantLoading };
}
