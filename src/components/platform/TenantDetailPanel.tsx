import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import {
  PlatformTenant,
  TenantDetailStats,
  TenantStatus,
  TENANT_STATUS_CONFIG,
  fetchTenantDetailStats,
  changeTenantStatus,
  updateTenantDetails,
} from "@/lib/platform";
import { fetchPlans, assignPlanToTenant, type PlatformPlan } from "@/lib/plans";
import {
  Building2, Users, UserCheck, CalendarDays, X, Save, Shield, AlertTriangle,
  Scissors, Briefcase, Ticket, Ban, Clock,
} from "lucide-react";

interface TenantDetailPanelProps {
  tenant: PlatformTenant;
  onClose: () => void;
  onUpdated: () => void;
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 text-center">
      <div className="mx-auto mb-1 text-primary flex justify-center">{icon}</div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export function TenantDetailPanel({ tenant, onClose, onUpdated }: TenantDetailPanelProps) {
  const [stats, setStats] = useState<TenantDetailStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tenant.name);
  const [slug, setSlug] = useState(tenant.slug);
  const [domain, setDomain] = useState(tenant.custom_domain || "");
  const [plan, setPlan] = useState(tenant.plan);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [assigningPlan, setAssigningPlan] = useState(false);
  const { toast } = useToast();

  const status = (tenant.status ?? (tenant.active ? "active" : "inactive")) as TenantStatus;
  const statusConfig = TENANT_STATUS_CONFIG[status] || TENANT_STATUS_CONFIG.active;

