import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, MapPin, Globe, Clock, Users, Scissors, ArrowLeft, Star } from "lucide-react";

interface TenantPublic {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  custom_domain: string | null;
}

interface ProfessionalPublic {
  id: string;
  name: string;
  photo_url: string | null;
  subtitle: string | null;
  bio: string | null;
}

interface ServicePublic {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
}

interface WorkSettingsPublic {
  site_name: string | null;
  site_subtitle: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_background_url: string | null;
  logo_url: string | null;
  start_time: string;
  end_time: string;
  working_days: number[];
}

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function TenantPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [tenant, setTenant] = useState<TenantPublic | null>(null);
  const [settings, setSettings] = useState<WorkSettingsPublic | null>(null);
  const [professionals, setProfessionals] = useState<ProfessionalPublic[]>([]);
  const [services, setServices] = useState<ServicePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      console.log("[TenantPublic] No slug provided");
      setNotFound(true); setLoading(false); return;
    }

    async function load() {
      setLoading(true);
      setNotFound(false);
      console.log("[TenantPublic] Slug capturado:", slug);

      const { data: t, error } = await supabase
        .from("tenants")
        .select("id, name, slug, logo_url, custom_domain")
        .eq("slug", slug)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      console.log("[TenantPublic] Resultado da busca:", { data: t, error });

      if (error) {
        console.error("[TenantPublic] Erro na consulta:", error);
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (!t) {
        console.warn("[TenantPublic] Tenant não encontrado para slug:", slug);
        setNotFound(true);
        setLoading(false);
        return;
      }

      console.log("[TenantPublic] Tenant encontrado:", t.name, "| ID:", t.id);
      setTenant(t);

      const [settingsRes, profsRes, servicesRes] = await Promise.all([
        supabase
          .from("work_settings")
          .select("site_name, site_subtitle, hero_title, hero_subtitle, hero_background_url, logo_url, start_time, end_time, working_days")
          .eq("tenant_id", t.id)
          .limit(1)
          .maybeSingle(),
        supabase
          .from("professionals")
          .select("id, name, photo_url, subtitle, bio")
          .eq("tenant_id", t.id)
          .eq("active", true)
          .order("name"),
        supabase
          .from("services")
          .select("id, name, description, price, duration_minutes")
          .eq("tenant_id", t.id)
          .eq("active", true)
          .order("name"),
      ]);

      console.log("[TenantPublic] Settings:", settingsRes.data, "| Error:", settingsRes.error);
      console.log("[TenantPublic] Professionals:", profsRes.data?.length, "| Error:", profsRes.error);
      console.log("[TenantPublic] Services:", servicesRes.data?.length, "| Error:", servicesRes.error);

      if (settingsRes.data) setSettings(settingsRes.data as WorkSettingsPublic);
      if (profsRes.data) setProfessionals(profsRes.data);
      if (servicesRes.data) setServices(servicesRes.data);
      setLoading(false);
    }

    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 max-w-4xl mx-auto space-y-6 relative z-10">
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !tenant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 relative z-10">
        <Card className="max-w-md w-full text-center shadow-lg">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Estabelecimento não encontrado</h1>
            <p className="text-sm text-muted-foreground">
              O endereço <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">/tenant/{slug}</span> não corresponde a nenhum estabelecimento ativo.
            </p>
            <Button variant="outline" asChild className="mt-2">
              <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" />Voltar ao início</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = settings?.site_name || tenant.name;
  const subtitle = settings?.hero_subtitle || settings?.site_subtitle || null;
  const logoUrl = settings?.logo_url || tenant.logo_url;
  const heroUrl = settings?.hero_background_url;
  const workingDayLabels = (settings?.working_days || []).map((d) => DAY_LABELS[d]).join(", ");
  const schedule = settings ? `${settings.start_time.slice(0, 5)} – ${settings.end_time.slice(0, 5)}` : null;

  return (
    <div className="min-h-screen bg-background relative z-10">
      {/* Hero */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: 220 }}>
        {heroUrl ? (
          <img src={heroUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex flex-col items-center justify-center py-12 px-4 text-center gap-3" style={{ minHeight: 220 }}>
          {logoUrl && (
            <img src={logoUrl} alt={displayName} className="w-20 h-20 rounded-full object-cover border-2 border-white/30 shadow-lg" />
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md">{displayName}</h1>
          {subtitle && <p className="text-sm sm:text-base text-white/80 max-w-md">{subtitle}</p>}
          {tenant.custom_domain && (
            <div className="flex items-center gap-1.5 text-white/60 text-xs">
              <Globe className="w-3.5 h-3.5" />
              {tenant.custom_domain}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Quick Info */}
        <div className="flex flex-wrap gap-3 justify-center">
          {schedule && (
            <Badge variant="secondary" className="gap-1.5 text-xs px-3 py-1.5">
              <Clock className="w-3.5 h-3.5" />{schedule}
            </Badge>
          )}
          {workingDayLabels && (
            <Badge variant="secondary" className="gap-1.5 text-xs px-3 py-1.5">
              <Star className="w-3.5 h-3.5" />{workingDayLabels}
            </Badge>
          )}
          <Badge variant="secondary" className="gap-1.5 text-xs px-3 py-1.5">
            <Users className="w-3.5 h-3.5" />{professionals.length} profissional(is)
          </Badge>
          <Badge variant="secondary" className="gap-1.5 text-xs px-3 py-1.5">
            <Scissors className="w-3.5 h-3.5" />{services.length} serviço(s)
          </Badge>
        </div>

        {/* Professionals */}
        {professionals.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Profissionais</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {professionals.map((p) => (
                <Card key={p.id} className="overflow-hidden">
                  <CardContent className="flex items-center gap-4 p-4">
                    {p.photo_url ? (
                      <img src={p.photo_url} alt={p.name} className="w-14 h-14 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center shrink-0 text-lg font-semibold text-muted-foreground">
                        {p.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{p.name}</p>
                      {p.subtitle && <p className="text-xs text-muted-foreground truncate">{p.subtitle}</p>}
                      {p.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.bio}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Services */}
        {services.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Serviços</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map((s) => (
                <Card key={s.id}>
                  <CardContent className="p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm text-foreground">{s.name}</p>
                      <span className="text-sm font-semibold text-primary whitespace-nowrap">
                        R$ {Number(s.price).toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                    {s.description && <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>}
                    <p className="text-xs text-muted-foreground">{s.duration_minutes} min</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Back */}
        <div className="text-center pt-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-1" />Página inicial</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
