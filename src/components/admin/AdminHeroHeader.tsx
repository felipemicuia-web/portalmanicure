import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Trash2, Eye, Image as ImageIcon, History, Check, X } from "lucide-react";

interface HistoryItem {
  id: string;
  image_url: string;
  file_name: string | null;
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
        setHeroBackgroundUrl(data.hero_background_url || null);
      }
      setLoading(false);
    }
    fetch();
  }, [tenantId]);

  const loadHistory = async () => {
    if (!tenantId) return;
    const { data } = await supabase
      .from("logo_history")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (data) setHistory(data);
  };

  useEffect(() => {
    loadHistory();
  }, [tenantId]);

  const handleSave = async () => {
    if (!tenantId) return;
    setSaving(true);
    const { error } = await supabase
      .from("work_settings")
      .update({ hero_background_url: heroBackgroundUrl })
      .eq("tenant_id", tenantId);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Salvo!", description: "Imagem de fundo atualizada com sucesso." });
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
    const fileName = `${tenantId}-${Date.now()}.${ext}`;
    const path = `hero-bg/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    // Save to history table
    await supabase.from("logo_history").insert({
      tenant_id: tenantId,
      image_url: publicUrl,
      file_name: file.name,
    });

    setHeroBackgroundUrl(publicUrl);
    setUploading(false);
    await loadHistory();
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

  const handleDeleteFromHistory = async (id: string) => {
    const { error } = await supabase.from("logo_history").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    await loadHistory();
    toast({ title: "Imagem removida do histórico." });
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
                const isSelected = heroBackgroundUrl === item.image_url;
                return (
                  <div key={item.id} className="relative group">
                    <button
                      onClick={() => handleSelectFromHistory(item.image_url)}
                      className={`relative rounded-lg overflow-hidden h-24 w-full bg-muted border-2 transition-all hover:opacity-90 ${
                        isSelected ? "border-primary ring-2 ring-primary/30" : "border-transparent"
                      }`}
                    >
                      <img src={item.image_url} alt={item.file_name || "Histórico"} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="w-6 h-6 text-primary" />
                        </div>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteFromHistory(item.id)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      title="Excluir do histórico"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {item.file_name && (
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">{item.file_name}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Salvando..." : "Salvar Imagem de Fundo"}
      </Button>
    </div>
  );
}
