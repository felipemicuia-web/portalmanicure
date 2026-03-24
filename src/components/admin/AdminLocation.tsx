import { useState, useEffect } from "react";
import { useLocationSettings, LocationSettings } from "@/hooks/useLocationSettings";
import { isValidUrl } from "@/hooks/usePaymentSettings";
import { normalizeGoogleMapsEmbedUrl } from "@/lib/maps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Loader2, ExternalLink } from "lucide-react";

export function AdminLocation() {
  const { settings, loading, saving, saveSettings } = useLocationSettings();
  const [form, setForm] = useState<LocationSettings>(settings);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const update = (patch: Partial<LocationSettings>) => setForm((p) => ({ ...p, ...patch }));

  const handleSave = async () => {
    if (form.enabled && !form.address.trim()) {
      return;
    }
    if (form.google_maps_url.trim() && !isValidUrl(form.google_maps_url.trim())) {
      return;
    }
    if (form.embed_url.trim() && !isValidUrl(form.embed_url.trim())) {
      return;
    }
    await saveSettings(form);
  };

  const addressMissing = form.enabled && !form.address.trim();
  const mapsUrlInvalid = form.google_maps_url.trim() !== "" && !isValidUrl(form.google_maps_url.trim());
  const embedUrlInvalid = form.embed_url.trim() !== "" && !isValidUrl(form.embed_url.trim());

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Localização do Estabelecimento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <Label htmlFor="loc-enabled" className="text-sm font-medium">
              Ativar localização na página pública
            </Label>
            <Switch
              id="loc-enabled"
              checked={form.enabled}
              onCheckedChange={(v) => update({ enabled: v })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="loc-title">Título da seção</Label>
            <Input
              id="loc-title"
              value={form.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="Nossa Localização"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="loc-address">
              Endereço completo {form.enabled && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="loc-address"
              value={form.address}
              onChange={(e) => update({ address: e.target.value })}
              placeholder="Rua Exemplo, 123 - Bairro, Cidade - UF"
              rows={2}
            />
            {addressMissing && (
              <p className="text-xs text-destructive">Endereço é obrigatório quando ativo.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="loc-maps-url">Link do Google Maps</Label>
            <Input
              id="loc-maps-url"
              value={form.google_maps_url}
              onChange={(e) => update({ google_maps_url: e.target.value })}
              placeholder="https://maps.google.com/..."
            />
            {mapsUrlInvalid && (
              <p className="text-xs text-destructive">URL inválida.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="loc-embed-url">Link de incorporação do mapa (opcional)</Label>
            <Input
              id="loc-embed-url"
              value={form.embed_url}
              onChange={(e) => update({ embed_url: e.target.value })}
              placeholder="https://www.google.com/maps/embed?pb=..."
            />
            {embedUrlInvalid && (
              <p className="text-xs text-destructive">URL inválida.</p>
            )}
            <p className="text-xs text-muted-foreground">
              Opcional. Se não preencher, o mapa será gerado automaticamente a partir do endereço.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="loc-desc">Descrição (opcional)</Label>
            <Textarea
              id="loc-desc"
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="Estamos ao lado do shopping..."
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="loc-btn-text">Texto do botão</Label>
            <Input
              id="loc-btn-text"
              value={form.button_text}
              onChange={(e) => update({ button_text: e.target.value })}
              placeholder="Ver no Google Maps"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="loc-new-tab" className="text-sm">
              Abrir em nova aba
            </Label>
            <Switch
              id="loc-new-tab"
              checked={form.open_in_new_tab}
              onCheckedChange={(v) => update({ open_in_new_tab: v })}
            />
          </div>

          {/* Preview */}
          {form.address.trim() && (
            <div className="space-y-1.5">
              <Label>Preview do mapa</Label>
              <div className="rounded-lg overflow-hidden border border-border/50">
                <iframe
                  src={normalizeGoogleMapsEmbedUrl(form.embed_url, form.address) ?? undefined}
                  className="w-full h-48"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Mapa preview"
                  style={{ border: 0 }}
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={saving || addressMissing || mapsUrlInvalid || embedUrlInvalid}
            className="w-full"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Salvar Localização
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
