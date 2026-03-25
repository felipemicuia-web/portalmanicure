import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLandingContent } from "@/hooks/useLandingContent";
import { LandingContent, LandingCard as LandingCardType } from "@/types/landing";
import {
  Calendar, Users, Scissors, Clock, Shield, Smartphone,
  BarChart3, Globe, Star, ChevronRight, Menu, X, Zap,
  Check, ArrowRight, Sparkles, Heart, Award,
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

/* ─── Header ─── */
function LandingHeader({ content }: { content: LandingContent }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { isSuperAdmin } = useSuperAdmin(user);
  const h = content.header;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, []);

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
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">{h.loginButtonText}</Link>
            </Button>
            <Button size="sm" className="gap-1.5" asChild>
              <Link to="/auth">
                {h.ctaButtonText} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </nav>

        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border/50 px-4 pb-4 space-y-1">
          {h.menuItems.map((i) => (
            <button
              key={i.href}
              onClick={() => { scrollToSection(i.href); setOpen(false); }}
              className="block w-full text-left px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/40"
            >
              {i.label}
            </button>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/auth">{h.loginButtonText}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/auth">{h.ctaButtonText}</Link>
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
  return (
    <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[300px] h-[300px] bg-secondary/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-8">
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
          <Button size="lg" className="gap-2 text-base px-8" asChild>
            <Link to="/auth">
              {hero.ctaText} <ArrowRight className="w-4 h-4" />
            </Link>
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
      </div>
    </section>
  );
}

/* ─── Benefícios ─── */
function BenefitsSection({ content }: { content: LandingContent }) {
  const b = content.benefits;
  if (!b.enabled) return null;

  return (
    <section id="beneficios" className="py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
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
      </div>
    </section>
  );
}

/* ─── Funções ─── */
function FeaturesSection({ content }: { content: LandingContent }) {
  const f = content.features;
  if (!f.enabled) return null;

  return (
    <section id="funcoes" className="py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="text-xs px-3 py-1">{f.badgeText}</Badge>
          <h2 className="text-2xl sm:text-4xl font-bold text-foreground">{f.title}</h2>
          <p className="text-muted-foreground text-sm sm:text-base">{f.subtitle}</p>
        </div>

        {f.imageUrl && (
          <div className="flex justify-center">
            <img
              src={f.imageUrl}
              alt={f.title}
              className="w-full max-w-4xl rounded-2xl shadow-2xl shadow-primary/10 border border-border/30"
            />
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Preços ─── */
function PricingSection({ content }: { content: LandingContent }) {
  const pr = content.pricing;
  if (!pr.enabled) return null;

  return (
    <section id="precos" className="py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
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
                <Button className="w-full gap-1.5" variant={p.highlighted ? "default" : "outline"} asChild>
                  <Link to="/auth">
                    {p.ctaText} <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Demonstração ─── */
function DemoSection({ content }: { content: LandingContent }) {
  const d = content.demo;
  if (!d.enabled) return null;

  return (
    <section id="demonstracao" className="py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
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
      </div>
    </section>
  );
}

/* ─── CTA Final ─── */
function CTASection({ content }: { content: LandingContent }) {
  const c = content.cta;
  if (!c.enabled) return null;

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/20 to-secondary/15" />
          <div className="absolute inset-0 bg-card/60 backdrop-blur-sm" />
          <div className="relative z-10 text-center py-16 px-6 sm:px-12 space-y-6">
            <h2 className="text-2xl sm:text-4xl font-bold text-foreground">{c.title}</h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">{c.description}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="gap-2 text-base px-8" asChild>
                <Link to="/auth">
                  {c.ctaText} <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
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

/* ─── Page ─── */
export default function LandingPage() {
  const { content, loading } = useLandingContent();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <div className="galaxy-bg" />
      <div className="relative z-10">
        <LandingHeader content={content} />
        <HeroSection content={content} />
        <BenefitsSection content={content} />
        <FeaturesSection content={content} />
        <PricingSection content={content} />
        <DemoSection content={content} />
        <CTASection content={content} />
        <LandingFooter content={content} />
      </div>
    </div>
  );
}
