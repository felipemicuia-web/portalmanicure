import { useState, useEffect } from "react";
import { usePaymentSettings, isValidUrl, type PaymentSettings } from "@/hooks/usePaymentSettings";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CreditCard, ExternalLink, AlertTriangle, Plus, Trash2 } from "lucide-react";

export function AdminPayment() {
  const { settings, loading, saving, saveSettings } = usePaymentSettings();
  const { methods, loading: methodsLoading, saving: methodsSaving, addMethod, toggleMethod, removeMethod } = usePaymentMethods();
  const [form, setForm] = useState<PaymentSettings>({ ...settings });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newMethodName, setNewMethodName] = useState("");

  useEffect(() => {
    setForm({ ...settings });
  }, [settings]);

  const updateField = <K extends keyof PaymentSettings>(key: K, value: PaymentSettings[K]) => {
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
      if (!form.payment_url.trim()) {
        errs.payment_url = "URL de pagamento é obrigatória quando ativo.";
      } else if (!isValidUrl(form.payment_url.trim())) {
        errs.payment_url = "URL inválida. Use http:// ou https://";
      }
      if (!form.title.trim()) {
        errs.title = "Título é obrigatório.";
      }
      if (!form.button_text.trim()) {
        errs.button_text = "Texto do botão é obrigatório.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    await saveSettings(form);
  };

  if (loading || methodsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <CreditCard className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-lg font-bold">Pagamento Adiantado</h2>
          <p className="text-sm text-muted-foreground">
            Configure um link externo de pagamento exibido na confirmação do agendamento.
          </p>
        </div>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between border border-border/50 rounded-lg p-4 bg-card/50">
        <div>
          <Label className="text-sm font-medium">Ativar pagamento adiantado</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quando ativo, um bloco de pagamento aparece no passo final do agendamento.
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
          <Label className="text-sm font-medium">Título</Label>
          <Input
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="Pagamento Adiantado"
            maxLength={100}
            className="mt-1"
          />
          {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <Label className="text-sm font-medium">Descrição</Label>
          <Textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Realize o pagamento antecipado para garantir seu horário."
            rows={3}
            maxLength={500}
            className="mt-1 resize-none"
          />
        </div>

        {/* Payment URL */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
            Link de pagamento
          </Label>
          <Input
            value={form.payment_url}
            onChange={(e) => updateField("payment_url", e.target.value)}
            placeholder="https://mpago.la/seu-link"
            maxLength={500}
            className="mt-1"
          />
          {errors.payment_url && <p className="text-xs text-destructive mt-1">{errors.payment_url}</p>}
        </div>

        {/* Button Text */}
        <div>
          <Label className="text-sm font-medium">Texto do botão</Label>
          <Input
            value={form.button_text}
            onChange={(e) => updateField("button_text", e.target.value)}
            placeholder="Pagar Agora"
            maxLength={50}
            className="mt-1"
          />
          {errors.button_text && <p className="text-xs text-destructive mt-1">{errors.button_text}</p>}
        </div>

        {/* Open in new tab */}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={form.open_in_new_tab}
            onCheckedChange={(v) => updateField("open_in_new_tab", v === true)}
            id="open_new_tab"
          />
          <Label htmlFor="open_new_tab" className="text-sm cursor-pointer">
            Abrir link em nova aba
          </Label>
        </div>

        {/* Warning */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Mensagem de aviso (opcional)
          </Label>
          <Textarea
            value={form.warning_message ?? ""}
            onChange={(e) => updateField("warning_message", e.target.value || null)}
            placeholder="O pagamento não é obrigatório, mas garante prioridade."
            rows={2}
            maxLength={300}
            className="mt-1 resize-none"
          />
        </div>
      </div>

      {/* Payment Methods Section */}
      <div className="border-t border-border/30 pt-6 space-y-4">
        <div className="flex items-center gap-3">
          <CreditCard className="w-4 h-4 text-primary" />
          <div>
            <h3 className="text-sm font-bold">Formas de Pagamento</h3>
            <p className="text-xs text-muted-foreground">
              Adicione as opções de pagamento que o cliente poderá escolher ao confirmar o agendamento.
            </p>
          </div>
        </div>

        {/* Add new method */}
        <div className="flex gap-2">
          <Input
            value={newMethodName}
            onChange={(e) => setNewMethodName(e.target.value)}
            placeholder="Ex: Pix, Cartão, Dinheiro..."
            maxLength={50}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newMethodName.trim()) {
                addMethod(newMethodName.trim());
                setNewMethodName("");
              }
            }}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={methodsSaving || !newMethodName.trim()}
            onClick={() => {
              addMethod(newMethodName.trim());
              setNewMethodName("");
            }}
            className="gap-1 h-10"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </div>

        {/* Methods list */}
        {methods.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Nenhuma forma de pagamento cadastrada.</p>
        ) : (
          <div className="space-y-2">
            {methods.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 border border-border/40 rounded-lg px-3 py-2.5 bg-card/50"
              >
                <span className="text-sm font-medium flex-1">{m.name}</span>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={m.enabled}
                    onCheckedChange={(v) => toggleMethod(m.id, v)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeMethod(m.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
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
