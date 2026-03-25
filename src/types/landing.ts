export type SectionDisplayMode = "text" | "image" | "both";

export interface LandingMenuItem {
  label: string;
  href: string;
}

export interface LandingHeader {
  brandName: string;
  logoUrl: string;
  menuItems: LandingMenuItem[];
  loginButtonText: string;
  ctaButtonText: string;
}

export interface LandingStat {
  label: string;
  value: string;
}

export interface LandingHero {
  badgeText: string;
  title: string;
  highlight: string;
  description: string;
  ctaText: string;
  secondaryCtaText: string;
  stats: LandingStat[];
  imageUrl?: string;
  displayMode?: SectionDisplayMode;
}

export interface LandingCard {
  title: string;
  description: string;
  icon: string;
}

export interface LandingSection {
  enabled: boolean;
  badgeText: string;
  title: string;
  subtitle: string;
  imageUrl?: string;
  displayMode?: SectionDisplayMode;
}

export interface LandingBenefits extends LandingSection {
  cards: LandingCard[];
}

export interface LandingFeatures extends LandingSection {
  items: LandingCard[];
}

export interface LandingPlanItem {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  ctaText: string;
  highlighted: boolean;
}

export interface LandingPricing extends LandingSection {
  plans: LandingPlanItem[];
}

export interface LandingDemo extends LandingSection {
  description: string;
  ctaText: string;
  demoUrl: string;
}

export interface LandingCta {
  enabled: boolean;
  title: string;
  description: string;
  ctaText: string;
  imageUrl?: string;
  displayMode?: SectionDisplayMode;
}

export interface LandingFooter {
  brandName: string;
  copyrightText: string;
}

export interface LandingContent {
  header: LandingHeader;
  hero: LandingHero;
  benefits: LandingBenefits;
  features: LandingFeatures;
  pricing: LandingPricing;
  demo: LandingDemo;
  cta: LandingCta;
  footer: LandingFooter;
}

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  header: {
    brandName: "Portal Manicure",
    logoUrl: "",
    menuItems: [
      { label: "Benefícios", href: "#beneficios" },
      { label: "Funções", href: "#funcoes" },
      { label: "Preços", href: "#precos" },
      { label: "Demonstração", href: "#demonstracao" },
    ],
    loginButtonText: "Entrar",
    ctaButtonText: "Teste grátis",
  },
  hero: {
    badgeText: "Plataforma completa de agendamento",
    title: "Agendamentos online para",
    highlight: "profissionais de beleza",
    description: "Gerencie sua agenda, clientes e serviços em uma plataforma moderna, rápida e pensada para quem cuida de pessoas.",
    ctaText: "Comece gratuitamente",
    secondaryCtaText: "Ver demonstração",
    stats: [
      { label: "Agendamentos gerenciados", value: "10K+" },
      { label: "Profissionais ativos", value: "500+" },
      { label: "Uptime garantido", value: "99.9%" },
    ],
    imageUrl: "",
    displayMode: "text",
  },
  benefits: {
    enabled: true,
    badgeText: "Benefícios",
    title: "Tudo que você precisa para crescer",
    subtitle: "Uma plataforma completa que simplifica sua rotina e encanta seus clientes.",
    imageUrl: "",
    displayMode: "text",
    cards: [
      { title: "Economia de tempo", description: "Automatize agendamentos e reduza no-shows com confirmações automáticas.", icon: "Clock" },
      { title: "100% mobile", description: "Seus clientes agendam de qualquer dispositivo, a qualquer hora.", icon: "Smartphone" },
      { title: "Segurança total", description: "Dados isolados por estabelecimento com criptografia de ponta a ponta.", icon: "Shield" },
      { title: "Relatórios inteligentes", description: "Acompanhe métricas, faturamento e ocupação em tempo real.", icon: "BarChart3" },
      { title: "Sua marca, seu domínio", description: "Personalize cores, logo e use seu próprio domínio.", icon: "Globe" },
      { title: "Avaliações e fidelização", description: "Seus clientes avaliam e você constrói reputação digital.", icon: "Star" },
    ],
  },
  features: {
    enabled: true,
    badgeText: "Funções",
    title: "Funcionalidades que fazem a diferença",
    subtitle: "Do agendamento à gestão completa do seu negócio.",
    imageUrl: "",
    displayMode: "text",
    items: [],
  },
  pricing: {
    enabled: true,
    badgeText: "Preços",
    title: "Planos para cada momento",
    subtitle: "Comece grátis e evolua conforme seu negócio cresce.",
    imageUrl: "",
    displayMode: "text",
    plans: [
      {
        name: "Gratuito",
        price: "R$ 0",
        period: "/mês",
        description: "Para começar sem compromisso",
        features: ["1 profissional", "Agendamento online", "Notificações básicas", "Personalização limitada"],
        ctaText: "Começar grátis",
        highlighted: false,
      },
      {
        name: "Profissional",
        price: "R$ 49",
        period: "/mês",
        description: "Para quem quer crescer",
        features: ["Até 5 profissionais", "Domínio personalizado", "Relatórios avançados", "Cupons e promoções", "Suporte prioritário"],
        ctaText: "Assinar agora",
        highlighted: true,
      },
      {
        name: "Premium",
        price: "R$ 99",
        period: "/mês",
        description: "Para redes e franquias",
        features: ["Profissionais ilimitados", "Multi-unidades", "API de integração", "Gerente dedicado", "SLA garantido"],
        ctaText: "Falar com vendas",
        highlighted: false,
      },
    ],
  },
  demo: {
    enabled: true,
    badgeText: "Demonstração",
    title: "Veja na prática",
    subtitle: "Acesse nosso ambiente de demonstração e experimente todas as funcionalidades.",
    imageUrl: "",
    displayMode: "text",
    description: "Acesse o ambiente demo e veja como é fácil gerenciar agendamentos, profissionais e serviços.",
    ctaText: "Acessar demo",
    demoUrl: "/tenant/default",
  },
  cta: {
    enabled: true,
    title: "Pronto para transformar sua agenda?",
    description: "Crie sua conta gratuita em menos de 2 minutos e comece a receber agendamentos online hoje mesmo.",
    ctaText: "Criar conta grátis",
    imageUrl: "",
    displayMode: "text",
  },
  footer: {
    brandName: "Portal Manicure",
    copyrightText: "Todos os direitos reservados.",
  },
};
