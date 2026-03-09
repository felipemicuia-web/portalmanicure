import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Building2, Eye } from "lucide-react";
import { TenantDetailPanel } from "./TenantDetailPanel";
import {
  PlatformTenant,
  TenantStatus,
  TENANT_STATUS_CONFIG,
  fetchAllTenants,
  createTenant,
} from "@/lib/platform";

export function PlatformTenants() {
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<PlatformTenant | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  async function loadTenants() {
    setLoading(true);
    try {
      const data = await fetchAllTenants();
      setTenants(data);
      // Refresh selected tenant if open
      if (selectedTenant) {
        const updated = data.find((t) => t.id === selectedTenant.id);
        if (updated) setSelectedTenant(updated);
      }
    } catch {
      toast({ title: "Erro ao carregar tenants", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTenants(); }, []);

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim()) return;
    setCreating(true);
    try {
      const tenantId = await createTenant({
        name: newName.trim(),
        slug: newSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ""),
        customDomain: newDomain.trim() || undefined,
      });
      toast({ title: "Tenant criado!", description: `ID: ${tenantId}` });
      setShowCreate(false);
      setNewName("");
      setNewSlug("");
      setNewDomain("");
      loadTenants();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (tenant: PlatformTenant) => {
    const s = (tenant.status ?? (tenant.active ? "active" : "inactive")) as TenantStatus;
    const config = TENANT_STATUS_CONFIG[s] || TENANT_STATUS_CONFIG.active;
    const variant = s === "active" ? "outline" as const : s === "suspended" ? "destructive" as const : "secondary" as const;
    return <Badge variant={variant} className="text-xs">{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar tenant..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Novo Tenant</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Onboarding de Novo Tenant</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Salão Exemplo" />
              </div>
              <div>
                <Label>Slug (URL)</Label>
                <Input value={newSlug} onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))} placeholder="salao-exemplo" />
                <p className="text-xs text-muted-foreground mt-1">Usado na URL: /t/salao-exemplo</p>
              </div>
              <div>
                <Label>Domínio Customizado (opcional)</Label>
                <Input value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="meusalao.com.br" />
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                <p className="font-medium mb-1">O que será criado automaticamente:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Registro do tenant</li>
                  <li>Configurações padrão de horários</li>
                  <li>Estrutura pronta para uso</li>
                </ul>
              </div>
              <Button onClick={handleCreate} disabled={creating} className="w-full">
                {creating ? "Criando..." : "Criar Tenant"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="text-sm text-muted-foreground">{filtered.length} tenant(s)</div>

      {selectedTenant && (
        <TenantDetailPanel
          tenant={selectedTenant}
          onClose={() => setSelectedTenant(null)}
          onUpdated={loadTenants}
        />
      )}

      <div className="grid gap-2">
        {filtered.map((t) => (
          <Card
            key={t.id}
            className="cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => setSelectedTenant(t)}
          >
            <CardContent className="py-3 px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="font-medium text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.slug}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(t)}
                <Badge variant="outline" className="text-xs">{t.plan}</Badge>
                <Eye className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
