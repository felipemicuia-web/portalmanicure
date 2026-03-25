import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, ImageIcon } from "lucide-react";
import { LandingFeatures } from "@/types/landing";
import { supabase } from "@/integrations/supabase/client";
import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  content: LandingFeatures;
  onChange: (v: LandingFeatures) => void;
}

export function LandingAdminFeatures({ content, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `landing/features-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Erro ao enviar imagem", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    onChange({ ...content, imageUrl: urlData.publicUrl });
    setUploading(false);
    toast({ title: "Imagem enviada com sucesso!" });
  };

  const removeImage = () => {
    onChange({ ...content, imageUrl: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Funções</h3>
        <div className="flex items-center gap-2">
          <Label htmlFor="features-enabled" className="text-sm">Ativo</Label>
          <Switch id="features-enabled" checked={content.enabled} onCheckedChange={(enabled) => onChange({ ...content, enabled })} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Badge</Label>
          <Input value={content.badgeText} onChange={(e) => onChange({ ...content, badgeText: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Título</Label>
          <Input value={content.title} onChange={(e) => onChange({ ...content, title: e.target.value })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Subtítulo</Label>
        <Input value={content.subtitle} onChange={(e) => onChange({ ...content, subtitle: e.target.value })} />
      </div>

      <div className="space-y-3">
        <Label>Arte / Imagem da seção</Label>

        {content.imageUrl ? (
          <div className="relative rounded-lg border border-border/50 overflow-hidden bg-muted/30">
            <img
              src={content.imageUrl}
              alt="Arte da seção Funções"
              className="w-full max-h-80 object-contain"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={removeImage}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full h-48 rounded-lg border-2 border-dashed border-border/60 hover:border-primary/40 bg-muted/20 hover:bg-muted/30 transition-colors flex flex-col items-center justify-center gap-3 text-muted-foreground"
          >
            {uploading ? (
              <span className="text-sm animate-pulse">Enviando...</span>
            ) : (
              <>
                <ImageIcon className="w-10 h-10" />
                <span className="text-sm font-medium">Clique para adicionar uma arte</span>
                <span className="text-xs">PNG, JPG ou WebP</span>
              </>
            )}
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />

        {content.imageUrl && (
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-1.5">
            <Upload className="w-3.5 h-3.5" /> Trocar imagem
          </Button>
        )}
      </div>
    </div>
  );
}
