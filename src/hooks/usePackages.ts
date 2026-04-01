import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { logger } from "@/lib/logger";
import type {
  ServicePackage,
  ServicePackageItem,
  ClientPackagePurchase,
  ClientPackageCredit,
  PackageFormData,
} from "@/types/packages";

export function usePackages() {
  const { tenantId } = useTenant();
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPackages = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("service_packages")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) logger.error("Error fetching packages:", error);
    else setPackages((data as ServicePackage[]) || []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const createPackage = async (form: PackageFormData) => {
    if (!tenantId) return null;
    const { data, error } = await supabase
      .from("service_packages")
      .insert({
        tenant_id: tenantId,
        name: form.name,
        description: form.description || null,
        price: form.price,
        active: form.active,
        validity_days: form.validity_days,
      })
      .select()
      .single();

    if (error) { logger.error("Error creating package:", error); return null; }

    // Insert items
    if (form.items.length > 0) {
      const items = form.items.map((item) => ({
        package_id: data.id,
        service_id: item.service_id,
        tenant_id: tenantId,
        credits_quantity: item.credits_quantity,
      }));
      const { error: itemErr } = await supabase.from("service_package_items").insert(items);
      if (itemErr) logger.error("Error inserting package items:", itemErr);
    }

    await fetchPackages();
    return data as ServicePackage;
  };

  const updatePackage = async (id: string, form: PackageFormData) => {
    if (!tenantId) return false;
    const { error } = await supabase
      .from("service_packages")
      .update({
        name: form.name,
        description: form.description || null,
        price: form.price,
        active: form.active,
        validity_days: form.validity_days,
      })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) { logger.error("Error updating package:", error); return false; }

    // Replace items
    await supabase.from("service_package_items").delete().eq("package_id", id).eq("tenant_id", tenantId);
    if (form.items.length > 0) {
      const items = form.items.map((item) => ({
        package_id: id,
        service_id: item.service_id,
        tenant_id: tenantId,
        credits_quantity: item.credits_quantity,
      }));
      await supabase.from("service_package_items").insert(items);
    }

    await fetchPackages();
    return true;
  };

  const deletePackage = async (id: string) => {
    if (!tenantId) return false;
    const { error } = await supabase
      .from("service_packages")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) { logger.error("Error deleting package:", error); return false; }
    await fetchPackages();
    return true;
  };

  const toggleActive = async (id: string, current: boolean) => {
    if (!tenantId) return;
    await supabase
      .from("service_packages")
      .update({ active: !current })
      .eq("id", id)
      .eq("tenant_id", tenantId);
    await fetchPackages();
  };

  const fetchPackageItems = async (packageId: string): Promise<ServicePackageItem[]> => {
    if (!tenantId) return [];
    const { data, error } = await supabase
      .from("service_package_items")
      .select("*")
      .eq("package_id", packageId)
      .eq("tenant_id", tenantId);

    if (error) { logger.error("Error fetching package items:", error); return []; }
    return (data as ServicePackageItem[]) || [];
  };

  return { packages, loading, fetchPackages, createPackage, updatePackage, deletePackage, toggleActive, fetchPackageItems };
}

export function usePackagePurchases() {
  const { tenantId } = useTenant();
  const [purchases, setPurchases] = useState<ClientPackagePurchase[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPurchases = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("client_package_purchases")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) logger.error("Error fetching purchases:", error);
    else setPurchases((data as ClientPackagePurchase[]) || []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const createPurchase = async (clientId: string, packageId: string) => {
    if (!tenantId) return null;
    const { data, error } = await supabase
      .from("client_package_purchases")
      .insert({
        tenant_id: tenantId,
        client_id: clientId,
        package_id: packageId,
        status: "pending_activation",
      })
      .select()
      .single();

    if (error) { logger.error("Error creating purchase:", error); return null; }
    await fetchPurchases();
    return data as ClientPackagePurchase;
  };

  const activatePurchase = async (purchaseId: string) => {
    if (!tenantId) return false;
    const { error } = await supabase.rpc("activate_package_purchase", {
      p_purchase_id: purchaseId,
      p_tenant_id: tenantId,
    });
    if (error) { logger.error("Error activating purchase:", error); return false; }
    await fetchPurchases();
    return true;
  };

  const cancelPurchase = async (purchaseId: string) => {
    if (!tenantId) return false;
    const { error } = await supabase
      .from("client_package_purchases")
      .update({ status: "cancelled" })
      .eq("id", purchaseId)
      .eq("tenant_id", tenantId);
    if (error) { logger.error("Error cancelling purchase:", error); return false; }
    await fetchPurchases();
    return true;
  };

  const fetchCredits = async (purchaseId: string): Promise<ClientPackageCredit[]> => {
    if (!tenantId) return [];
    const { data, error } = await supabase
      .from("client_package_credits")
      .select("*")
      .eq("purchase_id", purchaseId)
      .eq("tenant_id", tenantId);

    if (error) { logger.error("Error fetching credits:", error); return []; }
    return (data as ClientPackageCredit[]) || [];
  };

  return { purchases, loading, fetchPurchases, createPurchase, activatePurchase, cancelPurchase, fetchCredits };
}

export function useClientCredits(userId: string | undefined) {
  const { tenantId } = useTenant();
  const [credits, setCredits] = useState<ClientPackageCredit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    if (!tenantId || !userId) { setLoading(false); return; }
    setLoading(true);

    // Get active purchases for this client
    const { data: purchases, error: pErr } = await supabase
      .from("client_package_purchases")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("client_id", userId)
      .eq("status", "active");

    if (pErr || !purchases?.length) {
      setCredits([]);
      setLoading(false);
      return;
    }

    const purchaseIds = purchases.map((p: any) => p.id);
    const { data, error } = await supabase
      .from("client_package_credits")
      .select("*")
      .eq("tenant_id", tenantId)
      .in("purchase_id", purchaseIds);

    if (error) logger.error("Error fetching client credits:", error);
    else setCredits((data as ClientPackageCredit[]) || []);
    setLoading(false);
  }, [tenantId, userId]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const getCreditsForService = (serviceId: string): number => {
    return credits
      .filter((c) => c.service_id === serviceId)
      .reduce((sum, c) => sum + c.credits_remaining, 0);
  };

  const getBestCreditForService = (serviceId: string): ClientPackageCredit | null => {
    const available = credits
      .filter((c) => c.service_id === serviceId && c.credits_remaining > 0)
      .sort((a, b) => a.credits_remaining - b.credits_remaining);
    return available[0] || null;
  };

  return { credits, loading, fetchCredits, getCreditsForService, getBestCreditForService };
}
