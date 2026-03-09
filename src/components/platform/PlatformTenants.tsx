import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Building2, Eye, Users, CalendarDays, ChevronUp, ChevronDown } from "lucide-react";
import { TenantDetailPanel } from "./TenantDetailPanel";
import {
  PlatformTenant,
  TenantStatus,
  TENANT_STATUS_CONFIG,
  fetchPlatformTenantList,
  createTenant,
} from "@/lib/platform";

type SortKey = "name" | "booking_count" | "client_count" | "created_at";
type SortDir = "asc" | "desc";

export function PlatformTenants() {
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<PlatformTenant | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  async function loadTenants() {
    setLoading(true);
    try {
      const data = await fetchPlatformTenantList();
      setTenants(data);
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

  const filtered = useMemo(() => {
    let result = tenants;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q) || (t.custom_domain?.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== "all") result = result.filter((t) => t.status === statusFilter);
    if (planFilter !== "all") result = result.filter((t) => t.plan === planFilter);
    
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "booking_count") cmp = a.booking_count - b.booking_count;
      else if (sortKey === "client_count") cmp = a.client_count - b.client_count;
      else cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === "desc" ? -cmp : cmp;
    });
    return result;
  }, [tenants, search, statusFilter, planFilter, sortKey, sortDir]);

  const plans = useMemo(() => [...new Set(tenants.map((t) => t.plan))], [tenants]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 inline ml-0.5" /> : <ChevronDown className="w-3 h-3 inline ml-0.5" />;
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim() || !newOwner.trim()) {
      toast({ title: "Preencha nome, slug e owner", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const tenantId = await createTenant({
        name: newName.trim(),
        slug: newSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ""),
        ownerUserId: newOwner.trim(),
        customDomain: newDomain.trim() || undefined,
      });
      toast({ title: "Tenant criado!", description: `ID: ${tenantId}` });
      setShowCreate(false);
      setNewName(""); setNewSlug(""); setNewDomain(""); setNewOwner("");
      loadTenants();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status as TenantStatus;
    const config = TENANT_STATUS_CONFIG[s] || TENANT_STATUS_CONFIG.active;
    const variant = s === "active" ? "default" as const : s === "suspended" ? "destructive" as const : "secondary" as const;
    return <Badge variant={variant} className="text-xs">{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2"><Skeleton className="h-10 flex-1" /><Skeleton className="h-10 w-32" /></div>
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search + Filters + Create */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, slug ou domínio..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
            <SelectItem value="suspended">Suspensos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Plano" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {plans.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 whitespace-nowrap"><Plus className="w-4 h-4" /> Novo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Onboarding de Novo Tenant</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Salão Exemplo" /></div>
              <div>
                <Label>Slug (URL)</Label>
                <Input value={newSlug} onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))} placeholder="salao-exemplo" />
                <p className="text-xs text-muted-foreground mt-1">3-50 caracteres. Usado na URL: /t/salao-exemplo</p>
              </div>
              <div>
                <Label>Owner (User ID) <span className="text-destructive">*</span></Label>
                <Input value={newOwner} onChange={(e) => setNewOwner(e.target.value.trim())} placeholder="UUID do usuário owner" />
                <p className="text-xs text-muted-foreground mt-1">Obrigatório. O usuário será vinculado como owner do tenant.</p>
              </div>
              <div><Label>Domínio Customizado (opcional)</Label><Input value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="meusalao.com.br" /></div>
              <Button onClick={handleCreate} disabled={creating || !newName.trim() || !newSlug.trim() || !newOwner.trim()} className="w-full">{creating ? "Criando..." : "Criar Tenant"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="text-sm text-muted-foreground">{filtered.length} de {tenants.length} tenant(s)</div>

      {selectedTenant && (
        <TenantDetailPanel tenant={selectedTenant} onClose={() => setSelectedTenant(null)} onUpdated={loadTenants} />
      )}

      {/* Rich Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("name")}>
                  Tenant <SortIcon col="name" />
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead className="text-center cursor-pointer select-none" onClick={() => toggleSort("client_count")}>
                  <Users className="w-3.5 h-3.5 inline mr-1" />Clientes <SortIcon col="client_count" />
                </TableHead>
                <TableHead className="text-center cursor-pointer select-none" onClick={() => toggleSort("booking_count")}>
                  <CalendarDays className="w-3.5 h-3.5 inline mr-1" />Bookings <SortIcon col="booking_count" />
                </TableHead>
                <TableHead className="hidden md:table-cell">Staff</TableHead>
                <TableHead className="hidden lg:table-cell">Último Booking</TableHead>
                <TableHead className="hidden lg:table-cell cursor-pointer select-none" onClick={() => toggleSort("created_at")}>
                  Criado em <SortIcon col="created_at" />
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setSelectedTenant(t)}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.slug}{t.custom_domain ? ` · ${t.custom_domain}` : ""}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(t.status)}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{t.plan}</Badge></TableCell>
                  <TableCell className="text-center text-sm">{t.client_count}</TableCell>
                  <TableCell className="text-center text-sm">{t.booking_count}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-center">{t.staff_count}</TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {t.last_booking_date ? new Date(t.last_booking_date).toLocaleDateString("pt-BR") : "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell><Eye className="w-4 h-4 text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    Nenhum tenant encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
