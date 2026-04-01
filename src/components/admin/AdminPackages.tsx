import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import { usePackages, usePackagePurchases } from "@/hooks/usePackages";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Pencil, Trash2, Package, ChevronDown, ChevronUp, CheckCircle, XCircle, Eye,
} from "lucide-react";
import type { ServicePackage, ServicePackageItem, PackageFormData, ClientPackagePurchase, ClientPackageCredit } from "@/types/packages";

interface ServiceOption {
  id: string;
  name: string;
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending_activation: { label: "Pendente", variant: "outline" },
  active: { label: "Ativo", variant: "default" },
  expired: { label: "Expirado", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
  finished: { label: "Finalizado", variant: "secondary" },
};

export function AdminPackages() {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const { packages, loading, createPackage, updatePackage, deletePackage, toggleActive, fetchPackageItems } = usePackages();
  const { purchases, loading: purchasesLoading, fetchPurchases, activatePurchase, cancelPurchase, fetchCredits } = usePackagePurchases();

  const [services, setServices] = useState<ServiceOption[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<ServicePackage | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<PackageFormData>({
    name: "", description: "", price: 0, active: true, validity_days: null, items: [],
  });
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);
  const [packageItems, setPackageItems] = useState<Record<string, ServicePackageItem[]>>({});
  const [viewTab, setViewTab] = useState<"packages" | "purchases">("packages");

  // Purchases detail
  const [expandedPurchase, setExpandedPurchase] = useState<string | null>(null);
  const [purchaseCredits, setPurchaseCredits] = useState<Record<string, ClientPackageCredit[]>>({});
  const [purchasePackageNames, setPurchasePackageNames] = useState<Record<string, string>>({});
  const [purchaseClientNames, setPurchaseClientNames] = useState<Record<string, string>>({});

  // Assign package to client
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignPackageId, setAssignPackageId] = useState("");
  const [assignClientId, setAssignClientId] = useState("");
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!tenantId) return;
    supabase.from("services").select("id, name").eq("tenant_id", tenantId).eq("active", true)
      .then(({ data }) => setServices((data as ServiceOption[]) || []));
  }, [tenantId]);

  // Enrich purchases with package names and client names
  useEffect(() => {
    if (!purchases.length || !tenantId) return;
    const pkgIds = [...new Set(purchases.map(p => p.package_id))];
    const clientIds = [...new Set(purchases.map(p => p.client_id))];

    supabase.from("service_packages").select("id, name").in("id", pkgIds)
      .then(({ data }) => {
        const map: Record<string, string> = {};
        (data || []).forEach((p: any) => { map[p.id] = p.name; });
        setPurchasePackageNames(map);
      });

    supabase.from("profiles").select("user_id, name").eq("tenant_id", tenantId).in("user_id", clientIds)
      .then(({ data }) => {
        const map: Record<string, string> = {};
        (data || []).forEach((p: any) => { map[p.user_id] = p.name || "Sem nome"; });
        setPurchaseClientNames(map);
      });
  }, [purchases, tenantId]);

  // Fetch clients for assignment
  useEffect(() => {
    if (!assignOpen || !tenantId) return;
    supabase.from("profiles").select("user_id, name").eq("tenant_id", tenantId)
      .then(({ data }) => {
        setClients((data || []).map((p: any) => ({ id: p.user_id, name: p.name || "Sem nome" })));
      });
  }, [assignOpen, tenantId]);

  const openAdd = () => {
    setEditingPkg(null);
    setForm({ name: "", description: "", price: 0, active: true, validity_days: null, items: [] });
    setIsFormOpen(true);
  };

  const openEdit = async (pkg: ServicePackage) => {
    setEditingPkg(pkg);
    const items = await fetchPackageItems(pkg.id);
    setForm({
      name: pkg.name,
      description: pkg.description || "",
      price: Number(pkg.price),
      active: pkg.active,
      validity_days: pkg.validity_days,
      items: items.map(i => ({ service_id: i.service_id, credits_quantity: i.credits_quantity })),
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Digite o nome do pacote", variant: "destructive" });
      return;
    }
    if (form.items.length === 0) {
      toast({ title: "Adicione ao menos um serviço ao pacote", variant: "destructive" });
      return;
    }

    if (editingPkg) {
      const ok = await updatePackage(editingPkg.id, form);
      if (ok) toast({ title: "Pacote atualizado!" });
      else toast({ title: "Erro ao atualizar pacote", variant: "destructive" });
    } else {
      const result = await createPackage(form);
      if (result) toast({ title: "Pacote criado!" });
      else toast({ title: "Erro ao criar pacote", variant: "destructive" });
    }
    setIsFormOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const ok = await deletePackage(deleteId);
    if (ok) toast({ title: "Pacote removido!" });
    else toast({ title: "Erro ao remover pacote", variant: "destructive" });
    setDeleteId(null);
  };

  const toggleExpand = async (pkgId: string) => {
    if (expandedPkg === pkgId) { setExpandedPkg(null); return; }
    if (!packageItems[pkgId]) {
      const items = await fetchPackageItems(pkgId);
      setPackageItems(prev => ({ ...prev, [pkgId]: items }));
    }
    setExpandedPkg(pkgId);
  };

  const togglePurchaseExpand = async (purchaseId: string) => {
    if (expandedPurchase === purchaseId) { setExpandedPurchase(null); return; }
    if (!purchaseCredits[purchaseId]) {
      const credits = await fetchCredits(purchaseId);
      setPurchaseCredits(prev => ({ ...prev, [purchaseId]: credits }));
    }
    setExpandedPurchase(purchaseId);
  };

  const handleActivate = async (purchaseId: string) => {
    const ok = await activatePurchase(purchaseId);
    if (ok) {
      toast({ title: "Pacote ativado com sucesso!" });
      // Refresh credits for this purchase
      const credits = await fetchCredits(purchaseId);
      setPurchaseCredits(prev => ({ ...prev, [purchaseId]: credits }));
    } else {
      toast({ title: "Erro ao ativar pacote", variant: "destructive" });
    }
  };

  const handleAssign = async () => {
    if (!assignClientId || !assignPackageId) {
      toast({ title: "Selecione cliente e pacote", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("client_package_purchases").insert({
      tenant_id: tenantId,
      client_id: assignClientId,
      package_id: assignPackageId,
      status: "pending_activation",
    });
    if (error) {
      logger.error("Error assigning package:", error);
      toast({ title: "Erro ao atribuir pacote", variant: "destructive" });
    } else {
      toast({ title: "Pacote atribuído! Ative quando o pagamento for confirmado." });
      fetchPurchases();
    }
    setAssignOpen(false);
    setAssignClientId("");
    setAssignPackageId("");
  };

  const addItem = () => {
    if (services.length === 0) return;
    const usedIds = form.items.map(i => i.service_id);
    const available = services.find(s => !usedIds.includes(s.id));
    if (!available) {
      toast({ title: "Todos os serviços já foram adicionados", variant: "destructive" });
      return;
    }
    setForm({ ...form, items: [...form.items, { service_id: available.id, credits_quantity: 1 }] });
  };

  const removeItem = (index: number) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const updateItem = (index: number, field: "service_id" | "credits_quantity", value: string | number) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setForm({ ...form, items: newItems });
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <h2 className="text-lg sm:text-xl font-semibold">Pacotes</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAssignOpen(true)} size="sm" variant="outline" className="gap-1">
            <Plus className="w-4 h-4" /> Atribuir
          </Button>
          <Button onClick={openAdd} size="sm" className="gap-1">
            <Plus className="w-4 h-4" /> Novo Pacote
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button size="sm" variant={viewTab === "packages" ? "default" : "outline"} onClick={() => setViewTab("packages")}>
          Pacotes ({packages.length})
        </Button>
        <Button size="sm" variant={viewTab === "purchases" ? "default" : "outline"} onClick={() => setViewTab("purchases")}>
          Vendas ({purchases.length})
        </Button>
      </div>

      {viewTab === "packages" && (
        <div className="space-y-3">
          {packages.length === 0 ? (
            <div className="glass-panel p-8 text-center text-muted-foreground">Nenhum pacote cadastrado</div>
          ) : (
            packages.map(pkg => (
              <div key={pkg.id} className="glass-panel p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium ${!pkg.active ? "text-muted-foreground" : ""}`}>{pkg.name}</h3>
                      <Badge variant={pkg.active ? "default" : "secondary"}>{pkg.active ? "Ativo" : "Inativo"}</Badge>
                    </div>
                    {pkg.description && <p className="text-sm text-muted-foreground mt-1">{pkg.description}</p>}
                    <div className="flex items-center gap-3 text-sm mt-1">
                      <span className="font-medium">{formatPrice(Number(pkg.price))}</span>
                      {pkg.validity_days && <span className="text-muted-foreground">Validade: {pkg.validity_days} dias</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch checked={pkg.active} onCheckedChange={() => toggleActive(pkg.id, pkg.active)} />
                    <Button size="icon" variant="ghost" onClick={() => openEdit(pkg)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(pkg.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => toggleExpand(pkg.id)}>
                      {expandedPkg === pkg.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {expandedPkg === pkg.id && packageItems[pkg.id] && (
                  <div className="border-t border-border/50 pt-3">
                    <p className="text-xs text-muted-foreground mb-2">Serviços incluídos:</p>
                    <div className="space-y-1">
                      {packageItems[pkg.id].map(item => {
                        const svc = services.find(s => s.id === item.service_id);
                        return (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{svc?.name || "Serviço removido"}</span>
                            <span className="text-primary font-medium">{item.credits_quantity}x créditos</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {viewTab === "purchases" && (
        <div className="space-y-3">
          {purchases.length === 0 ? (
            <div className="glass-panel p-8 text-center text-muted-foreground">Nenhuma venda registrada</div>
          ) : (
            purchases.map(purchase => {
              const status = STATUS_LABELS[purchase.status] || { label: purchase.status, variant: "outline" as const };
              return (
                <div key={purchase.id} className="glass-panel p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium">{purchasePackageNames[purchase.package_id] || "Pacote"}</h3>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Cliente: {purchaseClientNames[purchase.client_id] || "..."}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Compra: {new Date(purchase.purchase_date).toLocaleDateString("pt-BR")}
                        {purchase.activated_at && ` | Ativado: ${new Date(purchase.activated_at).toLocaleDateString("pt-BR")}`}
                        {purchase.expires_at && ` | Expira: ${new Date(purchase.expires_at).toLocaleDateString("pt-BR")}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {purchase.status === "pending_activation" && (
                        <Button size="sm" variant="default" onClick={() => handleActivate(purchase.id)} className="gap-1">
                          <CheckCircle className="w-4 h-4" /> Ativar
                        </Button>
                      )}
                      {purchase.status === "pending_activation" && (
                        <Button size="sm" variant="outline" onClick={() => cancelPurchase(purchase.id)}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => togglePurchaseExpand(purchase.id)}>
                        {expandedPurchase === purchase.id ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {expandedPurchase === purchase.id && purchaseCredits[purchase.id] && (
                    <div className="border-t border-border/50 pt-3">
                      <p className="text-xs text-muted-foreground mb-2">Saldo de créditos:</p>
                      {purchaseCredits[purchase.id].length === 0 ? (
                        <p className="text-sm text-muted-foreground">Pacote ainda não ativado</p>
                      ) : (
                        <div className="space-y-1">
                          {purchaseCredits[purchase.id].map(credit => {
                            const svc = services.find(s => s.id === credit.service_id);
                            return (
                              <div key={credit.id} className="flex justify-between text-sm">
                                <span>{svc?.name || "Serviço"}</span>
                                <span>
                                  <span className="text-primary font-medium">{credit.credits_remaining}</span>
                                  <span className="text-muted-foreground">/{credit.credits_total} restantes</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="bg-background/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPkg ? "Editar Pacote" : "Novo Pacote"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Corte Masculino 5x" />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Preço (R$)</Label>
                <Input type="number" min={0} step={0.01} value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Validade (dias)</Label>
                <Input type="number" min={0} value={form.validity_days || ""} onChange={e => setForm({ ...form, validity_days: parseInt(e.target.value) || null })} placeholder="Sem limite" />
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Serviços incluídos</Label>
                <Button type="button" size="sm" variant="outline" onClick={addItem} className="gap-1">
                  <Plus className="w-3 h-3" /> Serviço
                </Button>
              </div>
              {form.items.length === 0 && (
                <p className="text-sm text-muted-foreground">Adicione serviços ao pacote.</p>
              )}
              {form.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={item.service_id}
                    onChange={e => updateItem(idx, "service_id", e.target.value)}
                  >
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={1}
                    value={item.credits_quantity}
                    onChange={e => updateItem(idx, "credits_quantity", parseInt(e.target.value) || 1)}
                    className="w-20"
                    placeholder="Qtd"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">créditos</span>
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(idx)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>{editingPkg ? "Salvar" : "Criar"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Atribuir Pacote ao Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Pacote</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={assignPackageId}
                onChange={e => setAssignPackageId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {packages.filter(p => p.active).map(p => (
                  <option key={p.id} value={p.id}>{p.name} - {formatPrice(Number(p.price))}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={assignClientId}
                onChange={e => setAssignClientId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancelar</Button>
              <Button onClick={handleAssign}>Atribuir</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja remover este pacote? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
