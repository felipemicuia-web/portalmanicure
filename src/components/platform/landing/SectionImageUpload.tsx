import { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, Trash2, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SectionDisplayMode } from "@/types/landing";

interface Props {
  imageUrl?: string;
  displayMode?: SectionDisplayMode;
  onImageChange: (url: string) => void;
  onDisplayModeChange: (mode: SectionDisplayMode) => void;
  sectionLabel?: string;
}

export function SectionImageUpload({
  imageUrl = "",
  displayMode = "text",
  onImageChange,
  onDisplayModeChange,
  sectionLabel = "seção",
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `landing/${sectionLabel}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Erro ao enviar imagem", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    onImageChange(urlData.publicUrl);
    setUploading(false);
    toast({ title: "Imagem enviada com sucesso!" });
  };

  return (
    <div className="space-y-4 pt-2 border-t border-border/30">
      <div className="space-y-3">
        <Label className="text-sm font-medium">Modo de exibição</Label>
        <RadioGroup
          value={displayMode}
          onValueChange={(v) => onDisplayModeChange(v as SectionDisplayMode)}
          className="flex flex-wrap gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="text" id={`${sectionLabel}-text`} />
            <Label htmlFor={`${sectionLabel}-text`} className="text-sm cursor-pointer">Apenas texto</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="image" id={`${sectionLabel}-image`} />
            <Label htmlFor={`${sectionLabel}-image`} className="text-sm cursor-pointer">Apenas imagem</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="both" id={`${sectionLabel}-both`} />
            <Label htmlFor={`${sectionLabel}-both`} className="text-sm cursor-pointer">Texto + Imagem</Label>
          </div>
        </RadioGroup>
      </div>

      {(displayMode === "image" || displayMode === "both") && (
        <div className="space-y-3">
          <Label>Arte / Imagem da seção</Label>

          {imageUrl ? (
            <div className="relative rounded-lg border border-border/50 overflow-hidden bg-muted/30">
              <img
                src={imageUrl}
                alt={`Arte da ${sectionLabel}`}
                className="w-full max-h-80 object-contain"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => onImageChange("")}
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

          {imageUrl && (
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Trocar imagem
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
