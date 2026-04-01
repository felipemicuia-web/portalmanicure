import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarDays,
  Clock,
  User,
  Phone,
  X,
  FileText,
  DollarSign,
  CreditCard,
} from "lucide-react";

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  total_price: number;
  status: string;
  client_name: string;
  client_phone: string;
  notes: string | null;
  services?: { name: string }[];
}

interface Props {
  professionalId: string;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  confirmed: { label: "Confirmado", variant: "default" },
  completed: { label: "Concluído", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

export function ProfessionalAgenda({ professionalId }: Props) {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");

  const fetchBookings = async () => {
    if (!tenantId) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, booking_date, booking_time, duration_minutes, total_price, status, client_name, client_phone, notes")
        .eq("professional_id", professionalId)
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .order("booking_date", { ascending: false })
        .order("booking_time", { ascending: false });

      if (error) throw error;

      logger.info("[ProfessionalAgenda] Bookings fetched", {
        tenantId,
        professionalId,
        bookingsCount: data?.length || 0,
      });

      // Fetch services for each booking
      if (data && data.length > 0) {
        const bookingIds = data.map((b) => b.id);
        const { data: bsData } = await supabase
          .from("booking_services")
          .select("booking_id, service_id")
          .in("booking_id", bookingIds)
          .eq("tenant_id", tenantId);

        if (bsData && bsData.length > 0) {
          const serviceIds = [...new Set(bsData.map((bs) => bs.service_id))];
          const { data: services } = await supabase
            .from("services")
            .select("id, name")
            .in("id", serviceIds);

          const serviceMap = new Map(services?.map((s) => [s.id, s.name]) || []);

          const enriched = data.map((b) => ({
            ...b,
            services: bsData
              .filter((bs) => bs.booking_id === b.id)
              .map((bs) => ({ name: serviceMap.get(bs.service_id) || "Serviço" })),
          }));
          setBookings(enriched);
        } else {
          setBookings(data.map((b) => ({ ...b, services: [] })));
        }
      } else {
        setBookings([]);
      }
    } catch (error) {
      logger.error("Error fetching professional bookings:", error);
      toast({ title: "Erro ao carregar agenda", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [professionalId, tenantId]);

  const activeBookings = useMemo(
    () => bookings.filter((b) => b.status === "confirmed"),
    [bookings]
  );

  const completedBookings = useMemo(
    () => bookings.filter((b) => b.status === "completed" || b.status === "cancelled"),
    [bookings]
  );

  const applyDateFilter = (list: Booking[]) => {
    if (!filterDate) return list;
    return list.filter((b) => b.booking_date === filterDate);
  };

  const formatDate = (d: string) => {
    try {
      return format(parseISO(d), "dd/MM/yyyy (EEEE)", { locale: ptBR });
    } catch {
      return d;
    }
  };

  const formatTime = (t: string) => t.slice(0, 5);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const status = STATUS_MAP[booking.status] || { label: booking.status, variant: "outline" as const };
    return (
      <div className="glass-panel p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{formatDate(booking.booking_date)}</span>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatTime(booking.booking_time)} ({booking.duration_minutes}min)
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" />
            {formatCurrency(booking.total_price)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <User className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{booking.client_name}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="w-3.5 h-3.5" />
          <span>{booking.client_phone}</span>
        </div>

        {booking.services && booking.services.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {booking.services.map((s, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {s.name}
              </Badge>
            ))}
          </div>
        )}

        {booking.notes && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground pt-1">
            <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{booking.notes}</span>
          </div>
        )}
      </div>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="glass-panel p-8 text-center text-muted-foreground">
      <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p>{message}</p>
    </div>
  );

  const renderList = (list: Booking[], emptyMsg: string) => {
    const filtered = applyDateFilter(list);
    if (filtered.length === 0) return <EmptyState message={emptyMsg} />;
    return (
      <div className="space-y-3">
        {filtered.map((b) => (
          <BookingCard key={b.id} booking={b} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Minha Agenda</h2>
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-auto"
        />
        {filterDate && (
          <Button variant="ghost" size="icon" onClick={() => setFilterDate("")}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <Tabs defaultValue="active">
        <TabsList className="w-full">
          <TabsTrigger value="active" className="flex-1">
            Ativos ({applyDateFilter(activeBookings).length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">
            Finalizados ({applyDateFilter(completedBookings).length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4">
          {renderList(activeBookings, "Nenhum agendamento vinculado a esta profissional")}
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          {renderList(completedBookings, "Nenhum agendamento vinculado a esta profissional")}
        </TabsContent>
      </Tabs>
    </div>
  );
}
