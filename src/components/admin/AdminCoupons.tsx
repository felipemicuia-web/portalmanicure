import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { formatDateBR } from "@/lib/dateFormat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Ticket, Shuffle, Copy } from "lucide-react";
import { logger } from "@/lib/logger";

interface Coupon {
  id: string;
  code: string;
  discount_type: "fixed" | "percentage";
  discount_value: number;
  max_uses: number;
  current_uses: number;
  active: boolean;
  expires_at: string | null;
  created_at: string;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function formatPrice(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function AdminCoupons() {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [multipleUses, setMultipleUses] = useState(false);
  const [unlimitedUses, setUnlimitedUses] = useState(false);
  const [active, setActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");

  async function fetchCoupons() {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (!error && data) setCoupons(data as Coupon[]);
    setLoading(false);
  }

  useEffect(() => { fetchCoupons(); }, [tenantId]);

  function openNew() {
    setEditing(null);
    setCode(generateCode());
    setDiscountType("percentage");
    setDiscountValue("");
    setMaxUses("1");
    setMultipleUses(false);
    setUnlimitedUses(false);
    setActive(true);
    setExpiresAt("");
    setDialogOpen(true);
  }

  function openEdit(c: Coupon) {
    setEditing(c);
    setCode(c.code);
    setDiscountType(c.discount_type);
    setDiscountValue(String(c.discount_value));
    setMaxUses(String(c.max_uses));
    setUnlimitedUses(c.max_uses >= 999999);
    setMultipleUses(c.max_uses > 1 && c.max_uses < 999999);
    setActive(c.active);
    setExpiresAt(c.expires_at ? c.expires_at.slice(0, 16) : "");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!tenantId) return;
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) { toast({ title: "Erro", description: "Código é obrigatório", variant: "destructive" }); return; }
    const val = parseFloat(discountValue);
    if (isNaN(val) || val <= 0) { toast({ title: "Erro", description: "Valor de desconto inválido", variant: "destructive" }); return; }
    if (discountType === "percentage" && (val < 1 || val > 100)) { toast({ title: "Erro", description: "Percentual deve ser entre 1 e 100", variant: "destructive" }); return; }

    const uses = unlimitedUses ? 999999 : (multipleUses ? parseInt(maxUses) || 1 : 1);
    setSaving(true);

    const payload = {
      code: trimmedCode,
      discount_type: discountType,
      discount_value: val,
      max_uses: uses,
      active,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      tenant_id: tenantId,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from("coupons").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("coupons").insert(payload));
    }

    setSaving(false);
    if (error) {
      logger.error("Coupon save error:", error);
      toast({ title: "Erro", description: error.message.includes("unique") ? "Este código já existe" : "Erro ao salvar cupom", variant: "destructive" });
    } else {
      toast({ title: editing ? "Cupom atualizado!" : "Cupom criado!" });
      setDialogOpen(false);
      fetchCoupons();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este cupom?")) return;
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: "Erro ao excluir cupom", variant: "destructive" });
    } else {
      toast({ title: "Cupom excluído!" });
      fetchCoupons();
    }
  }

  function getStatusBadge(c: Coupon) {
    if (!c.active) return <Badge variant="secondary" className="text-xs">Inativo</Badge>;
    if (c.expires_at && new Date(c.expires_at) < new Date()) return <Badge variant="destructive" className="text-xs">Expirado</Badge>;
    if (c.max_uses < 999999 && c.current_uses >= c.max_uses) return <Badge variant="secondary" className="text-xs">Esgotado</Badge>;
    return <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">Ativo</Badge>;
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Ticket className="w-5 h-5 text-primary" />
          Cupons de Desconto
        </h2>
        <Button onClick={openNew} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          Novo Cupom
        </Button>
      </div>

      {coupons.length === 0 ? (
        <div className="glass-panel p-8 text-center text-muted-foreground">
          <Ticket className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Nenhum cupom cadastrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {coupons.map((c) => (
            <div key={c.id} className="glass-panel p-3 sm:p-4 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-sm sm:text-base">{c.code}</span>
                  {getStatusBadge(c)}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                  <span>
                    {c.discount_type === "fixed" ? `R$ ${formatPrice(c.discount_value)}` : `${c.discount_value}%`}
                  </span>
                  <span>Uso: {c.current_uses}/{c.max_uses >= 999999 ? "∞" : c.max_uses}</span>
                  {c.expires_at && (
                    <span>Expira: {formatDateBR(c.expires_at)}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Cupom" : "Novo Cupom"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs mb-1 block">Código</Label>
              <div className="flex gap-2">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="CODIGO10"
                  className="font-mono uppercase"
                  maxLength={20}
                />
                <Button type="button" variant="outline" size="icon" onClick={() => setCode(generateCode())} title="Gerar código">
                  <Shuffle className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Tipo</Label>
                <Select value={discountType} onValueChange={(v) => setDiscountType(v as "fixed" | "percentage")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentual (%)</SelectItem>
                    <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">
                  {discountType === "fixed" ? "Valor (R$)" : "Percentual (%)"}
                </Label>
                <Input
                  type="number"
                  min="1"
                  max={discountType === "percentage" ? "100" : undefined}
                  step={discountType === "fixed" ? "0.01" : "1"}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === "fixed" ? "20.00" : "10"}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs mb-1 block">Validade (opcional)</Label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>

            <div className="rounded-lg border border-border/60 p-3 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Limite de uso</p>
              <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2.5">
                <div>
                  <Label className="text-sm font-medium">Uso ilimitado</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Cupom fica ativo até ser excluído</p>
                </div>
                <Switch checked={unlimitedUses} onCheckedChange={(v) => { setUnlimitedUses(v); if (v) { setMultipleUses(false); setMaxUses("1"); } }} />
              </div>
              {!unlimitedUses && (
                <>
                  <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2.5">
                    <div>
                      <Label className="text-sm font-medium">Múltiplos usos</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Permitir que vários clientes usem</p>
                    </div>
                    <Switch checked={multipleUses} onCheckedChange={(v) => { setMultipleUses(v); if (!v) setMaxUses("1"); }} />
                  </div>
                  {multipleUses && (
                    <div className="pl-1">
                      <Label className="text-xs mb-1 block">Limite de usos</Label>
                      <Input type="number" min="2" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2.5">
              <div>
                <Label className="text-sm font-medium">Ativo</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Cupom disponível para uso</p>
              </div>
              <Switch checked={active} onCheckedChange={setActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
