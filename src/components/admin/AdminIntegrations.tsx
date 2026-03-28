import { useState, useEffect, useCallback } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchProviders,
  fetchTenantIntegrations,
  upsertTenantIntegration,
  updateTenantIntegration,
  fetchIntegrationEvents,
  upsertIntegrationEvent,
  listSecrets,
  setSecret,
  deleteSecret,
  testIntegration,
  fetchLogs,
} from "@/lib/integrations";
import type {
  IntegrationProvider,
  TenantIntegration,
  TenantIntegrationEvent,
  IntegrationLog,
  IntegrationStatus,
  SecretStatus,
  ConfigField,
} from "@/types/integrations";
import { AVAILABLE_EVENTS } from "@/types/integrations";
import {
  Plug,
  Power,
  PowerOff,
  Settings2,
  Zap,
  FlaskConical,
  ScrollText,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  MessageCircle,
  Mail,
  Globe,
  MapPin,
  Shield,
  Key,
  Trash2,
  Save,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = { MessageCircle, Mail, Globe, MapPin, Plug };
function ProviderIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] || Plug;
  return <Icon className={className} />;
}

const STATUS_OPTIONS: { value: IntegrationStatus; label: string; color: string }[] = [
  { value: "disabled", label: "Desativado", color: "text-muted-foreground" },
  { value: "test_mode", label: "Modo Teste", color: "text-yellow-500" },
  { value: "live", label: "Ativo (Live)", color: "text-green-500" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "success") return <Badge className="bg-green-500/20 text-green-400"><CheckCircle2 className="w-3 h-3 mr-1" />Sucesso</Badge>;
  if (status === "error") return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Erro</Badge>;
  if (status === "skipped") return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Ignorado</Badge>;
  return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
}

function ModeBadge({ mode }: { mode: string }) {
  if (mode === "test_mode") return <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">Teste</Badge>;
  return <Badge variant="outline" className="border-green-500/50 text-green-500">Live</Badge>;
}

