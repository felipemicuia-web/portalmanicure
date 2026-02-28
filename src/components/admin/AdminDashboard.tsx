import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, TooltipProps } from "recharts";
import { DollarSign, Users, TrendingUp, Clock, Star, AlertTriangle, CalendarDays, BarChart3, Percent } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, parseISO, getDay, startOfWeek, endOfWeek, eachWeekOfInterval, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 200 70% 50%))",
  "hsl(var(--chart-3, 150 60% 50%))",
  "hsl(var(--chart-4, 40 80% 55%))",
  "hsl(var(--chart-5, 280 60% 55%))",
  "hsl(var(--destructive))",
];

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--card-foreground))",
    fontSize: 12,
  },
  labelStyle: { color: "hsl(var(--card-foreground))" },
  itemStyle: { color: "hsl(var(--card-foreground))" },
};

interface BookingRow {
  id: string;
  booking_date: string;
  booking_time: string;
  total_price: number;
  status: string;
  user_id: string;
  client_name: string;
  duration_minutes: number;
  created_at: string;
}

interface BookingServiceRow {
  service_id: string;
  booking_id: string;
}

interface ServiceRow {
  id: string;
  name: string;
  price: number;
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-lg font-bold truncate">{value}</p>
          {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function AdminDashboard() {
  const { tenantId } = useTenant();
  const [monthOffset, setMonthOffset] = useState(0);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [bookingServices, setBookingServices] = useState<BookingServiceRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [allBookings, setAllBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refDate = subMonths(new Date(), monthOffset);
  const mStart = format(startOfMonth(refDate), "yyyy-MM-dd");
  const mEnd = format(endOfMonth(refDate), "yyyy-MM-dd");
  const monthLabel = format(refDate, "MMMM yyyy", { locale: ptBR });

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);

    Promise.all([
      supabase
        .from("bookings")
        .select("id, booking_date, booking_time, total_price, status, user_id, client_name, duration_minutes, created_at")
        .eq("tenant_id", tenantId)
        .gte("booking_date", mStart)
        .lte("booking_date", mEnd)
        .is("deleted_at", null),
      supabase
        .from("bookings")
        .select("id, booking_date, booking_time, total_price, status, user_id, client_name, duration_minutes, created_at")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null),
      supabase
        .from("booking_services")
        .select("service_id, booking_id")
        .eq("tenant_id", tenantId),
      supabase
        .from("services")
        .select("id, name, price")
        .eq("tenant_id", tenantId),
    ]).then(([bRes, allRes, bsRes, sRes]) => {
      setBookings((bRes.data as BookingRow[]) || []);
      setAllBookings((allRes.data as BookingRow[]) || []);
      setBookingServices((bsRes.data as BookingServiceRow[]) || []);
      setServices((sRes.data as ServiceRow[]) || []);
      setLoading(false);
    });
  }, [tenantId, mStart, mEnd]);

  
  const completed = useMemo(() => bookings.filter((b) => b.status === "completed"), [bookings]);
  const cancelled = useMemo(() => bookings.filter((b) => b.status === "cancelled"), [bookings]);

  // ── Revenue metrics ──
  const totalRevenue = completed.reduce((s, b) => s + Number(b.total_price), 0);
  const avgTicket = completed.length ? totalRevenue / completed.length : 0;

  // Historical monthly average (all completed bookings grouped by month)
  const { monthlyAvg, vsAvgPct } = useMemo(() => {
    const allCompleted = allBookings.filter((b) => b.status === "completed");
    if (!allCompleted.length) return { monthlyAvg: 0, vsAvgPct: null };

    const byMonth: Record<string, number> = {};
    allCompleted.forEach((b) => {
      const key = b.booking_date.slice(0, 7); // yyyy-MM
      byMonth[key] = (byMonth[key] || 0) + Number(b.total_price);
    });

    const months = Object.keys(byMonth);
    if (!months.length) return { monthlyAvg: 0, vsAvgPct: null };

    const total = Object.values(byMonth).reduce((a, b) => a + b, 0);
    const avg = total / months.length;
    const pct = avg > 0 ? (((totalRevenue - avg) / avg) * 100).toFixed(1) : null;
    return { monthlyAvg: avg, vsAvgPct: pct };
  }, [allBookings, totalRevenue]);

  // Revenue by day
  const revenueByDay = useMemo(() => {
    const map: Record<string, number> = {};
    completed.forEach((b) => {
      map[b.booking_date] = (map[b.booking_date] || 0) + Number(b.total_price);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date: format(parseISO(date), "dd/MM"), value }));
  }, [completed]);

  // Revenue by service
  const revenueByService = useMemo(() => {
    const bookingIds = new Set(completed.map((b) => b.id));
    const sMap: Record<string, number> = {};
    const countMap: Record<string, number> = {};
    bookingServices.forEach((bs) => {
      if (!bookingIds.has(bs.booking_id)) return;
      const svc = services.find((s) => s.id === bs.service_id);
      if (!svc) return;
      sMap[svc.name] = (sMap[svc.name] || 0) + Number(svc.price);
      countMap[svc.name] = (countMap[svc.name] || 0) + 1;
    });
    return Object.entries(sMap)
      .map(([name, revenue]) => ({ name, revenue, count: countMap[name] || 0 }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [completed, bookingServices, services]);

  // ── Client flow ──
  const uniqueClientsMonth = useMemo(() => new Set(completed.map((b) => b.user_id)).size, [completed]);

  const newVsRecurring = useMemo(() => {
    const firstBookingMap: Record<string, string> = {};
    allBookings
      .filter((b) => b.status === "completed")
      .forEach((b) => {
        if (!firstBookingMap[b.user_id] || b.booking_date < firstBookingMap[b.user_id]) {
          firstBookingMap[b.user_id] = b.booking_date;
        }
      });

    let newClients = 0;
    let recurring = 0;
    const seen = new Set<string>();
    completed.forEach((b) => {
      if (seen.has(b.user_id)) return;
      seen.add(b.user_id);
      if (firstBookingMap[b.user_id] >= mStart) newClients++;
      else recurring++;
    });
    return { newClients, recurring };
  }, [completed, allBookings, mStart]);

  // Clients by week
  const clientsByWeek = useMemo(() => {
    const start = startOfMonth(refDate);
    const end = endOfMonth(refDate);
    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
    return weeks.map((ws, i) => {
      const we = endOfWeek(ws, { weekStartsOn: 1 });
      const count = completed.filter((b) => {
        const d = parseISO(b.booking_date);
        return d >= ws && d <= we;
      }).length;
      return { week: `Sem ${i + 1}`, count };
    });
  }, [completed, refDate]);

  // ── Peak hours/days ──
  const dayDistribution = useMemo(() => {
    const counts = Array(7).fill(0);
    completed.forEach((b) => {
      const d = getDay(parseISO(b.booking_date));
      counts[d]++;
    });
    return DAY_NAMES.map((name, i) => ({ name, count: counts[i] }));
  }, [completed]);

  const hourDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    completed.forEach((b) => {
      const h = b.booking_time.slice(0, 5);
      counts[h] = (counts[h] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, count]) => ({ hour, count }));
  }, [completed]);

  const busiestDay = dayDistribution.reduce((a, b) => (b.count > a.count ? b : a), { name: "-", count: 0 });
  const busiestHour = hourDistribution.reduce((a, b) => (b.count > a.count ? b : a), { hour: "-", count: 0 });
  const quietestHour = hourDistribution.length
    ? hourDistribution.reduce((a, b) => (b.count < a.count ? b : a), hourDistribution[0])
    : { hour: "-", count: 0 };

  // ── Bonus metrics ──
  const totalBookings = bookings.filter((b) => b.status !== "cancelled").length;
  const conversionRate = totalBookings ? ((completed.length / totalBookings) * 100).toFixed(1) : "0";
  // Only count no-shows for past bookings
  const pastAll = bookings.filter((b) => b.status !== "cancelled" && !isAfter(parseISO(b.booking_date), new Date()));
  const pastNotCompleted = pastAll.filter((b) => b.status !== "completed");
  const realNoShowRate = pastAll.length ? ((pastNotCompleted.length / pastAll.length) * 100).toFixed(1) : "0";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Month selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-lg sm:text-xl font-bold capitalize">{monthLabel}</h2>
        <Select value={String(monthOffset)} onValueChange={(v) => setMonthOffset(Number(v))}>
          <SelectTrigger className="w-36 sm:w-40 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <SelectItem key={i} value={String(i)}>
                {format(subMonths(new Date(), i), "MMMM yyyy", { locale: ptBR })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ═══ 1. Revenue ═══ */}
      <section className="space-y-4">
        <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" /> Faturamento
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={DollarSign} label="Faturamento do mês" value={fmt(totalRevenue)} />
          <StatCard icon={TrendingUp} label="Ticket médio" value={fmt(avgTicket)} />
          <StatCard icon={CalendarDays} label="Concluídos" value={String(completed.length)} />
          <StatCard
            icon={BarChart3}
            label="Média histórica"
            value={fmt(monthlyAvg)}
            sub={vsAvgPct ? `${Number(vsAvgPct) >= 0 ? "+" : ""}${vsAvgPct}% vs média` : "—"}
          />
        </div>

        {revenueByDay.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Faturamento por dia</CardTitle>
            </CardHeader>
            <CardContent className="h-56 px-1 sm:px-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByDay} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 8 }} angle={-45} textAnchor="end" height={45} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9 }} width={40} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [fmt(v), "Faturamento"]} labelFormatter={(l) => `Data: ${l}`} />
                  <Bar dataKey="value" name="Faturamento" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {revenueByService.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Faturamento por serviço</CardTitle>
            </CardHeader>
            <CardContent className="px-1 sm:px-4">
              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueByService}
                      dataKey="revenue"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={55}
                      label={false}
                      labelLine={false}
                      style={{ fontSize: 9 }}
                    >
                      {revenueByService.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(v: number, name: string) => [fmt(v), name]} />
                    <Legend
                      wrapperStyle={{ fontSize: 10, lineHeight: '18px' }}
                      iconSize={8}
                      formatter={(value: string) => value.length > 18 ? value.slice(0, 18) + "…" : value}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ═══ 2. Client flow ═══ */}
      <section className="space-y-4">
        <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" /> Fluxo de Clientes
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Clientes atendidos" value={String(uniqueClientsMonth)} />
          <StatCard icon={Users} label="Novos clientes" value={String(newVsRecurring.newClients)} />
          <StatCard icon={Users} label="Recorrentes" value={String(newVsRecurring.recurring)} />
          <StatCard icon={CalendarDays} label="Total concluídos" value={String(completed.length)} />
        </div>

        {clientsByWeek.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Atendimentos por semana</CardTitle>
            </CardHeader>
            <CardContent className="h-48 px-1 sm:px-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={clientsByWeek} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} width={30} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [v, "Atendimentos"]} labelFormatter={(l) => l} />
                  <Line type="monotone" dataKey="count" name="Atendimentos" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ═══ 3. Peak hours / days ═══ */}
      <section className="space-y-4">
        <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" /> Horários e Dias
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard icon={CalendarDays} label="Dia mais cheio" value={busiestDay.name} sub={`${busiestDay.count} atend.`} />
          <StatCard icon={Clock} label="Horário pico" value={busiestHour.hour} sub={`${busiestHour.count} agend.`} />
          <StatCard icon={AlertTriangle} label="Horário vazio" value={quietestHour.hour} sub={`${quietestHour.count} agend.`} />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Distribuição por dia da semana</CardTitle>
            </CardHeader>
            <CardContent className="h-48 px-1 sm:px-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayDistribution} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} width={25} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [v, "Atendimentos"]} />
                  <Bar dataKey="count" name="Atendimentos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {hourDistribution.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Distribuição por horário</CardTitle>
              </CardHeader>
              <CardContent className="h-48 px-1 sm:px-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourDistribution} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <XAxis dataKey="hour" tick={{ fontSize: 8 }} angle={-45} textAnchor="end" height={45} interval={Math.max(0, Math.floor(hourDistribution.length / 8))} />
                    <YAxis tick={{ fontSize: 9 }} width={25} allowDecimals={false} />
                    <Tooltip {...tooltipStyle} formatter={(v: number) => [v, "Agendamentos"]} labelFormatter={(l) => `Horário: ${l}`} />
                    <Bar dataKey="count" name="Agendamentos" fill="hsl(var(--chart-2, 200 70% 50%))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* ═══ 4. Service performance ═══ */}
      <section className="space-y-4">
        <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <Star className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" /> Performance dos Serviços
        </h3>
        {revenueByService.length > 0 ? (
          <div className="grid gap-2">
            {revenueByService.map((s, i) => (
              <Card key={s.name}>
                <CardContent className="p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xs font-bold text-muted-foreground w-5 text-center shrink-0">#{i + 1}</span>
                    <span className="font-medium text-xs sm:text-sm truncate">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm shrink-0">
                    <span className="text-muted-foreground">{s.count}x</span>
                    <span className="font-semibold">{fmt(s.revenue)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum serviço registrado no período.</p>
        )}
      </section>

      {/* ═══ 5. Bonus metrics ═══ */}
      <section className="space-y-4">
        <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <Percent className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" /> Indicadores Bônus
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={TrendingUp} label="Taxa de conversão" value={`${conversionRate}%`} sub="Concluídos / Agendados" />
          <StatCard icon={AlertTriangle} label="Taxa de faltas" value={`${realNoShowRate}%`} sub="No-show / Total passado" />
          <StatCard icon={CalendarDays} label="Cancelamentos" value={String(cancelled.length)} sub={`de ${bookings.length} agend.`} />
          <StatCard
            icon={BarChart3}
            label="vs Média geral"
            value={vsAvgPct ? `${Number(vsAvgPct) >= 0 ? "+" : ""}${vsAvgPct}%` : "—"}
            sub={`Média: ${fmt(monthlyAvg)}`}
          />
        </div>
      </section>
    </div>
  );
}
