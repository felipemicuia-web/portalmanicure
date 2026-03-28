import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchProviderAdmin,
  updateProviderAdmin,
  updateProvider,
  fetchLogs,
  deleteLogs,
} from "@/lib/integrations";
import { supabase } from "@/integrations/supabase/client";
import type {
  IntegrationProvider,
  IntegrationProviderAdmin,
  IntegrationLog,
} from "@/types/integrations";
import {
  Plug,
  Power,
  PowerOff,
  Activity,
  ScrollText,
  RefreshCw,
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  MessageCircle,
  Mail,
  Globe,
  MapPin,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  MessageCircle, Mail, Globe, MapPin, Plug,
};

function ProviderIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] || Plug;
  return <Icon className={className} />;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "success") return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Sucesso</Badge>;
  if (status === "error") return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Erro</Badge>;
  if (status === "skipped") return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Ignorado</Badge>;
  return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
}

function ModeBadge({ mode }: { mode: string }) {
  if (mode === "test_mode") return <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">Teste</Badge>;
  return <Badge variant="outline" className="border-green-500/50 text-green-500">Live</Badge>;
}

export function PlatformIntegrations() {
  const { toast } = useToast();
  const [tab, setTab] = useState("catalog");
  const [providers, setProviders] = useState<(IntegrationProviderAdmin & { provider: IntegrationProvider })[]>([]);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [logsCount, setLogsCount] = useState(0);
  const [logsPage, setLogsPage] = useState(0);
  const [logFilter, setLogFilter] = useState({ status: "", modeUsed: "", providerId: "" });
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<IntegrationLog | null>(null);
  const [tenantStats, setTenantStats] = useState<Record<string, number>>({});

  const loadProviders = async () => {
    try {
      const data = await fetchProviderAdmin();
      setProviders(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadLogs = async (page = 0) => {
    try {
      const result = await fetchLogs({
        status: logFilter.status || undefined,
        modeUsed: logFilter.modeUsed || undefined,
        providerId: logFilter.providerId || undefined,
        limit: 25,
        offset: page * 25,
      });
      setLogs(result.logs);
      setLogsCount(result.count);
      setLogsPage(page);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTenantStats = async () => {
    try {
      const { data } = await supabase
        .from("tenant_integrations")
        .select("provider_id, status");
      const stats: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        if (row.status !== "disabled") {
          stats[row.provider_id] = (stats[row.provider_id] || 0) + 1;
        }
      });
      setTenantStats(stats);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    Promise.all([loadProviders(), loadTenantStats()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === "logs") loadLogs(0);
  }, [tab, logFilter]);

  const toggleGlobal = async (admin: IntegrationProviderAdmin & { provider: IntegrationProvider }) => {
    try {
      await updateProviderAdmin(admin.id, { is_active_global: !admin.is_active_global });
      toast({ title: admin.is_active_global ? "Provider desativado" : "Provider ativado" });
      loadProviders();
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const handleCleanLogs = async () => {
    try {
      const count = await deleteLogs(90);
      toast({ title: `${count} logs removidos (>90 dias)` });
      loadLogs(0);
    } catch {
      toast({ title: "Erro ao limpar logs", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="catalog" className="gap-2"><Plug className="w-4 h-4" />Catálogo</TabsTrigger>
          <TabsTrigger value="monitoring" className="gap-2"><Activity className="w-4 h-4" />Monitoramento</TabsTrigger>
          <TabsTrigger value="logs" className="gap-2"><ScrollText className="w-4 h-4" />Logs Globais</TabsTrigger>
        </TabsList>

        {/* ── Catalog ─────────────────── */}
        <TabsContent value="catalog" className="space-y-4 mt-4">
          {providers.map((admin) => (
            <Card key={admin.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <ProviderIcon name={admin.provider.icon_name} className="w-5 h-5 text-primary" />
                  <div>
                    <CardTitle className="text-base">{admin.provider.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{admin.provider.code} · {admin.provider.category} · {admin.provider.integration_type === "event_driven" ? "Evento" : "Utilitário"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {admin.is_active_global ? (
                    <Badge className="bg-green-500/20 text-green-400"><Power className="w-3 h-3 mr-1" />Ativo</Badge>
                  ) : (
                    <Badge variant="secondary"><PowerOff className="w-3 h-3 mr-1" />Inativo</Badge>
                  )}
                  <Switch checked={admin.is_active_global} onCheckedChange={() => toggleGlobal(admin)} />
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>{admin.provider.description}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {admin.provider.supports_test_mode && <Badge variant="outline">Suporta Teste</Badge>}
                  {admin.provider.requires_secret && <Badge variant="outline">Requer Secret</Badge>}
                  <Badge variant="outline">Retries: {admin.max_retries}</Badge>
                  <Badge variant="outline">Rate: {admin.rate_limit_per_minute}/min</Badge>
                  {tenantStats[admin.provider_id] && (
                    <Badge variant="outline" className="border-primary/50 text-primary">
                      {tenantStats[admin.provider_id]} tenant(s) usando
                    </Badge>
                  )}
                </div>
                {admin.internal_notes && (
                  <p className="text-xs italic text-muted-foreground/60 mt-1">📝 {admin.internal_notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ── Monitoring ─────────────── */}
        <TabsContent value="monitoring" className="space-y-4 mt-4">
          {providers.map((admin) => {
            const activeCount = tenantStats[admin.provider_id] || 0;
            return (
              <Card key={admin.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <ProviderIcon name={admin.provider.icon_name} className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{admin.provider.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {activeCount} tenant(s) com integração ativa
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {admin.is_active_global ? (
                      <Badge className="bg-green-500/20 text-green-400">Global Ativo</Badge>
                    ) : (
                      <Badge variant="secondary">Global Inativo</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ── Global Logs ────────────── */}
        <TabsContent value="logs" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={logFilter.status} onValueChange={(v) => setLogFilter((p) => ({ ...p, status: v === "all" ? "" : v }))}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                  <SelectItem value="skipped">Ignorado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Modo</Label>
              <Select value={logFilter.modeUsed} onValueChange={(v) => setLogFilter((p) => ({ ...p, modeUsed: v === "all" ? "" : v }))}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="test_mode">Teste</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={() => loadLogs(0)}><RefreshCw className="w-4 h-4 mr-1" />Atualizar</Button>
            <Button variant="outline" size="sm" onClick={handleCleanLogs} className="text-destructive"><Trash2 className="w-4 h-4 mr-1" />Limpar +90 dias</Button>
          </div>

          <div className="space-y-2">
            {logs.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum log encontrado.</p>}
            {logs.map((log) => (
              <Card key={log.id} className="cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => setSelectedLog(log)}>
                <CardContent className="flex items-center justify-between py-3 px-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusBadge status={log.status} />
                    <ModeBadge mode={log.mode_used} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{log.provider?.name || "—"} · {log.event_code || "—"}</p>
                      {log.error_message && <p className="text-xs text-destructive truncate">{log.error_message}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    {log.duration_ms != null && <span>{log.duration_ms}ms</span>}
                    <span>{new Date(log.executed_at).toLocaleString("pt-BR")}</span>
                    <Eye className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {logsCount > 25 && (
            <div className="flex justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" disabled={logsPage === 0} onClick={() => loadLogs(logsPage - 1)}>Anterior</Button>
              <span className="text-sm text-muted-foreground self-center">
                {logsPage * 25 + 1}–{Math.min((logsPage + 1) * 25, logsCount)} de {logsCount}
              </span>
              <Button variant="outline" size="sm" disabled={(logsPage + 1) * 25 >= logsCount} onClick={() => loadLogs(logsPage + 1)}>Próximo</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(o) => !o && setSelectedLog(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Log</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <StatusBadge status={selectedLog.status} />
                <ModeBadge mode={selectedLog.mode_used} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Provider:</span> {selectedLog.provider?.name || "—"}</div>
                <div><span className="text-muted-foreground">Evento:</span> {selectedLog.event_code || "—"}</div>
                <div><span className="text-muted-foreground">Duração:</span> {selectedLog.duration_ms ?? "—"}ms</div>
                <div><span className="text-muted-foreground">Data:</span> {new Date(selectedLog.executed_at).toLocaleString("pt-BR")}</div>
              </div>
              {selectedLog.error_message && (
                <div>
                  <Label className="text-xs text-destructive">Erro</Label>
                  <p className="text-xs bg-destructive/10 p-2 rounded">{selectedLog.error_message}</p>
                </div>
              )}
              {selectedLog.request_summary && (
                <div>
                  <Label className="text-xs">Request</Label>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">{JSON.stringify(selectedLog.request_summary, null, 2)}</pre>
                </div>
              )}
              {selectedLog.response_summary && (
                <div>
                  <Label className="text-xs">Response</Label>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">{JSON.stringify(selectedLog.response_summary, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
