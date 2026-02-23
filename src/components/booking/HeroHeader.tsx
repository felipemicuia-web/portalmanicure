import { useBranding } from "@/hooks/useBranding";

export function HeroHeader() {
  const { branding } = useBranding();
  const logoSizePx = Math.round((branding.logoSize || 80) * 1.4);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: "280px" }}
    >
      {/* Background image with fallback gradient */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/hero-manicure.jpg')`,
          backgroundColor: "hsl(230 50% 15%)",
        }}
      />

      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(10,25,55,0.7) 0%, rgba(10,25,55,0.85) 60%, rgba(10,25,55,0.95) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-10 sm:py-14 text-center">
        {/* Logo with glow */}
        {branding.logoUrl ? (
          <div
            className="mb-4 flex-shrink-0"
            style={{
              width: `${logoSizePx}px`,
              height: `${logoSizePx}px`,
              filter: "drop-shadow(0 0 18px rgba(255,255,255,0.25))",
            }}
          >
            <img
              src={branding.logoUrl}
              alt={branding.siteName}
              className="w-full h-full object-contain"
              style={{ imageRendering: "auto", background: "transparent" }}
            />
          </div>
        ) : (
          <div
            className="mb-4 rounded-2xl border border-white/20 flex items-center justify-center"
            style={{
              width: `${Math.min(logoSizePx, 72)}px`,
              height: `${Math.min(logoSizePx, 72)}px`,
              filter: "drop-shadow(0 0 18px rgba(255,255,255,0.25))",
            }}
          >
            <span className="text-4xl">💅</span>
          </div>
        )}

        {/* Title */}
        <h1
          className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-wide"
          style={{
            background: "linear-gradient(135deg, #f5c6aa 0%, #e8b88a 40%, #d4a574 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))",
          }}
        >
          Manicures De Sucesso
        </h1>

        {/* Subtitle */}
        <p className="mt-2 text-sm sm:text-base text-white/70 max-w-md">
          Plataforma profissional para agendamentos premium
        </p>
      </div>
    </section>
  );
}
