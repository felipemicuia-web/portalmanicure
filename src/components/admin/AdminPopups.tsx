import { useState, useEffect } from "react";
import { usePopupSettings, type PopupSettings } from "@/hooks/usePopupSettings";
import { isValidUrl } from "@/hooks/usePaymentSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Megaphone, ExternalLink, ImageIcon } from "lucide-react";

export function AdminPopups() {
  const { settings, loading, saving, saveSettings } = usePopupSettings();
  const [form, setForm] = useState<PopupSettings>({ ...settings });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      } else if (!isValidUrl(form.trigger_image_url.trim())) {
        errs.trigger_image_url = "URL inválida. Use http:// ou https://";
      }
    }

    if (form.modal_image_url.trim() && !isValidUrl(form.modal_image_url.trim())) {
      errs.modal_image_url = "URL inválida. Use http:// ou https://";
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

        {/* Trigger Image URL */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            Imagem pequena (gatilho)
          </Label>
          <Input
            value={form.trigger_image_url}
            onChange={(e) => updateField("trigger_image_url", e.target.value)}
            placeholder="https://exemplo.com/banner-pequeno.jpg"
            maxLength={1000}
            className="mt-1"
          />
          {errors.trigger_image_url && <p className="text-xs text-destructive mt-1">{errors.trigger_image_url}</p>}
          {form.trigger_image_url.trim() && isValidUrl(form.trigger_image_url.trim()) && (
            <div className="mt-2 rounded-lg border border-border/50 overflow-hidden bg-muted/30 p-2">
              <p className="text-[10px] text-muted-foreground mb-1">Preview do gatilho:</p>
              <img
                src={form.trigger_image_url.trim()}
                alt="Preview gatilho"
                className="max-h-20 rounded object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}
        </div>

        {/* Modal Image URL */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            Imagem do pop-up (opcional)
          </Label>
          <Input
            value={form.modal_image_url}
            onChange={(e) => updateField("modal_image_url", e.target.value)}
            placeholder="https://exemplo.com/banner-grande.jpg"
            maxLength={1000}
            className="mt-1"
          />
          {errors.modal_image_url && <p className="text-xs text-destructive mt-1">{errors.modal_image_url}</p>}
          {form.modal_image_url.trim() && isValidUrl(form.modal_image_url.trim()) && (
            <div className="mt-2 rounded-lg border border-border/50 overflow-hidden bg-muted/30 p-2">
              <p className="text-[10px] text-muted-foreground mb-1">Preview do pop-up:</p>
              <img
                src={form.modal_image_url.trim()}
                alt="Preview modal"
                className="max-h-32 rounded object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}
        </div>

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
