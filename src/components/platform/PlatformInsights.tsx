import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2, TrendingUp, DollarSign, Users, Crown,
  BarChart3, Activity, Search, Eye, Check, X, Clock,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import {
  PlanInsights, PlanInsightData, PlatformPlan, PlanFeature,
  fetchPlanInsights, fetchPlans, fetchAllPlanFeatures,
} from "@/lib/plans";
import { PlatformTenant, fetchPlatformTenantList } from "@/lib/platform";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent-foreground))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--destructive))",
];

function KPICard({ label, value, icon, sub }: { label: string; value: string | number; icon: React.ReactNode; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className="text-muted-foreground shrink-0">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PlatformInsights() {
  const [insights, setInsights] = useState<PlanInsights | null>(null);
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [features, setFeatures] = useState<PlanFeature[]>([]);
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([fetchPlanInsights(), fetchPlans(), fetchAllPlanFeatures(), fetchPlatformTenantList()])
      .then(([i, p, f, t]) => {
        setInsights(i);
        setPlans(p);
        setFeatures(f);
        setTenants(t);
      })
      .catch(() => toast({ title: "Erro ao carregar insights", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const filteredTenants = useMemo(() => {
    let result = tenants;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q) || t.custom_domain?.toLowerCase().includes(q)
      );
    }
    if (planFilter !== "all") result = result.filter((t) => t.plan === planFilter);
    if (statusFilter !== "all") result = result.filter((t) => t.status === statusFilter);
    return result;
  }, [tenants, search, planFilter, statusFilter]);

  const timeSince = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days < 30) return `${days}d`;
    if (days < 365) return `${Math.floor(days / 30)}m`;
    return `${Math.floor(days / 365)}a ${Math.floor((days % 365) / 30)}m`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (!insights) return <p className="text-center text-muted-foreground py-8">Sem dados disponíveis.</p>;

  const planChartData = insights.plans?.map((p) => ({ name: p.name, value: p.tenant_count })) ?? [];
  const revenueChartData = insights.plans?.map((p) => ({
    name: p.name,
    mensal: p.monthly_revenue,
    anual: p.annual_revenue,
  })) ?? [];

  const totalPlanTenants = insights.plans?.reduce((acc, p) => acc + p.tenant_count, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" /> Valores e Insights
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <KPICard label="Total Tenants" value={insights.total_tenants} icon={<Building2 className="w-5 h-5" />} />
          <KPICard label="Ativos" value={insights.active_tenants} icon={<Building2 className="w-5 h-5 text-primary" />} />
          <KPICard label="Em Teste" value={insights.trial_tenants} icon={<Clock className="w-5 h-5" />} />
          <KPICard
            label="Suspensos / Inativos"
            value={`${insights.suspended_tenants} / ${insights.inactive_tenants}`}
            icon={<Users className="w-5 h-5" />}
          />
          <KPICard label="Receita Mensal Est." value={fmt(insights.total_monthly_revenue)} icon={<DollarSign className="w-5 h-5" />} />
          <KPICard label="Receita Anual Est." value={fmt(insights.total_annual_revenue)} icon={<DollarSign className="w-5 h-5" />} />
          <KPICard label="Ticket Médio" value={fmt(insights.avg_ticket)} icon={<TrendingUp className="w-5 h-5" />} />
          <KPICard label="Novos (30d)" value={insights.tenants_created_30d} icon={<TrendingUp className="w-5 h-5" />} />
        </div>
      </div>

      {/* Plan distribution and comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Distribuição por Plano
            </CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            {planChartData.length > 0 && totalPlanTenants > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {planChartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                   <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "hsl(var(--card-foreground))",
                    }}
                    itemStyle={{ color: "hsl(var(--card-foreground))" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center pt-20">Nenhum tenant vinculado a planos ainda.</p>
            )}
          </CardContent>
        </Card>

        {/* Revenue comparison bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Receita Estimada por Plano
            </CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip
                    formatter={(v: number) => fmt(v)}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="mensal" name="Mensal" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="anual" name="Anual" fill="hsl(var(--accent-foreground))" opacity={0.6} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center pt-20">Sem dados de receita.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Plan detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.plans?.map((planData, i) => {
          const planFeatures = features.filter((f) => f.plan_id === planData.id);
          const pct = totalPlanTenants > 0 ? ((planData.tenant_count / totalPlanTenants) * 100).toFixed(0) : "0";

          return (
            <Card key={planData.id} className={planData.is_highlighted ? "border-primary/50" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base">{planData.name}</CardTitle>
                  {planData.is_highlighted && <Badge className="text-xs">Destaque</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Tenants</p>
                    <p className="text-lg font-bold">{planData.tenant_count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">% da Base</p>
                    <p className="text-lg font-bold">{pct}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Receita Mensal</p>
                    <p className="text-sm font-semibold">{fmt(planData.monthly_revenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Receita Anual</p>
                    <p className="text-sm font-semibold">{fmt(planData.annual_revenue)}</p>
                  </div>
                </div>
                {planFeatures.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Recursos</p>
                    <div className="flex flex-wrap gap-1">
                      {planFeatures.filter((f) => f.included).map((f) => (
                        <Badge key={f.id} variant="outline" className="text-xs gap-1">
                          <Check className="w-2.5 h-2.5" /> {f.feature_label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tenant Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Tenants Detalhado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar tenant..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Plano" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {plans.map((p) => <SelectItem key={p.id} value={p.slug}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">{filteredTenants.length} tenant(s)</p>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Criado</TableHead>
                  <TableHead className="hidden md:table-cell">Tempo Ativo</TableHead>
                  <TableHead className="hidden lg:table-cell">Domínio</TableHead>
                  <TableHead className="hidden lg:table-cell">Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{t.plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={t.status === "active" ? "default" : t.status === "suspended" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {t.status === "active" ? "Ativo" : t.status === "suspended" ? "Suspenso" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {timeSince(t.created_at)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {t.custom_domain || "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground font-mono">
                      {t.owner_user_id ? t.owner_user_id.slice(0, 8) + "…" : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTenants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhum tenant encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
