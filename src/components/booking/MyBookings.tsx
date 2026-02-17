import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAvailableTimes } from "@/hooks/useBookingData";
import { useTenant } from "@/contexts/TenantContext";
import { Calendar, Clock, User as UserIcon, Pencil, Trash2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
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
import { cn } from "@/lib/utils";

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
  created_at: string;
}

interface Professional {
  id: string;
  name: string;
}

interface Props {
  user: User;
}

export function MyBookings({ user }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const { tenantId } = useTenant();

  // Edit state
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({
    booking_date: "",
    booking_time: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deletingBooking, setDeletingBooking] = useState<Booking | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch available times for the selected date/professional
  const { times: availableTimes, loading: timesLoading } = useAvailableTimes(
    editingBooking?.professional_id || "",
    editForm.booking_date,
    editingBooking?.duration_minutes || 0
  );

  const fetchData = async () => {
    setLoading(true);
    const [bookingsRes, professionalsRes] = await Promise.all([
      supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true }),
      supabase.from("professionals").select("id, name"),
    ]);

    if (bookingsRes.error) {
      logger.error("Error fetching bookings:", bookingsRes.error);
    } else {
      setBookings(bookingsRes.data || []);
    }

    if (professionalsRes.data) {
      setProfessionals(professionalsRes.data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user.id]);

  const getProfessionalName = (id: string) => {
    return professionals.find((p) => p.id === id)?.name || "—";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
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

  const canModify = (booking: Booking) => {
    // Only allow modifications for confirmed bookings (not completed or cancelled)
    return booking.status === "confirmed";
  };

  const openEditDialog = (booking: Booking) => {
    setEditingBooking(booking);
    setEditForm({
      booking_date: booking.booking_date,
      booking_time: booking.booking_time.slice(0, 5),
      notes: booking.notes || "",
    });
  };

  const createNotification = async (type: string, booking: Booking, message: string) => {
    try {
      await supabase.from("admin_notifications").insert({
        type,
        booking_id: booking.id,
        user_id: user.id,
        message,
        tenant_id: tenantId,
      });
    } catch (error) {
      logger.error("Error creating notification:", error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingBooking) return;

    setSaving(true);
    
    const { error } = await supabase
      .from("bookings")
      .update({
        booking_date: editForm.booking_date,
        booking_time: editForm.booking_time,
        notes: editForm.notes || null,
      })
      .eq("id", editingBooking.id);

    if (error) {
      logger.error("Error updating booking:", error);
      toast.error("Erro ao atualizar agendamento");
      setSaving(false);
      return;
    }

    // Create notification for admin
    const professional = getProfessionalName(editingBooking.professional_id);
    await createNotification(
      "booking_updated",
      editingBooking,
      `${editingBooking.client_name} alterou o agendamento com ${professional} para ${editForm.booking_date} às ${editForm.booking_time}`
    );

    toast.success("Agendamento atualizado! O admin foi notificado.");
    setEditingBooking(null);
    setSaving(false);

    setBookings((prev) =>
      prev.map((b) =>
        b.id === editingBooking.id
          ? { ...b, booking_date: editForm.booking_date, booking_time: editForm.booking_time, notes: editForm.notes || null }
          : b
      )
    );
  };

  const handleDelete = async () => {
    if (!deletingBooking) return;

    setDeleting(true);

    // Update status to cancelled instead of deleting
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", deletingBooking.id);

    if (error) {
      logger.error("Error cancelling booking:", error);
      toast.error("Erro ao cancelar agendamento");
      setDeleting(false);
      return;
    }

    // Create notification after successful cancellation
    const professional = getProfessionalName(deletingBooking.professional_id);
    await createNotification(
      "booking_cancelled",
      deletingBooking,
      `${deletingBooking.client_name} cancelou o agendamento de ${deletingBooking.booking_date} às ${deletingBooking.booking_time.slice(0, 5)} com ${professional}`
    );

    toast.success("Agendamento cancelado! O admin foi notificado.");
    setDeletingBooking(null);
    setDeleting(false);
    setBookings((prev) =>
      prev.map((b) =>
        b.id === deletingBooking.id ? { ...b, status: "cancelled" } : b
      )
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Include the current booking time as an option (since it's already booked by this user)
  const allAvailableTimes = editingBooking
    ? [...new Set([editingBooking.booking_time.slice(0, 5), ...availableTimes])].sort()
    : availableTimes;

  const EditFormContent = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="booking_date">Data</Label>
        <Input
          id="booking_date"
          type="date"
          value={editForm.booking_date}
          onChange={(e) => setEditForm((f) => ({ ...f, booking_date: e.target.value, booking_time: "" }))}
          min={new Date().toISOString().split("T")[0]}
          className="w-full"
        />
      </div>
      
      <div className="space-y-2">
        <Label>Horário disponível</Label>
        {timesLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">Carregando horários...</span>
          </div>
        ) : allAvailableTimes.length === 0 ? (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive text-center">
              Não há horários disponíveis para esta data.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
            {allAvailableTimes.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setEditForm((f) => ({ ...f, booking_time: t }))}
                className={cn(
                  "py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200",
                  editForm.booking_time === t
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "bg-muted/50 border border-border/50 text-foreground hover:bg-muted hover:border-border"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={editForm.notes}
          onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
          rows={3}
          placeholder="Alguma observação para o profissional?"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        ⚠️ O admin será notificado sobre esta alteração.
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-lg sm:text-xl font-semibold">Meus Agendamentos</h2>
          <span className="text-sm text-muted-foreground">({bookings.length})</span>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {bookings.length === 0 ? (
        <div className="glass-panel p-8 text-center text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Você ainda não tem agendamentos.</p>
          <p className="text-sm mt-1">Faça seu primeiro agendamento!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div key={booking.id} className="glass-panel p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {getStatusBadge(booking.status)}
                  </div>
                  <div className="flex items-center gap-3 text-sm mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{formatDate(booking.booking_date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{booking.booking_time.slice(0, 5)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                    <UserIcon className="w-4 h-4" />
                    <span>Profissional: {getProfessionalName(booking.professional_id)}</span>
                  </div>
                  <div className="text-sm font-medium text-primary">
                    {formatPrice(booking.total_price)}
                  </div>
                  {booking.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      "{booking.notes}"
                    </p>
                  )}
                </div>
                {canModify(booking) && (
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(booking)}
                      className="h-9 w-9"
                      title="Editar agendamento"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingBooking(booking)}
                      className="h-9 w-9 text-destructive hover:text-destructive"
                      title="Cancelar agendamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit: Drawer for mobile, Dialog for desktop */}
      {isMobile ? (
        <Drawer open={!!editingBooking} onOpenChange={(open) => !open && setEditingBooking(null)}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Alterar Agendamento</DrawerTitle>
              <DrawerDescription>Escolha uma nova data/horário para seu atendimento.</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4">
              <EditFormContent />
            </div>
            <DrawerFooter className="pt-2">
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? "Salvando..." : "Salvar Alterações"}
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
              <DialogTitle>Alterar Agendamento</DialogTitle>
              <DialogDescription>Escolha uma nova data/horário para seu atendimento.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <EditFormContent />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingBooking(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingBooking} onOpenChange={(open) => !open && setDeletingBooking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar o agendamento de{" "}
              <strong>{deletingBooking && formatDate(deletingBooking.booking_date)}</strong> às{" "}
              <strong>{deletingBooking?.booking_time.slice(0, 5)}</strong>?
              <br /><br />
              ⚠️ O admin será notificado sobre este cancelamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Cancelando..." : "Confirmar Cancelamento"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
