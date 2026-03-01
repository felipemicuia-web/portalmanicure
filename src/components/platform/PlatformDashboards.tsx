import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, LayoutDashboard, Trash2, Pencil } from "lucide-react";

interface Dashboard {
  id: string;
  name: string;
  tenant_id: string | null;
  is_system: boolean;
  created_at: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export function PlatformDashboards() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [tenantId, setTenantId] = useState<string>("global");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  async function fetchData() {
    setLoading(true);
    const [dashRes, tenantRes] = await Promise.all([
      supabase.from("dashboards").select("*").order("created_at", { ascending: false }),
      supabase.from("tenants").select("id, name, slug").order("name"),
    ]);
    if (dashRes.data) setDashboards(dashRes.data as Dashboard[]);
    if (tenantRes.data) setTenants(tenantRes.data);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const payload = {
      name: name.trim(),
      tenant_id: tenantId === "global" ? null : tenantId,
      created_by: user.id,
    };

    let error;
    if (editingId) {
      const res = await supabase.from("dashboards").update({ name: payload.name, tenant_id: payload.tenant_id }).eq("id", editingId);
      error = res.error;
    } else {
      const res = await supabase.from("dashboards").insert(payload);
      error = res.error;
    }

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "Atualizado!" : "Dashboard criado!" });
      resetForm();
      fetchData();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("dashboards").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Dashboard excluído!" });
      fetchData();
    }
  };

  const startEdit = (d: Dashboard) => {
    setEditingId(d.id);
    setName(d.name);
    setTenantId(d.tenant_id || "global");
    setShowCreate(true);
  };

  const resetForm = () => {
    setShowCreate(false);
    setEditingId(null);
    setName("");
    setTenantId("global");
  };

  const getTenantLabel = (tid: string | null) => {
    if (!tid) return "Global (Plataforma)";
    const t = tenants.find((x) => x.id === tid);
    return t ? t.name : tid;
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
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{dashboards.length} dashboard(s)</div>
        <Dialog open={showCreate} onOpenChange={(v) => { if (!v) resetForm(); else setShowCreate(true); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Novo Dashboard</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Dashboard" : "Criar Dashboard"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dashboard principal" />
              </div>
              <div>
                <Label>Escopo</Label>
                <Select value={tenantId} onValueChange={setTenantId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global (Plataforma)</SelectItem>
                    {tenants.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name} ({t.slug})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? "Salvando..." : editingId ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-2">
        {dashboards.map((d) => (
          <Card key={d.id}>
            <CardContent className="py-3 px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="font-medium text-sm">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{getTenantLabel(d.tenant_id)}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {d.is_system && <Badge variant="outline" className="text-xs">Sistema</Badge>}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(d)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(d.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {dashboards.length === 0 && (
          <p className="text-center text-muted-foreground py-8 text-sm">Nenhum dashboard criado.</p>
        )}
      </div>
    </div>
  );
}
