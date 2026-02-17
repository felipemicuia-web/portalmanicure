import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { formatPhone } from "@/lib/validation";
import { useIsMobile } from "@/hooks/use-mobile";
import { Calendar, Clock, User, Phone, CalendarDays, Pencil, Trash2, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  client_name: string;
  client_phone: string;
  duration_minutes: number;
  total_price: number;
  status: string;
  notes: string | null;
  professional_id: string;
  user_id: string;
  created_at: string;
}

interface Professional {
  id: string;
  name: string;
}

interface Profile {
  user_id: string;
  avatar_url: string | null;
}

export function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [whatsappTemplate, setWhatsappTemplate] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterProfessional, setFilterProfessional] = useState<string>("all");
  const isMobile = useIsMobile();
  
  // Edit state
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({
    client_name: "",
    client_phone: "",
    booking_date: "",
    booking_time: "",
    status: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  
  // Delete state
  const [deletingBooking, setDeletingBooking] = useState<Booking | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [bookingsRes, professionalsRes, settingsRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("*")
          .order("booking_date", { ascending: true })
          .order("booking_time", { ascending: true }),
        supabase.from("professionals").select("id, name"),
        supabase.from("work_settings").select("whatsapp_template").limit(1).single(),
      ]);

      if (bookingsRes.error) {
        logger.error("Error fetching bookings:", bookingsRes.error);
      } else {
        setBookings(bookingsRes.data || []);
        
        const userIds = [...new Set((bookingsRes.data || []).map((b) => b.user_id).filter(Boolean))];
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("user_id, avatar_url")
            .in("user_id", userIds);
          setProfiles(profilesData || []);
        }
      }

      if (professionalsRes.data) {
        setProfessionals(professionalsRes.data);
      }

      if (settingsRes.data?.whatsapp_template) {
        setWhatsappTemplate(settingsRes.data.whatsapp_template);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  const getProfessionalName = (id: string) => {
    return professionals.find((p) => p.id === id)?.name || "—";
  };

  const getClientAvatar = (userId: string) => {
    return profiles.find((p) => p.user_id === userId)?.avatar_url || null;
  };

  const getWhatsAppUrl = (booking: Booking) => {
    const professionalName = getProfessionalName(booking.professional_id);
    const formattedDate = formatDate(booking.booking_date);
    const formattedTime = booking.booking_time.slice(0, 5);
    const formattedPrice = formatPrice(booking.total_price);
    const obsText = booking.notes ? `📝 *Obs:* ${booking.notes}\n` : "";

    let message: string;
    if (whatsappTemplate) {
      message = whatsappTemplate
        .replace(/\{nome\}/g, booking.client_name)
        .replace(/\{data\}/g, formattedDate)
        .replace(/\{horario\}/g, formattedTime)
        .replace(/\{profissional\}/g, professionalName)
        .replace(/\{valor\}/g, formattedPrice)
        .replace(/\{duracao\}/g, String(booking.duration_minutes))
        .replace(/\{obs\}/g, obsText);
    } else {
      message = `Olá ${booking.client_name}! 👋\n\n` +
        `Seu agendamento foi confirmado! ✅\n\n` +
        `📅 *Data:* ${formattedDate}\n` +
        `🕐 *Horário:* ${formattedTime}\n` +
        `👤 *Profissional:* ${professionalName}\n` +
        `💰 *Valor:* ${formattedPrice}\n` +
        `⏱️ *Duração:* ${booking.duration_minutes} minutos\n` +
        (booking.notes ? `📝 *Obs:* ${booking.notes}\n` : "") +
        `\nAguardamos você! 💅✨`;
    }
    
    let phone = booking.client_phone.replace(/\D/g, "").replace(/^0+/, "");
    if (phone.length === 10 || phone.length === 11) {
      phone = `55${phone}`;
    }

    const encodedText = encodeURIComponent(message);
    if (isMobile) {
      return `whatsapp://send?phone=${phone}&text=${encodedText}`;
    }
    return `https://web.whatsapp.com/send?phone=${phone}&text=${encodedText}&app_absent=0`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const getClientInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Confirmado</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Cancelado</Badge>;
      case "completed":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">Concluído</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filterStatus !== "all" && b.status !== filterStatus) return false;
    if (filterProfessional !== "all" && b.professional_id !== filterProfessional) return false;
    return true;
  });

  const openEditDialog = (booking: Booking) => {
    setEditingBooking(booking);
    setEditForm({
      client_name: booking.client_name,
      client_phone: booking.client_phone,
      booking_date: booking.booking_date,
      booking_time: booking.booking_time.slice(0, 5),
      status: booking.status,
      notes: booking.notes || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingBooking) return;
    
    setSaving(true);
    const { error } = await supabase
      .from("bookings")
      .update({
        client_name: editForm.client_name,
        client_phone: editForm.client_phone.replace(/\D/g, ""),
        booking_date: editForm.booking_date,
        booking_time: editForm.booking_time,
        status: editForm.status,
        notes: editForm.notes || null,
      })
      .eq("id", editingBooking.id);
    
    setSaving(false);
    
    if (error) {
      logger.error("Error updating booking:", error);
      toast.error("Erro ao atualizar agendamento");
      return;
    }
    
    toast.success("Agendamento atualizado!");
    setEditingBooking(null);
    
    setBookings((prev) =>
      prev.map((b) =>
        b.id === editingBooking.id
          ? { ...b, ...editForm, client_phone: editForm.client_phone.replace(/\D/g, ""), notes: editForm.notes || null }
          : b
      )
    );
  };

  const handleDelete = async () => {
    if (!deletingBooking) return;
    
    setDeleting(true);
    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", deletingBooking.id);
    
    setDeleting(false);
    
    if (error) {
      logger.error("Error deleting booking:", error);
      toast.error("Erro ao excluir agendamento");
      return;
    }
    
    toast.success("Agendamento excluído!");
    setDeletingBooking(null);
    setBookings((prev) => prev.filter((b) => b.id !== deletingBooking.id));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const EditFormContent = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="client_name">Nome do Cliente</Label>
        <Input
          id="client_name"
          value={editForm.client_name}
          onChange={(e) => setEditForm((f) => ({ ...f, client_name: e.target.value }))}
          maxLength={100}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="client_phone">Telefone</Label>
        <Input
          id="client_phone"
          value={editForm.client_phone}
          onChange={(e) => setEditForm((f) => ({ ...f, client_phone: e.target.value }))}
          maxLength={20}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="booking_date">Data</Label>
          <Input
            id="booking_date"
            type="date"
            value={editForm.booking_date}
            onChange={(e) => setEditForm((f) => ({ ...f, booking_date: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="booking_time">Horário</Label>
          <Input
            id="booking_time"
            type="time"
            value={editForm.booking_time}
            onChange={(e) => setEditForm((f) => ({ ...f, booking_time: e.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={editForm.status} onValueChange={(v) => setEditForm((f) => ({ ...f, status: v }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="confirmed">Confirmado</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={editForm.notes}
          onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
          rows={3}
          maxLength={500}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          <h2 className="text-lg sm:text-xl font-semibold">Agendamentos</h2>
          <span className="text-sm text-muted-foreground">({filteredBookings.length})</span>
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="confirmed">Confirmados</SelectItem>
              <SelectItem value="completed">Concluídos</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterProfessional} onValueChange={setFilterProfessional}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Profissional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {professionals.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile: Cards Layout */}
      {isMobile ? (
        <div className="space-y-3">
          {filteredBookings.length === 0 ? (
            <div className="glass-panel p-8 text-center text-muted-foreground">
              Nenhum agendamento encontrado
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div key={booking.id} className="glass-panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={getClientAvatar(booking.user_id) || undefined} alt={booking.client_name} />
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getClientInitials(booking.client_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium truncate">{booking.client_name}</span>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <Phone className="w-3 h-3" />
                      {formatPhone(booking.client_phone)}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {formatDateShort(booking.booking_date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        {booking.booking_time.slice(0, 5)}
                      </div>
                      <span className="font-medium">{formatPrice(booking.total_price)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <User className="w-3 h-3" />
                      {getProfessionalName(booking.professional_id)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <a
                      href={getWhatsAppUrl(booking)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md text-green-500 hover:text-green-600 hover:bg-accent"
                      title="Enviar via WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(booking)}
                      className="h-8 w-8"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingBooking(booking)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Desktop: Table Layout */
        <div className="glass-panel overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> Data
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> Horário
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" /> Cliente
                  </div>
                </TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum agendamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{formatDate(booking.booking_date)}</TableCell>
                    <TableCell>{booking.booking_time.slice(0, 5)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={getClientAvatar(booking.user_id) || undefined} alt={booking.client_name} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getClientInitials(booking.client_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span>{booking.client_name}</span>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {formatPhone(booking.client_phone)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getProfessionalName(booking.professional_id)}</TableCell>
                    <TableCell className="text-right">{formatPrice(booking.total_price)}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <a
                          href={getWhatsAppUrl(booking)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-green-500 hover:text-green-600 hover:bg-accent"
                          title="Enviar via WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(booking)}
                          className="h-8 w-8"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingBooking(booking)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit: Drawer for mobile, Dialog for desktop */}
      {isMobile ? (
        <Drawer open={!!editingBooking} onOpenChange={(open) => !open && setEditingBooking(null)}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Editar Agendamento</DrawerTitle>
              <DrawerDescription>Altere as informações do agendamento.</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
              <EditFormContent />
            </div>
            <DrawerFooter className="pt-2">
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={!!editingBooking} onOpenChange={(open) => !open && setEditingBooking(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Agendamento</DialogTitle>
              <DialogDescription>Altere as informações do agendamento.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <EditFormContent />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingBooking(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingBooking} onOpenChange={(open) => !open && setDeletingBooking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o agendamento de{" "}
              <strong>{deletingBooking?.client_name}</strong> em{" "}
              <strong>{deletingBooking && formatDate(deletingBooking.booking_date)}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
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
