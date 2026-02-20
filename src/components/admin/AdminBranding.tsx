import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { Image, Save, Upload, Trash2, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { FONT_OPTIONS } from "@/hooks/useBranding";

export function AdminBranding() {
  const [siteName, setSiteName] = useState("Agendamento");
  const [siteSubtitle, setSiteSubtitle] = useState("Agende seu horário");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoDisplayMode, setLogoDisplayMode] = useState<"icon" | "banner">("icon");
  const [siteFont, setSiteFont] = useState("Inter");
  const [showBrandName, setShowBrandName] = useState(true);
  const [logoSize, setLogoSize] = useState(80);
  const [originalData, setOriginalData] = useState({
    siteName: "", siteSubtitle: "", logoUrl: "", logoDisplayMode: "icon", siteFont: "Inter",
    showBrandName: true, logoSize: 80,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("work_settings")
        .select("site_name, site_subtitle, logo_url, logo_display_mode, site_font, show_brand_name, logo_size")
        .limit(1)
        .single();

      if (data) {
        const d = data as any;
        const font = d.site_font || "Inter";
        setSiteName(d.site_name || "Agendamento");
        setSiteSubtitle(d.site_subtitle || "Agende seu horário");
        setLogoUrl(d.logo_url);
        setLogoDisplayMode((d.logo_display_mode as "icon" | "banner") || "icon");
        setSiteFont(font);
        setShowBrandName(d.show_brand_name ?? true);
        setLogoSize(d.logo_size ?? 80);
        setOriginalData({
          siteName: d.site_name || "Agendamento",
          siteSubtitle: d.site_subtitle || "Agende seu horário",
          logoUrl: d.logo_url || "",
          logoDisplayMode: d.logo_display_mode || "icon",
          siteFont: font,
          showBrandName: d.show_brand_name ?? true,
          logoSize: d.logo_size ?? 80,
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

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `logo/site-logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true, contentType: file.type });

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
        show_brand_name: showBrandName,
        logo_size: logoSize,
      } as any)
      .not("id", "is", null);

    setSaving(false);
    if (error) {
      logger.error("Error saving branding:", error);
      toast.error("Erro ao salvar");
      return;
    }
    setOriginalData({
      siteName: siteName.trim(), siteSubtitle: siteSubtitle.trim(),
      logoUrl: logoUrl || "", logoDisplayMode, siteFont,
      showBrandName, logoSize,
    });
    const fallback = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
    document.documentElement.style.setProperty("--font-sans", `'${siteFont}', ${fallback}`);
    toast.success("Identidade visual salva!");
  };

  const hasChanges =
    siteName !== originalData.siteName ||
    siteSubtitle !== originalData.siteSubtitle ||
    (logoUrl || "") !== originalData.logoUrl ||
    logoDisplayMode !== originalData.logoDisplayMode ||
    siteFont !== originalData.siteFont ||
    showBrandName !== originalData.showBrandName ||
    logoSize !== originalData.logoSize;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const previewLogoSize = logoSize;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Image className="w-5 h-5 text-primary" />
        <h2 className="text-lg sm:text-xl font-semibold">Identidade Visual</h2>
      </div>

      <div className="glass-panel p-4 space-y-5">
        {/* Logo Upload */}
        <div className="space-y-2">
          <Label>Logotipo</Label>
          <div className="flex items-start gap-4">
            <div
              className="rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ width: `${Math.max(previewLogoSize, 64)}px`, height: `${Math.max(previewLogoSize, 64)}px` }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-full h-full object-contain"
                  style={{ imageRendering: "auto" }}
                />
              ) : (
                <span className="text-3xl">💅</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
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
          <p className="text-xs text-muted-foreground">
            Recomendado: PNG transparente, até 2000×2000px, máx. 5MB
          </p>
        </div>

        {/* Logo Size Slider */}
        {logoUrl && (
          <div className="space-y-3">
            <Label>Tamanho do logo no cabeçalho: {logoSize}px</Label>
            <Slider
              value={[logoSize]}
              onValueChange={(v) => setLogoSize(v[0])}
              min={40}
              max={160}
              step={4}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>40px</span>
              <span>160px</span>
            </div>
          </div>
        )}

        {/* Show Brand Name Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Mostrar nome da marca</Label>
            <p className="text-xs text-muted-foreground">
              Exibe o nome e subtítulo abaixo do logo
            </p>
          </div>
          <Switch
            checked={showBrandName}
            onCheckedChange={setShowBrandName}
          />
        </div>

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

        {/* Live Preview */}
        <div className="space-y-2">
          <Label>Pré-visualização do cabeçalho</Label>
          <div className="rounded-xl bg-gradient-to-r from-primary/40 to-primary/20 border border-border/50 p-5 flex flex-col items-center gap-2">
            {logoUrl ? (
              <div
                className="flex items-center justify-center overflow-hidden"
                style={{ width: `${previewLogoSize}px`, height: `${previewLogoSize}px` }}
              >
                <img
                  src={logoUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                  style={{ imageRendering: "auto" }}
                />
              </div>
            ) : (
              <div
                className="rounded-2xl bg-transparent border border-white/20 flex items-center justify-center overflow-hidden"
                style={{ width: '48px', height: '48px' }}
              >
                <span className="text-2xl">💅</span>
              </div>
            )}
            {showBrandName && (
              <div className="text-center" style={{ fontFamily: `'${siteFont}', sans-serif` }}>
                <div className="font-bold text-base sm:text-lg">{siteName || "Agendamento"}</div>
                <div className="text-xs text-muted-foreground">{siteSubtitle || "Agende seu horário"}</div>
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