  useEffect(() => {
    setStatsLoading(true);
    fetchTenantDetailStats(tenant.id)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
    fetchPlans().then(setPlans).catch(() => {});
  }, [tenant.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTenantDetails(tenant.id, {
        name: name.trim(),
        slug: slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ""),
        custom_domain: domain.trim() || null,
        plan,
      });
      toast({ title: "Tenant atualizado!" });
      setEditing(false);
      onUpdated();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: TenantStatus) => {
    try {
      await changeTenantStatus(tenant.id, newStatus);
      toast({ title: `Status alterado para: ${TENANT_STATUS_CONFIG[newStatus].label}` });
      onUpdated();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const badgeVariant = status === "active" ? "default" : status === "suspended" ? "destructive" : "secondary";

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            {tenant.name}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={badgeVariant}>{statusConfig.label}</Badge>
          <Badge variant="outline" className="text-xs">{tenant.plan}</Badge>
          <span className="text-xs text-muted-foreground">{statusConfig.description}</span>
        </div>

        {/* Stats Grid */}
        {statsLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              <MiniStat icon={<UserCheck className="w-4 h-4" />} label="Equipe" value={stats.internal_users} />
              <MiniStat icon={<Users className="w-4 h-4" />} label="Clientes" value={stats.total_profiles} />
              <MiniStat icon={<Ban className="w-4 h-4" />} label="Bloqueados" value={stats.blocked_profiles} />
              <MiniStat icon={<CalendarDays className="w-4 h-4" />} label="Total Bookings" value={stats.total_bookings} />
              <MiniStat icon={<Clock className="w-4 h-4" />} label="Hoje" value={stats.bookings_today} />
              <MiniStat icon={<CalendarDays className="w-4 h-4" />} label="7 dias" value={stats.bookings_7d} />
              <MiniStat icon={<CalendarDays className="w-4 h-4" />} label="30 dias" value={stats.bookings_30d} />
              <MiniStat icon={<Scissors className="w-4 h-4" />} label="Serviços" value={stats.total_services} />
              <MiniStat icon={<Briefcase className="w-4 h-4" />} label="Profissionais" value={stats.total_professionals} />
              <MiniStat icon={<Ticket className="w-4 h-4" />} label="Cupons" value={stats.total_coupons} />
            </div>

            {/* Staff list */}
            {stats.staff_roles && stats.staff_roles.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Equipe interna</p>
                <div className="space-y-1">
                  {stats.staff_roles.map((s) => (
                    <div key={s.user_id} className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1.5">
                      <code className="text-muted-foreground">{s.user_id.slice(0, 8)}…</code>
                      <Badge variant={s.role === "owner" ? "default" : "outline"} className="text-xs">{s.role}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.last_booking_date && (
              <p className="text-xs text-muted-foreground">
                Último booking: {new Date(stats.last_booking_date).toLocaleDateString("pt-BR")}
              </p>
            )}
          </>
        ) : null}

        <Separator />

        {/* Details / Edit */}
        {editing ? (
          <div className="space-y-3">
            <div><Label className="text-xs">Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label className="text-xs">Slug</Label><Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))} /></div>
            <div><Label className="text-xs">Domínio customizado</Label><Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="meusalao.com.br" /></div>
            <div>
              <Label className="text-xs">Plano (legado)</Label>
              <Input value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="free" />
              <p className="text-xs text-muted-foreground mt-1">Campo legado. Use "Alterar Plano" abaixo para vincular via assinatura.</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} size="sm" className="gap-2">
                <Save className="w-3.5 h-3.5" /> {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Slug:</span> {tenant.slug}</div>
            <div><span className="text-muted-foreground">Plano:</span> {tenant.plan}</div>
            <div><span className="text-muted-foreground">Domínio:</span> {tenant.custom_domain || "—"}</div>
            <div><span className="text-muted-foreground">Criado em:</span> {new Date(tenant.created_at).toLocaleDateString("pt-BR")}</div>
            <div><span className="text-muted-foreground">Atualizado em:</span> {new Date(tenant.updated_at).toLocaleDateString("pt-BR")}</div>
            {stats?.owner_user_id && (
              <div><span className="text-muted-foreground">Owner:</span> <code className="text-xs">{stats.owner_user_id.slice(0, 8)}…</code></div>
            )}
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Editar detalhes</Button>
          </div>
        )}

        <Separator />

        {/* Plan Assignment */}
        {plans.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Alterar Plano</p>
            <div className="flex flex-col gap-2">
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger><SelectValue placeholder="Selecione um plano" /></SelectTrigger>
                <SelectContent>
                  {plans.filter(p => p.is_active).map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — R$ {Number(p.monthly_price).toFixed(2)}/mês
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={billingCycle} onValueChange={setBillingCycle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                disabled={!selectedPlanId || assigningPlan}
                onClick={async () => {
                  setAssigningPlan(true);
                  try {
                    await assignPlanToTenant(tenant.id, selectedPlanId, billingCycle);
                    const planName = plans.find(p => p.id === selectedPlanId)?.slug || "";
                    await updateTenantDetails(tenant.id, { plan: planName });
                    toast({ title: "Plano atribuído com sucesso!" });
                    setSelectedPlanId("");
                    onUpdated();
                  } catch (err: any) {
                    toast({ title: "Erro", description: err.message, variant: "destructive" });
                  } finally {
                    setAssigningPlan(false);
                  }
                }}
              >
                {assigningPlan ? "Atribuindo..." : "Atribuir Plano"}
              </Button>
            </div>
          </div>
        )}

        <Separator />

        {/* Status actions */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Shield className="w-3 h-3" /> Ações de status
          </p>
          <div className="flex flex-wrap gap-2">
            {status !== "active" && (
              <ConfirmDialog
                trigger={<Button variant="outline" size="sm">Ativar</Button>}
                title="Ativar tenant"
                description={`O tenant "${tenant.name}" voltará a funcionar normalmente.`}
                onConfirm={() => handleStatusChange("active")}
              />
            )}
            {status !== "inactive" && (
              <ConfirmDialog
                trigger={<Button variant="outline" size="sm">Desativar</Button>}
                title="Desativar tenant"
                description={`O tenant "${tenant.name}" será desativado.\n\n• Novos agendamentos serão bloqueados\n• Dados serão preservados\n• Esta ação pode ser revertida.`}
                onConfirm={() => handleStatusChange("inactive")}
              />
            )}
            {status !== "suspended" && (
              <ConfirmDialog
                trigger={
                  <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Suspender
                  </Button>
                }
                title="Suspender tenant"
                description={`⚠️ AÇÃO CRÍTICA\n\nO tenant "${tenant.name}" será SUSPENSO.\n\n• Nenhuma operação será permitida\n• Use apenas para violação de termos ou inadimplência`}
                confirmText={tenant.slug}
                variant="destructive"
                onConfirm={() => handleStatusChange("suspended")}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
