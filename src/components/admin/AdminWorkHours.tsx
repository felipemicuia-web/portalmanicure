import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock, Coffee, Save, Loader2, Calendar } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface WorkSettings {
  id: string;
  start_time: string;
  end_time: string;
  interval_minutes: number;
  slot_step_minutes: number;
  lunch_start: string | null;
  lunch_end: string | null;
  working_days: number[];
}

const WEEKDAYS = [
  { value: 0, label: "Domingo", short: "Dom" },
  { value: 1, label: "Segunda", short: "Seg" },
  { value: 2, label: "Terça", short: "Ter" },
  { value: 3, label: "Quarta", short: "Qua" },
  { value: 4, label: "Quinta", short: "Qui" },
  { value: 5, label: "Sexta", short: "Sex" },
  { value: 6, label: "Sábado", short: "Sáb" },
];

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
      slot_step_minutes: settings.slot_step_minutes,
      lunch_start: hasLunch ? settings.lunch_start : null,
      lunch_end: hasLunch ? settings.lunch_end : null,
      working_days: settings.working_days,
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

  function toggleDay(day: number) {
    if (!settings) return;
    const days = settings.working_days || [];
    const newDays = days.includes(day)
      ? days.filter((d) => d !== day)
      : [...days, day].sort((a, b) => a - b);
    setSettings({ ...settings, working_days: newDays });
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

          {/* Passo da agenda */}
          <div className="space-y-2">
            <Label htmlFor="slot_step">Passo da agenda (minutos)</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {[10, 20, 30, 40, 50, 60].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSettings({ ...settings, slot_step_minutes: v })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    settings.slot_step_minutes === v
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 bg-background hover:border-primary/50"
                  }`}
                >
                  {v} min
                </button>
              ))}
            </div>
            <Input
              id="slot_step"
              type="number"
              min="5"
              max="120"
              value={settings.slot_step_minutes}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  slot_step_minutes: parseInt(e.target.value) || 30,
                })
              }
              className="bg-background max-w-[200px]"
              placeholder="Ex: 45"
            />
            <p className="text-xs text-muted-foreground">
              Define de quanto em quanto tempo os horários aparecem (ex: 50 → 08:00, 08:50, 09:40…)
            </p>
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

          {/* Dias de funcionamento */}
          <div className="border-t border-border/50 pt-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label className="text-base">Dias de Funcionamento</Label>
                <p className="text-xs text-muted-foreground">
                  Selecione os dias da semana em que o estabelecimento funciona
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {WEEKDAYS.map((day) => (
                <label
                  key={day.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    settings.working_days?.includes(day.value)
                      ? "border-primary bg-primary/10"
                      : "border-border/50 bg-background hover:border-primary/50"
                  }`}
                >
                  <Checkbox
                    checked={settings.working_days?.includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                  />
                  <span className="text-sm font-medium">{day.label}</span>
                </label>
              ))}
            </div>
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
            📊 Passo da agenda: <span className="text-foreground font-medium">{settings.slot_step_minutes} min</span>
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
          <p>
            📅 Dias:{" "}
            <span className="text-foreground font-medium">
              {settings.working_days?.length === 7
                ? "Todos os dias"
                : settings.working_days?.length === 0
                ? "Nenhum dia selecionado"
                : WEEKDAYS.filter((d) => settings.working_days?.includes(d.value))
                    .map((d) => d.short)
                    .join(", ")}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
