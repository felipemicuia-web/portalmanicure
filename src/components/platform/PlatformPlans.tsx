import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Crown, Edit, Check, X, Plus, Trash2, Star, GripVertical,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  PlatformPlan, PlanFeature,
  fetchPlans, fetchAllPlanFeatures,
  updatePlan, upsertPlanFeature, deletePlanFeature,
} from "@/lib/plans";

export function PlatformPlans() {
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [features, setFeatures] = useState<PlanFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPlan, setEditPlan] = useState<PlatformPlan | null>(null);
  const [editFeatures, setEditFeatures] = useState<PlanFeature[]>([]);
  const [saving, setSaving] = useState(false);
  const [newFeatureKey, setNewFeatureKey] = useState("");
  const [newFeatureLabel, setNewFeatureLabel] = useState("");
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    try {
      const [p, f] = await Promise.all([fetchPlans(), fetchAllPlanFeatures()]);
      setPlans(p);
      setFeatures(f);
    } catch {
      toast({ title: "Erro ao carregar planos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const openEdit = (plan: PlatformPlan) => {
    setEditPlan({ ...plan });
    setEditFeatures(features.filter((f) => f.plan_id === plan.id).map((f) => ({ ...f })));
  };

  const handleSavePlan = async () => {
    if (!editPlan) return;
    setSaving(true);
    try {
      await updatePlan(editPlan.id, {
        name: editPlan.name,
        description: editPlan.description,
        monthly_price: editPlan.monthly_price,
        annual_price: editPlan.annual_price,
        is_active: editPlan.is_active,
        is_highlighted: editPlan.is_highlighted,
        display_order: editPlan.display_order,
      });

      for (const f of editFeatures) {
        await upsertPlanFeature({
          plan_id: editPlan.id,
          feature_key: f.feature_key,
          feature_label: f.feature_label,
          included: f.included,
          limit_value: f.limit_value,
          display_order: f.display_order,
        });
      }

      toast({ title: "Plano atualizado!" });
      setEditPlan(null);
      load();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAddFeature = () => {
    if (!newFeatureKey.trim() || !newFeatureLabel.trim() || !editPlan) return;
    setEditFeatures((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        plan_id: editPlan.id,
        feature_key: newFeatureKey.trim().toLowerCase().replace(/\s+/g, "_"),
        feature_label: newFeatureLabel.trim(),
        included: true,
        limit_value: null,
        display_order: prev.length + 1,
        created_at: new Date().toISOString(),
      },
    ]);
    setNewFeatureKey("");
    setNewFeatureLabel("");
  };

  const handleDeleteFeature = async (featureId: string) => {
    try {
      await deletePlanFeature(featureId);
      setEditFeatures((prev) => prev.filter((f) => f.id !== featureId));
      toast({ title: "Feature removida" });
    } catch {
      // May be a new unsaved feature
      setEditFeatures((prev) => prev.filter((f) => f.id !== featureId));
    }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Crown className="w-4 h-4" /> Planos da Plataforma
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((plan) => {
          const planFeatures = features.filter((f) => f.plan_id === plan.id);
          const includedCount = planFeatures.filter((f) => f.included).length;

          return (
            <Card key={plan.id} className={`relative ${plan.is_highlighted ? "border-primary/50 shadow-md" : ""}`}>
              {plan.is_highlighted && (
                <div className="absolute -top-2 left-4">
                  <Badge className="gap-1 text-xs"><Star className="w-3 h-3" /> Destaque</Badge>
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={plan.is_active ? "default" : "secondary"}>
                      {plan.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(plan)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {plan.description && (
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Mensal</p>
                    <p className="text-xl font-bold">{formatCurrency(plan.monthly_price)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Anual</p>
                    <p className="text-xl font-bold">{formatCurrency(plan.annual_price)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {includedCount}/{planFeatures.length} recursos incluídos
                  </p>
                  <div className="space-y-1">
                    {planFeatures.map((f) => (
                      <div key={f.id} className="flex items-center gap-2 text-sm">
                        {f.included ? (
                          <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                        )}
                        <span className={f.included ? "" : "text-muted-foreground/50"}>
                          {f.feature_label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Plan Dialog */}
      <Dialog open={!!editPlan} onOpenChange={(open) => !open && setEditPlan(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Plano — {editPlan?.name}</DialogTitle>
          </DialogHeader>
          {editPlan && (
            <div className="space-y-6">
              {/* Basic info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <Input value={editPlan.name} onChange={(e) => setEditPlan({ ...editPlan, name: e.target.value })} />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input value={editPlan.slug} disabled className="opacity-60" />
                  <p className="text-xs text-muted-foreground mt-1">Slug não pode ser alterado</p>
                </div>
                <div>
                  <Label>Preço Mensal (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editPlan.monthly_price}
                    onChange={(e) => setEditPlan({ ...editPlan, monthly_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Preço Anual (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editPlan.annual_price}
                    onChange={(e) => setEditPlan({ ...editPlan, annual_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={editPlan.description || ""}
                  onChange={(e) => setEditPlan({ ...editPlan, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editPlan.is_active}
                    onCheckedChange={(v) => setEditPlan({ ...editPlan, is_active: v })}
                  />
                  <Label>Ativo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editPlan.is_highlighted}
                    onCheckedChange={(v) => setEditPlan({ ...editPlan, is_highlighted: v })}
                  />
                  <Label>Destaque</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Ordem:</Label>
                  <Input
                    type="number"
                    className="w-16"
                    value={editPlan.display_order}
                    onChange={(e) => setEditPlan({ ...editPlan, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Features */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Recursos do Plano</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recurso</TableHead>
                      <TableHead className="w-20 text-center">Incluído</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editFeatures.map((f, idx) => (
                      <TableRow key={f.id}>
                        <TableCell className="text-sm">{f.feature_label}</TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={f.included}
                            onCheckedChange={(v) => {
                              const updated = [...editFeatures];
                              updated[idx] = { ...updated[idx], included: v };
                              setEditFeatures(updated);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteFeature(f.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex gap-2 mt-3">
                  <Input
                    placeholder="Chave (ex: sms_notifications)"
                    value={newFeatureKey}
                    onChange={(e) => setNewFeatureKey(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Label (ex: Notificações SMS)"
                    value={newFeatureLabel}
                    onChange={(e) => setNewFeatureLabel(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={handleAddFeature} disabled={!newFeatureKey.trim() || !newFeatureLabel.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Button onClick={handleSavePlan} disabled={saving} className="w-full">
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
