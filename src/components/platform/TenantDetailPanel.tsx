import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import {
  PlatformTenant,
  TenantStats,
  TenantStatus,
  TENANT_STATUS_CONFIG,
  fetchTenantStats,
  changeTenantStatus,
  updateTenantDetails,
} from "@/lib/platform";
import {
  Building2, Users, UserCheck, CalendarDays, X, Save, Shield, AlertTriangle,
} from "lucide-react";

interface TenantDetailPanelProps {
  tenant: PlatformTenant;
  onClose: () => void;
  onUpdated: () => void;
}

export function TenantDetailPanel({ tenant, onClose, onUpdated }: TenantDetailPanelProps) {
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(tenant.name);
  const [slug, setSlug] = useState(tenant.slug);
  const [domain, setDomain] = useState(tenant.custom_domain || "");
  const [plan, setPlan] = useState(tenant.plan);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const status = (tenant.status ?? (tenant.active ? "active" : "inactive")) as TenantStatus;
  const statusConfig = TENANT_STATUS_CONFIG[status] || TENANT_STATUS_CONFIG.active;

  useEffect(() => {
    setStatsLoading(true);
    fetchTenantStats(tenant.id)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
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
        {/* Status + badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={badgeVariant}>{statusConfig.label}</Badge>
          <span className="text-xs text-muted-foreground">{statusConfig.description}</span>
        </div>

        {/* Stats */}
        {statsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            Carregando estatísticas...
          </div>
        ) : stats ? (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <UserCheck className="w-4 h-4 mx-auto mb-1 text-primary" />
              <div className="text-lg font-bold">{stats.internal_users}</div>
              <div className="text-xs text-muted-foreground">Equipe interna</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <Users className="w-4 h-4 mx-auto mb-1 text-primary" />
              <div className="text-lg font-bold">{stats.total_profiles}</div>
              <div className="text-xs text-muted-foreground">Clientes</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <CalendarDays className="w-4 h-4 mx-auto mb-1 text-primary" />
              <div className="text-lg font-bold">{stats.total_bookings}</div>
              <div className="text-xs text-muted-foreground">Agendamentos</div>
            </div>
          </div>
        ) : null}

        <Separator />

        {/* Details / Edit */}
        {editing ? (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))} />
            </div>
            <div>
              <Label className="text-xs">Domínio customizado</Label>
              <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="meusalao.com.br" />
            </div>
            <div>
              <Label className="text-xs">Plano</Label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
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
            {stats?.owner_user_id && (
              <div><span className="text-muted-foreground">Owner:</span> <code className="text-xs">{stats.owner_user_id.slice(0, 8)}…</code></div>
            )}
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Editar detalhes</Button>
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
                description={`O tenant "${tenant.name}" voltará a funcionar normalmente. Clientes poderão agendar e admins poderão operar.`}
                onConfirm={() => handleStatusChange("active")}
              />
            )}
            {status !== "inactive" && (
              <ConfirmDialog
                trigger={<Button variant="outline" size="sm">Desativar</Button>}
                title="Desativar tenant"
                description={`O tenant "${tenant.name}" será desativado.\n\n• Novos agendamentos serão bloqueados\n• Admins não poderão operar\n• Dados serão preservados\n\nEsta ação pode ser revertida.`}
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
                description={`⚠️ AÇÃO CRÍTICA\n\nO tenant "${tenant.name}" será SUSPENSO.\n\n• Nenhuma operação será permitida\n• Clientes e admins perdem acesso\n• Dados serão preservados\n• Use apenas para violação de termos ou inadimplência`}
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