export function AdminIntegrations() {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const [providers, setProviders] = useState<IntegrationProvider[]>([]);
  const [integrations, setIntegrations] = useState<TenantIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<TenantIntegration | null>(null);
  const [detailTab, setDetailTab] = useState("config");

  // Detail state
  const [events, setEvents] = useState<TenantIntegrationEvent[]>([]);
  const [secrets, setSecrets] = useState<SecretStatus[]>([]);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [logsCount, setLogsCount] = useState(0);
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);
  const [testing, setTesting] = useState(false);
  const [configDraft, setConfigDraft] = useState<Record<string, unknown>>({});
  const [newSecretKey, setNewSecretKey] = useState("");
  const [newSecretValue, setNewSecretValue] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);
  const [selectedLog, setSelectedLog] = useState<IntegrationLog | null>(null);

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    try {
      const [p, i] = await Promise.all([
        fetchProviders(),
        fetchTenantIntegrations(tenantId),
      ]);
      setProviders(p);
      setIntegrations(i);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { loadData(); }, [loadData]);

  const loadDetail = useCallback(async (integration: TenantIntegration) => {
    if (!tenantId) return;
    const [ev, sec, logResult] = await Promise.all([
      fetchIntegrationEvents(integration.id),
      listSecrets(integration.id).catch(() => []),
      fetchLogs({ tenantId, limit: 15, offset: 0 }),
    ]);
    setEvents(ev);
    setSecrets(sec);
    setLogs(logResult.logs.filter((l) => l.tenant_integration_id === integration.id));
    setLogsCount(logResult.count);
    setConfigDraft(integration.config_json || {});
    setTestResult(null);
  }, [tenantId]);

  const openDetail = async (integration: TenantIntegration) => {
    setSelectedIntegration(integration);
    setDetailTab("config");
    await loadDetail(integration);
  };

  const handleStatusChange = async (provider: IntegrationProvider, newStatus: IntegrationStatus) => {
    if (!tenantId) return;
    try {
      const existing = integrations.find((i) => i.provider_id === provider.id);
      if (existing) {
        await updateTenantIntegration(existing.id, { status: newStatus });
      } else {
        await upsertTenantIntegration(tenantId, provider.id, newStatus);
      }
      toast({ title: `${provider.name}: ${STATUS_OPTIONS.find((s) => s.value === newStatus)?.label}` });
      loadData();
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const handleSaveConfig = async () => {
    if (!selectedIntegration) return;
    setSavingConfig(true);
    try {
      await updateTenantIntegration(selectedIntegration.id, { config_json: configDraft });
      toast({ title: "Configuração salva" });
      loadData();
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleToggleEvent = async (eventCode: string, enabled: boolean) => {
    if (!selectedIntegration || !tenantId) return;
    try {
      await upsertIntegrationEvent(selectedIntegration.id, tenantId, eventCode, enabled);
      const updated = await fetchIntegrationEvents(selectedIntegration.id);
      setEvents(updated);
      toast({ title: enabled ? "Evento ativado" : "Evento desativado" });
    } catch {
      toast({ title: "Erro ao atualizar evento", variant: "destructive" });
    }
  };

  const handleSetSecret = async () => {
    if (!selectedIntegration || !newSecretKey || !newSecretValue) return;
    try {
      await setSecret(selectedIntegration.id, newSecretKey, newSecretValue);
      setNewSecretKey("");
      setNewSecretValue("");
      const updated = await listSecrets(selectedIntegration.id);
      setSecrets(updated);
      toast({ title: "Secret configurado" });
    } catch {
      toast({ title: "Erro ao salvar secret", variant: "destructive" });
    }
  };

  const handleDeleteSecret = async (key: string) => {
    if (!selectedIntegration) return;
    try {
      await deleteSecret(selectedIntegration.id, key);
      const updated = await listSecrets(selectedIntegration.id);
      setSecrets(updated);
      toast({ title: "Secret removido" });
    } catch {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  };

  const handleTest = async (eventCode: string) => {
    if (!selectedIntegration) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testIntegration(selectedIntegration.id, eventCode);
      setTestResult(result);
      toast({ title: "Teste executado com sucesso" });
    } catch (err) {
      setTestResult({ error: true, message: err instanceof Error ? err.message : "Erro" });
      toast({ title: "Erro no teste", variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const getIntegration = (providerId: string) => integrations.find((i) => i.provider_id === providerId);
  const getStatus = (providerId: string): IntegrationStatus => getIntegration(providerId)?.status as IntegrationStatus || "disabled";

  const eventDriven = providers.filter((p) => p.integration_type === "event_driven");
  const utility = providers.filter((p) => p.integration_type === "utility");
  const configSchema = selectedIntegration?.provider?.config_schema_json as ConfigField[] || [];

  return (
    <div className="space-y-6">
      {/* Automações (event_driven) */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><Zap className="w-5 h-5 text-primary" />Automações</h3>
        {eventDriven.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma automação disponível.</p>}
        <div className="grid gap-3">
          {eventDriven.map((provider) => {
            const status = getStatus(provider.id);
            const integration = getIntegration(provider.id);
            return (
              <Card key={provider.id}>
                <CardContent className="flex items-center justify-between py-4 px-4">
                  <div className="flex items-center gap-3">
                    <ProviderIcon name={provider.icon_name} className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{provider.name}</p>
                      <p className="text-xs text-muted-foreground">{provider.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={status}
                      onValueChange={(v) => handleStatusChange(provider, v as IntegrationStatus)}
                    >
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className={opt.color}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {integration && (
                      <Button variant="outline" size="sm" onClick={() => openDetail(integration)}>
                        <Settings2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Utilitários */}
      {utility.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" />Utilitários</h3>
          <div className="grid gap-3">
            {utility.map((provider) => {
              const status = getStatus(provider.id);
              const integration = getIntegration(provider.id);
              return (
                <Card key={provider.id}>
                  <CardContent className="flex items-center justify-between py-4 px-4">
                    <div className="flex items-center gap-3">
                      <ProviderIcon name={provider.icon_name} className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">{provider.name}</p>
                        <p className="text-xs text-muted-foreground">{provider.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={status}
                        onValueChange={(v) => handleStatusChange(provider, v as IntegrationStatus)}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disabled">Desativado</SelectItem>
                          <SelectItem value="live">Ativo</SelectItem>
                        </SelectContent>
                      </Select>
                      {integration && (
                        <Button variant="outline" size="sm" onClick={() => openDetail(integration)}>
                          <Settings2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedIntegration} onOpenChange={(o) => !o && setSelectedIntegration(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedIntegration?.provider && <ProviderIcon name={selectedIntegration.provider.icon_name} className="w-5 h-5 text-primary" />}
              {selectedIntegration?.provider?.name || "Integração"}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={detailTab} onValueChange={setDetailTab}>
            <TabsList className="w-full">
              <TabsTrigger value="config" className="flex-1 gap-1 text-xs"><Settings2 className="w-3 h-3" />Config</TabsTrigger>
              {selectedIntegration?.provider?.integration_type === "event_driven" && (
                <TabsTrigger value="events" className="flex-1 gap-1 text-xs"><Zap className="w-3 h-3" />Eventos</TabsTrigger>
              )}
              {selectedIntegration?.provider?.requires_secret && (
                <TabsTrigger value="secrets" className="flex-1 gap-1 text-xs"><Key className="w-3 h-3" />Secrets</TabsTrigger>
              )}
              <TabsTrigger value="test" className="flex-1 gap-1 text-xs"><FlaskConical className="w-3 h-3" />Teste</TabsTrigger>
              <TabsTrigger value="logs" className="flex-1 gap-1 text-xs"><ScrollText className="w-3 h-3" />Logs</TabsTrigger>
            </TabsList>

            {/* Config */}
            <TabsContent value="config" className="space-y-4 mt-3">
              {configSchema.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma configuração necessária.</p>
              ) : (
                configSchema.map((field) => (
                  <div key={field.key}>
                    <Label className="text-xs">{field.label} {field.required && <span className="text-destructive">*</span>}</Label>
                    {field.type === "select" ? (
                      <Select
                        value={(configDraft[field.key] as string) || ""}
                        onValueChange={(v) => setConfigDraft((p) => ({ ...p, [field.key]: v }))}
                      >
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {field.options?.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={(configDraft[field.key] as string) || ""}
                        onChange={(e) => setConfigDraft((p) => ({ ...p, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                ))
              )}
              <Button onClick={handleSaveConfig} disabled={savingConfig} className="w-full gap-2">
                <Save className="w-4 h-4" />{savingConfig ? "Salvando..." : "Salvar Configuração"}
              </Button>
            </TabsContent>

            {/* Events */}
            <TabsContent value="events" className="space-y-3 mt-3">
              {AVAILABLE_EVENTS.map((ev) => {
                const existing = events.find((e) => e.event_code === ev.code);
                const enabled = existing?.is_enabled || false;
                return (
                  <div key={ev.code} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{ev.label}</p>
                      <p className="text-xs text-muted-foreground">{ev.description}</p>
                      {ev.scheduled && <Badge variant="outline" className="text-xs mt-1">Agendado</Badge>}
                    </div>
                    <Switch checked={enabled} onCheckedChange={(v) => handleToggleEvent(ev.code, v)} />
                  </div>
                );
              })}
            </TabsContent>

            {/* Secrets */}
            <TabsContent value="secrets" className="space-y-4 mt-3">
              <div className="space-y-2">
                {secrets.map((s) => (
                  <div key={s.secret_key} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="text-sm font-mono">{s.secret_key}</span>
                      <Badge className="bg-green-500/20 text-green-400 text-xs">Configurado</Badge>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteSecret(s.secret_key)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                {secrets.length === 0 && <p className="text-sm text-muted-foreground">Nenhum secret configurado.</p>}
              </div>
              <div className="space-y-2 border-t border-border/30 pt-3">
                <Label className="text-xs">Adicionar / Substituir Secret</Label>
                <Input placeholder="Nome (ex: api_token)" value={newSecretKey} onChange={(e) => setNewSecretKey(e.target.value)} />
                <Input type="password" placeholder="Valor do secret" value={newSecretValue} onChange={(e) => setNewSecretValue(e.target.value)} />
                <Button onClick={handleSetSecret} disabled={!newSecretKey || !newSecretValue} className="w-full gap-2">
                  <Key className="w-4 h-4" />Salvar Secret
                </Button>
              </div>
            </TabsContent>

            {/* Test */}
            <TabsContent value="test" className="space-y-4 mt-3">
              <p className="text-sm text-muted-foreground">Selecione um evento para simular o disparo da integração em modo teste.</p>
              <div className="grid gap-2">
                {AVAILABLE_EVENTS.filter((e) => !e.scheduled).map((ev) => (
                  <Button key={ev.code} variant="outline" size="sm" onClick={() => handleTest(ev.code)} disabled={testing} className="justify-start gap-2">
                    <FlaskConical className="w-4 h-4" />{ev.label}
                  </Button>
                ))}
              </div>
              {testResult && (
                <div className="mt-3">
                  <Label className="text-xs">Resultado do Teste</Label>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48">{JSON.stringify(testResult, null, 2)}</pre>
                </div>
              )}
            </TabsContent>

            {/* Logs */}
            <TabsContent value="logs" className="space-y-2 mt-3">
              {logs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum log encontrado.</p>}
              {logs.map((log) => (
                <Card key={log.id} className="cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => setSelectedLog(log)}>
                  <CardContent className="flex items-center justify-between py-2 px-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={log.status} />
                      <ModeBadge mode={log.mode_used} />
                      <span className="text-xs">{log.event_code}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(log.executed_at).toLocaleString("pt-BR")}</span>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(o) => !o && setSelectedLog(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalhes do Log</DialogTitle></DialogHeader>
          {selectedLog && (
            <div className="space-y-3 text-sm">
              <div className="flex gap-2"><StatusBadge status={selectedLog.status} /><ModeBadge mode={selectedLog.mode_used} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Evento:</span> {selectedLog.event_code || "—"}</div>
                <div><span className="text-muted-foreground">Duração:</span> {selectedLog.duration_ms ?? "—"}ms</div>
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
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">{JSON.stringify(selectedLog.request_summary, null, 2)}</pre>
                </div>
              )}
              {selectedLog.response_summary && (
                <div>
                  <Label className="text-xs">Response</Label>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">{JSON.stringify(selectedLog.response_summary, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
