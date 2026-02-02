import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { formatPhone } from "@/lib/validation";
import { Calendar, Clock, User, Phone, FileText, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

export function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterProfessional, setFilterProfessional] = useState<string>("all");

  useEffect(() => {
    async function fetchData() {
      const [bookingsRes, professionalsRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("*")
          .order("booking_date", { ascending: false })
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
    }

    fetchData();
  }, []);

  const getProfessionalName = (id: string) => {
    return professionals.find((p) => p.id === id)?.name || "—";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR", {
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
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Confirmado</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Cancelado</Badge>;
      case "completed":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Concluído</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filterStatus !== "all" && b.status !== filterStatus) return false;
    if (filterProfessional !== "all" && b.professional_id !== filterProfessional) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Agendamentos</h2>
          <span className="text-sm text-muted-foreground">({filteredBookings.length})</span>
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
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
            <SelectTrigger className="w-40">
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum agendamento encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>{formatDate(booking.booking_date)}</TableCell>
                  <TableCell>{booking.booking_time.slice(0, 5)}</TableCell>
                  <TableCell>
                    <div>
                      <span>{booking.client_name}</span>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {formatPhone(booking.client_phone)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{getProfessionalName(booking.professional_id)}</TableCell>
                  <TableCell className="text-right">{formatPrice(booking.total_price)}</TableCell>
                  <TableCell className="text-center">{getStatusBadge(booking.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
