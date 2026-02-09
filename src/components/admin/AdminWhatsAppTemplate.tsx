import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { MessageCircle, Save, RotateCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const DEFAULT_TEMPLATE = `Olá {nome}! 👋

Seu agendamento foi confirmado! ✅

📅 *Data:* {data}
🕐 *Horário:* {horario}
👤 *Profissional:* {profissional}
💰 *Valor:* {valor}
⏱️ *Duração:* {duracao} minutos
{obs}
Aguardamos você! 💅✨`;

const PLACEHOLDERS = [
  { tag: "{nome}", desc: "Nome do cliente" },
  { tag: "{data}", desc: "Data do agendamento" },
  { tag: "{horario}", desc: "Horário" },
  { tag: "{profissional}", desc: "Nome do profissional" },
  { tag: "{valor}", desc: "Valor total" },
  { tag: "{duracao}", desc: "Duração em minutos" },
  { tag: "{obs}", desc: "Observações (se houver)" },
];

export function AdminWhatsAppTemplate() {
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [originalTemplate, setOriginalTemplate] = useState(DEFAULT_TEMPLATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("work_settings")
        .select("whatsapp_template")
        .limit(1)
        .single();

      if (data?.whatsapp_template) {
        setTemplate(data.whatsapp_template);
        setOriginalTemplate(data.whatsapp_template);
      }
      setLoading(false);
    }
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("work_settings")
      .update({ whatsapp_template: template })
      .not("id", "is", null);

    setSaving(false);
    if (error) {
      logger.error("Error saving template:", error);
      toast.error("Erro ao salvar modelo");
      return;
    }
    setOriginalTemplate(template);
    toast.success("Modelo de mensagem salvo!");
  };

  const handleReset = () => {
    setTemplate(DEFAULT_TEMPLATE);
  };

  const hasChanges = template !== originalTemplate;

  const insertPlaceholder = (tag: string) => {
    setTemplate((prev) => prev + tag);
  };

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
        <MessageCircle className="w-5 h-5 text-green-500" />
        <h2 className="text-lg sm:text-xl font-semibold">Mensagem WhatsApp</h2>
      </div>

      <div className="glass-panel p-4 space-y-4">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            Personalize a mensagem de confirmação enviada via WhatsApp. Use as variáveis abaixo para inserir dados do agendamento automaticamente.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PLACEHOLDERS.map((p) => (
            <button
              key={p.tag}
              onClick={() => insertPlaceholder(p.tag)}
              className="group relative"
              title={p.desc}
            >
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors text-xs"
              >
                {p.tag}
              </Badge>
            </button>
          ))}
        </div>

        <Textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={12}
          className="bg-input/80 border-border/60 font-mono text-sm resize-none"
          placeholder="Digite o modelo da mensagem..."
        />

        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar padrão
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasChanges} size="sm" className="gap-1.5">
            <Save className="w-3.5 h-3.5" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
