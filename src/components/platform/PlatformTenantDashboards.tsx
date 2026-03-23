import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ExternalLink, Building2, BarChart3 } from "lucide-react";

interface TenantItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  logo_url: string | null;
}

export function PlatformTenantDashboards() {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name, slug, status, plan, logo_url")
        .order("name");
      if (error) {
        toast({ title: "Erro ao carregar tenants", variant: "destructive" });
      } else {
        setTenants(data || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return tenants;
    const q = search.toLowerCase();
    return tenants.filter(
      (t) => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q)
    );
  }, [tenants, search]);

  const handleOpenDashboard = (slug: string) => {
    navigate(`/tenant/${slug}/admin`);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar tenant por nome ou slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} tenant(s)
      </p>

      <div className="space-y-2">
        {filtered.map((t) => (
          <Card key={t.id} className="hover:bg-accent/30 transition-colors">
            <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {t.logo_url ? (
                  <img
                    src={t.logo_url}
                    alt={t.name}
                    className="w-9 h-9 rounded-md object-cover shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{t.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{t.slug}</span>
                    <Badge
                      variant={t.status === "active" ? "default" : t.status === "suspended" ? "destructive" : "secondary"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {t.status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {t.plan}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 shrink-0"
                onClick={() => handleOpenDashboard(t.slug)}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
                <ExternalLink className="w-3 h-3" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8 text-sm">
            Nenhum tenant encontrado.
          </p>
        )}
      </div>
    </div>
  );
}
