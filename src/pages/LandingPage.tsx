import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLandingContent } from "@/hooks/useLandingContent";
import { LandingContent, SectionDisplayMode } from "@/types/landing";
import { getPresetById } from "@/contexts/ThemeContext";
import {
  Calendar, Users, Scissors, Clock, Shield, Smartphone,
  BarChart3, Globe, Star, ChevronRight, Menu, X, Zap,
  Check, ArrowRight, Sparkles, Heart, Award, Loader2, Send,
  Play, TrendingUp, type LucideIcon,
} from "lucide-react";

/* ─── Icon map ─── */
const ICON_MAP: Record<string, LucideIcon> = {
  Calendar, Users, Scissors, Clock, Shield, Smartphone,
  BarChart3, Globe, Star, Zap, Sparkles, Heart, Award, TrendingUp,
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
        className="w-full max-w-4xl rounded-2xl border border-emerald-500/10 shadow-2xl shadow-emerald-500/5"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HEADER — Premium dark navbar
   ═══════════════════════════════════════════════════════════ */
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
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#0a0f0a]/90 backdrop-blur-2xl border-b border-emerald-500/10 shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-8 h-[72px]">
        {/* Brand */}
        <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <Calendar className="w-4.5 h-4.5 text-white" />
          </div>
          {h.brandName}
        </span>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {h.menuItems.map((i) => (
            <button
              key={i.href}
              onClick={() => scrollToSection(i.href)}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/5"
            >
              {i.label}
            </button>
          ))}
          <div className="ml-6 flex items-center gap-3">
            {showConsole && (
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-white/5" asChild>
                <Link to="/platform">Console</Link>
              </Button>
            )}
            {user ? (
              <span className="text-sm text-zinc-400 px-3 py-1.5">
                Olá, <span className="font-semibold text-white">{user.user_metadata?.name || user.email?.split("@")[0]}</span>
              </span>
            ) : (
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-white/5" asChild>
                <Link to="/auth">{h.loginButtonText}</Link>
              </Button>
            )}
            <button
              onClick={() => scrollToSection("#teste-gratis")}
              className="h-9 px-5 text-sm font-semibold rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
            >
              {h.ctaButtonText}
            </button>
          </div>
        </nav>

        {/* Mobile hamburger */}
        <button className="md:hidden text-zinc-300 p-2 hover:bg-white/5 rounded-lg transition-colors" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu items — horizontal scroll */}
      <div className="md:hidden overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1 px-4 py-2 min-w-max">
          {h.menuItems.map((i) => (
            <button
              key={i.href}
              onClick={() => scrollToSection(i.href)}
              className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/5 whitespace-nowrap"
            >
              {i.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden bg-[#0a0f0a]/98 backdrop-blur-2xl border-t border-emerald-500/10 px-5 pb-5 space-y-3">
          <div className="pt-3 flex flex-col gap-2.5">
            {showConsole && (
              <Button variant="outline" size="sm" className="border-emerald-500/20 text-zinc-300 hover:bg-emerald-500/10" asChild>
                <Link to="/platform">Console da Plataforma</Link>
              </Button>
            )}
            {user ? (
              <p className="text-sm text-zinc-400 px-1 py-1">
                Olá, <span className="font-semibold text-white">{user.user_metadata?.name || user.email?.split("@")[0]}</span>
              </p>
            ) : (
              <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:bg-white/5" asChild>
                <Link to="/auth">{h.loginButtonText}</Link>
              </Button>
            )}
            <button
              onClick={() => { scrollToSection("#teste-gratis"); setOpen(false); }}
              className="h-10 px-6 text-sm font-semibold rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25"
            >
              {h.ctaButtonText}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════
   HERO — High-impact first fold
   ═══════════════════════════════════════════════════════════ */
function HeroSection({ content }: { content: LandingContent }) {
  const hero = content.hero;
  const mode: SectionDisplayMode = hero.displayMode || "text";
  const hasImage = !!hero.imageUrl;
  const showText = mode === "text" || mode === "both";
  const showImage = (mode === "image" || mode === "both") && hasImage;

  return (
    <section className="relative pt-32 pb-20 sm:pt-44 sm:pb-32 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-emerald-500/8 rounded-full blur-[150px]" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-emerald-400/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-600/5 rounded-full blur-[100px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8">
        {showText && (
          <div className="text-center space-y-8 sm:space-y-10">
            {/* Badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {hero.badgeText}
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] max-w-5xl mx-auto">
              {hero.title}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500">
                {hero.highlight}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-light">
              {hero.description}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <button
                onClick={() => scrollToSection("#teste-gratis")}
                className="group h-14 px-10 text-base font-semibold rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 transition-all duration-300 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 flex items-center justify-center gap-2.5"
              >
                {hero.ctaText}
                <ArrowRight className="w-4.5 h-4.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => scrollToSection("#demonstracao")}
                className="h-14 px-10 text-base font-semibold rounded-full border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white hover:bg-white/5 transition-all duration-300 flex items-center justify-center gap-2.5"
              >
                <Play className="w-4 h-4" />
                {hero.secondaryCtaText}
              </button>
            </div>

            {/* Stats */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-8 sm:pt-12">
              {hero.stats.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm"
                >
                  <div className="text-left">
                    <p className="text-2xl sm:text-3xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 font-medium">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showImage && <div className="mt-12"><SectionImage url={hero.imageUrl!} alt="Hero" /></div>}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   BENEFITS — Premium cards grid
   ═══════════════════════════════════════════════════════════ */
function BenefitsSection({ content }: { content: LandingContent }) {
  const b = content.benefits;
  if (!b.enabled) return null;
  const mode: SectionDisplayMode = b.displayMode || "text";
  const hasImage = !!b.imageUrl;
  const showText = mode === "text" || mode === "both";
  const showImage = (mode === "image" || mode === "both") && hasImage;

  return (
    <section id="beneficios" className="py-24 sm:py-32 scroll-mt-20 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[150px]" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 space-y-16">
        {showText && (
          <>
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                {b.badgeText}
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">{b.title}</h2>
              <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto">{b.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {b.cards.map((card) => {
                const Icon = getIcon(card.icon);
                return (
                  <div
                    key={card.title}
                    className="group relative p-6 sm:p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/20 transition-all duration-500 hover:bg-white/[0.04]"
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10 space-y-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/15 transition-colors duration-300">
                        <Icon className="w-5 h-5 text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed">{card.description}</p>
                    </div>
                  </div>
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

/* ═══════════════════════════════════════════════════════════
   FEATURES — Functions section
   ═══════════════════════════════════════════════════════════ */
function FeaturesSection({ content }: { content: LandingContent }) {
  const f = content.features;
  if (!f.enabled) return null;
  const mode: SectionDisplayMode = f.displayMode || "text";
  const hasImage = !!f.imageUrl;
  const showText = mode === "text" || mode === "both";
  const showImage = (mode === "image" || mode === "both") && hasImage;

  return (
    <section id="funcoes" className="py-24 sm:py-32 scroll-mt-20 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px]" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 space-y-16">
        {showText && (
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              {f.badgeText}
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">{f.title}</h2>
            <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto">{f.subtitle}</p>
          </div>
        )}
        {showImage && <SectionImage url={f.imageUrl!} alt={f.title} />}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   PRICING — Premium plan cards
   ═══════════════════════════════════════════════════════════ */
function PricingSection({ content }: { content: LandingContent }) {
  const pr = content.pricing;
  if (!pr.enabled) return null;
  const mode: SectionDisplayMode = pr.displayMode || "text";
  const hasImage = !!pr.imageUrl;
  const showText = mode === "text" || mode === "both";
  const showImage = (mode === "image" || mode === "both") && hasImage;

  return (
    <section id="precos" className="py-24 sm:py-32 scroll-mt-20 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/5 rounded-full blur-[150px]" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 space-y-16">
        {showText && (
          <>
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                {pr.badgeText}
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">{pr.title}</h2>
              <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto">{pr.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              {pr.plans.map((p) => (
                <div
                  key={p.name}
                  className={`relative group rounded-2xl transition-all duration-500 ${
                    p.highlighted
                      ? "bg-gradient-to-b from-emerald-500/10 to-transparent border-emerald-500/30 border-2 shadow-xl shadow-emerald-500/10 scale-[1.02]"
                      : "bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/15"
                  }`}
                >
                  {p.highlighted && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30">
                        Mais popular
                      </span>
                    </div>
                  )}
                  <div className="p-7 sm:p-8 space-y-6">
                    <div>
                      <h3 className="font-bold text-white text-xl">{p.name}</h3>
                      <p className="text-sm text-zinc-500 mt-1">{p.description}</p>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-extrabold text-white">{p.price}</span>
                      <span className="text-sm text-zinc-500">{p.period}</span>
                    </div>
                    <div className="h-px bg-white/[0.06]" />
                    <ul className="space-y-3">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-sm text-zinc-400">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-emerald-400" />
                          </div>
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => scrollToSection("#teste-gratis")}
                      className={`w-full h-12 text-sm font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                        p.highlighted
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                          : "bg-white/[0.05] border border-white/[0.1] text-zinc-300 hover:bg-white/[0.08] hover:border-emerald-500/20 hover:text-white"
                      }`}
                    >
                      {p.ctaText} <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {showImage && <SectionImage url={pr.imageUrl!} alt={pr.title} />}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   DEMO — Product demonstration
   ═══════════════════════════════════════════════════════════ */
function DemoSection({ content }: { content: LandingContent }) {
  const d = content.demo;
  if (!d.enabled) return null;
  const mode: SectionDisplayMode = d.displayMode || "text";
  const hasImage = !!d.imageUrl;
  const showText = mode === "text" || mode === "both";
  const showImage = (mode === "image" || mode === "both") && hasImage;

  return (
    <section id="demonstracao" className="py-24 sm:py-32 scroll-mt-20 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-emerald-500/5 rounded-full blur-[150px]" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 space-y-16">
        {showText && (
          <>
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                {d.badgeText}
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">{d.title}</h2>
              <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto">{d.subtitle}</p>
            </div>

            <div className="relative max-w-4xl mx-auto">
              <div className="absolute -inset-1 bg-gradient-to-br from-emerald-500/20 via-emerald-500/5 to-transparent rounded-3xl blur-xl" />
              <div className="relative rounded-2xl border border-white/[0.08] bg-[#0d1210]/80 backdrop-blur-xl overflow-hidden p-8 sm:p-12 text-center space-y-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                  <Calendar className="w-10 h-10 text-white" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-white">Experimente agora</h3>
                  <p className="text-zinc-400 max-w-md mx-auto">{d.description}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="gap-2 h-12 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                    asChild
                  >
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

/* ═══════════════════════════════════════════════════════════
   CTA FINAL — Conversion block
   ═══════════════════════════════════════════════════════════ */
function CTASection({ content }: { content: LandingContent }) {
  const c = content.cta;
  if (!c.enabled) return null;
  const mode: SectionDisplayMode = c.displayMode || "text";
  const hasImage = !!c.imageUrl;
  const showText = mode === "text" || mode === "both";
  const showImage = (mode === "image" || mode === "both") && hasImage;

  return (
    <section className="py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {showText && (
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-emerald-500/10 to-transparent" />
            <div className="absolute inset-0 bg-[#0d1210]/60 backdrop-blur-sm" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
            <div className="relative z-10 text-center py-20 px-6 sm:px-16 space-y-8">
              <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">{c.title}</h2>
              <p className="text-zinc-400 max-w-lg mx-auto text-base sm:text-lg">{c.description}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => scrollToSection("#teste-gratis")}
                  className="h-14 px-10 text-base font-semibold rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2.5"
                >
                  {c.ctaText} <ArrowRight className="w-4.5 h-4.5" />
                </button>
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

/* ═══════════════════════════════════════════════════════════
   TRIAL FORM — Lead capture
   ═══════════════════════════════════════════════════════════ */
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
      <section id="teste-gratis" className="py-24 sm:py-32 scroll-mt-20">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-white">Recebemos sua solicitação!</h2>
          <p className="text-zinc-400">Nossa equipe entrará em contato pelo WhatsApp informado para liberar seu acesso ao teste gratuito.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="teste-gratis" className="py-24 sm:py-32 scroll-mt-20 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/5 rounded-full blur-[150px]" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8">
        <div className="relative rounded-3xl overflow-hidden max-w-2xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent" />
          <div className="absolute inset-0 bg-[#0d1210]/70 backdrop-blur-xl" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

          <div className="relative z-10 py-12 px-6 sm:px-10 space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                Teste Grátis
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold text-white">
                Comece seu teste gratuito
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base max-w-md mx-auto">
                Preencha os dados e nossa equipe libera seu acesso em até 24 horas.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="company_name" className="text-zinc-300 text-sm">Nome da empresa</Label>
                <Input
                  id="company_name"
                  placeholder="Ex: Studio Maria"
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  maxLength={100}
                  required
                  className="h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-600 focus:border-emerald-500/50 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-zinc-300 text-sm">Nome completo</Label>
                <Input
                  id="full_name"
                  placeholder="Seu nome completo"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  maxLength={100}
                  required
                  className="h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-600 focus:border-emerald-500/50 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-zinc-300 text-sm">Cidade</Label>
                  <Input
                    id="city"
                    placeholder="Sua cidade"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    maxLength={100}
                    required
                    className="h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-600 focus:border-emerald-500/50 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-zinc-300 text-sm">Estado</Label>
                  <select
                    id="state"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    required
                    className="flex h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="" className="bg-[#0d1210]">Selecione</option>
                    {BRAZILIAN_STATES.map((s) => (
                      <option key={s} value={s} className="bg-[#0d1210]">{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-zinc-300 text-sm">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  placeholder="(11) 99999-9999"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  maxLength={15}
                  required
                  className="h-12 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-zinc-600 focus:border-emerald-500/50 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={!isValid || submitting}
                className="w-full h-14 text-base font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-emerald-500/25 flex items-center justify-center gap-2.5"
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</>
                ) : (
                  <><Send className="w-4 h-4" /> Solicitar teste grátis</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   FOOTER — Clean premium footer
   ═══════════════════════════════════════════════════════════ */
function LandingFooter({ content }: { content: LandingContent }) {
  const ft = content.footer;
  const h = content.header;
  return (
    <footer className="border-t border-white/[0.06] py-12">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2.5 font-bold text-white text-lg">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-white" />
            </div>
            {ft.brandName}
          </span>
          <div className="flex flex-wrap gap-6">
            {h.menuItems.map((i) => (
              <button
                key={i.href}
                onClick={() => scrollToSection(i.href)}
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {i.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} {ft.brandName}. {ft.copyrightText}
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─── Apply landing theme ─── */
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

/* ─── Landing background ─── */
function LandingBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {/* Base */}
      <div className="absolute inset-0 bg-[#060b06]" />
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-emerald-900/15 rounded-full blur-[200px]" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-emerald-800/10 rounded-full blur-[150px]" />
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }} />
      {/* Top shine line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE — Main entry
   ═══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const { content, loading } = useLandingContent();
  const themeId = content.themeId || "galaxy";
  useLandingTheme(themeId);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060b06] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060b06] text-white relative">
      <LandingBackground />
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
