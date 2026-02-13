import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { Image, Save, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminBranding() {
  const [siteName, setSiteName] = useState("Agendamento");
  const [siteSubtitle, setSiteSubtitle] = useState("Agende seu horário");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState({ siteName: "", siteSubtitle: "", logoUrl: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("work_settings")
        .select("site_name, site_subtitle, logo_url")
        .limit(1)
        .single();

      if (data) {
        setSiteName(data.site_name || "Agendamento");
        setSiteSubtitle(data.site_subtitle || "Agende seu horário");
        setLogoUrl(data.logo_url);
        setOriginalData({
          siteName: data.site_name || "Agendamento",
          siteSubtitle: data.site_subtitle || "Agende seu horário",
          logoUrl: data.logo_url || "",
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
      })
      .not("id", "is", null);

    setSaving(false);
    if (error) {
      logger.error("Error saving branding:", error);
      toast.error("Erro ao salvar");
      return;
    }
    setOriginalData({ siteName: siteName.trim(), siteSubtitle: siteSubtitle.trim(), logoUrl: logoUrl || "" });
    toast.success("Identidade visual salva!");
  };

  const hasChanges =
    siteName !== originalData.siteName ||
    siteSubtitle !== originalData.siteSubtitle ||
    (logoUrl || "") !== originalData.logoUrl;

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

        {/* Preview */}
        <div className="space-y-2">
          <Label>Pré-visualização</Label>
          <div className="rounded-xl bg-gradient-to-r from-primary/30 to-primary/10 border border-border/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/20 flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo preview" className="w-full h-full object-contain p-1" />
                ) : (
                  <span className="text-2xl">💅</span>
                )}
              </div>
              <div>
                <div className="font-bold text-base sm:text-lg">{siteName || "Agendamento"}</div>
                <div className="text-xs text-muted-foreground">{siteSubtitle || "Agende seu horário"}</div>
              </div>
            </div>
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
