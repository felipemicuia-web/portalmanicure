import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2, Users, UserCheck, CalendarDays, TrendingUp,
  AlertTriangle, Scissors, Briefcase, Ticket, Clock,
  ShieldAlert, Activity,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid,
} from "recharts";
import {
  PlatformStats, PlatformTenant, BookingActivity, TenantGrowth,
  fetchPlatformStats, fetchPlatformTenantList, fetchBookingActivity, fetchTenantGrowth,
} from "@/lib/platform";
import { useToast } from "@/hooks/use-toast";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
  variant?: "default" | "warning" | "danger";
}

function StatCard({ label, value, icon, description, variant = "default" }: StatCardProps) {
  const borderColor = variant === "danger"
    ? "border-destructive/30"
    : variant === "warning"
      ? "border-orange-500/30"
      : "border-border";

  return (
    <Card className={`${borderColor}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonCards({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
      ))}
    </div>
  );
}

interface Props {
  onSelectTenant?: (tenant: PlatformTenant) => void;
}

export function PlatformOverview({ onSelectTenant }: Props) {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [activity, setActivity] = useState<BookingActivity[]>([]);
  const [growth, setGrowth] = useState<TenantGrowth[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      fetchPlatformStats(),
      fetchPlatformTenantList(),
      fetchBookingActivity(),
      fetchTenantGrowth(),
    ])
      .then(([s, t, a, g]) => {
        setStats(s);
        setTenants(t);
        setActivity(a);
        setGrowth(g);
      })
      .catch(() => toast({ title: "Erro ao carregar dados", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCards count={8} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card><CardContent className="p-4"><Skeleton className="h-48 w-full" /></CardContent></Card>
          <Card><CardContent className="p-4"><Skeleton className="h-48 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  if (!stats) return <p className="text-center text-muted-foreground py-8">Sem dados disponíveis.</p>;

  const avgBookingsPerTenant = stats.total_tenants > 0
    ? (stats.total_bookings / stats.total_tenants).toFixed(1)
    : "0";

  // Rankings
  const topByBookings = [...tenants].sort((a, b) => b.booking_count - a.booking_count).slice(0, 5);
  const topByClients = [...tenants].sort((a, b) => b.client_count - a.client_count).slice(0, 5);

  // Attention items
  const needsAttention = tenants.filter(
    (t) =>
      !t.owner_user_id ||
      t.staff_count === 0 ||
      t.booking_count === 0 ||
      t.status !== "active"
  );

  const chartDateFormatter = (val: string) => {
    const d = new Date(val);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" /> Visão Geral da Plataforma
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <StatCard label="Total de Tenants" value={stats.total_tenants} icon={<Building2 className="w-5 h-5" />} />
          <StatCard label="Tenants Ativos" value={stats.active_tenants} icon={<Building2 className="w-5 h-5 text-green-500" />} />
          <StatCard
            label="Inativos / Suspensos"
            value={`${stats.inactive_tenants} / ${stats.suspended_tenants}`}
            icon={<ShieldAlert className="w-5 h-5" />}
            variant={stats.suspended_tenants > 0 ? "danger" : stats.inactive_tenants > 0 ? "warning" : "default"}
          />
          <StatCard label="Novos (7 dias)" value={stats.tenants_created_7d} icon={<TrendingUp className="w-5 h-5" />} />
          <StatCard label="Equipe Interna" value={stats.total_internal_users} icon={<UserCheck className="w-5 h-5" />} />
          <StatCard label="Clientes/Perfis" value={stats.total_profiles} icon={<Users className="w-5 h-5" />} />
          <StatCard label="Total Bookings" value={stats.total_bookings} icon={<CalendarDays className="w-5 h-5" />} />
          <StatCard label="Bookings Hoje" value={stats.bookings_today} icon={<Clock className="w-5 h-5" />} />
          <StatCard label="Últimos 7 dias" value={stats.bookings_7d} icon={<CalendarDays className="w-5 h-5" />} />
          <StatCard label="Últimos 30 dias" value={stats.bookings_30d} icon={<CalendarDays className="w-5 h-5" />} />
          <StatCard label="Serviços Ativos" value={stats.total_services} icon={<Scissors className="w-5 h-5" />} />
          <StatCard label="Profissionais" value={stats.total_professionals} icon={<Briefcase className="w-5 h-5" />} />
          <StatCard label="Cupons Ativos" value={stats.total_active_coupons} icon={<Ticket className="w-5 h-5" />} />
          <StatCard label="Média Bookings/Tenant" value={avgBookingsPerTenant} icon={<TrendingUp className="w-5 h-5" />} />
          <StatCard
            label="Sem Owner"
            value={stats.tenants_without_owner}
            icon={<AlertTriangle className="w-5 h-5" />}
            variant={stats.tenants_without_owner > 0 ? "warning" : "default"}
          />
          <StatCard
            label="Sem Bookings"
            value={stats.tenants_without_bookings}
            icon={<AlertTriangle className="w-5 h-5" />}
            variant={stats.tenants_without_bookings > 0 ? "warning" : "default"}
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Bookings — Últimos 30 dias</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            {activity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activity}>
                  <defs>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tickFormatter={chartDateFormatter} tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    labelFormatter={(v) => new Date(v).toLocaleDateString("pt-BR")}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="bookings" stroke="hsl(var(--primary))" fill="url(#colorBookings)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center pt-16">Sem dados de atividade.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Crescimento — Últimas 13 semanas</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            {growth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" tickFormatter={chartDateFormatter} tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    labelFormatter={(v) => `Semana de ${new Date(v).toLocaleDateString("pt-BR")}`}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="tenants" name="Tenants" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profiles" name="Clientes" fill="hsl(var(--accent-foreground))" opacity={0.5} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center pt-16">Sem dados de crescimento.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Top 5 — Mais Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topByBookings.length > 0 ? (
              <div className="space-y-2">
                {topByBookings.map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => onSelectTenant?.(t)}
                    className="w-full flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                      <div>
                        <span className="text-sm font-medium">{t.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{t.slug}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">{t.booking_count} bookings</Badge>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum tenant com bookings.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" /> Top 5 — Mais Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topByClients.length > 0 ? (
              <div className="space-y-2">
                {topByClients.map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => onSelectTenant?.(t)}
                    className="w-full flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                      <div>
                        <span className="text-sm font-medium">{t.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{t.slug}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">{t.client_count} clientes</Badge>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum tenant com clientes.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attention */}
      {needsAttention.length > 0 && (
        <Card className="border-orange-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <AlertTriangle className="w-4 h-4" /> Tenants que precisam de atenção ({needsAttention.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {needsAttention.slice(0, 10).map((t) => {
                const issues: string[] = [];
                if (!t.owner_user_id) issues.push("Sem owner");
                if (t.staff_count === 0) issues.push("Sem staff");
                if (t.booking_count === 0) issues.push("Sem bookings");
                if (t.status !== "active") issues.push(t.status === "suspended" ? "Suspenso" : "Inativo");

                return (
                  <button
                    key={t.id}
                    onClick={() => onSelectTenant?.(t)}
                    className="w-full flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t.name}</span>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {issues.map((issue) => (
                        <Badge key={issue} variant="outline" className="text-xs text-orange-600 dark:text-orange-400 border-orange-500/30">
                          {issue}
                        </Badge>
                      ))}
                    </div>
                  </button>
                );
              })}
              {needsAttention.length > 10 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{needsAttention.length - 10} tenants com pendências
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
