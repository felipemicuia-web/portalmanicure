import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, Users, Building2, Shield } from "lucide-react";
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
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState("user");
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  // Fetch tenants list
  useEffect(() => {
    async function fetchTenants() {
      const { data } = await supabase
        .from("tenants")
        .select("id, name, slug")
        .eq("active", true)
        .order("name");
      if (data) {
        setTenants(data);
        if (data.length > 0 && !selectedTenantId) {
          setSelectedTenantId(data[0].id);
        }
      }
    }
    fetchTenants();
  }, []);

  // Fetch members for selected tenant
  useEffect(() => {
    if (!selectedTenantId) return;
    async function fetchMembers() {
      setLoading(true);
      const { data, error } = await supabase
        .from("tenant_users")
        .select("*")
        .eq("tenant_id", selectedTenantId)
        .order("created_at", { ascending: false });

      if (!error && data) setMembers(data);
      setLoading(false);
    }
    fetchMembers();
  }, [selectedTenantId]);

  const handleChangeRole = async (userId: string, newRole: string) => {
    const { error } = await changeUserTenantRole(selectedTenantId, userId, newRole);
    if (error) {
      toast({ title: "Erro", description: error, variant: "destructive" });
    } else {
      toast({ title: "Role atualizado!" });
      setMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, role: newRole } : m))
      );
    }
  };

  const handleAddUser = async () => {
    if (!addEmail.trim() || !selectedTenantId) return;
    setAdding(true);

    // Look up user by email via auth (we need to find user_id)
    // Since we can't query auth.users directly, we search profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id")
      .ilike("name", `%${addEmail.trim()}%`)
      .limit(1);

    if (!profiles || profiles.length === 0) {
      toast({
        title: "Usuário não encontrado",
        description: "Nenhum usuário encontrado com esse critério.",
        variant: "destructive",
      });
      setAdding(false);
      return;
    }

    const { error } = await addUserToTenant(selectedTenantId, profiles[0].user_id, addRole);
    if (error) {
      toast({ title: "Erro", description: error, variant: "destructive" });
    } else {
      toast({ title: "Usuário adicionado ao tenant!" });
      setShowAddUser(false);
      setAddEmail("");
      setAddRole("user");
      // Refresh
      const { data } = await supabase
        .from("tenant_users")
        .select("*")
        .eq("tenant_id", selectedTenantId)
        .order("created_at", { ascending: false });
      if (data) setMembers(data);
    }
    setAdding(false);
  };

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId);

  return (
    <div className="space-y-4">
      {/* Tenant selector */}
      <div className="flex items-center gap-3">
        <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
        <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Selecione um tenant" />
          </SelectTrigger>
          <SelectContent>
            {tenants.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name} ({t.slug})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2" disabled={!selectedTenantId}>
              <UserPlus className="w-4 h-4" /> Vincular Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vincular Usuário ao Tenant</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome do Usuário (busca)</Label>
                <Input
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="Nome do usuário"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={addRole} onValueChange={setAddRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Proprietário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddUser} disabled={adding} className="w-full">
                {adding ? "Vinculando..." : "Vincular"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedTenant && (
        <div className="text-sm text-muted-foreground">
          <Users className="inline w-4 h-4 mr-1" />
          {members.length} membro(s) em <strong>{selectedTenant.name}</strong>
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
                    <div className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">
                      {m.user_id}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={m.status === "active" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {m.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Select
                  value={m.role}
                  onValueChange={(newRole) => handleChangeRole(m.user_id, newRole)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Proprietário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ))}
          {members.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhum membro encontrado neste tenant.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
