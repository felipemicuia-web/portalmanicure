import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MessageSquareText } from "lucide-react";

export function AdminAnnouncement() {
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const [announcement, setAnnouncement] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    supabase
      .from("work_settings")
      .select("booking_announcement")
      .eq("tenant_id", tenantId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const text = (data as any).booking_announcement || "";
          setAnnouncement(text);
          setEnabled(!!text);
        }
        setLoading(false);
      });
  }, [tenantId]);

  const handleSave = async () => {
    if (!tenantId) return;
    setSaving(true);
    const value = enabled ? announcement.trim() || null : null;
    const { error } = await supabase
      .from("work_settings")
      .update({ booking_announcement: value } as any)
      .eq("tenant_id", tenantId);

    if (error) {
      toast({ title: "Erro", description: "Não foi possível salvar o aviso.", variant: "destructive" });
    } else {
      toast({ title: "Salvo!", description: "Aviso atualizado com sucesso." });
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8">
      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquareText className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Aviso na Página de Agendamento</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Exiba uma mensagem de destaque para seus clientes acima da seleção de profissional. 
        Ideal para comunicar regras, avisos ou informações importantes.
      </p>

      <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/30">
        <div>
          <Label className="font-medium">Ativar aviso</Label>
          <p className="text-xs text-muted-foreground mt-0.5">Mostrar mensagem na página de agendamento</p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      {enabled && (
        <div className="space-y-2">
          <Label htmlFor="announcement-text">Texto do aviso</Label>
          <Textarea
            id="announcement-text"
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            placeholder="Ex: AS SEGUNDAS E TERÇAS POR ORDEM DE CHEGADA"
            className="min-h-[100px] resize-y"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">{announcement.length}/500</p>

          {announcement.trim() && (
            <div className="mt-3">
              <Label className="text-xs text-muted-foreground mb-2 block">Pré-visualização:</Label>
              <div className="p-3 sm:p-4 rounded-xl border-2 border-primary/30 bg-primary/10 text-center">
                <p className="text-sm sm:text-base font-semibold text-primary whitespace-pre-line">
                  {announcement}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? "Salvando..." : "Salvar"}
      </Button>
    </div>
  );
}
