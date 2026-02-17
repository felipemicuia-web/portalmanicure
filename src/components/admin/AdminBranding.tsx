import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { Image, Save, Upload, Trash2, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FONT_OPTIONS } from "@/hooks/useBranding";

export function AdminBranding() {
  const [siteName, setSiteName] = useState("Agendamento");
  const [siteSubtitle, setSiteSubtitle] = useState("Agende seu horário");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoDisplayMode, setLogoDisplayMode] = useState<"icon" | "banner">("icon");
  const [siteFont, setSiteFont] = useState("Inter");
  const [originalData, setOriginalData] = useState({ siteName: "", siteSubtitle: "", logoUrl: "", logoDisplayMode: "icon", siteFont: "Inter" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("work_settings")
        .select("site_name, site_subtitle, logo_url, logo_display_mode, site_font")
        .limit(1)
        .single();

      if (data) {
        const font = (data as any).site_font || "Inter";
        setSiteName(data.site_name || "Agendamento");
        setSiteSubtitle(data.site_subtitle || "Agende seu horário");
        setLogoUrl(data.logo_url);
        setLogoDisplayMode((data.logo_display_mode as "icon" | "banner") || "icon");
        setSiteFont(font);
        setOriginalData({
          siteName: data.site_name || "Agendamento",
          siteSubtitle: data.site_subtitle || "Agende seu horário",
          logoUrl: data.logo_url || "",
          logoDisplayMode: data.logo_display_mode || "icon",
          siteFont: font,
        });
      }
      setLoading(false);
    }
    fetch();
  }, []);

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `logo/site-logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      logger.error("Logo upload error:", uploadError);
      toast.error("Erro ao enviar logo");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const url = `${urlData.publicUrl}?t=${Date.now()}`;
    setLogoUrl(url);
    setUploading(false);
    toast.success("Logo enviada!");
  };

  const handleRemoveLogo = () => {
    setLogoUrl(null);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("work_settings")
      .update({
        site_name: siteName.trim(),
        site_subtitle: siteSubtitle.trim(),
        logo_url: logoUrl,
        logo_display_mode: logoDisplayMode,
        site_font: siteFont,
      } as any)
      .not("id", "is", null);

    setSaving(false);
    if (error) {
      logger.error("Error saving branding:", error);
      toast.error("Erro ao salvar");
      return;
    }
    setOriginalData({ siteName: siteName.trim(), siteSubtitle: siteSubtitle.trim(), logoUrl: logoUrl || "", logoDisplayMode, siteFont });
    // Apply font globally
    const fallback = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
    document.documentElement.style.setProperty("--font-sans", `'${siteFont}', ${fallback}`);
    toast.success("Identidade visual salva!");
  };

  const hasChanges =
    siteName !== originalData.siteName ||
    siteSubtitle !== originalData.siteSubtitle ||
    (logoUrl || "") !== originalData.logoUrl ||
    logoDisplayMode !== originalData.logoDisplayMode ||
    siteFont !== originalData.siteFont;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Image className="w-5 h-5 text-primary" />
        <h2 className="text-lg sm:text-xl font-semibold">Identidade Visual</h2>
      </div>

      <div className="glass-panel p-4 space-y-5">
        {/* Logo */}
        <div className="space-y-2">
          <Label>Logotipo</Label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center overflow-hidden flex-shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <span className="text-3xl">💅</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadLogo}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                {uploading ? "Enviando..." : "Enviar logo"}
              </Button>
              {logoUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveLogo}
                  className="gap-1.5 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remover
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Recomendado: PNG transparente, máx. 2MB</p>
        </div>

        {/* Display Mode */}
        {logoUrl && (
          <div className="space-y-2">
            <Label>Modo de exibição da logo</Label>
            <RadioGroup value={logoDisplayMode} onValueChange={(v) => setLogoDisplayMode(v as "icon" | "banner")} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="icon" id="mode-icon" />
                <Label htmlFor="mode-icon" className="font-normal cursor-pointer">Ícone pequeno + texto</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="banner" id="mode-banner" />
                <Label htmlFor="mode-banner" className="font-normal cursor-pointer">Logo como banner</Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Site Name */}
        <div className="space-y-2">
          <Label htmlFor="site-name">Nome do site</Label>
          <Input
            id="site-name"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="Ex: Meu Salão"
            maxLength={40}
          />
        </div>

        {/* Subtitle */}
        <div className="space-y-2">
          <Label htmlFor="site-subtitle">Subtítulo</Label>
          <Input
            id="site-subtitle"
            value={siteSubtitle}
            onChange={(e) => setSiteSubtitle(e.target.value)}
            placeholder="Ex: Agende seu horário"
            maxLength={60}
          />
        </div>

        {/* Font Selector */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Type className="w-4 h-4 text-primary" />
            Fonte do site
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {FONT_OPTIONS.map((font) => {
              // Load font for preview
              const linkId = `font-preview-${font.value}`;
              if (!document.querySelector(`link[data-font="${font.value}"]`)) {
                const link = document.createElement("link");
                link.rel = "stylesheet";
                link.href = font.url;
                link.setAttribute("data-font", font.value);
                document.head.appendChild(link);
              }
              return (
                <button
                  key={font.value}
                  onClick={() => setSiteFont(font.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                    siteFont === font.value
                      ? "border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20"
                      : "border-border/50 hover:border-border hover:bg-muted/30"
                  }`}
                >
                  <span
                    className="text-base font-semibold block"
                    style={{ fontFamily: `'${font.value}', sans-serif` }}
                  >
                    {font.label}
                  </span>
                  <span
                    className="text-xs text-muted-foreground mt-1 block"
                    style={{ fontFamily: `'${font.value}', sans-serif` }}
                  >
                    Agende seu horário
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label>Pré-visualização</Label>
          <div className="rounded-xl bg-gradient-to-r from-primary/30 to-primary/10 border border-border/50 p-4">
            {logoDisplayMode === "banner" && logoUrl ? (
              <img src={logoUrl} alt="Banner preview" className="h-12 max-w-[280px] object-contain bg-transparent" style={{ mixBlendMode: "normal" }} />
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-transparent border border-white/20 flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo preview" className="w-full h-full object-contain p-1" style={{ background: "transparent" }} />
                  ) : (
                    <span className="text-2xl">💅</span>
                  )}
                </div>
                <div style={{ fontFamily: `'${siteFont}', sans-serif` }}>
                  <div className="font-bold text-base sm:text-lg">{siteName || "Agendamento"}</div>
                  <div className="text-xs text-muted-foreground">{siteSubtitle || "Agende seu horário"}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm" className="gap-1.5">
            <Save className="w-3.5 h-3.5" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
