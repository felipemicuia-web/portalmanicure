import { useState, useEffect, useRef } from "react";
import { usePopupSettings, type PopupSettings } from "@/hooks/usePopupSettings";
import { isValidUrl } from "@/hooks/usePaymentSettings";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Megaphone, ExternalLink, ImageIcon, Upload, Trash2 } from "lucide-react";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

function ImageUploadField({
  label,
  value,
  onChange,
  error,
  tenantId,
  fieldKey,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  error?: string;
  tenantId: string | null;
  fieldKey: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenantId) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "Arquivo muito grande", description: "Máximo 2MB.", variant: "destructive" });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({ title: "Formato inválido", description: "Envie apenas imagens.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `popups/${tenantId}/${fieldKey}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      onChange(urlData.publicUrl);
      toast({ title: "Imagem enviada!" });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div>
      <Label className="text-sm font-medium flex items-center gap-1.5">
        <ImageIcon className="w-3.5 h-3.5" />
        {label}
      </Label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />

      {value && isValidUrl(value) ? (
        <div className="mt-2 rounded-lg border border-border/50 overflow-hidden bg-muted/30 p-2 space-y-2">
          <img
            src={value}
            alt="Preview"
            className="max-h-28 rounded object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="gap-1.5 text-xs"
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              Trocar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="gap-1.5 text-xs text-destructive hover:text-destructive"
            >
              <Trash2 className="w-3 h-3" />
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="mt-1 w-full border-2 border-dashed border-border/60 rounded-lg p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors cursor-pointer"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Upload className="w-6 h-6" />
              <span className="text-xs">Clique para enviar imagem (máx. 2MB)</span>
            </>
          )}
        </button>
      )}

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

export function AdminPopups() {
  const { settings, loading, saving, saveSettings } = usePopupSettings();
  const [form, setForm] = useState<PopupSettings>({ ...settings });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { tenantId } = useTenant();

  useEffect(() => {
    setForm({ ...settings });
  }, [settings]);

  const updateField = <K extends keyof PopupSettings>(key: K, value: PopupSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (form.enabled) {
      if (!form.trigger_image_url.trim()) {
        errs.trigger_image_url = "Imagem do gatilho é obrigatória quando ativo.";
      }
    }

    if (form.button_url.trim() && !isValidUrl(form.button_url.trim())) {
      errs.button_url = "URL inválida. Use http:// ou https://";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    await saveSettings(form);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Megaphone className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-lg font-bold">Pop-ups</h2>
          <p className="text-sm text-muted-foreground">
            Configure um pop-up promocional na página pública de agendamento.
          </p>
        </div>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between border border-border/50 rounded-lg p-4 bg-card/50">
        <div>
          <Label className="text-sm font-medium">Ativar pop-up</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quando ativo, uma imagem clicável aparece na página de agendamento.
          </p>
        </div>
        <Switch
          checked={form.enabled}
          onCheckedChange={(v) => updateField("enabled", v)}
        />
      </div>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <Label className="text-sm font-medium">Título (opcional)</Label>
          <Input
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="Promoção especial"
            maxLength={100}
            className="mt-1"
          />
        </div>

        {/* Trigger Image */}
        <ImageUploadField
          label="Imagem pequena (gatilho)"
          value={form.trigger_image_url}
          onChange={(url) => updateField("trigger_image_url", url)}
          error={errors.trigger_image_url}
          tenantId={tenantId}
          fieldKey="trigger"
        />

        {/* Modal Image */}
        <ImageUploadField
          label="Imagem do pop-up (opcional)"
          value={form.modal_image_url}
          onChange={(url) => updateField("modal_image_url", url)}
          error={errors.modal_image_url}
          tenantId={tenantId}
          fieldKey="modal"
        />

        {/* Description */}
        <div>
          <Label className="text-sm font-medium">Descrição (opcional)</Label>
          <Textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Aproveite nossa promoção especial!"
            rows={3}
            maxLength={500}
            className="mt-1 resize-none"
          />
        </div>

        {/* Button Text */}
        <div>
          <Label className="text-sm font-medium">Texto do botão (opcional)</Label>
          <Input
            value={form.button_text}
            onChange={(e) => updateField("button_text", e.target.value)}
            placeholder="Saiba mais"
            maxLength={50}
            className="mt-1"
          />
        </div>

        {/* Button URL */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
            Link do botão (opcional)
          </Label>
          <Input
            value={form.button_url}
            onChange={(e) => updateField("button_url", e.target.value)}
            placeholder="https://exemplo.com/promo"
            maxLength={500}
            className="mt-1"
          />
          {errors.button_url && <p className="text-xs text-destructive mt-1">{errors.button_url}</p>}
        </div>

        {/* Open in new tab */}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={form.open_button_in_new_tab}
            onCheckedChange={(v) => updateField("open_button_in_new_tab", v === true)}
            id="popup_new_tab"
          />
          <Label htmlFor="popup_new_tab" className="text-sm cursor-pointer">
            Abrir link do botão em nova aba
          </Label>
        </div>

        {/* Position */}
        <div>
          <Label className="text-sm font-medium">Posição na página</Label>
          <Select value={form.position} onValueChange={(v) => updateField("position", v)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bottom">Final da página</SelectItem>
              <SelectItem value="above-footer">Acima do rodapé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Salvar
        </Button>
      </div>
    </div>
  );
}
