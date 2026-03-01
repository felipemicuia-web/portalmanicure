import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Building2, Users, Eye } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  active: boolean;
  created_at: string;
  custom_domain: string | null;
}

export function PlatformTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  async function fetchTenants() {
    setLoading(true);
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setTenants(data);
    setLoading(false);
  }

  useEffect(() => { fetchTenants(); }, []);

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("tenants").insert({
      name: newName.trim(),
      slug: newSlug.trim().toLowerCase(),
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Tenant criado!" });
      setShowCreate(false);
      setNewName("");
      setNewSlug("");
      fetchTenants();
    }
    setCreating(false);
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
          <Input
            placeholder="Buscar tenant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Novo Tenant</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Tenant</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Salão Exemplo" />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} placeholder="salao-exemplo" />
              </div>
              <Button onClick={handleCreate} disabled={creating} className="w-full">
                {creating ? "Criando..." : "Criar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="text-sm text-muted-foreground">{filtered.length} tenant(s)</div>

      {/* Selected tenant detail */}
      {selectedTenant && (
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {selectedTenant.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Slug:</span> {selectedTenant.slug}</div>
            <div><span className="text-muted-foreground">Plano:</span> {selectedTenant.plan}</div>
            <div><span className="text-muted-foreground">Domínio:</span> {selectedTenant.custom_domain || "—"}</div>
            <div><span className="text-muted-foreground">Criado em:</span> {new Date(selectedTenant.created_at).toLocaleDateString("pt-BR")}</div>
            <div className="flex items-center gap-2">
              <Badge variant={selectedTenant.active ? "default" : "destructive"}>
                {selectedTenant.active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedTenant(null)}>Fechar</Button>
          </CardContent>
        </Card>
      )}

      {/* Tenant list */}
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
