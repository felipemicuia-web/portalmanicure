import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "./ConfirmDialog";
import { Search, UserPlus, Users, Building2, Shield, AlertTriangle } from "lucide-react";
import { changeUserTenantRole, addUserToTenant } from "@/lib/tenant";
import { getRoleLabel } from "@/lib/permissions";

interface TenantMember {
  id: string;
  user_id: string;
  tenant_id: string;
  role: string;
  status: string;
  created_at: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export function PlatformUsers() {
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState("admin");
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchTenants() {
      const { data } = await supabase.from("tenants").select("id, name, slug").order("name");
      if (data) {
        setTenants(data);
        if (data.length > 0 && !selectedTenantId) setSelectedTenantId(data[0].id);
      }
    }
    fetchTenants();
  }, []);

  const refreshMembers = async () => {
    if (!selectedTenantId) return;
    setLoading(true);
    const { data } = await supabase
      .from("tenant_users")
      .select("*")
      .eq("tenant_id", selectedTenantId)
      .order("created_at", { ascending: false });
    if (data) setMembers(data);
    setLoading(false);
  };

  useEffect(() => { refreshMembers(); }, [selectedTenantId]);

  const handleChangeRole = async (userId: string, currentRole: string, newRole: string) => {
    // Prevent changing owner via simple dropdown
    if (currentRole === "owner" && newRole !== "owner") {
      toast({ title: "Não permitido", description: "Rebaixar owner requer ação específica.", variant: "destructive" });
      return;
    }
    const { error } = await changeUserTenantRole(selectedTenantId, userId, newRole);
    if (error) {
      toast({ title: "Erro", description: error, variant: "destructive" });
    } else {
      toast({ title: `Role alterado para: ${getRoleLabel(newRole)}` });
      refreshMembers();
    }
  };

  const handleAddUser = async () => {
    if (!addEmail.trim() || !selectedTenantId) return;
    setAdding(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id")
      .ilike("name", `%${addEmail.trim()}%`)
      .limit(1);

    if (!profiles?.length) {
      toast({ title: "Usuário não encontrado", variant: "destructive" });
      setAdding(false);
      return;
    }

    const { error } = await addUserToTenant(selectedTenantId, profiles[0].user_id, addRole);
    if (error) {
      toast({ title: "Erro", description: error, variant: "destructive" });
    } else {
      toast({ title: "Membro adicionado à equipe interna!" });
      setShowAddUser(false);
      setAddEmail("");
      setAddRole("admin");
      refreshMembers();
    }
    setAdding(false);
  };

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId);

  const getRoleBadgeVariant = (role: string) => {
    if (role === "owner") return "default" as const;
    if (role === "admin") return "secondary" as const;
    return "outline" as const;
  };

  return (
    <div className="space-y-4">
      <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground flex items-center gap-2">
        <Shield className="w-4 h-4 shrink-0" />
        <span>Esta seção gerencia apenas <strong>equipe interna</strong> (admins, staff). Clientes finais são gerenciados pela aba de cada tenant.</span>
      </div>

      <div className="flex items-center gap-3">
        <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
        <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Selecione um tenant" /></SelectTrigger>
          <SelectContent>
            {tenants.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name} ({t.slug})</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" disabled={!selectedTenantId}>
              <UserPlus className="w-4 h-4" /> Vincular Membro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Vincular Membro Interno</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                <AlertTriangle className="inline w-3 h-3 mr-1" />
                Apenas adicione pessoas da equipe interna do tenant. Clientes finais <strong>não devem</strong> ser adicionados aqui.
              </div>
              <div>
                <Label>Nome do Usuário (busca)</Label>
                <Input value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="Nome do usuário" />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={addRole} onValueChange={setAddRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="user">Staff</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Owner só pode ser atribuído pelo console SQL.</p>
              </div>
              <Button onClick={handleAddUser} disabled={adding} className="w-full">
                {adding ? "Vinculando..." : "Vincular à Equipe"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedTenant && (
        <div className="text-sm text-muted-foreground">
          <Users className="inline w-4 h-4 mr-1" />
          {members.length} membro(s) interno(s) em <strong>{selectedTenant.name}</strong>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-2">
          {members.map((m) => (
            <Card key={m.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">{m.user_id.slice(0, 12)}…</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getRoleBadgeVariant(m.role)} className="text-xs">{getRoleLabel(m.role)}</Badge>
                      <Badge variant={m.status === "active" ? "outline" : "destructive"} className="text-xs">{m.status}</Badge>
                    </div>
                  </div>
                </div>
                {m.role === "owner" ? (
                  <Badge variant="default" className="text-xs">Owner (protegido)</Badge>
                ) : (
                  <ConfirmDialog
                    trigger={
                      <Select value={m.role} onValueChange={(v) => handleChangeRole(m.user_id, m.role, v)}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="user">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    }
                    title="Confirmar alteração de role"
                    description={`Deseja alterar o papel deste membro?`}
                    onConfirm={() => {}}
                  />
                )}
              </CardContent>
            </Card>
          ))}
          {members.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhum membro interno neste tenant.</p>
          )}
        </div>
      )}
    </div>
  );
}
