import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDateBR } from "@/lib/dateFormat";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Search, Trash2, ShieldBan, ShieldCheck, User, Phone, Calendar, Mail,
  Eye, StickyNote, Clock, CalendarDays, CreditCard, Sparkles, Save, DollarSign,
} from "lucide-react";

interface ProfileUser {
  id: string;
  user_id: string;
  name: string | null;
  phone: string | null;
  avatar_url: string | null;
  blocked: boolean;
  created_at: string;
  updated_at: string;
  notes: string | null;
  advance_payment_required: boolean;
  advance_payment_percentage: number;
  advance_payment_message: string | null;
  email?: string | null;
}

interface UserBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  total_price: number;
  payment_method: string | null;
  client_name: string;
  professional_name?: string;
  services?: string[];
}

export function AdminUsers() {
  const [users, setUsers] = useState<ProfileUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ProfileUser | null>(null);
  const [userBookings, setUserBookings] = useState<UserBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [editNotes, setEditNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [advancePayment, setAdvancePayment] = useState(false);
  const [advancePercentage, setAdvancePercentage] = useState(50);
  const [advanceMessage, setAdvanceMessage] = useState("");
  const [savingAdvance, setSavingAdvance] = useState(false);
  const { toast } = useToast();
  const { tenantId } = useTenant();

  const fetchUsers = async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, name, phone, avatar_url, blocked, created_at, updated_at, notes, advance_payment_required, advance_payment_percentage, advance_payment_message")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar usuários", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Fetch emails via secure function
    const { data: emailData } = await supabase.rpc("get_user_emails_for_tenant", { p_tenant_id: tenantId });
    const emailMap = new Map<string, string>();
    if (emailData) {
      (emailData as any[]).forEach((e: { user_id: string; email: string }) => {
        emailMap.set(e.user_id, e.email);
      });
    }

    const usersWithEmail = (data || []).map((u) => ({
      ...u,
      email: emailMap.get(u.user_id) || null,
    }));

    setUsers(usersWithEmail);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [tenantId]);

  const fetchUserBookings = async (userId: string) => {
    if (!tenantId) return;
    setLoadingBookings(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("id, booking_date, booking_time, status, total_price, payment_method, client_name, professional_id")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("booking_date", { ascending: false })
      .limit(50);

    if (!error && data) {
      // Fetch professional names
      const profIds = [...new Set(data.map(b => b.professional_id))];
      const { data: profs } = await supabase
        .from("professionals")
        .select("id, name")
        .in("id", profIds);

      const profMap = new Map(profs?.map(p => [p.id, p.name]) || []);

      setUserBookings(data.map(b => ({
        ...b,
        professional_name: profMap.get(b.professional_id) || "—",
      })));
    } else {
      setUserBookings([]);
    }
    setLoadingBookings(false);
  };

  const openUserDetail = (user: ProfileUser) => {
    setSelectedUser(user);
    setEditNotes(user.notes || "");
    setAdvancePayment(user.advance_payment_required);
    setAdvancePercentage(user.advance_payment_percentage);
    setAdvanceMessage(user.advance_payment_message || "");
    fetchUserBookings(user.user_id);
  };

  const saveNotes = async () => {
    if (!selectedUser || !tenantId) return;
    setSavingNotes(true);
    const { error } = await supabase
      .from("profiles")
      .update({ notes: editNotes || null })
      .eq("id", selectedUser.id)
      .eq("tenant_id", tenantId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Notas salvas" });
      setSelectedUser({ ...selectedUser, notes: editNotes || null });
      fetchUsers();
    }
    setSavingNotes(false);
  };

  const saveAdvancePayment = async () => {
    if (!selectedUser || !tenantId) return;
    setSavingAdvance(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        advance_payment_required: advancePayment,
        advance_payment_percentage: advancePercentage,
        advance_payment_message: advanceMessage.trim() || null,
      })
      .eq("id", selectedUser.id)
      .eq("tenant_id", tenantId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Configuração de pagamento antecipado salva" });
      setSelectedUser({
        ...selectedUser,
        advance_payment_required: advancePayment,
        advance_payment_percentage: advancePercentage,
        advance_payment_message: advanceMessage.trim() || null,
      });
      fetchUsers();
    }
    setSavingAdvance(false);
  };



  const toggleBlock = async (profile: ProfileUser) => {
    const newBlocked = !profile.blocked;
    const { error } = await supabase
      .from("profiles")
      .update({ blocked: newBlocked })
      .eq("id", profile.id)
      .eq("tenant_id", tenantId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: newBlocked ? "Usuário bloqueado" : "Usuário desbloqueado",
        description: `${profile.name || "Usuário"} foi ${newBlocked ? "bloqueado" : "desbloqueado"} com sucesso.`,
      });
      fetchUsers();
      if (selectedUser?.id === profile.id) {
        setSelectedUser({ ...profile, blocked: newBlocked });
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;
    setDeleting(true);
    try {
      const response = await supabase.functions.invoke("delete-user", {
        body: { user_id: deleteUserId, tenant_id: tenantId },
      });
      if (response.error) throw new Error(response.error.message || "Erro ao excluir usuário");
      toast({ title: "Usuário excluído", description: "O usuário foi removido com sucesso." });
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteUserId(null);
    }
  };

  const filtered = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      (u.name || "").toLowerCase().includes(term) ||
      (u.phone || "").includes(term) ||
      (u.notes || "").toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term)
    );
  });

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const statusLabel: Record<string, string> = {
    confirmed: "Confirmado",
    cancelled: "Cancelado",
    completed: "Concluído",
    pending: "Pendente",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold">Clientes Cadastrados ({filtered.length})</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou notas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{search ? "Nenhum usuário encontrado" : "Nenhum cliente cadastrado"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => (
            <div
              key={user.id}
              className={`rounded-lg border p-3 flex items-center gap-3 cursor-pointer hover:bg-accent/50 transition-colors ${user.blocked ? "opacity-60" : ""}`}
              onClick={() => openUserDetail(user)}
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user.name || "Sem nome"}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {user.phone || "—"}
                </p>
                {user.email && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {user.email}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {user.blocked ? (
                  <Badge variant="destructive" className="text-xs">Bloqueado</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Ativo</Badge>
                )}
                <Eye className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={selectedUser.avatar_url || undefined} />
                    <AvatarFallback>{getInitials(selectedUser.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p>{selectedUser.name || "Sem nome"}</p>
                    {selectedUser.blocked ? (
                      <Badge variant="destructive" className="text-xs mt-1">Bloqueado</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs mt-1">Ativo</Badge>
                    )}
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Basic Info */}
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Telefone</p>
                      <p className="font-medium">{selectedUser.phone || "Não informado"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedUser.email || "Não informado"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Cadastrado em</p>
                      <p className="font-medium">{formatDateBR(selectedUser.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Última atualização</p>
                      <p className="font-medium">{formatDateBR(selectedUser.updated_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
                    <User className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">ID do usuário</p>
                      <p className="font-mono text-xs break-all">{selectedUser.user_id}</p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <StickyNote className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Notas do admin</p>
                  </div>
                  <Textarea
                    placeholder="Adicione observações sobre este cliente..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                  />
                  <Button size="sm" onClick={saveNotes} disabled={savingNotes} className="gap-1">
                    <Save className="w-3.5 h-3.5" />
                    {savingNotes ? "Salvando..." : "Salvar notas"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Histórico de agendamentos ({userBookings.length})</p>
                  </div>
                  {loadingBookings ? (
                    <div className="flex justify-center py-4">
                      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : userBookings.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">Nenhum agendamento encontrado.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {userBookings.map((b) => (
                        <div key={b.id} className="rounded-md border p-2.5 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {formatDateBR(b.booking_date)} às {b.booking_time?.slice(0, 5)}
                            </span>
                            <Badge
                              variant={b.status === "cancelled" ? "destructive" : "secondary"}
                              className="text-[10px]"
                            >
                              {statusLabel[b.status] || b.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              {b.professional_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              {formatCurrency(b.total_price)}
                            </span>
                          </div>
                          {b.payment_method && (
                            <p className="text-muted-foreground">
                              Pagamento: {b.payment_method}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleBlock(selectedUser)}
                    className="gap-1 flex-1"
                  >
                    {selectedUser.blocked ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                        Desbloquear
                      </>
                    ) : (
                      <>
                        <ShieldBan className="w-4 h-4 text-amber-500" />
                        Bloquear
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteUserId(selectedUser.user_id)}
                    className="gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUserId} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. O usuário e todos os seus dados serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
