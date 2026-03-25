import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Users,
  Scissors,
  Clock,
  Shield,
  Smartphone,
  BarChart3,
  Globe,
  Star,
  ChevronRight,
  Menu,
  X,
  Zap,
  Check,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Benefícios", href: "#beneficios" },
  { label: "Funções", href: "#funcoes" },
  { label: "Preços", href: "#precos" },
  { label: "Demonstração", href: "#demonstracao" },
];

function scrollToSection(id: string) {
  const el = document.querySelector(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ─── Header ─── */
function LandingHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
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
          Portal Manicure
        </span>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((i) => (
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
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button size="sm" className="gap-1.5" asChild>
              <Link to="/auth">
                Teste grátis <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        </nav>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border/50 px-4 pb-4 space-y-1">
          {NAV_ITEMS.map((i) => (
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
              <Link to="/auth">Entrar</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/auth">Teste grátis</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

/* ─── Hero ─── */
function HeroSection() {
  return (
    <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[300px] h-[300px] bg-secondary/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-8">
        <Badge variant="secondary" className="gap-1.5 text-xs px-4 py-1.5 mx-auto">
          <Zap className="w-3.5 h-3.5" />
          Plataforma completa de agendamento
        </Badge>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-tight max-w-4xl mx-auto">
          Agendamentos online para{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            profissionais de beleza
          </span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Gerencie sua agenda, clientes e serviços em uma plataforma moderna, rápida e pensada para quem cuida de pessoas.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="gap-2 text-base px-8" asChild>
            <Link to="/auth">
              Comece gratuitamente <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="gap-2 text-base px-8" onClick={() => scrollToSection("#demonstracao")}>
            Ver demonstração
          </Button>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-6 sm:gap-10 justify-center pt-6 text-sm text-muted-foreground">
          {[
            { label: "Agendamentos gerenciados", value: "10K+" },
            { label: "Profissionais ativos", value: "500+" },
            { label: "Uptime garantido", value: "99.9%" },
          ].map((s) => (
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
const BENEFITS = [
  {
    icon: Clock,
    title: "Economia de tempo",
    desc: "Automatize agendamentos e reduza no-shows com confirmações automáticas.",
  },
  {
    icon: Smartphone,
    title: "100% mobile",
    desc: "Seus clientes agendam de qualquer dispositivo, a qualquer hora.",
  },
  {
    icon: Shield,
    title: "Segurança total",
    desc: "Dados isolados por estabelecimento com criptografia de ponta a ponta.",
  },
  {
    icon: BarChart3,
    title: "Relatórios inteligentes",
    desc: "Acompanhe métricas, faturamento e ocupação em tempo real.",
  },
  {
    icon: Globe,
    title: "Sua marca, seu domínio",
    desc: "Personalize cores, logo e use seu próprio domínio.",
  },
  {
    icon: Star,
    title: "Avaliações e fidelização",
    desc: "Seus clientes avaliam e você constrói reputação digital.",
  },
];

function BenefitsSection() {
  return (
    <section id="beneficios" className="py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="text-xs px-3 py-1">Benefícios</Badge>
          <h2 className="text-2xl sm:text-4xl font-bold text-foreground">
            Tudo que você precisa para crescer
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Uma plataforma completa que simplifica sua rotina e encanta seus clientes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {BENEFITS.map((b) => (
            <Card key={b.title} className="group hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <b.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Funções ─── */
const FEATURES = [
  {
    icon: Calendar,
    title: "Agenda inteligente",
    desc: "Controle horários, bloqueios e intervalos por profissional.",
  },
  {
    icon: Users,
    title: "Gestão de clientes",
    desc: "Cadastro automático, histórico completo e anotações.",
  },
  {
    icon: Scissors,
    title: "Catálogo de serviços",
    desc: "Preços, durações e vínculo com profissionais específicos.",
  },
  {
    icon: Globe,
    title: "Multi-tenant",
    desc: "Cada estabelecimento com ambiente totalmente isolado.",
  },
];

function FeaturesSection() {
  return (
    <section id="funcoes" className="py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="text-xs px-3 py-1">Funções</Badge>
          <h2 className="text-2xl sm:text-4xl font-bold text-foreground">
            Funcionalidades que fazem a diferença
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Do agendamento à gestão completa do seu negócio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="flex gap-4 p-6 rounded-xl border border-border/50 bg-card/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center shrink-0">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Preços ─── */
const PLANS = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "/mês",
    desc: "Para começar sem compromisso",
    features: ["1 profissional", "Agendamento online", "Notificações básicas", "Personalização limitada"],
    cta: "Começar grátis",
    highlighted: false,
  },
  {
    name: "Profissional",
    price: "R$ 49",
    period: "/mês",
    desc: "Para quem quer crescer",
    features: ["Até 5 profissionais", "Domínio personalizado", "Relatórios avançados", "Cupons e promoções", "Suporte prioritário"],
    cta: "Assinar agora",
    highlighted: true,
  },
  {
    name: "Premium",
    price: "R$ 99",
    period: "/mês",
    desc: "Para redes e franquias",
    features: ["Profissionais ilimitados", "Multi-unidades", "API de integração", "Gerente dedicado", "SLA garantido"],
    cta: "Falar com vendas",
    highlighted: false,
  },
];

function PricingSection() {
  return (
    <section id="precos" className="py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="text-xs px-3 py-1">Preços</Badge>
          <h2 className="text-2xl sm:text-4xl font-bold text-foreground">
            Planos para cada momento
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Comece grátis e evolua conforme seu negócio cresce.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((p) => (
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
                  <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
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
                <Button
                  className="w-full gap-1.5"
                  variant={p.highlighted ? "default" : "outline"}
                  asChild
                >
                  <Link to="/auth">
                    {p.cta} <ChevronRight className="w-3.5 h-3.5" />
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
function DemoSection() {
  return (
    <section id="demonstracao" className="py-20 sm:py-28 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <Badge variant="outline" className="text-xs px-3 py-1">Demonstração</Badge>
          <h2 className="text-2xl sm:text-4xl font-bold text-foreground">
            Veja na prática
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Acesse nosso ambiente de demonstração e experimente todas as funcionalidades.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-2xl blur-2xl -z-10" />
          <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden p-6 sm:p-10 text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto">
              <Calendar className="w-10 h-10 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">Experimente agora</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Acesse o ambiente demo e veja como é fácil gerenciar agendamentos, profissionais e serviços.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="gap-2" asChild>
                <Link to="/tenant/default">
                  Acessar demo <ArrowRight className="w-4 h-4" />
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
function CTASection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/20 to-secondary/15" />
          <div className="absolute inset-0 bg-card/60 backdrop-blur-sm" />
          <div className="relative z-10 text-center py-16 px-6 sm:px-12 space-y-6">
            <h2 className="text-2xl sm:text-4xl font-bold text-foreground">
              Pronto para transformar sua agenda?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
              Crie sua conta gratuita em menos de 2 minutos e comece a receber agendamentos online hoje mesmo.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="gap-2 text-base px-8" asChild>
                <Link to="/auth">
                  Criar conta grátis <ArrowRight className="w-4 h-4" />
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
function LandingFooter() {
  return (
    <footer className="border-t border-border/50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-2 font-semibold text-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            Portal Manicure
          </span>
          <div className="flex gap-6">
            {NAV_ITEMS.map((i) => (
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
            © {new Date().getFullYear()} Portal Manicure. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ─── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <div className="galaxy-bg" />
      <div className="relative z-10">
        <LandingHeader />
        <HeroSection />
        <BenefitsSection />
        <FeaturesSection />
        <PricingSection />
        <DemoSection />
        <CTASection />
        <LandingFooter />
      </div>
    </div>
  );
}
