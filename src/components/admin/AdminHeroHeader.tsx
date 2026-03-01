import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Trash2, Eye, Image as ImageIcon, History, Check } from "lucide-react";

interface HistoryItem {
  name: string;
  url: string;
  created_at: string;
}

export function AdminHeroHeader() {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [heroBackgroundUrl, setHeroBackgroundUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    async function fetch() {
      const { data } = await supabase
        .from("work_settings")
        .select("hero_background_url")
        .eq("tenant_id", tenantId)
        .limit(1)
        .single();
      if (data) {
        setHeroBackgroundUrl((data as any).hero_background_url || null);
      }
      setLoading(false);
    }
    fetch();
  }, [tenantId]);

  // Load history of uploaded images from storage
  useEffect(() => {
    if (!tenantId) return;
    async function loadHistory() {
      const { data } = await supabase.storage
        .from("avatars")
        .list(`hero-bg`, { sortBy: { column: "created_at", order: "desc" } });

      if (data) {
        const items: HistoryItem[] = data
          .filter((f) => f.name.startsWith(`${tenantId}-`))
          .map((f) => {
            const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(`hero-bg/${f.name}`);
            return {
              name: f.name,
              url: urlData.publicUrl,
              created_at: f.created_at || "",
            };
          });
        setHistory(items);
      }
    }
    loadHistory();
  }, [tenantId, uploading]);

  const handleSave = async () => {
    if (!tenantId) return;
    setSaving(true);
    const { error } = await supabase
      .from("work_settings")
      .update({ hero_background_url: heroBackgroundUrl } as any)
      .eq("tenant_id", tenantId);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Salvo!", description: "Logotipo atualizado com sucesso." });
    }
    setSaving(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenantId) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Envie uma imagem PNG ou JPG.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 5MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `hero-bg/${tenantId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    setHeroBackgroundUrl(urlData.publicUrl);
    setUploading(false);
    toast({ title: "Imagem enviada!", description: "Clique em Salvar para aplicar." });
  };

  const handleRemoveBackground = () => {
    setHeroBackgroundUrl(null);
  };

  const handleSelectFromHistory = (url: string) => {
    setHeroBackgroundUrl(url);
    setShowHistory(false);
    toast({ title: "Imagem selecionada!", description: "Clique em Salvar para aplicar." });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Pré-visualização
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full rounded-xl overflow-hidden" style={{ minHeight: 180 }}>
            {heroBackgroundUrl ? (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${heroBackgroundUrl}')` }}
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(180deg, hsl(230 50% 12%) 0%, hsl(230 50% 8%) 100%)",
                }}
              />
            )}
            <div className="absolute inset-0 bg-black/30" />
          </div>
        </CardContent>
      </Card>

      {/* Background Image */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Imagem de Fundo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {heroBackgroundUrl && (
            <div className="relative rounded-lg overflow-hidden h-32 bg-muted">
              <img src={heroBackgroundUrl} alt="Background" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              {uploading ? "Enviando..." : heroBackgroundUrl ? "Trocar Imagem" : "Enviar Imagem"}
            </Button>
            {history.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="gap-2"
              >
                <History className="w-4 h-4" />
                Histórico ({history.length})
              </Button>
            )}
            {heroBackgroundUrl && (
              <Button variant="outline" size="sm" onClick={handleRemoveBackground} className="gap-2 text-destructive">
                <Trash2 className="w-4 h-4" />
                Remover
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleUpload}
          />
          <p className="text-xs text-muted-foreground">PNG, JPG ou WebP. Máximo 5MB. Recomendado: 1920×400px.</p>
        </CardContent>
      </Card>

      {/* History */}
      {showHistory && history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="w-4 h-4" />
              Histórico de Imagens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {history.map((item) => {
                const isSelected = heroBackgroundUrl === item.url;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleSelectFromHistory(item.url)}
                    className={`relative rounded-lg overflow-hidden h-24 bg-muted border-2 transition-all hover:opacity-90 ${
                      isSelected ? "border-primary ring-2 ring-primary/30" : "border-transparent"
                    }`}
                  >
                    <img src={item.url} alt="Histórico" className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="w-6 h-6 text-primary" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Salvando..." : "Salvar Logotipo"}
      </Button>
    </div>
  );
}