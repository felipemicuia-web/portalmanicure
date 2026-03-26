import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLandingContent } from "@/hooks/useLandingContent";
import { LandingContent, LandingCard as LandingCardType, SectionDisplayMode } from "@/types/landing";
import { getPresetById } from "@/contexts/ThemeContext";
import {
  Calendar, Users, Scissors, Clock, Shield, Smartphone,
  BarChart3, Globe, Star, ChevronRight, Menu, X, Zap,
  Check, ArrowRight, Sparkles, Heart, Award, Loader2, Send,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Calendar, Users, Scissors, Clock, Shield, Smartphone,
  BarChart3, Globe, Star, Zap, Sparkles, Heart, Award,
};

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] || Star;
}

function scrollToSection(id: string) {
  const el = document.querySelector(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function SectionImage({ url, alt }: { url: string; alt: string }) {
  return (
    <div className="flex justify-center">
      <img
        src={url}
        alt={alt}
        className="w-full max-w-4xl rounded-2xl shadow-2xl shadow-primary/10 border border-border/30"
      />
    </div>
  );
}

/* ─── Header ─── */
function LandingHeader({ content }: { content: LandingContent }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const { isSuperAdmin, loading: superAdminLoading } = useSuperAdmin(user);
  const showConsole = !superAdminLoading && isSuperAdmin;
  const h = content.header;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
        <span className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          {h.brandName}
        </span>

        <nav className="hidden md:flex items-center gap-1">
          {h.menuItems.map((i) => (
            <button
              key={i.href}
              onClick={() => scrollToSection(i.href)}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/40"
            >
              {i.label}
            </button>
          ))}
          <div className="ml-4 flex items-center gap-2">
            {showConsole && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/platform">Console</Link>
              </Button>
            )}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground px-2 py-1.5">
                  Olá, <span className="font-semibold text-foreground">{user.user_metadata?.name || user.email?.split("@")[0]}</span>
                </span>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  Sair
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">{h.loginButtonText}</Link>
              </Button>
            )}
            <Button size="sm" className="gap-1.5" onClick={() => scrollToSection("#teste-gratis")}>
              {h.ctaButtonText} <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </nav>

        {/* Mobile: hamburger only for login/console/cta */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile: menu items always visible as horizontal scroll */}
      <div className="md:hidden overflow-x-auto scrollbar-hide border-b border-border/30">
        <div className="flex items-center gap-1 px-4 py-1.5 min-w-max">
          {h.menuItems.map((i) => (
            <button
              key={i.href}
              onClick={() => scrollToSection(i.href)}
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/40 whitespace-nowrap"
            >
              {i.label}
            </button>
          ))}
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border/50 px-4 pb-4 space-y-1">
          <div className="pt-2 flex flex-col gap-2">
            {showConsole && (
              <Button variant="secondary" size="sm" asChild>
                <Link to="/platform">Console da Plataforma</Link>
              </Button>
            )}
            {user ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground px-2 py-1">
                  Olá, <span className="font-semibold text-foreground">{user.user_metadata?.name || user.email?.split("@")[0]}</span>
                </p>
                <Button variant="outline" size="sm" onClick={() => { signOut(); setOpen(false); }}>
                  Sair da conta
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link to="/auth">{h.loginButtonText}</Link>
              </Button>
            )}
            <Button size="sm" onClick={() => { scrollToSection("#teste-gratis"); setOpen(false); }}>
              {h.ctaButtonText}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

