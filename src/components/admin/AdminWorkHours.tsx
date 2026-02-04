import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock, Coffee, Save, Loader2 } from "lucide-react";

interface WorkSettings {
  id: string;
  start_time: string;
  end_time: string;
  interval_minutes: number;
  lunch_start: string | null;
  lunch_end: string | null;
}

export function AdminWorkHours() {
  const [settings, setSettings] = useState<WorkSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasLunch, setHasLunch] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    const { data, error } = await supabase
      .from("work_settings")
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Error fetching work settings:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações.",
        variant: "destructive",
      });
    } else if (data) {
      setSettings(data);
      setHasLunch(!!data.lunch_start && !!data.lunch_end);
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!settings) return;

    setSaving(true);

    const updateData = {
      start_time: settings.start_time,
      end_time: settings.end_time,
      interval_minutes: settings.interval_minutes,
      lunch_start: hasLunch ? settings.lunch_start : null,
      lunch_end: hasLunch ? settings.lunch_end : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("work_settings")
      .update(updateData)
      .eq("id", settings.id);

    setSaving(false);

    if (error) {
      console.error("Error saving work settings:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Salvo!",
        description: "Configurações de horário atualizadas com sucesso.",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="glass-panel p-6 text-center">
        <p className="text-muted-foreground">Nenhuma configuração encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Horário de Funcionamento</h2>
            <p className="text-sm text-muted-foreground">
              Configure o horário de atendimento e intervalos
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Horário de funcionamento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Horário de Início</Label>
              <Input
                id="start_time"
                type="time"
                value={settings.start_time}
                onChange={(e) =>
                  setSettings({ ...settings, start_time: e.target.value })
                }
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">Horário de Término</Label>
              <Input
                id="end_time"
                type="time"
                value={settings.end_time}
                onChange={(e) =>
                  setSettings({ ...settings, end_time: e.target.value })
                }
                className="bg-background"
              />
            </div>
          </div>

          {/* Intervalo entre serviços */}
          <div className="space-y-2">
            <Label htmlFor="interval">Intervalo entre serviços (minutos)</Label>
            <Input
              id="interval"
              type="number"
              min="0"
              max="60"
              value={settings.interval_minutes}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  interval_minutes: parseInt(e.target.value) || 0,
                })
              }
              className="bg-background max-w-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              Tempo de descanso entre um atendimento e outro
            </p>
          </div>

          {/* Horário de almoço */}
          <div className="border-t border-border/50 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Coffee className="w-5 h-5 text-muted-foreground" />
                <div>
                  <Label className="text-base">Horário de Almoço</Label>
                  <p className="text-xs text-muted-foreground">
                    Bloqueia horários durante o intervalo de almoço
                  </p>
                </div>
              </div>
              <Switch
                checked={hasLunch}
                onCheckedChange={setHasLunch}
              />
            </div>

            {hasLunch && (
              <div className="grid grid-cols-2 gap-4 mt-4 pl-8">
                <div className="space-y-2">
                  <Label htmlFor="lunch_start">Início do Almoço</Label>
                  <Input
                    id="lunch_start"
                    type="time"
                    value={settings.lunch_start || "12:00"}
                    onChange={(e) =>
                      setSettings({ ...settings, lunch_start: e.target.value })
                    }
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lunch_end">Fim do Almoço</Label>
                  <Input
                    id="lunch_end"
                    type="time"
                    value={settings.lunch_end || "13:00"}
                    onChange={(e) =>
                      setSettings({ ...settings, lunch_end: e.target.value })
                    }
                    className="bg-background"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar Alterações
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div className="glass-panel p-4 sm:p-6">
        <h3 className="font-semibold mb-3">Resumo</h3>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>
            🕐 Atendimento: <span className="text-foreground font-medium">{settings.start_time}</span> às{" "}
            <span className="text-foreground font-medium">{settings.end_time}</span>
          </p>
          <p>
            ⏱️ Intervalo entre serviços: <span className="text-foreground font-medium">{settings.interval_minutes} min</span>
          </p>
          {hasLunch && settings.lunch_start && settings.lunch_end && (
            <p>
              🍽️ Almoço: <span className="text-foreground font-medium">{settings.lunch_start}</span> às{" "}
              <span className="text-foreground font-medium">{settings.lunch_end}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