/* ─── Hero ─── */
function HeroSection({ content }: { content: LandingContent }) {
  const hero = content.hero;
  const mode: SectionDisplayMode = hero.displayMode || "text";
  const hasImage = !!hero.imageUrl;
  const showText = mode === "text" || mode === "both";
  const showImage = (mode === "image" || mode === "both") && hasImage;

  return (
    <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[300px] h-[300px] bg-secondary/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-8">
        {showText && (
          <>
            <Badge variant="secondary" className="gap-1.5 text-xs px-4 py-1.5 mx-auto">
              <Zap className="w-3.5 h-3.5" />
              {hero.badgeText}
            </Badge>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight max-w-4xl mx-auto">
              {hero.title}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                {hero.highlight}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {hero.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="gap-2 text-base px-8" onClick={() => scrollToSection("#teste-gratis")}>
                {hero.ctaText} <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2 text-base px-8" onClick={() => scrollToSection("#demonstracao")}>
                {hero.secondaryCtaText}
              </Button>
            </div>

            <div className="flex flex-wrap gap-6 sm:gap-10 justify-center pt-6 text-sm text-muted-foreground">
              {hero.stats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {showImage && <SectionImage url={hero.imageUrl!} alt="Hero" />}
      </div>
    </section>
  );
}

/* ─── Benefícios ─── */
function BenefitsSection({ content }: { content: LandingContent }) {
  const b = content.benefits;
  if (!b.enabled) return null;
  const mode: SectionDisplayMode = b.displayMode || "text";
  const hasImage = !!b.imageUrl;
  const showText = mode === "text" || mode === "both";
  const showImage = (mode === "image" || mode === "both") && hasImage;

  return (
    <section id="beneficios" className="py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        {showText && (
          <>
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <Badge variant="outline" className="text-xs px-3 py-1">{b.badgeText}</Badge>
              <h2 className="text-2xl sm:text-4xl font-bold text-foreground">{b.title}</h2>
              <p className="text-muted-foreground text-sm sm:text-base">{b.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {b.cards.map((card) => {
                const Icon = getIcon(card.icon);
                return (
                  <Card key={card.title} className="group hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                    <CardContent className="p-6 space-y-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">{card.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {showImage && <SectionImage url={b.imageUrl!} alt={b.title} />}
      </div>
    </section>
  );
}

/* ─── Funções ─── */
function FeaturesSection({ content }: { content: LandingContent }) {
  const f = content.features;
  if (!f.enabled) return null;
  const mode: SectionDisplayMode = f.displayMode || "text";
  const hasImage = !!f.imageUrl;
  const showText = mode === "text" || mode === "both";
  const showImage = (mode === "image" || mode === "both") && hasImage;

  return (
    <section id="funcoes" className="py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        {showText && (
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="outline" className="text-xs px-3 py-1">{f.badgeText}</Badge>
            <h2 className="text-2xl sm:text-4xl font-bold text-foreground">{f.title}</h2>
            <p className="text-muted-foreground text-sm sm:text-base">{f.subtitle}</p>
          </div>
        )}

        {showImage && <SectionImage url={f.imageUrl!} alt={f.title} />}
      </div>
    </section>
  );
}

/* ─── Preços ─── */
function PricingSection({ content }: { content: LandingContent }) {
  const pr = content.pricing;
  if (!pr.enabled) return null;
  const mode: SectionDisplayMode = pr.displayMode || "text";
  const hasImage = !!pr.imageUrl;
  const showText = mode === "text" || mode === "both";
  const showImage = (mode === "image" || mode === "both") && hasImage;

  return (
    <section id="precos" className="py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        {showText && (
          <>
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <Badge variant="outline" className="text-xs px-3 py-1">{pr.badgeText}</Badge>
              <h2 className="text-2xl sm:text-4xl font-bold text-foreground">{pr.title}</h2>
              <p className="text-muted-foreground text-sm sm:text-base">{pr.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pr.plans.map((p) => (
                <Card
                  key={p.name}
                  className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                    p.highlighted
                      ? "border-primary shadow-lg shadow-primary/10 scale-[1.02]"
                      : "hover:border-primary/30"
                  }`}
                >
                  {p.highlighted && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-secondary" />
                  )}
                  <CardContent className="p-6 space-y-5">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">{p.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-foreground">{p.price}</span>
                      <span className="text-sm text-muted-foreground">{p.period}</span>
                    </div>
                    <ul className="space-y-2.5">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-primary shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full gap-1.5" onClick={() => scrollToSection("#teste-gratis")}>
                      {p.ctaText} <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {showImage && <SectionImage url={pr.imageUrl!} alt={pr.title} />}
      </div>
    </section>
  );
}

/* ─── Demonstração ─── */
function DemoSection({ content }: { content: LandingContent }) {
  const d = content.demo;
  if (!d.enabled) return null;
  const mode: SectionDisplayMode = d.displayMode || "text";
  const hasImage = !!d.imageUrl;
  const showText = mode === "text" || mode === "both";
  const showImage = (mode === "image" || mode === "both") && hasImage;

  return (
    <section id="demonstracao" className="py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        {showText && (
          <>
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <Badge variant="outline" className="text-xs px-3 py-1">{d.badgeText}</Badge>
              <h2 className="text-2xl sm:text-4xl font-bold text-foreground">{d.title}</h2>
              <p className="text-muted-foreground text-sm sm:text-base">{d.subtitle}</p>
            </div>

            <div className="relative max-w-4xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-2xl blur-2xl -z-10" />
              <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden p-6 sm:p-10 text-center space-y-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto">
                  <Calendar className="w-10 h-10 text-primary-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground">Experimente agora</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">{d.description}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button size="lg" className="gap-2" asChild>
                    <Link to={d.demoUrl}>
                      {d.ctaText} <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {showImage && <SectionImage url={d.imageUrl!} alt={d.title} />}
      </div>
    </section>
  );
}

/* ─── CTA Final ─── */
function CTASection({ content }: { content: LandingContent }) {
  const c = content.cta;
  if (!c.enabled) return null;
  const mode: SectionDisplayMode = c.displayMode || "text";
  const hasImage = !!c.imageUrl;
  const showText = mode === "text" || mode === "both";
  const showImage = (mode === "image" || mode === "both") && hasImage;

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {showText && (
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/20 to-secondary/15" />
            <div className="absolute inset-0 bg-card/60 backdrop-blur-sm" />
            <div className="relative z-10 text-center py-16 px-6 sm:px-12 space-y-6">
              <h2 className="text-2xl sm:text-4xl font-bold text-foreground">{c.title}</h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">{c.description}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" className="gap-2 text-base px-8" onClick={() => scrollToSection("#teste-gratis")}>
                  {c.ctaText} <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {showImage && (
          <div className={showText ? "mt-12" : ""}>
            <SectionImage url={c.imageUrl!} alt={c.title} />
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Formulário Teste Grátis ─── */
const BRAZILIAN_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

function TrialFormSection() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    company_name: "",
    full_name: "",
    city: "",
    state: "",
    whatsapp: "",
  });

  const isValid = form.company_name.trim().length >= 2
    && form.full_name.trim().length >= 2
    && form.city.trim().length >= 2
    && form.state.length > 0
    && form.whatsapp.replace(/\D/g, "").length >= 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);

    const { error } = await supabase.from("trial_leads" as any).insert({
      company_name: form.company_name.trim(),
      full_name: form.full_name.trim(),
      city: form.city.trim(),
      state: form.state,
      whatsapp: form.whatsapp.replace(/\D/g, ""),
    });

    setSubmitting(false);
    if (error) {
      toast({ title: "Erro ao enviar", description: "Tente novamente em instantes.", variant: "destructive" });
    } else {
      setSubmitted(true);
      toast({ title: "Solicitação enviada!", description: "Entraremos em contato em breve." });
    }
  };

  if (submitted) {
    return (
      <section id="teste-gratis" className="py-20 sm:py-28 scroll-mt-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Recebemos sua solicitação!</h2>
          <p className="text-muted-foreground">Nossa equipe entrará em contato pelo WhatsApp informado para liberar seu acesso ao teste gratuito.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="teste-gratis" className="py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/10" />
          <div className="absolute inset-0 bg-card/70 backdrop-blur-sm" />

          <div className="relative z-10 py-12 px-6 sm:px-12 space-y-8">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <Badge variant="outline" className="text-xs px-3 py-1">Teste Grátis</Badge>
              <h2 className="text-2xl sm:text-4xl font-bold text-foreground">
                Comece seu teste gratuito agora
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                Preencha os dados abaixo e nossa equipe liberará seu acesso em até 24 horas.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-5">
              <div className="space-y-2">
                <Label htmlFor="company_name">Nome da empresa</Label>
                <Input
                  id="company_name"
                  placeholder="Ex: Studio Maria"
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Nome completo</Label>
                <Input
                  id="full_name"
                  placeholder="Seu nome completo"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  maxLength={100}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    placeholder="Sua cidade"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    maxLength={100}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <select
                    id="state"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Selecione</option>
                    {BRAZILIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  placeholder="(11) 99999-9999"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  maxLength={15}
                  required
                />
              </div>

              <Button type="submit" size="lg" className="w-full gap-2 text-base" disabled={!isValid || submitting}>
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                ) : (
                  <><Send className="w-4 h-4" /> Solicitar teste grátis</>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function LandingFooter({ content }: { content: LandingContent }) {
  const ft = content.footer;
  const h = content.header;
  return (
    <footer className="border-t border-border/50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-2 font-semibold text-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            {ft.brandName}
          </span>
          <div className="flex gap-6">
            {h.menuItems.map((i) => (
              <button
                key={i.href}
                onClick={() => scrollToSection(i.href)}
                className="hover:text-foreground transition-colors"
              >
                {i.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {ft.brandName}. {ft.copyrightText}
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─── Apply landing theme to DOM ─── */
function useLandingTheme(themeId: string) {
  useEffect(() => {
    const preset = getPresetById(themeId);
    const root = document.documentElement;
    root.style.setProperty("--primary", preset.colors.primary);
    root.style.setProperty("--secondary", preset.colors.secondary);
    root.style.setProperty("--accent", preset.colors.accent);
    root.style.setProperty("--background", preset.colors.background);
    root.style.setProperty("--card", preset.colors.card);
    root.style.setProperty("--muted", preset.colors.muted);
    root.style.setProperty("--border", preset.colors.border);
    root.style.setProperty("--ring", preset.colors.primary);

    return () => {
      const props = ["--primary", "--secondary", "--accent", "--background", "--card", "--muted", "--border", "--ring"];
      props.forEach((p) => root.style.removeProperty(p));
    };
  }, [themeId]);
}

/* ─── Standalone themed background for landing (no ThemeContext needed) ─── */
function LandingThemedBackground({ themeId }: { themeId: string }) {
  const particles = useMemo(() => {
    const THEME_BG: Record<string, { type: string; count: number }> = {
      galaxy: { type: "stars", count: 50 },
      rosa: { type: "petals", count: 20 },
      oceano: { type: "bubbles", count: 30 },
      floresta: { type: "leaves", count: 25 },
      pordosol: { type: "rays", count: 15 },
      meianoite: { type: "snow", count: 40 },
      lavanda: { type: "butterflies", count: 12 },
    };
    const config = THEME_BG[themeId] || THEME_BG.galaxy;
    const els: JSX.Element[] = [];
    for (let i = 0; i < config.count; i++) {
      const delay = Math.random() * 10;
      const size = 4 + Math.random() * 12;
      const left = Math.random() * 100;
      const duration = 8 + Math.random() * 12;
      const style: React.CSSProperties = { left: `${left}%`, animationDelay: `${delay}s`, animationDuration: `${duration}s` };
      switch (config.type) {
        case "stars":
          els.push(<div key={i} className="bg-star" style={{ ...style, top: `${Math.random() * 100}%`, width: size, height: size }} />);
          break;
        case "bubbles":
          els.push(<div key={i} className="bg-bubble" style={{ ...style, width: size * 1.5, height: size * 1.5 }} />);
          break;
        case "petals":
          els.push(<div key={i} className="bg-petal" style={{ ...style, width: size, height: size * 1.5 }} />);
          break;
        case "leaves":
          els.push(<div key={i} className="bg-leaf" style={{ ...style, width: size * 1.2, height: size * 1.2 }} />);
          break;
        case "rays":
          els.push(<div key={i} className="bg-ray" style={style} />);
          break;
        case "snow":
          els.push(<div key={i} className="bg-snowflake" style={{ ...style, width: size * 0.8, height: size * 0.8 }} />);
          break;
        case "butterflies":
          els.push(<div key={i} className="bg-butterfly" style={{ ...style, top: `${Math.random() * 80}%`, width: size * 1.5, height: size * 0.9 }} />);
          break;
      }
    }
    return els;
  }, [themeId]);

  return <div className="themed-bg-container">{particles}</div>;
}

/* ─── Page ─── */
export default function LandingPage() {
  const { content, loading } = useLandingContent();
  const themeId = content.themeId || "galaxy";
  useLandingTheme(themeId);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <LandingThemedBackground themeId={themeId} />
      <div className="relative z-10">
        <LandingHeader content={content} />
        <HeroSection content={content} />
        <BenefitsSection content={content} />
        <FeaturesSection content={content} />
        <PricingSection content={content} />
        <DemoSection content={content} />
        <CTASection content={content} />
        <TrialFormSection />
        <LandingFooter content={content} />
      </div>
    </div>
  );
}
